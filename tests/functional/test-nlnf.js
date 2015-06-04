var nk = require('../../index.js');
var util = require('util');

var nf = require('../../nl/nfnetlink.js');

// var toType = function(obj) {
//   return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
// }

// var str = "this is a string";
// var num = 56136731;
// var arr = [1,2,3,4];
// var fn = function() {

// }
// var buf = Buffer(1);

// console.log(toType(str));
// console.log(toType(num));
// console.log(toType(arr));
// console.log(toType(fn));
// console.log(toType(buf));
// console.log(buf instanceof Buffer);

// var at = require('../../nf/nfattribute.js');


// nk.nfTable({ command: "del", type: "table", family: "ip", params: { name: "filter2" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });

// nk.nfTable({ command: "add", type: "table", family: "ip", params: { name: "filter" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);

		nk.nfChain({ command: "add",
					 type: "chain",
					 family: "ip",
					 params: { table: "filter", name: "input", hook: {hooknum: 1, priority: 0} }},
					 function(err,bufs) {
			if(err) {
				console.error(util.inspect(err));
			} else {
				console.log("success!");
				console.dir(bufs);
			}
		});
// 	}
// });

// var attrs = new nf.Attributes("chain", { table: "filter", name: "input", hook: {hooknum: 1, priority: 0} });
// nf.writeAttributes(attrs);

// nk.nfTable({ command: "list", type: "table", family: "ip" }, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });


// nk.nfTable({ command: "update", type: "table", family: "ip", params: { name: "filter2", flags: nk.nf.flags.NFT_TABLE_F_ACTIVE }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });

// nk.nfTable({ command: "get", type: "table", family: "ip", params: { name: "filter2" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });

