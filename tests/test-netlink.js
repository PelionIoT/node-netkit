var netkit = require('../index.js');

var util = require('util');

var sock = netkit.newNetlinkSocket();


console.dir(sock);

// sock.create(null,function(err) {
// 	if(err) {
// 		console.log("Error: " + util.inspect(err));
// 	} else {
// 		console.log("Created netlink socket.");
// 	}
// 	// that was exciting. Now let's close it.
// 	sock.close();
// });


// ok - now try a bit more...
sock.create(null,function(err) {
	if(err) {
		console.log("Error: " + util.inspect(err));
	} else {
		console.log("Created netlink socket.");
	}
	// that was exciting. Now let's close it.
	sock.close();
});

var experiment = netkit.wrapMemBufferTest();

console.log(experiment);
console.dir(experiment);
console.log(util.inspect(experiment));
experiment = null;

var tun0 = netkit.newTunInterfaceRaw();

tun0.ifname = "tun_test";

if(tun0.create()) {
	console.log("Interface created: " + tun0.ifname);
	var num = netkit.ifNameToIndex(tun0.ifname);
	netkit.assignAddress({
		ifname:tun0.ifname,         // required
		mtu: 1501,                  // test MTU - set it bigger than default
//				mac: "ab:cd:Ef:01:23:45",   // can't do this on TUN devices, but can on TAP devices...
	    inet6: {
	   	   addr: "fe80::1",        // assign a single IP
//					mask: "0:0:0:FC00:0:0:0:0"
		   add_addr: [ "bbbb::1/64" ] // assign multiple IPs. Also hand just a string: "aaaa::1"
	    }
	},function(err){
		if(err) {
			console.log("** Error: " + util.inspect(err));
		} else {
			console.log("assignAddress called successfully.");
 			netkit.initIfFlags(tun0.ifname,netkit.FLAGS.IFF_UP | netkit.FLAGS.IFF_RUNNING); // turn the interface up
 			setTimeout(function(){


			netkit.addIPv6Neighbor(tun0.ifname,'bbbb::100','02:2a:8c:54:3f:cf',function(err) {
				if(err)
					console.error("** Error: " + util.inspect(err));
				else {
					console.log("success!");
					setTimeout(function(){
						console.log("ok... 30 seconds");
					},30000);
				}
			});




 			},3000);
		}
	});

	// if(typeof num == 'number') {
	// 	console.log("  is interface number: " + num);
	// 	var name = netkit.ifIndexToName(num);
	// 	if(typeof name == 'string') {
	// 		console.log("  which is still interface: " + name);
	// 	} else {
	// 		console.log("  ** Error on ifIndexToName: " + util.inspect(name));
	// 	}
	// } else {
	// 	console.log("  ** Error indexing interface: " + util.inspect(num));
	// }


	} else {
		console.error("Failed to create interface: " + tun0.ifname);
		if(tun0.lastError) {
			console.error("Error was: " + util.inspect(tun0.lastError));
		}
	}
