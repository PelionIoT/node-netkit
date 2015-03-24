var nk = require('../../index.js');
var util = require('util');
var exec  = require('child_process').exec, child;

var filter = [{ ifname: 'eth2' }]; //, table: 'main' };
// nk.getAddresses(afilter, function(addrs){
// 	console.log('before addresses....')
// 	console.dir(addrs);

// 	nk.ipAddress("add","ip","eth2","10.10.20.19/32",null,function(err,bufs){

// 		if(err) {
// 			console.log("netlinkAddrCommand() Error: " + util.inspect(err));
// 		} else {
// 			console.dir("Response ->" + bufs);
// 			var addrs = nk.getAddresses(afilter, function(addrs){
// 				console.log('addresses....');
// 				console.dir(addrs);
// 			});


// 				nk.ipAddress("delete","ip","eth2","10.10.20.19/32",null,function(err,bufs){

// 				if(err) {
// 					console.log("netlinkAddrCommand() Error: " + util.inspect(err));
// 				} else {
// 					console.dir("Response ->" + bufs);
// 					var addrs = nk.getAddresses(afilter, function(addrs){
// 						console.log('addresses....');
// 						console.dir(addrs);
// 					});
// 				}
// 			});
// 		}
// 	});
// });


//setTimeout(function(){
// nk.ipAddress("add","inet","eth2","10.10.20.19/24",null,function(err,bufs){
// 	if(err) {
// 		console.log(util.inspect(err));
// 		return;
// 	}
// });
	// nk.ipAddress("add","ip","eth2","10.10.20.20/24",null,function(err,bufs){});
	// nk.ipAddress("add","ip","eth2","10.10.20.21/24",null,function(err,bufs){});
//}, 2000);

//setTimeout(function(){
	// console.log('Added ====================================================================================================');
	// nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
	// 	if(err) {
	// 		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
	// 	} else {ut
	// 		for(ip in bufs) {
	// 			console.log(ip);
	// 		}

			console.log('Deleting ====================================================================================================');

			nk.ipAddress("flush","inet","eth2",null,null,function(err,bufs){
				if(err) {
					console.log("ipAddress() Error: " + util.inspect(err));
				} else {
					console.log('Deleted');
				}
			});
// 		}
// 	});
// },2000);

// nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
// 	if(err) {
// 		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
// 	} else {
// 		for(ip in bufs) {
// 			console.log(ip);
// 		}
// 	}
// });
