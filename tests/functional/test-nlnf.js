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

// // nk.nfTable("get", null, "filter", function(err,bufs) {
// // 	if(err) {
// // 		console.error(util.inspect(err));
// // 	} else {
// // 		console.log("success!");
// // 		console.dir(bufs);
// // 	}
// // });


nk.nfTable("add", null, "filter2", function(err,bufs) {
	if(err) {
		console.error(util.inspect(err));
	} else {
		console.log("success!");
		console.dir(bufs);
	}
});

// var nl = require("../../nl/netlink.js");
// var nk = require("../../index.js");
// var util = require("util");

// var sock_opts = {
// 		sock_class: nl.NETLINK_NETFILTER,
// 	};

// var sock = nk.newNetlinkSocket();

// sock.create(sock_opts,function(err) {
// 	if(err) {
// 		cb(new Error("socket.create() Error: " + util.inspect(err)));
// 		return;
// 	} else {
// 		nl.sendNetlinkRaw(sock, Buffer("14000000100001008CBE25550000000000000A0020000000000A05008DBE255500000000020000000C00010066696C746572320014000000110001008EBE25550000000000000A00", 'hex'), function(err,bufs) {
// 		 	if(err) {
// 		 		console.error(util.inspect(err));
// 		 	} else {
// 		 		console.log("success!");
// 		 		console.dir(bufs);
// 		 	}
// 		 });
// 	}
// });
