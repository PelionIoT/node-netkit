#! /usr/bin/env node

var nk = require('../index.js');
var util = require('util');

var command = process.argv.slice(2).join(" ");
nk.nnf(command, function(err, result){
	if(err) {
		console.log(util.inspect(err, {depth:null}));
		throw err;
	}
	else
		console.log(util.inspect(result, {depth:null}));
		console.log("Success");
});
