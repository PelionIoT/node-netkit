/**
 * test tun interface
 */


var network = require('./index.js');

var tun0 = network.newTunInterfaceRaw();

tun0.ifname = "tun_test";

if(tun0.create()) {
	console.log("Interface created: " + tun0.ifname);
	console.log("    fd: " + tun0.fd);
	setTimeout(function(){
		if(tun0.open()) {
			console.log("Opened successfully.");
			network.assignAddress({
				ifname:tun0.ifname,
				inet6: {
					addr: "fe80::1",        // assign a single IP
//					mask: "0:0:0:FC00:0:0:0:0"
					add_addr: [ "aaaa::1/48" ] // assign multiple IPs. Also hand just a string: "aaaa::1"
	
				}
			});

			setTimeout(function() {
				console.log("removing an IP address.");
				network.assignAddress({
					ifname:tun0.ifname,
					inet6: {
//					addr: "fe80::1",
//					mask: "0:0:0:FC00:0:0:0:0"
	                    remove_addr: [ "aaaa::1/48" ]

	                }
	            });
			},8000);

		}
	},1000);
} else {
	console.log("Failed to create interface tun0, error: " + tun0.lastError + " --> " + tun0.lastErrorStr);
}

console.log("You can type 'ifconfig -a' in a terminal to see if the interface exists.");

setTimeout(function(){
	console.log("done.");
}, 15000);

