var rt = require('./rtnetlink.js');
var monitor = require('./ipmonitor.js');

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

	getRoutes: function(ifname,family,type,cb) {
		var sock = this.newNetlinkSocket();
		var sock_opts = {
			subscriptions: 
				  rt.make_group(rt.RTNLGRP_IPV4_ROUTE)
				| rt.make_group(rt.RTN_GRP_IPV6_ROUTE)
				| rt.make_group(rt.RTNLGRP_IPV4_MROUTE)
				| rt.make_group(rt.RTNLGRP_IPV6_MROUTE)
		};

		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");
			}
		 });

		var getlink_command_opts = {
			type: 	rt.RTM_GETLINK, // get link
			flags: 	this.nl.NLM_F_REQUEST|this.nl.NLM_F_ROOT|this.nl.NLM_F_MATCH
		};
		var getroute_command_opts = {
			type: 	rt.RTM_GETROUTE,
			flags: 	this.nl.NLM_F_REQUEST|this.nl.NLM_F_ROOT|this.nl.NLM_F_MATCH
		};
		var netkitObject = this;
		this.netlinkCommand(getlink_command_opts, "eth0", sock, function(err,bufs) {
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
						var filters = { table: 'main' };

						for(var n=0;n<routes_bufs.length;n++) {
							var route = monitor.parseAttributes(filters,links,routes_bufs[n]);
							if(typeof(route) !== 'undefined') {
								data.push(route);
							}
						}
						cb(data);
					}
				});
			}
		});
	}
};

module.exports = routes;