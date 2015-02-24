var nk = require('../index.js');
var exec  = require('child_process').exec, child;

var rfilter = { ifname: 'eth0', table: 'main' };
nk.getRoutes(rfilter, function(routes){
	console.log('before routes....')
	console.dir(routes);

	child = exec('ip route add 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
			var routes = nk.getRoutes(rfilter, function(routes){
			console.log('routes....');
			console.dir(routes);

			child = exec('ip route del 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
				var routes = nk.getRoutes(rfilter, function(routes){
					console.log('routes....');
					console.dir(routes);
				});
			});
		});
	});
});

var lfilter = { ifname: 'eth1' }; //, table: 'main' };
nk.getLinks(lfilter, function(links){
	console.log('before links....')
	console.dir(links);

	child = exec('ip link set dev eth1 up', function(error, stdout,stderr){
			var links = nk.getLinks(lfilter, function(links){
			console.log('up links....');
			console.dir(links);

			child = exec(' ip link set dev eth1 down', function(error, stdout,stderr){
				var links = nk.getLinks(lfilter, function(links){
					console.log('down links....');
					console.dir(links);
				});
			});
		});
	});
});

var afilter = { ifname: 'eth1' }; //, table: 'main' };
nk.getAddresses(afilter, function(addrs){
	console.log('before addresses....')
	console.dir(addrs);

	child = exec('ip addr add 10.10.20.17/32 dev eth1', function(error, stdout,stderr){
			var addrs = nk.getAddresses(afilter, function(addrs){
			console.log('addresses....');
			console.dir(addrs);

			child = exec('ip addr del 10.10.20.17/32 dev eth1', function(error, stdout,stderr){
				var addrs = nk.getAddresses(afilter, function(addrs){
					console.log('addresses....');
					console.dir(addrs);
				});
			});
		});
	});
});


	console.log('listening...')
	nk.onNetworkChange("eth1", "all", function (data) {
		console.log("changed...");
		console.dir(data);
	});

child = exec('ip addr add 10.10.20.17/32 dev eth1', function(error, stdout,stderr){
	child = exec('ip addr del 10.10.20.17/32 dev eth1', function(error, stdout,stderr){});
});


nk.onNetworkChange("eth1", "link", function (data) {
	console.log("changed...");
	console.dir(data);
});

nk.onNetworkChange("eth1", "address", function (data) {
	console.log("changed...");
	console.dir(data);
});

nk.onNetworkChange("eth1", "route", function (data) {
	console.log("changed...");
	console.dir(data);
});

nk.onNetworkChange(null, "neigh", function (data) {
	console.log("changed...");
	console.dir(data);
});

// var google = "2607:f8b0:4000:80b::200e";
// console.log(nk.hostnameFromAddress(google));
