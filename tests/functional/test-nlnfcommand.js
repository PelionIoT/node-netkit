var nk = require('../../index.js');
var util = require('util');
var parser = require("../../nf/node-netfilter.js");
var nft = nk.nf.nft;

var ret;
try {
	ret = parser.parse("list table filter");
	console.log(util.inspect(ret, {depth:null}));
	// nk.nnf(ret, function(err){
	// 	if(err)
	// 		console.log(util.inspect(err, {depth:null}));
	// 	else
	// 		console.log("Success");
	// });
	// ret = parser.parse("add ip chain filter input { type filter hook input priority 0 }");
	// console.log(util.inspect(ret, {depth:null}));
	// ret = parser.parse("add ip rule filter input tcp dport 22 saddr 192.168.56.0/23 accept");
	// console.log(util.inspect(ret, {depth:null}));
	// ret = parser.parse("add ip rule filter input tcp dport 22 drop");
	// console.log(util.inspect(ret, {depth:null}));
} catch(err) {
	console.dir(err);
}
