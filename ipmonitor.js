var rt = require('./rtnetlink.js');
var bufferpack = require('./libs/bufferpack.js');
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

var monitor = {

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

	onNetworkChange: function(ifname, event_type, cb) {
		var links = [];

		var sock = this.newNetlinkSocket();
		var sock_opts;
		if(!event_type || event_type === 'all') {
			sock_opts = {
				subscriptions: 	 
							
								  rt.make_group(rt.RTNLGRP_LINK)

								| rt.make_group(rt.RTN_GRP_IPV4_IFADDR)
								| rt.make_group(rt.RTN_GRP_IPV6_IFADDR)
								| rt.make_group(rt.RTNLGRP_IPV6_PREFIX)

								| rt.make_group(rt.RTNLGRP_IPV4_ROUTE)
								| rt.make_group(rt.RTN_GRP_IPV6_ROUTE)
								| rt.make_group(rt.RTNLGRP_IPV4_MROUTE)
								| rt.make_group(rt.RTNLGRP_IPV6_MROUTE)

							// | rt.make_group(rt.RTNLGRP_NEIGH)
							// | rt.make_group(rt.RTNLGRP_IPV4_NETCONF)
							// | rt.make_group(rt.RTNLGRP_IPV6_NETCONF)						
			}
		} else if(event_type === 'link') {
			sock_opts = {
				subscriptions: 	  rt.make_group(rt.RTNLGRP_IPV4_LINK)
			}
		} else if(event_type === 'address') {
			sock_opts = {
				subscriptions: 	  rt.make_group(rt.RTN_GRP_IPV4_IFADDR)
								| rt.make_group(rt.RTN_GRP_IPV6_IFADDR)
			}
		} else if(event_type === 'route') {
			sock_opts = {
				subscriptions: 	  rt.make_group(rt.RTNLGRP_IPV4_ROUTE)
								| rt.make_group(rt.RTN_GRP_IPV6_ROUTE)
			}
		} else {
			err("event type = '" + event_type + "'' : Not supported");
			return;	
		}

		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");
			}
		 });

		var command_opts = {
			type: 	rt.RTM_GETLINK, // get link
			flags: 	this.nl.NLM_F_REQUEST|this.nl.NLM_F_ROOT|this.nl.NLM_F_MATCH
		};

		this.netlinkCommand(command_opts, "eth0", sock, function(err,bufs) {
			if(err)
				console.error("** Error: " + util.inspect(err));
			else {


				// get the attributes of all the links first for later reference
				for(var i = 0; i < bufs.length; i++) {
					var l = rt.parseRtattributes(bufs[i]);
					links[i] = l;
					//console.dir(l);
				}

				sock.onRecv(function(err,bufs) {
					if(err) {
						console.error("ERROR: ** Bad parameters to buildRtattrBuf() **");
					} else {
						var at = rt.parseRtattributes(bufs[0]);

						if(typeof(at['operation']) !== 'undefined') {
							console.dir(at);
							var handler_name = 'packageInfo' + at['operation'].slice(3);
							//console.log("handler_name = " + handler_name);
							var boundApply = monitor[handler_name];
							var data = boundApply(at,links);

							if(!ifname || (ifname === data['ifname'])) {
								cb(data);
							}
						}
					}
				});
			}
		});
	},

	packageInfoLink: function(ch,links) {
		var operstate = link_oper_states[ch['operstate'].readUInt8(0)];
		var data = {
			ifname: ch['ifname'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['ifname']), // the interface number, as per system call 
			event:  { name: ch['operation'], 
					  state: operstate,
					  address: monitor.getBufferAsHexAddr(ch['address']),
					  broadcast: monitor.getBufferAsHexAddr(ch['broadcast']),
					  flags: monitor.getLinkDeviceFlags(ch['payload']['_if_flags'])  }
		};

		return data;
	},

	packageInfoAddress: function(ch,links) {

		var addr_ar =  rt.bufToArray(ch['address'], 0, ch['address'].length);
		var addr = nativelib.fromAddress(addr_ar, ch['payload']['_family']);
		var data = {
			ifname: ch['label'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['label']), // the interface number, as per system call 
			event:  { 	name: ch['operation'], 
						address: addr['address'] + '/' + ch['payload']['_prefix_len'], 
						family: monitor.getFamily(addr['family']), 
						scope: monitor.getScope(ch['payload']['_scope'])
					}
		};

		return data;
	},

	packageInfoRoute: function(ch,links) {

		var oif = ch['oif'].readUInt32LE(0);
		var ev = monitor.getRouteEventObj(ch);
		var data = {
			ifname: links[oif-1]['ifname'],
			ifnum: oif,
			event: ev
		};

		return data;
	},

	getFamily: function(fam) {
		if(fam == this.AF_INET)
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
		ret.type = monitor.routeType(ch['payload']['_type']);

		var fam = ch['payload']['_family'];
		ret.family = monitor.getFamily(fam);

		var dest = ch['dst'];
		var dest_len = ch['payload']['_dst_len'];
		ret.address = monitor.getRouteAddress(dest, dest_len, fam);

		var src = ch['src'];
		var src_len = ch['payload']['_src_len'];
		ret.src = monitor.getRouteAddress(src, src_len, ret.family);

		ret.table = monitor.getRouteTable(ch['payload']['_table']);
		ret.protocol = monitor.getRouteProtocol(ch['payload']['_protocol']);
		ret.scope = monitor.getScope(ch['payload']['_scope']);

		var src = ch['prefsrc'];
		if(typeof(src) !== 'undefined') {
			var src_a = rt.bufToArray(src, 0, src.length);
			var src_o = nativelib.fromAddress(src_a, ch['payload']['_family'])
			ret.source = src_o['address'];
		}

		var gw = ch['gateway'];
		if(typeof(gw) !== 'undefined') {
			var gw_a = rt.bufToArray(gw, 0, gw.length);
			var gw_o = nativelib.fromAddress(gw_a, ch['payload']['_family'])
			ret.source = gw_o['address'];
		}

		var mark = ch['mark'];
		if(typeof(mark) !== 'undefined') {
			ret.source = mark >= 16 ? mark.toString(16) : mark;
		}

		var m = ch['priority'];
		if(typeof(m) !== 'undefined') {
			ret.metric = m.readUInt32LE(0);
		}

		var flags = ch['payload']['_flags'];
		if(typeof(flags) !== 'undefined' && flags > 0) {
			ret.flags = monitor.getRouteFlags(flags);
		}

		return ret;
	},

	getRouteProtocol: function(proto) {
		var p = monitor.protocol_map[proto];
		if(typeof(p) !== 'undefined')
			return p;
		return proto;
	},

	getRouteTable: function(table) {
		var t = monitor.table_map[table];
		if(typeof(t) !== 'undefined')
			return t;
		return table;
	},

	getRouteAddress: function(address, len, family) {
		if(typeof(address) !== 'undefined') {
			var addr_a = rt.bufToArray(address, 0, address.length);
			var addr = nativelib.fromAddress(addr_a, family);
			console.dir (family);

			if(len != this.calcHostLen(family)) {
				return addr['address'] + '/' + len;
			} else {
				// here were are suppossed to show the hostname
				// same as linux gethostbyaddr
				var name = "";
				if(family === this.AF_INET6){

				} else if(family === AF_INET) {

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
		if (family == this.AF_INET6)
			return 128;
		else if (family == this.AF_INET)
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
		for (var k = 0; k < net_device_flags.length; k++){
	 		if(flags & net_device_flags[k]['fl']) {
	 			if(flags_str.length)
	 				flags_str += ",";
	 			flags_str += net_device_flags[k]['nm'];
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

module.exports = monitor;
