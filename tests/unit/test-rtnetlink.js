var rt = require('../../rtnetlink.js');

exports.testBogusInput = function(test){
	test.doesNotThrow(function() {
		rt.parseRtattributes(null);  	// null
		rt.parseRtattributes();			// undefined
		rt.parseRtattributes("");		// wrong type
		rt.parseRtattributes(0);		// wrong type
		rt.parseRtattributes({});		// wrong type
		rt.parseRtattributes(new Buffer(1)); // less than netlink header size
		rt.parseRtattributes(new Buffer(16)); // netlink header but no length
		rt.parseRtattributes(Buffer([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]));
	});//, [error], [message])

    test.done();
};

exports.testMessageTypes = function(test){
	test.deepEqual(
		rt.parseRtattributes(Buffer([0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		{},
		"zero length link message should result in empty object" );

	test.deepEqual(
		rt.parseRtattributes(Buffer([255,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		{},
		"full message size but no attributes should result in empty object" );

	test.deepEqual(
		rt.parseRtattributes(Buffer([22,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		{ payload: undefined, operation: 'newLink' },
		"full message size but no attributes should result in empty link object" );

	test.deepEqual(
		rt.parseRtattributes(Buffer([22,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),
		{},
		"bad type result in empty object" );

	test.deepEqual(
		rt.parseRtattributes(Buffer([22,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0])),
		{},
		"bad type result in empty object" );

    test.done();
};