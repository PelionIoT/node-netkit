var nk = require('../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');

nk.addIPv4Neighbor("eth1","192.168.56.191","02:2a:8c:54:3f:cf", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});