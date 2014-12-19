// DeviceJS
// (c) WigWag Inc 2014
//
// tuntap native interface


//var build_opts = require('build_opts.js');

var build_opts = { 
	debug: 1 
};
var colors = require('./colors.js');

var nativelib = null;
try {
	nativelib = require('./build/Release/netkit.node');
} catch(e) {
	if(e.code == 'MODULE_NOT_FOUND')
		nativelib = require('./build/Debug/netkit.node');
	else
		console.error("Error in nativelib [debug]: " + e + " --> " + e.stack);
}

var Stream = require('stream');
var util = require('util');
var net = require('net');

var dbg = function() {
	console.log(colors.greyFG('dbg: ') + colors.yellowFG.apply(undefined,arguments));
}

var err = function() {
	console.log(colors.redFG('err: ') + colors.redFG.apply(undefined,arguments));
}

var asHexBuffer = function(b) {
	return b.toString('hex');
}


// Extension object technique. Let's us build part of the native prototype in JS. 
// The native library will put all properties of this object into it's prototype.
var extendthis = {
	// defind in native:
	// fd: file descriptor of tunnel
	// ifname: interface name
	// flags: flags ofr 

	stream: null,

	extra: function() {
		dbg("--------EXTRA----------");
		console.dir(this);
	},
	
	open: function() {
		dbg("open(): " + util.inspect(this));
		var ret = this._open();
		if(this.fd < 1 || !ret) {
			err("TUN device not created or valid.");
			return false;
		} else {
			if(!this.stream) {
	
				this.stream = new TunInterfaceStream(this,{});

				this._isReading = true;

			}



			// if(!this.socket) {
			// 	this.socket = new net.Socket( {
			// 		fd: this.fd,
			// 		readable: true,
			// 		writable: true
			// 	});
			// }
			return true;
		}
	}

	// read: function() {
	// 	if(this.socket) {
	// 		return this.socket.apply(this.socket,arguments);
	// 	} else {
	// 		err("Socket for TUN device not created. Did you call open()?");
	// 	}
	// },
	
	// write: function() {
	// 	if(this.socket) {
	// 		return this.socket.apply(this.socket,arguments);
	// 	} else {
	// 		err("Socket for TUN device not created. Did you call open()?");
	// 	}
	// }


};
nativelib.InitNativeTun(extendthis);

var extendthis2 = {

};

nativelib.InitNetlinkSocket(extendthis2);

//
// Wraps the TunInterface with a stream interface ala. node.js semantics.
//
function TunInterfaceStream(tunif,opt) {
	Stream.Duplex.call(this, opt);
	this._max = 1000000;
	this._index = 1;
	this.IF = tunif;

}

util.inherits(TunInterfaceStream, Stream.Duplex);

TunInterfaceStream.prototype._doRead = function(size) {
	var self = this;
	console.log("_doRead(): ");
//	console.dir(this);
	this.IF._getData(function(buf,readsize,error){
		if(buf && readsize > 0) {
			self.push(buf.slice(0,readsize));			
		}
		if(error && error.errno > 0) {
			err("Error ocurred: " + JSON.stringify(error));
		}
	}, size);
}

// implements Stream interface
TunInterfaceStream.prototype._read = function(size) {
	this._doRead(size);
};




TunInterfaceStream.prototype._write = function(chunk,encoding,callback) {
	if(typeof chunk == 'string') {
		var buf = Buffer(str, encoding);
		this.IF._sendData(buf,function(){
			callback();
		}, function(){
			callback(err);
		});		
	} else {
		if(Buffer.isBuffer(chunk)) {
			dbg(util.inspect(chunk));
			dbg(JSON.stringify(chunk));

			this.IF._sendData(chunk,function(){
				callback();
			}, function(err){
				callback(err);
			});
		} else
			err("Passed a non Buffer or string to TUN._write");
	}
};



var netkit = {
	packTest: nativelib.packTest, // a test

	newNetlinkSocket: nativelib.newNetlinkSocket,
	newTunInterfaceRaw: nativelib.newTunInterface,
	newTapInterfaceRaw: function() {
		return nativelib.newTunInterface({tap:true});
	},	
	assignAddress: nativelib.assignAddress,
	assignRoute: nativelib.assignRoute,
	setIfFlags: nativelib.setIfFlags,
	unsetIfFlags: nativelib.unsetIfFlags,
	ifNameToIndex: nativelib.ifNameToIndex,
	ifIndexToName: nativelib.ifIndexToName,
	toAddress: nativelib.toAddress,

	assignDbgCB: function(func) {
		dbg = func;
	},
	assignErrCB: function(func) {
		err = func;
	},

	// address families: bits/socket.h
	AF_INET6: 10,
	AF_INET: 2,

	FLAGS: {



		// Interface FLAGS
		// See: if.h

		IFF_UP:		        0x1,	/* interface is up		*/
		IFF_BROADCAST:	    0x2,	/* broadcast address valid	*/
		IFF_DEBUG:	        0x4,	/* turn on debugging		*/
		IFF_LOOPBACK:	    0x8,	/* is a loopback net		*/
		IFF_POINTOPOINT:	0x10,	/* interface is has p-p link	*/
		IFF_NOTRAILERS:	    0x20,	/* avoid use of trailers	*/
		IFF_RUNNING:	    0x40,	/* interface RFC2863 OPER_UP	*/
		IFF_NOARP:	        0x80,	/* no ARP protocol		*/
		IFF_PROMISC:	    0x100,	/* receive all packets		*/
		IFF_ALLMULTI:	    0x200,	/* receive all multicast packets*/

		IFF_MASTER:	        0x400,	/* master of a load balancer 	*/
		IFF_SLAVE:	        0x800,	/* slave of a load balancer	*/

		IFF_MULTICAST:	   0x1000,	/* Supports multicast		*/

		IFF_PORTSEL:	   0x2000,  /* can set media type		*/
		IFF_AUTOMEDIA:	   0x4000,	/* auto media select active	*/
		IFF_DYNAMIC:	   0x8000,	/* dialup device with changing addresses*/

		IFF_LOWER_UP:	  0x10000,	/* driver signals L1 up		*/
		IFF_DORMANT:	  0x20000,	/* driver signals dormant	*/

		IFF_ECHO:	      0x40000,	/* echo sent packets		*/

//		IFF_VOLATILE:	(this.FLAGS.IFF_LOOPBACK|IFF_POINTOPOINT|IFF_BROADCAST|IFF_ECHO|IFF_MASTER|IFF_SLAVE|IFF_RUNNING|IFF_LOWER_UP|IFF_DORMANT)

	    // Routing FLAGS
	    // see net-tools/lib/net-support.h for more information
	    // Keep this in sync with /usr/src/linux/include/linux/route.h
	    RT_UP:         0x0001,          /* route usable                 */
	    RT_GATEWAY:    0x0002,          /* destination is a gateway     */
	    RT_HOST:       0x0004,          /* host entry (net otherwise)   */
        RT_REINSTATE:  0x0008,         /* reinstate route after tmout  */
        RT_DYNAMIC:    0x0010,         /* created dyn. (by redirect)   */
        RT_MODIFIED:   0x0020,         /* modified dyn. (by redirect)  */
        RT_MTU:        0x0040,         /* specific MTU for this route  */
        RT_MSS:        0x0040,         /* Compatibility :-(            */
        RT_WINDOW:     0x0080,         /* per route window clamping    */
        RT_IRTT:       0x0100,         /* Initial round trip time      */
        RT_REJECT:     0x0200,         /* Reject route                 */

        /* Keep this in sync with /usr/src/linux/include/linux/ipv6_route.h */
        RT_DEFAULT:    0x00010000,     /* default - learned via ND     */
        RT_ALLONLINK:  0x00020000,     /* fallback, no routers on link */
        RT_ADDRCONF:   0x00040000,     /* addrconf route - RA          */
        RT_NONEXTHOP:  0x00200000,     /* route with no nexthop        */
        RT_EXPIRES:    0x00400000,
        RT_CACHE:      0x01000000,     /* cache entry                  */
        RT_FLOW:       0x02000000,     /* flow significant route       */
        RT_POLICY:     0x04000000,     /* policy route                 */
        RT_LOCAL:      0x80000000
	}
};

var rt = netkit.rt = require('./rtnetlink.js');


var netutil = netkit.util = require('./netutils.js');



netkit.addIPv6Neighbor = function(ifname,inet6dest,lladdr,cb,sock) {
	var ifndex = netkit.ifNameToIndex(ifname);
	if(util.isError(ifndex)) {
		err("* Error: " + util.inspect(ans));
		cb(ifindex); // call w/ error
		return;
	}
	var bufs = [];

	var len = 0; // updated at end
	var nl_hdr = netkit.rt.buildHdr();
	nl_hdr._cmd = rt.RTM_NEWNEIGH;
	nl_hdr._flags = rt.NLM_F_REQUEST|rt.NLM_F_CREATE|rt.NLM_F_EXCL;
	var nd_msg = netkit.rt.buildNdmsg(netkit.AF_INET6,ifndex,rt.NUD_PERMANENT,rt.NLM_F_REQUEST);
	//var rt_msg = netkit.rt.buildRtmsg();
	
	bufs.push(nl_hdr.pack());
	bufs.push(nd_msg.pack());

	if(inet6dest) {
		if(typeof inet6dest === 'string') {
			var ans = netkit.toAddress(inet6dest,netkit.AF_INET6);
			if(util.isError(ans)) {
				cb(ans);
				return;
			}
			var destbuf = ans;
		} else
			var destbuf = inet6dest;
		var rt_attr = netkit.rt.buildRtattrBuf(netkit.rt.NDA_DST,destbuf.bytes);
		console.dir(destbuf);
		dbg("destbuf---> " + asHexBuffer(destbuf.bytes));
		dbg("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	} else {
		cb(new Error("bad parameters."));
		return;
	}

	if(lladdr) {
		if(typeof lladdr === 'string') {
			var macbuf = netutil.bufferifyMacString(lladdr);
			if(!macbuf) {
				cb(new Error("bad lladdr"));
				return;
			}
		}
		else if(Buffer.isBuffer(macbuf))
			var macbuf = lladdr;
		else {
			cb(new Error("bad parameters."));
			return;			
		}
		var rt_attr = netkit.rt.buildRtattrBuf(netkit.rt.NDA_LLADDR,macbuf);
		bufs.push(rt_attr);
	}

	var all = Buffer.concat(bufs); // the entire message....

	dbg("Sending---> " + asHexBuffer(all));

	if(sock) {
		cb("Not implemented");
	} else {
		var sock = netkit.newNetlinkSocket();
		sock.create(null,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");
			}
	            // that was exciting. Now let's close it.

	            var msgreq = sock.createMsgReq();


	            msgreq.addMsg(all);

	            sock.sendMsg(msgreq, function(err,bytes) {
	            	if(err) {
	            		console.error("** Error: " + util.inspect(err));
	            		cb(err);
	            	} else {
	            		console.log("in cb: " + util.inspect(arguments));
	            		cb();
	            	}
	            });


	        });

	        // that was exciting. Now let's close it.
//	        sock.close();
	    }

//    cb(ifndex); // callback with error

}



module.exports = netkit;

