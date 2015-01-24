var nk = require('../index.js');

var util = require('util');

var sock = nk.newNetlinkSocket();


console.dir(sock);


//setTimeout(function(){

	nk.monitorNetwork("eth0", sock, function(err,bufs) {
		if(err)
			console.error("** Error: " + util.inspect(err));
		else {
			console.log("success!");

			// TODO
			// Parse response as it will have the initial state of the interface
			// see iproute2 source ipaddress.c:print_addrinfo

			setTimeout(function(){
				console.log("listen for changes... 2 minutes");

				sock.onRecv(function(err,bufs){
					if(err) {
	            		console.log("** Error in reply: ");
	            		for(var n=0;n<bufs.length;n++) {
	            			console.log('here');
	            			console.dir(bufs[n]);
	            			console.log('buf len = ' + bufs[n].length);
	            			var errobj = nk.nl.parseErrorHdr(bufs[n]);
	            			console.dir(nk.errorFromErrno(errobj._error));
	            			console.log(util.inspect(errobj));
	            		}
	            	} else {
	            		for(var n=0;n<bufs.length;n++) {
	            			console.log('here');
	            			console.dir(bufs[n]);
	            			console.log('buf len = ' + bufs[n].length);

	            			// TODO
	            			// Compare with last 
	            		}
	            	}
				});

			},120000);

			sock.stopRecv();
		}
	});

//}, 15000);

