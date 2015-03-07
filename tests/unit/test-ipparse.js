var rt = require('../../ipparse.js');

var fs = require('fs');
var links = JSON.parse(fs.readFileSync('./tests/unit/links.json', 'utf8'));

/*
{ ifname: 'eth0',
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
   prefsrc: '192.168.56.101' }
 */
var eth0 = Buffer([60,0,0,0,24,0,2,0,99,38,251,84,81,9,0,0,2,24,0,0,254,2,253,1,0,0,0,0,8,0,15,0,254,0,0,0,8,0,1,0,192,168,56,0,8,0,7,0,192,168,56,101,8,0,4,0,2,0,0,0]);

/*
	{ ifname: 'lo',
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
   prefsrc: '127.0.0.1' } }
*/
var lo = Buffer([60,0,0,0,24,0,2,0,99,38,251,84,81,9,0,0,2,32,0,0,255,2,253,3,0,0,0,0,8,0,15,0,255,0,0,0,8,0,1,0,127,0,0,0,8,0,7,0,127,0,0,1,8,0,4,0,1,0,0,0]);

exports.testBogusInput = function(test){
	test.doesNotThrow(function() {
		test.deepEqual(
			rt.parseAttributes(null,null,null),  	// null
			{},
			"");
		test.deepEqual(
			rt.parseAttributes(),			// undefined
			{},
			"");
		test.deepEqual(
			rt.parseAttributes("","",""),		// bad
			{},
			"");
		test.deepEqual(
			rt.parseAttributes(0,0,0),		// bad
			{},
			"");
		test.deepEqual(
			rt.parseAttributes({}, null, null),
			{},
			"");
		test.deepEqual(
			rt.parseAttributes({},links,Buffer(0)),
			{},
			"");
		test.deepEqual(
			rt.parseAttributes({},links,Buffer([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
			{},
			"");
	});//, [error], [message])

    test.done();
};

exports.testMessageTypes = function(test){

	test.doesNotThrow(function() {
		// test.deepEqual(
		// 	rt.parseAttributes(Buffer([0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		// 	{},
		// 	"zero length link message should result in empty object" );

		// test.deepEqual(
		// 	rt.parseAttributes(Buffer([255,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		// 	{},
		// 	"full message size but no attributes should result in empty object" );

		// test.deepEqual(
		// 	rt.parseAttributes(Buffer([22,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		// 	{ payload: undefined, operation: 'newLink' },
		// 	"full message size but no attributes should result in empty link object" );

		// test.deepEqual(
		// 	rt.parseAttributes(Buffer([22,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		// 	{},
		// 	"bad type result in empty object" );

		// test.deepEqual(
		// 	rt.parseAttributes(Buffer([22,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0])),
		// 	{},
		// 	"bad type result in empty object" );
	});
    test.done();
};