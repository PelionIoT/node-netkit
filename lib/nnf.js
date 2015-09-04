#! /usr/bin/env node

var nk = require('../index.js');
var util = require('util');
var parser = require("../nl/node-netfilter.js");
var nft = nk.nf.nft;

var arguments = process.argv.slice(2).join(" ");
console.log("nnf " + arguments);
var ret;
try {
	ret = parser.parse(arguments);
	console.log(util.inspect(ret, {depth:null}));
	nk.nnf(ret, function(err){
		if(err)
			console.log(util.inspect(err, {depth:null}));
		else
			console.log("Success");
	});
} catch(err) {
	console.dir(err);
}
