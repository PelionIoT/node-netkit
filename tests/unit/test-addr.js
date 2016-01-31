var nk = require('../../index.js');
var util = require('util');

var enp0s8_10_10_20_19 =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8' } };

var enp0s8_10_10_20_19_label =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8:bob' } };


var enp0s8_10_10_20_20 =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8' } };

var enp0s8_10_10_20_20_label =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8:bob' } };

var enp0s8_10_10_20_21 =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8' } };

var enp0s8_10_10_20_21_label =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s8:bob' } };

var enp0s8_aaaa_a =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::a/64',
	       family: 'inet6',
	       scope: 'global' } };

var enp0s8_aaaa_b =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::b/64',
	       family: 'inet6',
	       scope: 'global' } };

var enp0s8_aaaa_c =
	 { ifname: 'enp0s8',
	    ifnum: 3,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::c/64',
	       family: 'inet6',
	       scope: 'global' } };



exports.testAddrFlush = function(test) {
		// flush everything on enp0s8
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,null,function(err,bufs){
			 	if(err) throw new Error("testAddrFlush() Error: " + util.inspect(err));
				nk.ipAddress("flush","inet6","enp0s8",null,null,function(err,bufs){
				 	if(err) throw new Error("testAddrFlush() Error: " + util.inspect(err));
				 	test.done();
				});
			});
		});
};

exports.group = {

	//======================= test add and flush

	testAddrAdd: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","enp0s8","10.10.20.19/24",null,function(err,bufs){
				if(err) throw new Error("testAddrAdd() Error: " + util.inspect(err));
			 	test.ok(true);
			    test.done();
			} );
		});
	},

	testAddrShowAdded: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testAddrShowAdded() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_19]);
			    test.done();
			} );
		});
	},

	testAddrFlush: function(test) {
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,null,function(err,bufs){
			 	if(err) throw new Error("testAddrFlush() Error: " + util.inspect(err));
			 	test.done();
			});
		});
	},

	testVerifyFlush: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testVerifyFlush() Error: " + util.inspect(err));
				test.deepEqual(bufs, []);
			    test.done();
			} );
		});
	},

	//======================= test add three and flush all

	testAddrAddThree: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","enp0s8","10.10.20.19/24",null,function(err,bufs){
				if(err) throw new Error("testAddrAddThree() Error: " + util.inspect(err));

				nk.ipAddress("add","inet","enp0s8","10.10.20.20/24",null,function(err,bufs){
					if(err) throw new Error("testAddrAddThree() Error: " + util.inspect(err));

					nk.ipAddress("add","inet","enp0s8","10.10.20.21/24",null,function(err,bufs){
						if(err) throw new Error("testAddrAddThree() Error: " + util.inspect(err));

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
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testAddrShowThree() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_19, enp0s8_10_10_20_20, enp0s8_10_10_20_21]);
			    test.done();
			} );
		});
	},

	testFlushThree: function(test){
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,null,function(err,bufs){
			 	if(err) throw new Error("testFlushThree() Error: " + util.inspect(err));
	 			test.done();
			});
		});
	},


	//======================= test add with label and flush by label
	testAddrAddThreeOneWithLabel: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","enp0s8","10.10.20.19/24",null,function(err,bufs){
				if(err) throw new Error("testAddrAddThreeOneWithLabel() Error: " + util.inspect(err));

				nk.ipAddress("add","inet","enp0s8","10.10.20.20/24","enp0s8:bob",function(err,bufs){
					if(err) throw new Error("testAddrAddThreeOneWithLabel() Error: " + util.inspect(err));

					nk.ipAddress("add","inet","enp0s8","10.10.20.21/24",null,function(err,bufs){
						if(err) throw new Error("testAddrAddThreeOneWithLabel() Error: " + util.inspect(err));

					 	test.ok(true);
					    test.done();
					});
				});
			} );
		});
	},


	testAddrShowThreeOneWithLabel: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testAddrShowThreeOneWithLabel() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_19, enp0s8_10_10_20_20_label, enp0s8_10_10_20_21]);
			    test.done();
			} );
		});
	},

	testAddrShowOneWithLabelFromThree: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,"enp0s8:bob",function(err,bufs){
				if(err) throw new Error("testAddrShowThreeOneWithLabel() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_20_label]);
			    test.done();
			} );
		});
	},

	testFlushOneOfThreeByLabel: function(test){
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,"enp0s8:bob",function(err,bufs){
			 	if(err) throw new Error("testFlushOneOfThreeByLabel() Error: " + util.inspect(err));
			 	test.done();
			});
		});
	},

	testVerifyLabelFushed: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testVerifyLabelFushed() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_19, enp0s8_10_10_20_21]);
			    test.done();
			} );
		});
	},

	testFlushNoLabel: function(test){
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,null,function(err,bufs){
			 	if(err) throw new Error("testFlushNoLabel() Error: " + util.inspect(err));
			 	test.done();
			});
		});
	},

	testAddrAddThreeAllWithLabel: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet","enp0s8","10.10.20.19/24","enp0s8:bob",function(err,bufs){
				if(err) throw new Error("testAddrAddThreeAllWithLabel() Error: " + util.inspect(err));

				nk.ipAddress("add","inet","enp0s8","10.10.20.20/24","enp0s8:bob",function(err,bufs){
					if(err) throw new Error("testAddrAddThreeAllWithLabel() Error: " + util.inspect(err));

					nk.ipAddress("add","inet","enp0s8","10.10.20.21/24","enp0s8:bob",function(err,bufs){
						if(err) throw new Error("testAddrAddThreeAllWithLabel() Error: " + util.inspect(err));

					 	test.ok(true);
					    test.done();
					});
				});
			} );
		});
	},

	testAddrShowThreeAllWithLabel: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testAddrShowThreeAllWithLabel() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_10_10_20_19_label, enp0s8_10_10_20_20_label, enp0s8_10_10_20_21_label]);
			    test.done();
			} );
		});
	},

	testFlushAllThreeByLabel: function(test){
		test.doesNotThrow(function() {
			nk.ipAddress("flush","inet","enp0s8",null,"enp0s8:bob",function(err,bufs){
			 	if(err) throw new Error("testFlushAllThreeByLabel() Error: " + util.inspect(err));
	 		test.done();
			});
		});
	},

	testVerifyAllThreeLabelFushed: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testVerifyAllThreeLabelFushed() Error: " + util.inspect(err));
				test.deepEqual(bufs, []);
			    test.done();
			} );
		});
	},

	testAddrAddThreeIpv6: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("add","inet6","enp0s8","aaaa::a/64","enp0s8:bob",function(err,bufs){
				if(err) throw new Error("testAddrAddThreeIpv6() Error: " + util.inspect(err));

				nk.ipAddress("add","inet6","enp0s8","aaaa::b/64","enp0s8:bob",function(err,bufs){
					if(err) throw new Error("testAddrAddThreeIpv6() Error: " + util.inspect(err));

					nk.ipAddress("add","inet6","enp0s8","aaaa::c/64","enp0s8:bob",function(err,bufs){
						if(err) throw new Error("testAddrAddThreeIpv6() Error: " + util.inspect(err));

					 	test.ok(true);
					    test.done();
					});
				});
			} );
		});
	},

	testAddrShowThreeIpv6: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddress("show","inet6","enp0s8",null,null,function(err,bufs){
				if(err) throw new Error("testAddrShowThreeIpv6() Error: " + util.inspect(err));
				test.deepEqual(bufs, [enp0s8_aaaa_c, enp0s8_aaaa_b, enp0s8_aaaa_a]);
			    test.done();
			} );
		});
	},

};

