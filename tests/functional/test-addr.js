var nk = require('../../index.js');
var util = require('util');

var filter = [{ ifname: 'eth2' }]; //, table: 'main' };
nk.getAddresses(filter, function(err,addrs){
	console.log('before addresses....')
	 if(err) { console.log(util.inspect(err)); return;}
	 console.dir(addrs);

	nk.ipAddress("add","inet","eth2","10.10.20.19/24",null,function(err,bufs){

		if(err) {
			console.log("netlinkAddrCommand() Error: " + util.inspect(err));
			return;
		} else {

			var addrs = nk.getAddresses(filter, function(err, addrs){
				console.log('addresses after add....');
				console.dir(addrs);


				nk.ipAddress("delete","inet","eth2","10.10.20.19/24",null,function(err,bufs) {

					if(err) {
						console.log("netlinkAddrCommand() Error: " + util.inspect(err));
						return;
					} else {
						var addrs = nk.getAddresses(filter, function(err, addrs){
							console.log('addresses after delete....');
							console.dir(addrs);


							nk.ipAddress("add","inet","eth2","10.10.20.19/24",null,function(err,bufs){
								if(err) { console.log(util.inspect(err)); return;}

								nk.ipAddress("add","inet","eth2","10.10.20.20/24",null,function(err,bufs){
									if(err) { console.log(util.inspect(err)); return; }

									nk.ipAddress("add","inet","eth2","10.10.20.21/24",null,function(err,bufs){
										if(err) { console.log(util.inspect(err)); return;}

										console.log('Added ====================================================================================================');
										nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
											if(err) {
												console.log("netlinkAddrCommand() Error: " + util.inspect(err));
												return;
											} else {
												for(ip in bufs) {
													console.dir(bufs[ip]);
												}

												console.log('Deleting ====================================================================================================');

												nk.ipAddress("flush","inet","eth2",null,null,function(err,bufs){
													if(err) {
														console.log("ipAddress() Error: " + util.inspect(err));
														return;
													} else {
														console.log('Deleted');

														nk.ipAddress("show","inet","eth2",null,null,function(err,bufs){
															if(err) {
																console.log("netlinkAddrCommand() Error: " + util.inspect(err));
																return;
															} else {
																for(ip in bufs) {
																	console.dir(bufs[ip]);
																}
															}
														});
													}
												});
											}
										});
									});
								});
							});
						});
					}
				});
			});
		}
	});
});



// nk.ipAddress("flush","inet6","eth2",null ,null,function(err,bufs){
// 	if(err) {
// 		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
// 		return;
// 	} else {

// 		console.log("CALLBACK!!!!!");
// 		for(ip in bufs) {
// 			console.dir(bufs[ip]);
// 		}
// 	}
// });
