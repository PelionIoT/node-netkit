
var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');
var NlAttributes = require('../nl/nlattributes.js');

var asHexBuffer = cmn.asHexBuffer;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var netutils = cmn.netutils;


module.exports.onNetworkChange = function(ifname, event_type, cb) {
	var links = [];
	var netkitObject = this;

	var sock = netkitObject.newNetlinkSocket();
	var sock_opts;
	if(!event_type) {
		throw new Error("specify event type: [link,addr,route,neigh]");
	} else if(event_type === 'link') {
		sock_opts = {
			subscriptions: 	  rt.make_group(rt.RTNLGRP_IPV4_LINK)
		}
	} else if(event_type === 'addr') {
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
		console.error("event type = '" + event_type + "'' : Not supported - use [link,addr,route,neigh]");
		return;
	}

	sock.create(sock_opts,function(err) {
		if(err) {
			error("socket.create() Error: " + util.inspect(err));
			cb(err);
			return;
		} else {
			//debug("Created netlink socket.");
		}
	 });

	var command_opts = {
		type: 	rt.RTM_GETLINK, // get link
		flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
	};

	ipcommand.netlinkInfoCommand.call(this,command_opts, sock, function(err,bufs) {
		if(err) {
				cb(err,null);
		}
		else {
			// get the attributes of all the links first for later reference
			for(var i = 0; i < bufs.length; i++) {
				var l = rt.parseRtattributes(bufs[i]);
				links[i] = l;
				//console.dir(l);
			}

			sock.onRecv(function(err,bufs) {
				if(err) {
					cb(err, null);
				} else {
					var filters = {};
					if(ifname) filters['ifname'] = ifname;
					var mObject;
					if(event_type === 'link') {
						var attrs = new NlAttributes("link", null, rt );
						mObject = attrs.generateNetlinkResponse(bufs, ipparse.transformInfoLinkFull, null);
					} else {
						mObject = ipparse.parseAttributes(filters,links,bufs[0]);
					}

					if(typeof mObject[0] !== 'undefined') {
						var retval = mObject[0]['payload'];
						if(typeof(retval) != 'undefined') {
							if((Array.isArray(retval) && retval.length > 0) || !Array.isArray(retval)) {
								cb(null, retval);
							}
						}
					}
				}
			});
		}
	});
};
