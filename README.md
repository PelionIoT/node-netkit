node-netkit
===========

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/WigWagCo/node-netkit?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

node module for network interface &amp; routing manipulation

**work in progress:**
* only supports Linux so far
* IPv4 support largely untested yet
* rapidly changing. **not for production** unless you really know what you're doing.


#### API

* TUN/TAP device creation support w/ stream interface
* update routing tables
* interface up / down
* *more to come*

Bear in mind, most of the time you need to be root / sudo to run these commands.

Right now the code is the documentation...

```javascript
/**
 * test tun interface
 */


var netkit = require('../index.js');

var util = require('util');

var tun0 = netkit.newTunInterfaceRaw();

tun0.ifname = "tun_test";

if(tun0.create()) {
	console.log("Interface created: " + tun0.ifname);
	console.log("    fd: " + tun0.fd);
	setTimeout(function(){
		if(tun0.open()) {
			console.log("Opened successfully.");
			netkit.assignAddress({
				ifname:tun0.ifname,         // required
				mtu: 1501,                  // test MTU - set it bigger than default
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
						  via_if: "tun_test",       // via the interface 'tun_test'
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
			netkit.setIfFlags(tun0.ifname,netkit.FLAGS.IFF_UP | netkit.FLAGS.IFF_RUNNING); // turn the interface up

			tun0.stream.on('readable', function() {
				var chunk;
				while (null !== (chunk = tun0.stream.read())) {
					console.log('got %d bytes of data', chunk.length);
					console.log('buffer: ' + chunk.toJSON());
					if(!tun0.stream.write(chunk)) {
						console.log("ERROR: test write failed");
					} else
					    console.log("wrote back " + chunk.length + " bytes.");
				}
			});

			setTimeout(function(){
			netkit.assignRoute({
				del_route6: 
					[  // ipv6 routes: dest
						{ 
						  dest: "2003::/16",        // ip -6 route add 2003::/16 dev tun_test
						  via_if: "tun_test",       // via the interface 'tun_test'
//						  via_network: "2001::/16", 
						  metric: 2400,             // if you have a specific metric in add_route6 you will need to use the same metric so the 
						                            // kernel can find the correct route
						  flags: netkit.FLAGS.RT_GATEWAY | netkit.FLAGS.RT_MODIFIED | netkit.FLAGS.RT_DYNAMIC
						}
					]
				});
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
```
