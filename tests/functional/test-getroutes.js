var nk = require('../../index.js');
var util = require('util');



var default_unicast = [{ family: 'inet', src: 'default' , type: 'unicast', table: 'main', address: 'default'}];//, protocol: 'kernel', table: 'main'}]; //, table: 'main' };
nk.getRoutes(default_unicast,function(err,bufs){

	if(err) {
		console.log("netlinkAddrCommand() Error: " + util.inspect(err));
		return;
	} else {

		console.dir(bufs[0]);
//		if(bufs[0].length === 1) {

			// the only route in the system
			var primaryInterface = bufs[0].ifname;
			var primaryGateway = bufs[0].event.gateway;
			console.log("primaryInterface: " + primaryInterface + " primaryGateway: " + primaryGateway)
//		}
	}
});

