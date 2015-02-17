var nk = require('../index.js');

var filter = { ifname: 'eth0', table: 'main' };

var exec  = require('child_process').exec, child;
nk.getRoutes(filter, function(routes){
	console.log('before routes....')
	console.dir(routes);

	child = exec('ip route add 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
			var routes = nk.getRoutes(filter, function(routes){
			console.log('routes....');
			console.dir(routes);
		});
	});

	child = exec('ip route del 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
			var routes = nk.getRoutes(filter, function(routes){
			console.log('routes....');
			console.dir(routes);
		});
	});
});


// nk.onNetworkChange("eth1", "link", function (data) {
// 	console.log("changed...");
// 	console.dir(data);
// });

// nk.onNetworkChange("eth1", "address", function (data) {
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

// var google = "2607:f8b0:4000:80b::200e";
// console.log(nk.hostnameFromAddress(google));
