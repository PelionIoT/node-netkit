var rt = require('./rtnetlink.js');
var dns = require('dns');

var nativelib = null;
try {
	nativelib = require('./build/Release/netkit.node');
} catch(e) {
	if(e.code == 'MODULE_NOT_FOUND')
		nativelib = require('./build/Debug/netkit.node');
	else
		console.error("Error in nativelib [debug]: " + e + " --> " + e.stack);
}

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

	parseAttributes: function(filters,links,buf) {
		var at = rt.parseRtattributes(buf);
		if(typeof(at['operation']) !== 'undefined') {
			//console.dir(at);
			var handler_name = 'packageInfo' + at['operation'].slice(3);
			//console.log("handler_name = " + handler_name);
			var boundApply = ipparse[handler_name];
			var data = boundApply(at,links);

			// Does filter apply?
			var applies = true;
			for(fkey in filters) {

				if(typeof(data[fkey]) !== 'undefined') {
					if(data.hasOwnProperty(fkey) && (data[fkey] !== filters[fkey])) {
						applies = false;
						break;
					}
				} else {
					var ev = data['event'];
					if(ev.hasOwnProperty(fkey) && (ev[fkey] !== filters[fkey])) {
						applies = false;
						break;
					}
				}
			}

			if(applies) {
				return data;
			} else {
				return;
			}
		}
	},

	packageInfoLink: function(ch,links) {

		var operstate = ipparse.link_oper_states[ch['operstate'].readUInt8(0)];
		var data = {
			ifname: ch['ifname'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['ifname']), // the interface number, as per system call 
			event:  { name: ch['operation'], 
					  state: operstate,
					  address: ipparse.getBufferAsHexAddr(ch['address']),
					  broadcast: ipparse.getBufferAsHexAddr(ch['broadcast']),
					  flags: ipparse.getLinkDeviceFlags(ch['payload']['_if_flags'])  }
		};

		return data;
	},

	packageInfoAddress: function(ch,links) {

		var addr_ar =  rt.bufToArray(ch['address'], 0, ch['address'].length);
		var addr = nativelib.fromAddress(addr_ar, ch['payload']['_family']);
		var linkno = ch['payload']['_index'];

		var data = {
			ifname: links[linkno-1]['ifname'], // the interface name as labeled by the OS
			ifnum: linkno, // the interface number, as per system call 
			event:  { 	name: ch['operation'], 
						address: addr['address'] + '/' + ch['payload']['_prefix_len'], 
						family: ipparse.getFamily(addr['family']), 
						scope: ipparse.getScope(ch['payload']['_scope'])
					}
		};

		return data;
	},

	packageInfoRoute: function(ch,links) {

		var oif = ch['oif'].readUInt32LE(0);
		var ev = ipparse.getRouteEventObj(ch);
		var data = {
			ifname: links[oif-1]['ifname'],
			ifnum: oif,
			event: ev
		};

		return data;
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
			ret.flags = ipparse.getRouteFlags(flags);
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

	getRouteFlags: function(flags) {
		var flags_str = "";	
		for (var k in this.route_flags){
			if(this.route_flags.hasOwnProperty(k)){
		 		if(flags & k) {
		 			if(flags_str.length)
		 				flags_str += ",";
		 			flags_str += this.route_flags[k];
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
