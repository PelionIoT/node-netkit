var nk = require('../../index.js');
var util = require('util');
var exec  = require('child_process').exec, child;

// var rfilter = { ifname: 'eth2', table: 'main' };
// nk.getRoutes(rfilter, function(err,routes){
// 	console.log('before routes....')
// 	console.dir(routes);

// 	child = exec('ip route add 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
// 			var routes = nk.getRoutes(rfilter, function(err,routes){
// 			console.log('routes....');
// 			if(err) console.log("* Error: " + util.inspect() );
// 			console.dir(routes);

// 			child = exec('ip route del 10.38.0.0/16 via 192.168.56.101', function(error, stdout,stderr){
// 				var routes = nk.getRoutes(rfilter, function(err,routes){
// 					console.log('routes....');
// 					if(err) console.log("* Error: " + util.inspect() );
// 					console.dir(routes);
// 				});
// 			});
// 		});
// 	});
// });

// var lfilter = { ifname: 'eth2' }; //, table: 'main' };
// nk.getLinks(lfilter, function(err,links){
// 	console.log('before links....')
// 	if(err) console.log("* Error: " + util.inspect() );
// 	console.dir(links);

// 	child = exec('ip link set dev eth2 up', function(error, stdout,stderr){
// 			var links = nk.getLinks(lfilter, function(err,links){
// 			console.log('up links....');
// 			if(err) console.log("* Error: " + util.inspect() );
// 			console.dir(links);

// 			child = exec(' ip link set dev eth2 down', function(error, stdout,stderr){
// 				var links = nk.getLinks(lfilter, function(err,links){
// 					if(err) console.log("* Error: " + util.inspect() );
// 					console.log('down links....');
// 					console.dir(links);
// 				});
// 			});
// 		});
// 	});
// });

// var afilter = [{ ifname: 'eth2' },{ ifname: 'eth2' }]; //, table: 'main' };
// nk.getAddresses(afilter, function(err,addrs){
// 	console.log('before addresses....')
// 	if(err) console.log("* Error: " + util.inspect() );
// 	console.dir(addrs);

// 	child = exec('ip addr add 10.10.20.17/32 dev eth2', function(error, stdout,stderr){
// 			var addrs = nk.getAddresses(afilter, function(err,addrs){
// 			console.log('addresses....');
// 			if(err) console.log("* Error: " + util.inspect() );
// 			console.dir(addrs);

// 			child = exec('ip addr del 10.10.20.17/32 dev eth2', function(error, stdout,stderr){
// 				var addrs = nk.getAddresses(afilter, function(err,addrs){
// 					console.log('addresses....');
// 					if(err) console.log("* Error: " + util.inspect() );
// 					console.dir(addrs);
// 				});
// 			});
// 		});
// 	});
// });


// console.log('listening...')
// nk.onNetworkChange("eth2", "all", function (err, data) {
// 	console.log("changed...");
// 	console.dir(data);
// });

// child = exec('ip addr add 10.10.20.17/32 dev eth2', function(error, stdout,stderr){
// 	child = exec('ip addr del 10.10.20.17/32 dev eth2', function(error, stdout,stderr){});
// });


nk.onNetworkChange("wlp3s0", "link", function (err, data) {
	if(err) {
		return console.log("Error with onNetworkChange: " + util.inspect(err));
	}
	console.log("changed...");
	console.log(util.inspect(data, {depth:null}));
});

// nk.onNetworkChange("eth2", "address", function (err, data) {
// 	if(err) {
// 		return console.log("Error with onNetworkChange: " + util.inspect(err));
// 	}
// 	console.log("changed...");
// 	console.dir(data);
// });

// nk.onNetworkChange("eth2", "route", function (err, data) {
// 	if(err) {
// 		return console.log("Error with onNetworkChange: " + util.inspect(err));
// 	}
// 	console.log("changed...");
// 	console.dir(data);
// });

// nk.onNetworkChange("eth2", "neigh", function (err, data) {
// 	if(err) {
// 		return console.log("Error with onNetworkChange: " + util.inspect(err));
// 	}
// 	console.log("changed...");
// 	console.dir(data);
// });

// var google = "2607:f8b0:4000:80b::200e";
// console.log(nk.hostnameFromAddress(google));
