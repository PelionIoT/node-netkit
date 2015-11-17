
var parser = require("../../nf/node-netfilter.js");
var fs = require('fs');
var util = require('util');

exports.testFilters = function(test){


	test.doesNotThrow(function() {
		parser.parse("list all tables");
		parser.parse("list table filter");
		parser.parse("list chain filter input");

		parser.parse("add table filter");
		parser.parse("add chain filter input { type filter hook input priority 0 }");
		parser.parse("add rule filter input tcp dport 22 saddr 192.168.1.0/24 accept");

		parser.parse("delete table filter");
		parser.parse("delete chain filter input");
		parser.parse("delete rule 5");

		parser.parse("flush table filter");
		parser.parse("flush chain filter input");

		parser.parse("list all tables ip");
		parser.parse("list table ip filter");
		parser.parse("list chain ip filter input");

		parser.parse("add table ip filter");
		parser.parse("add chain ip filter input { type filter hook input priority 0 }");
		parser.parse("add rule ip filter input tcp dport 22 saddr 192.168.1.0/24 accept");

		parser.parse("delete table ip filter");
		parser.parse("delete chain ip filter input");
		parser.parse("delete rule ip6 5");

		parser.parse("flush table ip6 filter");
		parser.parse("flush chain ip filter input");
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_table', 'utf8');
		var parsed = parser.parse("add table ip filter");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_chain', 'utf8');
		var parsed = parser.parse("add chain ip filter input { type filter hook input priority 0 }");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_accept', 'utf8');
		var parsed = parser.parse("add rule ip filter input tcp dport 22 saddr 192.168.56.0/23 accept");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

	test.doesNotThrow(function() {
		var output = fs.readFileSync('./tests/unit/data/add_drop', 'utf8');
		var parsed = parser.parse("add rule ip filter input tcp dport 22 drop");
		test.deepEqual(
			parsed,
			JSON.parse(output),
			"should generate the correct structure" );
	});

    test.done();
};
