var nk = require('../index.js');


/*
var rt = nk.rt;
var util = require('util');
var sock = nk.newNetlinkSocket();
console.dir(sock);

//setTimeout(function(){
	var sock_opts = {
		// subscriptions: rt.RTN_GRP_IPV4_IFADDR(rt.RTN_GRP_LINK)
		//subscriptions: rt.make_group(rt.RTN_GRP_IPV4_IFADDR)// | rt.make_group(rt.RTN_GRP_IPV6_IFADDR) | rt.make_group(rt.RTN_GRP_IPV6_ROUTE) 
				subscriptions: 	rt.make_group(rt.RTN_GRP_IPV4_IFADDR) 	| 
						rt.make_group(rt.RTN_GRP_IPV6_IFADDR) 	| 
						rt.make_group(rt.RTNLGRP_LINK) 	|
						rt.make_group(rt.RTNLGRP_IPV4_ROUTE) 	|
						rt.make_group(rt.RTN_GRP_IPV6_ROUTE) 	|
						rt.make_group(rt.RTNLGRP_IPV4_MROUTE) 	|
						rt.make_group(rt.RTNLGRP_IPV6_MROUTE) 	|
						rt.make_group(rt.RTNLGRP_IPV6_PREFIX) 	|
						rt.make_group(rt.RTNLGRP_NEIGH) 	|
						rt.make_group(rt.RTNLGRP_IPV4_NETCONF) 	|
						rt.make_group(rt.RTNLGRP_IPV6_NETCONF)						

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


	sock.onRecv(function(err,bufs){
		if(err) {
    		console.log("** Error in reply: ");
    		for(var n=0;n<bufs.length;n++) {
    			console.log('here');
    			console.dir(bufs[n]);
    			console.log('buf len = ' + bufs[n].length);
    			var errobj = nk.nl.parseErrorHdr(bufs[n]);
    			console.dir(nk.errorFromErrno(errobj._error));
    			console.log(util.inspect(errobj));
    		}
    	} else {
    		for(var n=0;n<bufs.length;n++) {
    			console.log('here');
    			console.log(bufs[n]);
    			console.log('buf len = ' + bufs[n].length);

    			var attrs = nk.rt.parseRtattributes(bufs[n]);
    			// console.dir(attrs);

			    for (key in attrs) {
	    			console.log(key + ' = ' + attrs[key]);
			    }

    		}
    	}
	});


	// use this to get link or address info before receiving the first change event
	// or comment out to just start listening for changes
	// /*

	var command_opts = {
		// The info you want to retrieve before listening

		//type: nk.rt.RTM_GETLINK, // get link
		type: 	nk.rt.RTM_GETADDR, // get addr
		flags: 	nk.nl.NLM_F_REQUEST|nk.nl.NLM_F_ROOT|nk.nl.NLM_F_MATCH
	};
	nk.netlinkCommand(command_opts, "eth0", sock, function(err,req) {

		if(err)
			console.error("** Error: " + util.inspect(err));
		else {
			console.log("success!");
		}
	});
	// */

	nk.onNetworkChange("", "address", function (data) {
		console.log("changed...");
		console.dir(data);
	});
