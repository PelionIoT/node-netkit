/**
 * test tun interface
 */


var netkit = require('../../index.js');

var util = require('util');



var tun0 = netkit.newTapInterfaceRaw();

tun0.ifname = "tap0";

if(tun0.create()) {
	console.log("Interface created: " + tun0.ifname);
	console.log("    fd: " + tun0.fd);
	setTimeout(function(){
		if(tun0.open()) {
			console.log("Opened successfully.");
			netkit.assignAddress({
				ifname:tun0.ifname,         // required
				mtu: 1501,                  // test MTU - set it bigger than default
				// if you get a "Cannot assign requested address" - bear in mind that the first octet
				// of the MAC needs to be even! See more here:
				// https://blog.sleeplessbeastie.eu/2013/01/11/how-to-change-the-mac-address-of-an-ethernet-interface/
				mac: "02:ab:bc:de:f0:12",   // can't do this on TUN devices, but can on TAP devices...
				inet6: {
					addr: "fe80::1",        // assign a single IP
//					mask: "0:0:0:FC00:0:0:0:0"
					add_addr: [ "aaaa::1/64" ] // assign multiple IPs. Also hand just a string: "aaaa::1"

				}
			},function(err){
				if(err) {
					console.log("Error: " + util.inspect(err));
				} else {
					console.log("assignAddress called successfully.");
				}
			});
			netkit.assignRoute({
				add_route6:
					[  // ipv6 routes: dest
						{
						  dest: "2003::/16",        // ip -6 route add 2003::/16 dev tun_test
						  via_if: tun0.ifname,       // via the interface 'tun_test'
//						  via_network: "2001::/16",
						  metric: 2400,
						  flags: netkit.FLAGS.RT_MODIFIED | netkit.FLAGS.RT_DYNAMIC  // netkit.FLAGS.RT_GATEWAY |
						}
					],
				del_route6: []
			},function(err){
				if(err) {
					console.log("Error: " + util.inspect(err));
				} else {
					console.log("assignRoute called successfully.");
				}
			});



			tun0.stream.on('readable', function() {
				var chunk;
				while (null !== (chunk = tun0.stream.read())) {
					console.log('got %d bytes of data', chunk.length);
					console.log('buffer: ' + chunk.toJSON());
					if(!tun0.stream.write(chunk)) {
						console.log("ERROR: test write failed");
					} else {
					    console.log("wrote back " + chunk.length + " bytes.");
					}
				}
			});

			setTimeout(function(){
			netkit.assignRoute({
				del_route6:
					[  // ipv6 routes: dest
						{
						  dest: "2003::/16",        // ip -6 route add 2003::/16 dev tun_test
						  via_if: tun0.ifname,       // via the interface 'tun_test'
//						  via_network: "2001::/16",
						  metric: 2400,             // if you have a specific metric in add_route6 you will need to use the same metric so the
						                            // kernel can find the correct route
						  flags: netkit.FLAGS.RT_GATEWAY | netkit.FLAGS.RT_MODIFIED | netkit.FLAGS.RT_DYNAMIC
						}
					]
				});

		        setTimeout(function(){
		        	console.log("Set Interface DOWN.");
					netkit.unsetIfFlags(tun0.ifname,netkit.FLAGS.IFF_NOARP ); // turn the interface down
					setTimeout(function(){
						console.log("Interface UP.");
						netkit.setIfFlags(tun0.ifname,netkit.FLAGS.IFF_UP | netkit.FLAGS.IFF_RUNNING| netkit.FLAGS.IFF_NOARP); // turn the interface up
						setTimeout(function(){
			                console.log("Interface - enable ARP.");
							netkit.unsetIfFlags(tun0.ifname,netkit.FLAGS.IFF_NOARP ); // turn the interface DOWN
						},3000);
					}, 3000);

		        },2000);

		    }, 5000);
		}
	},1000);
} else {
	console.log("Failed to create interface tun0, error: " + tun0.lastError + " --> " + tun0.lastErrorStr);
}

console.log("You can type 'ifconfig -a' in a terminal to see if the interface exists.");

setTimeout(function(){
	console.log("done.");
	// turn down the interface...
//	netkit.unsetIfFlags(tun0.ifname,network.FLAGS.IFF_UP | network.FLAGS.IFF_RUNNING);
}, 15000);

