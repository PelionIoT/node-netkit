var nk = require('../index.js');

var routes = nk.getRoutes(null,null,null, function(routes){
	console.log('routes....')
	console.dir(routes);
});

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


nk.onNetworkChange(null, "route", function (data) {
	console.log("changed...");
	console.dir(data);
});


// var google = "2607:f8b0:4000:80b::200e";
// console.log(nk.hostnameFromAddress(google));
