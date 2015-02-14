var nk = require('../index.js');

// nk.onNetworkChange("eth1", "link", function (data) {
// 	console.log("changed...");
// 	console.dir(data);
// });

// nk.onNetworkChange("eth1", "addr", function (data) {
// 	console.log("changed...");
// 	console.dir(data);
// });

// nk.onNetworkChange("eth1", "route", function (data) {
// 	console.log("changed...");
// 	console.dir(data);
// });

nk.onNetworkChange("eth1", "route", function (data) {
	console.log("changed...");
	console.dir(data);
});

// var google = "2607:f8b0:4000:80b::200e";
// console.log(nk.hostnameFromAddress(google));
