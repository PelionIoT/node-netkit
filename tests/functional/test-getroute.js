var nk = require('../../index.js');
var util = require('util');


// get the default ipv4 route
var filter = [{ family: 'inet', table: 'main', address: 'default'}];
nk.getRoutes(filter,function(err,bufs){

	if(err) {
		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
		return;
	} else {
		console.dir(bufs);
	}
});