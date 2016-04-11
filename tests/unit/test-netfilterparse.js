
var parser = require("../../nf/node-netfilter.js");
var nfcommand = require("../../nf/nfcommand.js");
var JSONminify = require('jsonminify');

var Buffer = require('buffer').Buffer;
var fs = require('fs');
var util = require('util');

exports.testNfParse = function(test){

	var nnf_commands = JSON.parse(JSONminify(fs.readFileSync('./tests/unit/data/nnf_commands.json', 'utf8')));

	test.doesNotThrow(function() {

		nnf_commands.forEach(function(command) {
			//console.log(command);
			parser.parse(command);
		});

		test.done();

	});

};
