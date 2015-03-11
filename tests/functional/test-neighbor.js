var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');


nk.ipv4Neighbor("add","eth1","192.168.56.191","02:2a:8c:54:3f:cf", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

nk.ipv4Neighbor("change","eth1","192.168.56.191","02:2a:8c:00:3f:cf", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

nk.ipv4Neighbor("replace","eth1","192.168.56.199","02:2a:8c:00:3f:cf", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

nk.ipv4Neighbor("delete","eth1","192.168.56.191","02:2a:8c:54:3f:cf", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

nk.ipv4Neighbor("show",null,null,null, function(bufs) {
	console.dir(bufs);
});
