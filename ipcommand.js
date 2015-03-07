var rt = require('./rtnetlink.js');
var nl = require('./netlink.js')
var util = require('util');
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

var ipcommand = {

	onNetworkChange: function(ifname, event_type, cb) {
		var links = [];
		var netkitObject = this;

		var sock = netkitObject.newNetlinkSocket();
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

								| rt.make_group(rt.RTN_GRP_NEIGH)
								| rt.make_group(rt.RTNLGRP_IPV4_NETCONF)
								| rt.make_group(rt.RTNLGRP_IPV6_NETCONF)
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
		} else if(event_type === 'neigh') {
			sock_opts = {
				subscriptions: 	  rt.make_group(rt.RTN_GRP_NEIGH)
								| rt.make_group(rt.RTNLGRP_IPV4_NETCONF)
								| rt.make_group(rt.RTNLGRP_IPV6_NETCONF)
			}
		} else {
			console.error("event type = '" + event_type + "'' : Not supported");
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
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};

		nl.netlinkInfoCommand.call(this,command_opts, sock, function(err,bufs) {
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

	neighbor: function(operation,ifname,inet4dest,lladdr,cb) {
		var netkitObject = this;
		var neigh_opts;
		var sock_opts = {};

		if(!operation || operation === 'show') {
			var getneigh_command_opts = {
				type: 	rt.RTM_GETNEIGH,
				flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
			};
			ipcommand.sendInquiry(netkitObject,null,getneigh_command_opts,cb);
			return;
		} else if(operation === 'add') {
			neigh_opts = {
				type: rt.RTM_NEWNEIGH, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
				family: rt.AF_INET,
				inet4dest: inet4dest,
				lladdr: lladdr,
				ifname: ifname
			}
		} else if(operation === 'change') {
			neigh_opts = {
				type: rt.RTM_NEWNEIGH, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: rt.AF_INET,
				inet4dest: inet4dest,
				lladdr: lladdr,
				ifname: ifname
			}
		} else if(operation === 'replace') {
			neigh_opts = {
				type: rt.RTM_NEWNEIGH, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: rt.AF_INET,
				inet4dest: inet4dest,
				lladdr: lladdr,
				ifname: ifname
			}
		} else if(operation === 'delete') {
			neigh_opts = {
				type: rt.RTM_DELNEIGH, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
				family: rt.AF_INET,
				inet4dest: inet4dest,
				lladdr: lladdr,
				ifname: ifname
			}
		} else {
			console.error("event type = '" + operation + "'' : Not supported");
			return;
		}

		var sock = netkitObject.newNetlinkSocket();
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");

				nl.netlinkNeighCommand.call(netkitObject,neigh_opts, sock, function(err,bufs) {
					if(err) {
						cb(err);
					} else {
						cb();
					}
					sock.close();
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

		var netkitObject = this;
		var getroute_command_opts = {
			type: 	rt.RTM_GETROUTE,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		ipcommand.sendInquiry(netkitObject,filters,getroute_command_opts,cb);
	},

	getAddresses: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var netkitObject = this;
		var getaddr_command_opts = {
			type: 	rt.RTM_GETROUTE,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		ipcommand.sendInquiry(netkitObject,filters,getaddr_command_opts,cb);
	},

	getLinks: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var netkitObject = this;
		ipcommand.sendInquiry(netkitObject,filters,null,cb);
	},


	sendInquiry: function(nkObject,filters,command,cb) {
		var sock = nkObject.newNetlinkSocket();
		var sock_opts = {};
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");

				var getlink_command_opts = {
					type: 	rt.RTM_GETLINK, // get link
					flags: 	nkObject.nl.NLM_F_REQUEST|nkObject.nl.NLM_F_ROOT|nkObject.nl.NLM_F_MATCH
				};

				nl.netlinkInfoCommand.call(nkObject,getlink_command_opts, sock, function(err,bufs) {
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

						if(!command) {
							var ldata = [];
							for(var l = 0; l < links.length; l++) {
								var link = ipparse.parseAttributes(filters,null,bufs[l]);
								if(typeof(link) !== 'undefined') {
									ldata.push(link);
								}
							}
							cb(ldata);
						} else {
							nl.netlinkInfoCommand.call(nkObject, command, sock, function(err,c_bufs) {
								if(err)
									console.error("** Error: " + util.inspect(err));
								else {
									//console.dir(c_bufs);
									var cdata = [];
									for(var n = 0; n < c_bufs.length; n++) {
										var cObject = ipparse.parseAttributes(filters,links,c_bufs[n]);
										if(typeof(cObject) !== 'undefined') {
											cdata.push(cObject);
										}
									}
									cb(cdata);
								}
							});
						}
					}
				});
			}
		 });
		//sock.close();
	},
};

module.exports = ipcommand;