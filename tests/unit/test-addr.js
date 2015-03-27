var nk = require('../../index.js');


var eth2_10_10_20_20_19 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

var eth2_10_10_20_20_20 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

var eth2_10_10_20_20_21 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

exports.testAddrFlush = function(test) {
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","eth2",null,null,function(err,bufs){
			 	if(err) console.log("ipAddress() Error: " + util.inspect(err));
			 	test.done();
			});
		});
};

exports.group = {

	testAddrAdd: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","eth2","10.10.20.19/24",null,function(err,bufs){
				if(err) console.log("ipAddress() Error: " + util.inspect(err));
			 	test.ok(true);
			    test.done();
			} );
		});
	},

	testAddrShowAdded: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
				if(err) console.log("ipAddress() Error: " + util.inspect(err));
				test.deepEqual(bufs, [eth2_10_10_20_20_19]);
			    test.done();
			} );
		});
	},

	testAddrFlush: function(test) {
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","eth2",null,null,function(err,bufs){
			 	if(err) console.log("ipAddress() Error: " + util.inspect(err));
			});
		});
	 	test.done();
	},

	testVerifyFlush: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
				if(err) console.log("ipAddress() Error: " + util.inspect(err));
				test.deepEqual(bufs, []);
			    test.done();
			} );
		});
	},

	testAddrAddThree: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","eth2","10.10.20.19/24",null,function(err,bufs){
				if(err) console.log("ipAddress() Error: " + util.inspect(err));

				nk.ipAddress("add","inet","eth2","10.10.20.20/24",null,function(err,bufs){
					if(err) console.log("ipAddress() Error: " + util.inspect(err));

					nk.ipAddress("add","inet","eth2","10.10.20.21/24",null,function(err,bufs){
						if(err) console.log("ipAddress() Error: " + util.inspect(err));

					 	test.ok(true);
					    test.done();
					});
				});
			} );
		});
	},


	testAddrShowThree: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
				if(err) console.log("ipAddress() Error: " + util.inspect(err));
				test.deepEqual(bufs, [eth2_10_10_20_20_19, eth2_10_10_20_20_20, eth2_10_10_20_20_21]);
			    test.done();
			} );
		});
	},

	testVerifyFlushThree: function(test){
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","eth2",null,null,function(err,bufs){
			 	if(err) console.log("ipAddress() Error: " + util.inspect(err));
			});
		});
	 	test.done();
	},

};

