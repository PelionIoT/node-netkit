var nk = require('../../index.js');
var util = require('util');

var enp0s9_10_10_20_19 =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9' } };

var enp0s9_10_10_20_19_label =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.19/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9:bob' } };


var enp0s9_10_10_20_20 =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9' } };

var enp0s9_10_10_20_20_label =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.20/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9:bob' } };

var enp0s9_10_10_20_21 =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9' } };

var enp0s9_10_10_20_21_label =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: '10.10.20.21/24',
	       family: 'inet',
	       scope: 'global',
	       label: 'enp0s9:bob' } };

var enp0s9_aaaa_a =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::a/64',
	       family: 'inet6',
	       scope: 'global' } };

var enp0s9_aaaa_b =
	 { ifname: 'enp0s9',
	    ifnum: 4,
	    event:
	     { name: 'newAddress',
	       address: 'aaaa::b/64',
	       family: 'inet6',
	       scope: 'global' } };

var enp0s9_aaaa_c =
	 { ifname: 'enp0s9',
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

		test.doesNotThrow(function() {
			nk.ipAddrLabel("add","inet6", "enp0s9", "aaaa::a/64",25,function(err,bufs){
				if(err) {
					console.log(util.inspect(err));
					throw err;
				}
			 	test.ok(true);
			} );
		});
	    test.done();
	},


};

