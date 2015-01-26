var nk = require('../index.js');

var rt = nk.rt;

var util = require('util');

var sock = nk.newNetlinkSocket();

var msgReq;

console.dir(sock);


//setTimeout(function(){
	var opt = {
		// type: nk.sk.SOCK_STREAM, // | nk.sk.SOCK_CLOEXEC,
		// sock_class: nk.AF_NETLINK, 
		subscriptions:rt.RTN_GRP_LINK
	};

	sock.create(null,function(err) {
		if(err) {
			console.log("socket.create() Error: " + util.inspect(err));
			cb(err);
			return;
		} else {
			console.log("Created netlink socket.");
		}
    });


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

	nk.monitorNetwork("eth0", sock, function(err,req) {

		if(err)
			console.error("** Error: " + util.inspect(err));
		else {
			console.log("success!");
			msgReq = req;
		}
	});

//}, 15000);

