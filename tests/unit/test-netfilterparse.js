
var parser = require("../../nf/node-netfilter.js");
var nfcommand = require("../../nf/nfcommand.js");
var NfAttributes = require("../../nf/nfattributes.js");
var nf = require("../../nl/nfnetlink.js");

var Buffer = require('buffer').Buffer;
var fs = require('fs');
var util = require('util');

exports.testNfParse = function(test){


	test.doesNotThrow(function() {
		parser.parse("list tables");
		parser.parse("list table filter");
		parser.parse("list chain filter input");
		parser.parse("list chain");
		parser.parse("list ip6 chain");
		parser.parse("list rule");
		parser.parse("list rule filter input");

		parser.parse("add table filter");
		parser.parse("add chain filter input { type filter hook input priority 0 }");
		parser.parse("add rule filter input tcp dport 22 ip saddr 192.168.1.0/24 accept");

		parser.parse("add rule filter input tcp dport 22 ct state new log prefix \"New SSH connection\" group 0 accept");
		parser.parse("add rule filter input tcp dport 22 ct state established log prefix \"New SSH connection\" group 0 accept");
		parser.parse("add rule filter input log");
		parser.parse("add rule filter input log prefix \"network packet\" group 0");

		parser.parse("delete table filter");
		parser.parse("delete chain filter input");
		parser.parse("delete rule 5");

		parser.parse("flush table filter");
		parser.parse("flush chain filter input");


		// Repeat some with family specifier
		parser.parse("list ip tables");
		parser.parse("list ip table filter");
		parser.parse("list ip chain filter input");

		parser.parse("add ip table filter");
		parser.parse("add ip chain filter input { type filter hook input priority 0 }");
		parser.parse("add ip rule filter input tcp dport 22 ip saddr 192.168.1.0/24 accept");

		parser.parse("delete ip table filter");
		parser.parse("delete ip chain filter input");
		parser.parse("delete ip6 rule 5");

		parser.parse("flush ip6 table filter");
		parser.parse("flush ip chain filter input");
	
		test.done();

	});

};
