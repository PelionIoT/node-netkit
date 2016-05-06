var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');
var err = require('../../libs/common.js').err;


// nk.link("up","eth1", null, function(err) {
// 	if(err) {
// 		console.error("** Error: " + util.inspect(err));
// 	} else {
// 		console.log("success!");
// 	}
// });

// var opts = {
//     operation: 'set',
//     ifname: 'wlp3s0',
//     address: '080027dce402'
// };

var opts = {
    operation: 'down',
    ifname: 'wlp3s0'
};

nk.link(opts, function(err) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
	}
});

