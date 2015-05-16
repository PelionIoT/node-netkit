var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');
var err = require('../../libs/common.js').err;


nk.link("up","eth1", function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

