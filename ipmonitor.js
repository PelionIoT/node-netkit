var rt = require('./rtnetlink.js');

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
							if(!ifname || (ifname == at['ifname']) || (ifname == at['label'])) {
								var tname = 'packageInfo' + at['operation'].slice(3);
								console.log("tname = " + tname);
								var data = monitor[tname](this, at);
								cb(data);
							}
						}
					}
				});
			}
		});
	},

	packageInfoLink: function(nk, ch) {

		var addr = nativelib.fromAddress(ch['address'], ch['payload']['_family']);
		var data = {
			ifname: ch['ifname'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['ifname']), // the interface number, as per system call 
			event:  { name: ch['operation'], address: addr }
		};

		return data;
	},

	packageInfoAddress: function(nk, ch) {

		var addr = nativelib.fromAddress(ch['address'], ch['payload']['_family']);
		var data = {
			ifname: ch['label'], // the interface name as labeled by the OS
			ifnum: nativelib.ifNameToIndex(ch['label']), // the interface number, as per system call 
			event:  { 	name: ch['operation'], 
						address: addr['address'] + '/' + ch['payload']['_prefix_len'], 
						family: this.getFamily(addr['family']), 
						scope: this.getScope(ch['payload']['_scope'])
					}
		};

		return data;
	},

	packageInfoRoute: function(nk, ch) {

		var addr = nativelib.fromAddress(ch['address'], ch['payload']['_family']);
		var data = {
			event:  { 	name: ch['operation'], 
						address: this.getRouteAddress(ch, addr), 
						family: this.getFamily(ch['payload']['_family']), 
						scope: this.getScope(ch['payload']['_scope'])
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

		/*
		enum rt_scope_t {
		RT_SCOPE_UNIVERSE=0,
		RT_SCOPE_SITE=200,
		RT_SCOPE_LINK=253,
		RT_SCOPE_HOST=254,
		RT_SCOPE_NOWHERE=255
		};
		*/

		switch(sco) {
			case 0: return 'global'; break;
			case 200: return 'local'; break;
			case 253: return 'link'; break;
			case 254: return 'host'; break;
			default: 'nowhere'; break;
		}
	},

	getRouteAddress: function(ch, addr) {
		if(ch['payload']['dst'].length > 0) {
			if(ch['payload']['_dst_len'] == this.calcHostLen(ch['payload']['_family'])) {
				return addr + '/' + ch['payload']['_dst_len'];
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
	}
};

module.exports = monitor;
