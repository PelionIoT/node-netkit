#! /usr/bin/env node

var nk = require('../index.js');
var util = require('util');
var cmn = require('../libs/common.js');
var debug = cmn.logger.debug;
var error = cmn.logger.error;


var command = process.argv.slice(2).join(" ");
try {
	nk.nnf(command, function(err, result){
		if(err) {
			debug(util.inspect(err, {depth:null}));
			throw(err);
		}
		else {
			debug(util.inspect(result, {depth:null}));
			debug("Success");
		}
	});
} catch(err) {
	console.log(util.inspect(err));
}
