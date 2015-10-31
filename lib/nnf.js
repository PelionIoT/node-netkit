#! /usr/bin/env node

var nk = require('../index.js');
var util = require('util');
var parser = require("../nf/node-netfilter.js");
var cmn = require("../libs/common.js");
var nft = nk.nf.nft;

var arguments = process.argv.slice(2).join(" ");
var ret;
//try {
	ret = parser.parse(arguments);
	nk.nnf(ret, function(err, result){
		if(err) {
			console.log(util.inspect(err, {depth:null}));
			throw err;
		}
		else
			console.log(util.inspect(result, {depth:null}));
			console.log("Success");
	});
// } catch(err) {
// 	 cmn.err(util.inspect(err));
// }
