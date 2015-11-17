var nk = require('../../index.js');
var util = require('util');


exports.testAddrFlush = function(test) {
	// flush everything on enp0s9
	test.doesNotThrow(function() {
		nk.ipAddress("flush","inet","enp0s9",null,null,function(err,bufs){
		 	if(err) throw new Error("testAddrFlush() Error: " + util.inspect(err));
			nk.ipAddress("flush","inet6","enp0s9",null,null,function(err,bufs){
			 	if(err) throw new Error("testAddrFlush() Error: " + util.inspect(err));
			 	test.done();
			});
		});
	});
};

exports.group = {

	testLinkNullOptionsForSet: function(test){
		test.doesNotThrow(function() {
			// nk.link("set", "enp0s9", null, function(err,bufs){
			// 	if(err !== null)
			// 		throw new Error("testLinkNullOptionsForSet() Error: " + util.inspect(err));
			//     test.done();
			// } );

			test.done();
		});
	},
};

