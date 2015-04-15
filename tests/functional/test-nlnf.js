var nk = require('../../index.js');
var util = require('util');


var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

var str = "this is a string";
var num = 56136731;
var arr = [1,2,3,4];
var fn = function() {

}
var buf = Buffer(1);

console.log(toType(str));
console.log(toType(num));
console.log(toType(arr));
console.log(toType(fn));
console.log(toType(buf));
console.log(buf instanceof Buffer);

nk.nfTable({ command: "add", type: "table", family: "ip", params: { name: "filter2" }}, function(err,bufs) {
	if(err) {
		console.error(util.inspect(err));
	} else {
		console.log("success!");
		console.dir(bufs);
	}
});


// nk.nfTable({ command: "get", type: "table", family: "ip", params: { name: "filter2" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });


// nk.nfTable({ command: "del", type: "table", family: "ip", params: { name: "filter2" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });


// nk.nfTable({ command: "update", type: "table", family: "ip", params: { name: "filter2", flags: "" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);
// 	}
// });
