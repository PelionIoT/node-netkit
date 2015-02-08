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

nk.onNetworkChange("eth1", "all", function (data) {
	console.log("changed...");
	console.dir(data);
});
