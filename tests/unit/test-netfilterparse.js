
var parser = require("../../nf/node-netfilter.js");
var fs = require('fs');
var util = require('util');

exports.testFilters = function(test){

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_table', 'utf8');
		var parsed = parser.parse("add ip table filter");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_chain', 'utf8');
		var parsed = parser.parse("add ip chain filter input { type filter hook input priority 0 }");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_accept', 'utf8');
		var parsed = parser.parse("add ip rule filter input tcp dport 22 saddr 192.168.56.0/23 accept");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_drop', 'utf8');
		var parsed = parser.parse("add ip rule filter input tcp dport 22 drop");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	// test.doesNotThrow(function() {
	// 	var output = fs.readFileSync('./tests/unit/data/add_table', 'utf8');
	// 	console.dir(util.inspect(output));
	// 	var parsed = parser.parse("add ip table filter");
	// 	test.deepEqual(
	// 		parsed,
	// 		JSON.parse(output),
	// 		"should generate the correct structure" );
	// });

    test.done();
};
