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





// function TunInterface (opts) {
//   if (!(this instanceof Decoder)) {
//     return new TunInterface(opts);
//   }
//   Transform.call(this, opts);
//   var ret;

//   // ret = binding.mpg123_new(opts ? opts.decoder : null);
//   // if (Buffer.isBuffer(ret)) {
//   //   this.mh = ret;
//   // } else {
//   //   throw new Error('mpg123_new() failed: ' + ret);
//   // }

//   // ret = binding.mpg123_open_feed(this.mh);
//   // if (MPG123_OK != ret) {
//   //   throw new Error('mpg123_open_feed() failed: ' + ret);
//   // }
//   dbg('created new TunInterface instance');
// }
// util.inherits(TunInterface, Transform);








// console.dir(nativelib);
// console.log("*********************");

// var tun = nativelib.newTunInterface();

// console.dir(tun)
// console.log("*********************");
// tun.extra();

//console.dir(nativelib._TunInterface_cstor.prototype);

module.exports = {
	newTunInterfaceRaw: nativelib.newTunInterface,
	newTapInterfaceRaw: function() {
		return nativelib.newTunInterface({tap:true});
	},	
	assignAddress: nativelib.assignAddress,
	assignRoute: nativelib.assignRoute,
	setIfFlags: nativelib.setIfFlags,
	unsetIfFlags: nativelib.unsetIfFlags,

	assignDbgCB: function(func) {
		dbg = func;
	},
	assignErrCB: function(func) {
		err = func;
	},

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
