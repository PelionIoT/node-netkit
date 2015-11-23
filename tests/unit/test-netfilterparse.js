
var parser = require("../../nf/node-netfilter.js");
var nfcommand = require("../../nf/nfcommand.js");
var NfAttributes = require("../../nf/nfattributes.js");
var nf = require("../../nl/nfnetlink.js");

var Buffer = require('buffer').Buffer;
var fs = require('fs');
var util = require('util');

exports.testNfParse = function(test){


	test.doesNotThrow(function() {
		parser.parse("list all tables");
		parser.parse("list table filter");
		parser.parse("list chain filter input");
		parser.parse("list chain");
		parser.parse("list chain ip6");

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

	test.doesNotThrow(function() {

		// Input input is what is sent over the netlink socket for thw command parsed below
		var input = fs.readFileSync('./tests/unit/data/add_rule_accept_data', 'utf8');
		input = input.slice(32);  //remove the first 32 characters which represents 16 bytes of nl_hdr

		var opts = parser.parse("add rule ip filter input tcp dport 22 saddr 192.168.56.0/23 accept");

		nfcommand.build_command(opts,function(err){
			if(err) {
				cb(err);
			} else {
				 var attrs = new NfAttributes(opts.type, opts.params);
				nf.createCommandBuffer(opts, attrs, function(error, nl_hdr, bufs){

					test.deepEqual(
						Buffer.concat(bufs),
						new Buffer(input, 'hex'),
						"should generate the correct structure" );

				    test.done();

				});
			}
		});
	});
};
