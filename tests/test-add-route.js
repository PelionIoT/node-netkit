/**
 * test tun interface
 */


var netkit = require('../index.js');

var util = require('util');


netkit.assignRoute({
	add_route6: 
		   		[  // ipv6 routes: dest
					{ 
					  dest: "aaaa::/64",        // ip -6 route add 2003::/16 dev tun_test
//						  via_if: "tun_test",       // via the interface 'tun_test'
					  via_network: "bbbb::100", 
//						  metric: 2400,
					  flags: netkit.FLAGS.RT_GATEWAY // | netkit.FLAGS.RT_HOST  // netkit.FLAGS.RT_DYNAMIC aka 'dyn', netkit.FLAGS.RT_MODIFIED aka 'mod'  
					}
				]
});

	