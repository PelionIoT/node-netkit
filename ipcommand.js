var rt = require('./rtnetlink.js');
var ipparse = require('./ipparse.js');

var nativelib = null;
try {
	nativelib = require('./build/Release/netkit.node');
} catch(e) {
	if(e.code == 'MODULE_NOT_FOUND')
		nativelib = require('./build/Debug/netkit.node');
	else
		console.error("Error in nativelib [debug]: " + e + " --> " + e.stack);
}

var routes = {

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
			this.err("event type = '" + event_type + "'' : Not supported");
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
						var filters = {};
						if(ifname) filters['ifname'] = ifname;
						var mObject = ipparse.parseAttributes(filters,links,bufs[0]);
						if(typeof(mObject) != 'undefined') {
							cb(mObject);
						}
					}
				});
			}
		});
	},

	getRoutes: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		} else {
			filters['table'] = 'main';
		}

		var sock = this.newNetlinkSocket();
		var sock_opts = {
			subscriptions: 
				  rt.make_group(rt.RTNLGRP_IPV4_ROUTE)
				| rt.make_group(rt.RTN_GRP_IPV6_ROUTE)
				| rt.make_group(rt.RTNLGRP_IPV4_MROUTE)
				| rt.make_group(rt.RTNLGRP_IPV6_MROUTE)
		};

		var netkitObject = this;
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");

				var getlink_command_opts = {
					type: 	rt.RTM_GETLINK, // get link
					flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
				};
				var getroute_command_opts = {
					type: 	rt.RTM_GETROUTE,
					flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
				};
				netkitObject.netlinkCommand(getlink_command_opts, "eth0", sock, function(err,bufs) {
					if(err)
						console.error("** Error: " + util.inspect(err));
					else {
						// get the attributes of all the links first for later reference
						var links = [];
						for(var i = 0; i < bufs.length; i++) {
							var l = rt.parseRtattributes(bufs[i]);
							links[i] = l;
							//console.dir(l);
						}

						netkitObject.netlinkCommand(getroute_command_opts, "eth0", sock, function(err,routes_bufs) {
							if(err)
								console.error("** Error: " + util.inspect(err));
							else {
								var data = [];

								for(var n=0;n<routes_bufs.length;n++) {
									var route = ipparse.parseAttributes(filters,links,routes_bufs[n]);
									if(typeof(route) !== 'undefined') {
										data.push(route);
									}
								}
								sock.close();
								cb(data);
							}
						});
					}
				});
			}
		 });
	},

	getAddresses: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var sock = this.newNetlinkSocket();
		var sock_opts = {};

		var netkitObject = this;
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");

				var getlink_command_opts = {
					type: 	rt.RTM_GETLINK, // get link
					flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
				};
				var getaddr_command_opts = {
					type: 	rt.RTM_GETROUTE,
					flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
				};
				netkitObject.netlinkCommand(getlink_command_opts, "eth0", sock, function(err,bufs) {
					if(err)
						console.error("** Error: " + util.inspect(err));
					else {
						// get the attributes of all the links first for later reference
						var links = [];
						for(var i = 0; i < bufs.length; i++) {
							var l = rt.parseRtattributes(bufs[i]);
							links[i] = l;
							//console.dir(l);
						}

						netkitObject.netlinkCommand(getaddr_command_opts, "eth0", sock, function(err,addr_bufs) {
							if(err)
								console.error("** Error: " + util.inspect(err));
							else {
								var data = [];

								for(var n=0;n<addr_bufs.length;n++) {
									var addr = ipparse.parseAttributes(filters,links,addr_bufs[n]);
									if(typeof(addr) !== 'undefined') {
										data.push(addr);
									}
								}
								sock.close();
								cb(data);
							}
						});
					}
				});
			}
		 });
	},

	getLinks: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var sock = this.newNetlinkSocket();
		var sock_opts = {};

		var netkitObject = this;
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");

				var getlink_command_opts = {
					type: 	rt.RTM_GETLINK, // get link
					flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
				};
				netkitObject.netlinkCommand(getlink_command_opts, "eth0", sock, function(err,link_bufs) {
					if(err)
						console.error("** Error: " + util.inspect(err));
					else {
						var data = [];

						for(var l = 0; l < link_bufs.length; l++) {
							var link = ipparse.parseAttributes(filters,null,link_bufs[l]);
							if(typeof(link) !== 'undefined') {
								data.push(link);
							}
						}
						sock.close();
						cb(data);
					}
				});
			}
		 });
	}
};

module.exports = routes;