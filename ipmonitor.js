var rt = require('./rtnetlink.js');
var bufferpack = require('./libs/bufferpack.js');

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
	
	onNetworkChange: function(ifname, event_type, cb) {
		var links = [];

		var sock = this.newNetlinkSocket();
		var sock_opts;
		if(!event_type || event_type == 'all') {
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
		} else if(event_type == 'address') {
			sock_opts = {
				subscriptions: 	  rt.make_group(rt.RTN_GRP_IPV4_IFADDR)
								| rt.make_group(rt.RTN_GRP_IPV6_IFADDR)
			}
		} else if(event_type == 'route') {
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
					console.dir(l);
				}

				sock.onRecv(function(err,bufs) {
					if(err) {
						console.error("ERROR: ** Bad parameters to buildRtattrBuf() **");
					} else {
						var at = rt.parseRtattributes(bufs[0]);

						if(typeof(at['operation']) != 'undefined') {
							console.dir(at);
							var handler_name = 'packageInfo' + at['operation'].slice(3);
							console.log("handler_name = " + handler_name);
							var boundApply = monitor[handler_name];
							var data = boundApply(at,links);

							if(!ifname || (ifname == data['ifname'])) {
								cb(data);
							}
						}
					}
				});
			}
		});
	},

	packageInfoLink: function(ch,links) {

		var addr = nativelib.fromAddress(ch['address'], ch['payload']['_family']);
		var data = {
			ifname: ch['ifname'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['ifname']), // the interface number, as per system call 
			event:  { name: ch['operation'], address: addr }
		};

		return data;
	},

	packageInfoAddress: function(ch,links) {

		var addr = nativelib.fromAddress(ch['address'], ch['payload']['_family']);
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
		var data = {
			ifname: links[oif-1]['ifname'],
			ifnum: oif,
			event:  { 	name: ch['operation'], 
						address: monitor.getRouteAddress(ch), 
						routeType: monitor.routeType(ch['payload']['_type']),
						family: monitor.getFamily(ch['payload']['_family']), 
						scope: monitor.getScope(ch['payload']['_scope'])
					}
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
			case rt.RT_SCOPE_NOWHERE:
			default: 'nowhere'; break;
		}
	},

	getRouteAddress: function(ch, addr) {
		if(ch['dst'].length > 0) {
			if(ch['payload']['_dst_len'] != this.calcHostLen(ch['payload']['_family'])) {
				var addr_a = rt.bufToArray(ch['dst'], 0, 16);
				var addr = nativelib.fromAddress(addr_a, ch['payload']['_family']);
				return addr['address'] + '/' + ch['payload']['_dst_len'];
			} else {
				if(  + '/' + ch['payload']['_dst_len']){ 
				}
			}
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
	}

};

module.exports = monitor;
