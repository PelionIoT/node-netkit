var rt = require('../nl/rtnetlink.js');
var cmn = require('../libs/common.js');
var nativelib = cmn.nativelib;
var util = require('util');
var debug = cmn.logger.debug;
var error = cmn.logger.error;

var ipparse = {

	AF_INET6: 10,
	AF_INET: 2,
	AF_DECnet: 12,

	link_oper_states: [
		"UNKNOWN", "NOTPRESENT", "DOWN", "LOWERLAYERDOWN",
		"TESTING", "DORMANT",	 "UP"
	],

	net_device_flags: [
		{fl: 0x00001,	nm: 'IFF_UP'},
		{fl: 0x00002,	nm: 'IFF_BROADCAST'},
		{fl: 0x00004,	nm: 'IFF_DEBUG'},
		{fl: 0x00008,	nm: 'IFF_LOOPBACK'},
		{fl: 0x00010,	nm: 'IFF_POINTOPOINT'},
		{fl: 0x00020,	nm: 'IFF_NOTRAILERS'},
		{fl: 0x00040,	nm: 'IFF_RUNNING'},
		{fl: 0x00080,	nm: 'IFF_NOARP'},
		{fl: 0x00100,	nm: 'IFF_PROMISC'},
		{fl: 0x00200,	nm: 'IFF_ALLMULTI'},
		{fl: 0x00400,	nm: 'IFF_MASTER'},
		{fl: 0x00800,	nm: 'IFF_SLAVE'},
		{fl: 0x01000,	nm: 'IFF_MULTICAST'},
		{fl: 0x02000,	nm: 'IFF_PORTSEL'},
		{fl: 0x04000,	nm: 'IFF_AUTOMEDIA'},
		{fl: 0x08000,	nm: 'IFF_DYNAMIC'},
		{fl: 0x10000,	nm: 'IFF_LOWER_UP'},
		{fl: 0x20000,	nm: 'IFF_DORMANT'},
		{fl: 0x40000,	nm: 'IFF_ECHO'}
	],

	protocol_map: {
		0: "unspec",
		1: "redirect",
		2: "kernel",
		3: "boot",
		4: "static",

		8: "gated",
		9: "ra",
		10: "mrt",
		11: "zebra",
		12: "bird",
		13: "dnrouted",
		14: "xorp",
		15: "ntk",
		16: "dhcp",
		17: "mrouted",
		42: "babel",
	},

	table_map: {
		0: 		"unspec",
		/* User defined values */
		252:	"compat",
		253:	"default",
		254: 	"main",
		255: 	"local",
	},

	route_flags: {
		1: 		"dead", 		/* Nexthop is dead (used by multipath)	*/
		2: 		"pervasive", 	/* Do recursive gateway lookup	*/
		4: 		"onlink", 		/* Gateway is forced on link	*/
		0x100: 	"notify", 		/* Notify user of route change	*/
		0x200: 	"cloned",		/* This route is cloned		*/
		0x400: 	"equalize",		/* Multipath equalizer: NI	*/
		0x800: 	"prefix",		/* Prefix addresses		*/
	},

	neigh_flags: {
		0x01:	"use",
		0x08:	"proxy", 	/* == ATF_PUBL */
		0x80:	"router",

		0x02:	"self",
		0x04:	"master",
	},

	neigh_states: {
		/*
		 *	Neighbor Cache Entry States.
		 */

		0x01:	"incomplete",
		0x02:	"reachable",
		0x04:	"stale",
		0x08:	"delay",
		0x10:	"probe",
		0x20:	"failed",

		/* Dummy states */
		0x40:	"noarp",
		0x80:	"permanent"
	},

	parseAttributes: function(filters, links, buf) {

		//debug("data --> " + buf.toJSON());
		// debug("links --> " + JSON.stringify(links));
		var at = rt.parseRtattributes(buf);
		if(typeof at['operation'] !== 'undefined') {
			//console.dir(at);
			var handler_name = 'packageInfo' + at['operation'].slice(3);
			//debug("handler_name = " + handler_name);
			var boundApply = ipparse[handler_name];

			var data;
			try {
				data = boundApply(at,links);
			} catch(err) {
				error(util.inspect(err) + " attributes = " + util.inspect(at));
				throw (err);
			}
			data = ipparse.filter(filters, data);
			if(data !== undefined) {
				return data;
			}
		}
	},

	filter: function(filters, data) {

		if(typeof data === 'undefined') return;

		var filters_array = [];
		if(typeof( filters ) === 'undefined'){
			return data;
		} else if( Object.prototype.toString.call( filters ) === '[object Array]' ) {
			filters_array = filters;
		} else if(Object.prototype.toString.call( filters ) !== '[object]'){
			filters_array.push(filters);
		}

		//console.dir(data);
		//console.dir(filters_array);
		// Assume no matches will happen
		var applies = false;

		if(filters_array.length == 0) {
			applies = true;
		} else {
			for(var f in filters_array) {
				var object_match = true;
				for(fkey in filters_array[f]) {
					// debug("fkey = " + fkey + " data[fkey] = " + data[fkey] + " filters_array[f][fkey] = " + filters_array[f][fkey]);
					if(typeof(data[fkey]) !== 'undefined') {
						if(data.hasOwnProperty(fkey) && (data[fkey] !== filters_array[f][fkey])) {
							object_match = false;
							break;
						}
					} else {
						var ev = data['event'];
						if(typeof ev !== 'undefined') {
							// debug("fkey = " + fkey + " ev[fkey] = " + ev[fkey] + " filters_array[f][fkey] = " + filters_array[f][fkey]);
							if(ev.hasOwnProperty(fkey) && (ev[fkey] !== filters_array[f][fkey])) {
								object_match = false;
								break;
							}
						}
					}
				}
				// debug("object_match = " + object_match + " applies = " + applies);
				applies |= object_match;
			}
		}

		if(applies) {
			return data;
		} else {
			return;
		}
	},

	packageInfoLink: function(link_result, filters) {

		var ch;
		var genmsg;
		if(typeof link_result['operation'] !== 'undefined') {
			ch = link_result;
			genmsg = link_result.payload;
			// error('FIRST = ' + util.inspect(ch, {depth:null}));
		} else {
			ch = link_result.payload.link;
			genmsg = link_result.genmsg;
			// error('SECOND = ' + util.inspect(ch, {depth:null}));
		}

		if(typeof ch['operstate'] === 'undefined') {
			return [];
		}

		var ret = {};
		try{
			ret.name = ch['operation'] ? ch['operation'] : 'newLink';
			ret.ifnum = genmsg._if_index;
			ret.event = {};

			var opst = ch['operstate'];
			if(typeof opst !== 'undefined') {
				if(Buffer.isBuffer(opst)) {
					ret.event.state = ipparse.link_oper_states[ch.operstate.readUInt8()];
				} else {
					ret.event.state = ipparse.link_oper_states[ch.operstate];
				}
			}

			ret.event.ifname = ch['ifname'];
			if(Buffer.isBuffer(ch['address'])) {
				ret.event.address = ipparse.getBufferAsHexAddr(ch['address']);
			} else {
				ret.event.address = ch['address'];
			}

			if(Buffer.isBuffer(ch['broadcast'])) {
				ret.event.broadcast = ipparse.getBufferAsHexAddr(ch['broadcast']);
			} else {
				ret.event.broadcast = ch['broadcast'];
			}

			ret.event.flags = ipparse.getLinkDeviceFlags(genmsg._if_flags);

			if(typeof ret.genmsg !== 'undefined') delete ret.genmsg;

		} catch(err) {
			error("error parsing link: " + util.inspect(err) +
				" : " + util.inspect(ch, {depth:null}));
		}

		//error('result = ' + util.inspect(ret, {depth:null}));

		ret = ipparse.filter(filters, ret);
		return ret;
	},

	packageInfoAddress: function(ch,links) {

		var addr_ar =  rt.bufToArray(ch['address'], 0, ch['address'].length);
		var addr = nativelib.fromAddress(addr_ar, ch['payload']['_family']);
		var linkno = ch['payload']['_index'];
		var lbl = ch['label'];

		var data = {
			ifname: ipparse.getLinkFromIndex(links,linkno)['ifname'], // the interface name as labeled by the OS
			ifnum: linkno, // the interface number, as per system call
			event:  {	name: ch['operation'],
						address: addr['address'] + '/' + ch['payload']['_prefix_len'],
						family: ipparse.getFamily(addr['family']),
						scope: ipparse.getScope(ch['payload']['_scope']),
					}
		};
		if(lbl) data['event']['label'] = lbl; // no label for ipv6 for some reason

		return data;
	},

	packageInfoRoute: function(ch,links) {
		var oif = ch['oif'].readUInt32LE(0);
		var ev = ipparse.getRouteEventObj(ch);
		var data = {
			ifname: ipparse.getLinkFromIndex(links,oif)['ifname'],
			ifnum: oif,
			event: ev
		};
		return data;
	},

	packageInfoNeighbor: function(ch,links) {

		var payload = ch['payload'];

		var state = ipparse.getFlags(ipparse.neigh_states, payload['_state']);
		if(state === 'noarp' )
			return;

		var cinfo = ch['cacheinfo'];
		var oif = payload['_ifindex'];
		var neigh = {};

		neigh.ifname =ipparse.getLinkFromIndex(links,oif)['ifname'];
		neigh.ifnum = oif;

		// cache info and probes currently left out.
		neigh.event = {};

		var dst = ch['dst'];
		if(dst) {
			var addr_ar =  rt.bufToArray(ch['dst'], 0, ch['dst'].length);
			var addr = nativelib.fromAddress(addr_ar, payload['_family']);
			neigh.event.destination = addr['address'];
		}

		var lladdr = ch['lladdr'];
		if(lladdr) {
			neigh.event.lladdr = ipparse.getBufferAsHexAddr(lladdr);
		}

		neigh.event.state = state;

		var flags = payload['_flags'];
		if(flags) {
			neigh.event.flags = ipparse.getFlags(ipparse.neigh_flags,payload['_flags']);
		}

		return neigh;
	},

	getLinkFromIndex: function(links, index) {
		for(var l in links){
			var payload =  links[l]['payload'];
			if(payload) {
				var lindex = payload['_if_index'];
				if(lindex && lindex === index)
					return links[l];
			}
		}
	},

	getFamily: function(fam) {
		if(fam == ipparse.AF_INET)
			return 'inet'
		else
			return 'inet6'
	},

	getScope: function(sco) {
		switch(sco) {
			case rt.RT_SCOPE_UNIVERSE: return 'global'; break;
			case rt.RT_SCOPE_SITE: return 'local'; break;
			case rt.RT_SCOPE_LINK: return 'link'; break;
			case rt.RT_SCOPE_HOST: return 'host'; break;
			case rt.RT_SCOPE_NOWHERE: return 'nowhere'; break;
			default: return sco; break;
		}
	},

	getRouteEventObj: function(ch) {

		var ret = {};

		ret.name = ch['operation'];
		ret.type = ipparse.routeType(ch['payload']['_type']);

		var fam = ch['payload']['_family'];
		ret.family = ipparse.getFamily(fam);

		var dest = ch['dst'];
		var dest_len = ch['payload']['_dst_len'];
		ret.address = ipparse.getRouteAddress(dest, dest_len, fam);

		var src = ch['src'];
		var src_len = ch['payload']['_src_len'];
		ret.src = ipparse.getRouteAddress(src, src_len, ret.family);

		ret.table = ipparse.getRouteTable(ch['payload']['_table']);
		ret.protocol = ipparse.getRouteProtocol(ch['payload']['_protocol']);
		ret.scope = ipparse.getScope(ch['payload']['_scope']);

		var src = ch['prefsrc'];
		if(typeof(src) !== 'undefined') {
			var src_a = rt.bufToArray(src, 0, src.length);
			var src_o = nativelib.fromAddress(src_a, ch['payload']['_family'])
			ret.prefsrc = src_o['address'];
		}

		var gw = ch['gateway'];
		if(typeof(gw) !== 'undefined') {
			var gw_a = rt.bufToArray(gw, 0, gw.length);
			var gw_o = nativelib.fromAddress(gw_a, ch['payload']['_family'])
			ret.gateway = gw_o['address'];
		}

		var mark = ch['mark'];
		if(typeof(mark) !== 'undefined') {
			ret.mark = mark >= 16 ? mark.toString(16) : mark;
		}

		var m = ch['priority'];
		if(typeof(m) !== 'undefined') {
			ret.priority = m.readUInt32LE(0);
		}

		var flags = ch['payload']['_flags'];
		if(typeof(flags) !== 'undefined' && flags > 0) {
			ret.flags = ipparse.getFlags(ipparse.route_flags,flags);
		}

		return ret;
	},

	getRouteProtocol: function(proto) {
		var p = ipparse.protocol_map[proto];
		if(typeof(p) !== 'undefined')
			return p;
		return proto;
	},

	getRouteTable: function(table) {
		var t = ipparse.table_map[table];
		if(typeof(t) !== 'undefined')
			return t;
		return table;
	},

	getRouteAddress: function(address, len, family) {
		if(typeof(address) !== 'undefined') {
			var addr_a = rt.bufToArray(address, 0, address.length);
			var addr = nativelib.fromAddress(addr_a, family);

			if(len != this.calcHostLen(family)) {
				return addr['address'] + '/' + len;
			} else {
				// here were are suppossed to show the hostname
				// same as linux gethostbyaddr
				var name = "";
				if(family === this.AF_INET6){

				} else if(family === ipparse.AF_INET) {

				}
				if(name.length === 0)
					return addr['address'] + '/' + len;
				else
					return name;
			}
		} else if(len > 0) {
			return "0/" + len;
		} else {
			return "default";
		}
	},

	calcHostLen: function(family) {
		if (family == ipparse.AF_INET6)
			return 128;
		else if (family == ipparse.AF_INET)
			return 32;
		else
			return 0;
	},

	routeType: function(id) {
		switch (id) {
		case rt.RTN_UNSPEC:
			return "none";
		case rt.RTN_UNICAST:
			return "unicast";
		case rt.RTN_LOCAL:
			return "local";
		case rt.RTN_BROADCAST:
			return "broadcast";
		case rt.RTN_ANYCAST:
			return "anycast";
		case rt.RTN_MULTICAST:
			return "multicast";
		case rt.RTN_BLACKHOLE:
			return "blackhole";
		case rt.RTN_UNREACHABLE:
			return "unreachable";
		case rt.RTN_PROHIBIT:
			return "prohibit";
		case rt.RTN_THROW:
			return "throw";
		case rt.RTN_NAT:
			return "nat";
		case rt.RTN_XRESOLVE:
			return "xresolve";
		default:
			return id;
		}
	},

	getLinkDeviceFlags: function(flags) {
		var flags_str = "";
		for (var k = 0; k < ipparse.net_device_flags.length; k++){
	 		if(flags & ipparse.net_device_flags[k]['fl']) {
	 			if(flags_str.length)
	 				flags_str += ",";
	 			flags_str += ipparse.net_device_flags[k]['nm'];
	 		}
		}
		return flags_str;
	},

	getFlags: function(flags,f) {
		var flags_str = "";

		for (var k in flags){
			if(flags.hasOwnProperty(k)){
		 		if(f & k) {
		 			if(flags_str.length)
		 				flags_str += ",";
		 			flags_str += flags[k];
		 		}
	 		}
		}
		return flags_str;
	},

	getBufferAsHexAddr: function(buf) {
		var addr = "";
		for(var b = 0; b < buf.length; b++) {
			if(addr.length)
				addr += ":";
			addr += buf.toString('hex', b, b+1);
		}
		return addr;
	}
};

module.exports = ipparse;
