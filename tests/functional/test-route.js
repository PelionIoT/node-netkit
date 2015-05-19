var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');
var err = require('../../libs/common.js').err;


nk.route("delete","eth0","192.168.0.1",null, function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));

		// nk.ipv4Neighbor("change","eth1","192.168.56.191","02:2a:8c:00:3f:cf", function(err) {
		// 	if(err) {
		// 		console.error("** Error: " + util.inspect(err));

		// 		nk.ipv4Neighbor("replace","eth1","192.168.56.199","02:2a:8c:00:3f:cf", function(err) {
		// 			if(err) {
		// 				console.error("** Error: " + util.inspect(err));

		// 				nk.ipv4Neighbor("delete","eth1","192.168.56.191","02:2a:8c:54:3f:cf", function(err) {
		// 					if(err) {
		// 						console.error("** Error: " + util.inspect(err));
		// 					} else {
		// 						console.log("success!");
		// 					}
		// 				});

		// 			} else {
		// 				console.log("success!");
		// 			}
		// 		});

		// 	} else {
		// 		console.log("success!");
		// 	}
		// });
	} else {
		console.log("success!");
	}
});

// nk.ipv4Neighbor("show",null,null,null, function(err, bufs) {
// 	if(err) {
// 		console.error("** Error: " + util.inspect(err));
// 	} else {
// 		console.dir(bufs);
// 	}
// });

//ifname,inet6dest,lladdr,cb,sock

// var sock = nk.newNetlinkSocket();
// nk.addIPv6Neighbor("add","eth2","fe80::2a:8cff:ff70:dbf2","02:2a:8c:70:db:f2", function(err) {
// 	if(err) {
// 		console.error("** Error: " + util.inspect(err));
// 	} else {
// 		console.log("Success!");
// 	}
// }, sock);
