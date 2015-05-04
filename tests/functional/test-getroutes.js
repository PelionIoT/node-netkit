var nk = require('../../index.js');
var util = require('util');

var filter = [{ ifname: 'eth0', family: 'inet6', address: 'default'}];//, protocol: 'kernel', table: 'main'}]; //, table: 'main' };
nk.getRoutes(filter,function(err,bufs){

	if(err) {
		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
		return;
	} else {
		console.dir(bufs);
	}
});

