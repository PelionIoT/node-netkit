/**
 * test tun interface
 */


var netkit = require('../index.js');

var util = require('util');

netkit.setIfFlags("tap0",netkit.FLAGS.IFF_UP | netkit.FLAGS.IFF_RUNNING,function(err){
	if(err) {
		console.error("Error on setIfFlags: " + util.inspect(err));
	} else {
		console.log("Success: set interface UP");

		setTimeout(function() {
			// after 3 seconds do this:
			netkit.assignRoute({
			add_route6: 
		   		[  // ipv6 routes: dest
					{ 
					  dest: "aaaa::/64",        // ip -6 route add 2003::/16 dev tun_test
//					  via_if: "tap0",       // via the interface 'tun_test'
					  via_network: "bbbb::100", 
//						  metric: 2400,
					  //flags: netkit.FLAGS.RT_GATEWAY // | netkit.FLAGS.RT_HOST  // netkit.FLAGS.RT_DYNAMIC aka 'dyn', netkit.FLAGS.RT_MODIFIED aka 'mod'  
					}
				]
			},function(err){
				if(err) {
					console.log("Error: " + util.inspect(err));
				} else
				    console.log('route added successfully.');
			});
 		}, 3000);
	}

});


setTimeout(function(){
netkit.unsetIfFlags("tap0",netkit.FLAGS.IFF_UP | netkit.FLAGS.IFF_RUNNING,function(err){
	if(err) {
		console.error("Error on unsetIfFlags: " + util.inspect(err));
	} else {
		console.log("Success: set interface DOWN");
	}
})
}, 10000);

