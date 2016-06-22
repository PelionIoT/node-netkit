#! /usr/bin/env node

var nk = require('../index.js');
var util = require('util');
var cmn = require('../libs/common.js');
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var info = cmn.logger.info;


var command = process.argv.slice(2).join(" ");
nk.nnf(command).then(function(result){
	debug(util.inspect(result, {depth:null}));
}, function (err) {
	error(util.inspect(err, {depth:null}));
	throw(err);
}).catch(function(err) {
	error(util.inspect(err) + err.stack);
});

nk.nnfEvent('event', function(data) {
	debug(util.inspect(data, {depth:null}));
});