var rt = require('../../ip/ipparse.js');

var fs = require('fs');
var links = JSON.parse(fs.readFileSync('./tests/unit/data/links.json', 'utf8'));

var lo_obj = { ifname: 'lo',
ifnum: 1,
event:
 { name: 'newRoute',
   type: 'broadcast',
   family: 'inet',
   address: '127.0.0.0/32',
   src: 'default',
   table: 'local',
   protocol: 'kernel',
   scope: 'link',
   prefsrc: '127.0.0.1' } };

var lo = Buffer([60,0,0,0,24,0,2,0,99,38,251,84,81,9,0,0,2,32,0,0,255,2,253,3,0,0,0,0,8,0,15,0,255,0,0,0,8,0,1,0,127,0,0,0,8,0,7,0,127,0,0,1,8,0,4,0,1,0,0,0]);

var eth0_obj = { ifname: 'eth0',
ifnum: 2,
event:
 { name: 'newRoute',
   type: 'unicast',
   family: 'inet',
   address: '192.168.56.0/24',
   src: 'default',
   table: 'main',
   protocol: 'kernel',
   scope: 'link',
   prefsrc: '192.168.56.101' } };
var eth0 = Buffer([60,0,0,0,24,0,2,0,99,38,251,84,81,9,0,0,2,24,0,0,254,2,253,1,0,0,0,0,8,0,15,0,254,0,0,0,8,0,1,0,192,168,56,0,8,0,7,0,192,168,56,101,8,0,4,0,2,0,0,0]);

var eth1_obj = { ifname: 'eth1',
  ifnum: 3,
  event:
   { name: 'newRoute',
     type: 'unicast',
     family: 'inet6',
     address: 'fe80::/64',
     src: 'default',
     table: 'main',
     protocol: 'kernel',
     scope: 'global',
     priority: 256 } };

var eth1 = Buffer([108,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,10,64,0,0,254,2,0,1,0,0,0,0,8,0,15,0,254,0,0,0,20,0,1,0,254,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,4,0,3,0,0,0,8,0,6,0,0,1,0,0,36,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);

var both = [eth0,lo];
var all = [lo,eth0,eth1];

exports.testBogusInput = function(test){
	test.doesNotThrow(function() {
		test.equal(
			rt.parseAttributes(null,null,null),  	// null
			undefined);
		test.equal(
			rt.parseAttributes(),			// undefined
			undefined);
		test.equal(
			rt.parseAttributes("","",""),		// bad
			undefined);
		test.equal(
			rt.parseAttributes(0,0,0),		// bad
			undefined);
		test.equal(
			rt.parseAttributes({}, null, null),
			undefined);
		test.equal(
			rt.parseAttributes({},links,Buffer(0)),
			undefined);
		test.equal(
			rt.parseAttributes({},links,Buffer([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
			undefined);
	});//, [error], [message])

    test.done();
};

var noarp_neigh = [88,0,0,0,29,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,4,0,0,0,64,0,0,5,20,0,1,0,255,2,0,0,0,0,0,0,0,0,0,1,255,232,214,48,10,0,2,0,51,51,255,232,214,48,0,0,8,0,4,0,0,0,0,0,20,0,3,0,206,23,0,0,94,0,0,0,94,0,0,0,0,0,0,0];

exports.testFilters = function(test){

	test.doesNotThrow(function() {
		test.deepEqual(
			rt.parseAttributes(null,links,eth0),
			eth0_obj,
			"null filter should return all objects" );

		test.deepEqual(
			rt.parseAttributes({},links,eth0),
			eth0_obj,
			"empty filter should return all objects" );

		test.deepEqual(
			rt.parseAttributes([],links,eth0),
			eth0_obj,
			"null array filter should return all objects" );

		test.deepEqual(
			rt.parseAttributes([{}],links,eth0),
			eth0_obj,
			"array filter with empty object should return all objects" );

		test.deepEqual(
			rt.parseAttributes([{},{},{}],links,eth0),
			eth0_obj,
			"array filter with empty objects should return all objects" );

		test.deepEqual(
			rt.parseAttributes({ ifname: 'eth1' },links,noarp_neigh),
			undefined,
			"no filter specified with no data from RTn parse should return undefined" );

		test.deepEqual(
			rt.parseAttributes({ifname: 'eth0'},links,eth0),
			eth0_obj,
			"filter with specified object should return that object" );

		test.deepEqual(
			rt.parseAttributes({ifname: 'lo'},links,eth0),
			undefined,
			"filter with specified object should return that object" );

		test.deepEqual(
			rt.parseAttributes([{ifname: 'lo'},{ifname: 'eth0'}],links,eth0),
			eth0_obj,
			"array filter with specified objects should return either object" );

		test.deepEqual(
			rt.parseAttributes([{ifname: 'lo'},{ifname: 'eth0'}],links,lo),
			lo_obj,
			"array filter with specified objects should return either object" );

		var result = [];
		for(var a in both) {
			result.push(rt.parseAttributes({},links,both[a]));
		}
		test.deepEqual(
			result,
			[eth0_obj,lo_obj],
			"filter with empty object should return all objects" );

		result = [];
		for(var a in all) {
			var r = rt.parseAttributes([{ifname: 'eth0'},{ifname: 'eth1'}],links,all[a]);
			if(r)result.push(r);
		}
		test.deepEqual(
			result,
			[eth0_obj,eth1_obj],
			"filter with two of the three objects should return those objects" );

	});
    test.done();
};
