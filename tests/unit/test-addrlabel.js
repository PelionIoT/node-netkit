var nk = require('../../index.js');
var util = require('util');

var eth2_10_10_20_19 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

var eth2_10_10_20_19_label =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2:bob' } };


var eth2_10_10_20_20 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

var eth2_10_10_20_20_label =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2:bob' } };

var eth2_10_10_20_21 =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2' } };

var eth2_10_10_20_21_label =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'eth2:bob' } };

var eth2_aaaa_a =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::a/64',
	       family: 'inet6',
	       scope: 'global' } };

var eth2_aaaa_b =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::b/64',
	       family: 'inet6',
	       scope: 'global' } };

var eth2_aaaa_c =
	 { ifname: 'eth2',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::c/64',
	       family: 'inet6',
	       scope: 'global' } };



exports.preConditions = function(test) {
	test.done();
};

exports.group = {

	//======================= test add and flush

	testAddrlabelAdd: function(test){
		test.expect(2);

		test.doesNotThrow(function() {
			nk.ipAddrLabel("add","inet6", "eth2", "aaaa::1/64",25,function(err,bufs){
				if(err) throw new Error("testAddrlabelAdd() Error: " + util.inspect(err));
			 	test.ok(true);
			    test.done();
			} );
		});
	},


};

