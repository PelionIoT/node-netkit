
var parser = require("../../nf/node-netfilter.js");
var nfcommand = require("../../nf/nfcommand.js");
var NfAttributes = require("../../nf/nfattributes.js");
var nf = require("../../nl/nfnetlink.js");

var Buffer = require('buffer').Buffer;
var fs = require('fs');
var util = require('util');

exports.testNfParse = function(test){

	var nnf_commands = JSON.parse(fs.readFileSync('./tests/unit/data/nnf_commands.json', 'utf8'));

	test.doesNotThrow(function() {
		
		nnf_commands.forEach(function(command) {
			//console.log(command);
			parser.parse(command);	
		});
	
		test.done();

	});

};
