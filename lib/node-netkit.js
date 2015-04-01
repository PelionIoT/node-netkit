// DeviceJS
// (c) WigWag Inc 2014
//
// tuntap native interface

//var build_opts = require('build_opts.js');
var build_opts = {
	debug: 1
};

var cmn = require('../libs/common.js');
var dbg = cmn.dbg;
var err = cmn.err;
var asHexBuffer = cmn.asHexBuffer;

var Stream = require('stream');
var util = require('util');
var net = require('net');

var ipcommands = require('../ip/ipcommand.js');
var nlprocess = require('../proc/nlprocess.js');
var nlnf = require('../nf/nlnetfilter.js');
var addr = require('../ip/addr.js');
var addrlabel = require('../ip/addrlabel.js');
var neigh = require('../ip/neighbor.js');
var netev = require('../ip/netevent.js');

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
cmn.nativelib.InitNativeTun(extendthis);

var extendthis2 = {

};

cmn.nativelib.InitNetlinkSocket(extendthis2);

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


// ip commands
var boundOnNetworkChange = netev.onNetworkChange;
boundOnNetworkChange.bind(this);
var boundGetRoutes = ipcommands.getRoutes;
boundGetRoutes.bind(this);
var boundGetLinks = ipcommands.getLinks;
boundGetLinks.bind(this);
var boundGetAddresses = ipcommands.getAddresses;
boundGetAddresses.bind(this);

var boundAddrLabel = addrlabel.addrlabel;
boundAddrLabel.bind(this);

var boundIpAddress = addr.address;
boundIpAddress.bind(this);
var boundIPv4Neighbor = neigh.neighbor;
boundIPv4Neighbor.bind(this);
var boundAddIPv6Neighbor = neigh.addIPv6Neighbor;
boundAddIPv6Neighbor.bind(this);

var boundOnProcessChange = nlprocess.onProcessChange;
boundOnProcessChange.bind(this);

var boundFwTable = nlnf.fwTable;
boundFwTable.bind(this);

var nk = {
	packTest: cmn.nativelib.packTest, // a test
	wrapMemBufferTest: cmn.nativelib.wrapMemBufferTest,

	ERR: cmn.nativelib.ERR,
	errorFromErrno: function(errno) {
		var ret = cmn.nativelib.errorFromErrno(errno); // returns a Error()
		// do a reverse lookup to add 'code' in also - which is like the standard node.js errors
		ret.code = this.ERR[ret.errno];
		return ret;
	},
	newNetlinkSocket: cmn.nativelib.newNetlinkSocket,
	newTunInterfaceRaw: cmn.nativelib.newTunInterface,
	newTapInterfaceRaw: function() {
		return cmn.nativelib.newTunInterface({tap:true});
	},
	assignAddress: cmn.nativelib.assignAddress,
	assignRoute: cmn.nativelib.assignRoute,
	initIfFlags: cmn.nativelib.initIfFlags,
	setIfFlags: cmn.nativelib.setIfFlags,
	unsetIfFlags: cmn.nativelib.unsetIfFlags,
	ifNameToIndex: cmn.nativelib.ifNameToIndex,
	ifIndexToName: cmn.nativelib.ifIndexToName,
	toAddress: cmn.nativelib.toAddress,
	fromAddress: cmn.nativelib.fromAddress,

	onNetworkChange: boundOnNetworkChange,
	getRoutes: boundGetRoutes,
	getLinks: boundGetLinks,
	getAddresses: boundGetAddresses,
	ipv4Neighbor: boundIPv4Neighbor,
	addIPv6Neighbor: boundAddIPv6Neighbor,

	ipAddress: boundIpAddress,
	ipAddrLabel: boundAddrLabel,

	onProcessChange: boundOnProcessChange,

	fwTable: boundFwTable,


	assignDbgCB: function(func) {
		dbg = func;
	},
	assignErrCB: function(func) {
		err = func;
	},

	// address families: bits/socket.h
	AF_INET6: 10,
	AF_INET: 2,
	AF_NETLINK:	16,
	AF_UNSPEC: 0,

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
        RT_LOCAL:      0x80000000,
    }
};


nk.sk = {
	// socket.h socket types
	SOCK_DGRAM:		1,
	SOCK_STREAM: 	2,
	SOCK_RAW:	 	3,
	SOCK_RDM:	 	4,
	SOCK_SEQPACKET:	5,
	SOCK_DCCP:	 	6,
	SOCK_PACKET:	10,

	SOCK_CLOEXEC:	0x40000000,
	SOCK_NONBLOCK:	0x40000000

};


/**
 * Netlink related constants and functions
 * @type {Object}
 */
var nl = nk.nl = require('../nl/netlink.js');

/**
 * NETLINK_ROUTE related constants and functions
 * @type {[type]}
 */
var rt = nk.rt = require('../nl/rtnetlink.js');

/**
 * General utility functions
 * @type {[type]}
 */
var netutil = nk.util = require('../nl/netutils.js');


module.exports = nk;

