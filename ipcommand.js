var rt = require('./nl/rtnetlink.js');
var nl = require('./nl/netlink.js')
var util = require('util');
var ipparse = require('./ipparse.js');

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

	address: function(operation,family,ifname,addr,label,cb) {
		// console.log("operation = " + operation);

		var netkitObject = this;
		var opts;
		var sock_opts = {};

		var fam = rt.AF_INET

		if(family !== null){
			if(family === 'inet') { fam = rt.AF_INET; }
			else if(family === 'inet6') { fam = rt.AF_INET6; }
			else {
				cb(new Error("Error: address " + operation + " unrecognized family " + family));
				return;
			}
		}

		if(ifname === null && operation !== 'show'){
			cb(new Error("Error: address " + operation + " parameter ifname is required"));
			return;
		}

		var filters = {};
		if(family) filters['family'] = family;
		if(addr) filters['address'] = addr;
		if(label) filters['label'] = label;
		if(ifname) filters['ifname'] = ifname;

		// console.dir(filters);

		var sock = netkitObject.newNetlinkSocket();
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			}
		});

		if(!operation || operation === 'show') {
			if(ifname === null){
				cb(new Error("Error: address " + operation + " ifname parameter required"));
				return;
			}
			var opts = {
				type: 	rt.RTM_GETADDR,
				flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH,
				family: fam,
				addr: addr,
				ifname: ifname,
				label: label
			};
			ipcommand.sendInquiry(netkitObject,filters,opts,cb);
			return;
		} else if(operation === 'add') {
			if(addr === null){
				cb(new Error("Error: address " + operation + " addr required"));
				return;
			}

			opts = {
				type: rt.RTM_NEWADDR, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
				family: fam,
				addr: addr,
				ifname: ifname,
				label: label
			}
		} else if(operation === 'change') {
			if(addr === null){
				cb(new Error("Error: address " + operation + " addr parameter required"));
				return;
			}

			opts = {
				type: rt.RTM_NEWADDR, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: fam,
				addr: addr,
				ifname: ifname,
				label: label
			}
		} else if(operation === 'delete') {
			if(addr === null && label === null){
				cb(new Error("Error: address " + operation + " addr or label parameters required"));
				return;
			}

			opts = {
				type: rt.RTM_DELADDR, // the command
				flags: nl.NLM_F_REQUEST,
				family: fam,
				addr: addr,
				ifname: ifname,
				label: label
			}
		} else if(operation === 'flush') {

			var netkitObject = this;
			var getaddr_command_opts = {
				type: 	rt.RTM_GETADDR,
				flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
			};

			opts = {
				type: rt.RTM_DELADDR, // the command
				flags: nl.NLM_F_REQUEST,
				family: fam,
				ifname: ifname,
				label: null
			};

			ipcommand.sendInquiry(netkitObject,filters,getaddr_command_opts,function(err, bufs){
				if(err) {
					console.log("* Error" + util.inspect(err));
					cb(err);
					return;
				} else {
					// console.log("bufs --> ");
					// console.dir(bufs);

					var keep_going = true;
					for(var i = 0; i < bufs.length && keep_going; i++) {

						opts.addr = bufs[i]['event']['address'];

						//console.log("bufs.length = " + bufs.length + " i = " + i);
						// console.dir(opts);
						nl.netlinkAddrCommand.call(netkitObject,opts, sock, function(err,bufs) {
							if(err) {
							} else {
								cb(null,bufs);
								return;
							}
						});
					}
					sock.close();
					cb(null);
					return;
				}
			});


		} else {
			console.error("event type = '" + operation + "'' : Not supported");
			return;
		}

		if(operation !== 'flush') {
			nl.netlinkAddrCommand.call(netkitObject,opts, sock, function(err,bufs) {
				if(err) {
					cb(err);
					return;
				} else {
					//console.log("bufs--->");
					//console.dir(bufs);
					cb(null,bufs);
					return;
				}
				sock.close();
			});
		}
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
			type: 	rt.RTM_GETADDR,
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
					if(err) {
						console.error("** Error: " + util.inspect(err));
						cb(err);
					} else {
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
							cb(null, ldata);
						} else {
							nl.netlinkInfoCommand.call(nkObject, command, sock, function(err,c_bufs) {
								if(err) {
									console.error("** Error: " + util.inspect(err));
									cb(err);
								} else {
									var cdata = [];
									for(var n = 0; n < c_bufs.length; n++) {
										var cObject = ipparse.parseAttributes(filters,links,c_bufs[n]);
										if(typeof(cObject) !== 'undefined') {
											cdata.push(cObject);
										}
									}
									//console.log("cdata ---> ");
									//console.dir(cdata);
									cb(null, cdata);
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