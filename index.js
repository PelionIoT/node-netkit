// DeviceJS
// (c) WigWag Inc 2014
//
// tuntap native interface


//var build_opts = require('build_opts.js');

var build_opts = { 
	debug: 1 
};
var colors = require('./colors.js');
var bufferpack = require('./libs/bufferpack.js');

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




var nk = {
	packTest: nativelib.packTest, // a test
	wrapMemBufferTest: nativelib.wrapMemBufferTest,



	ERR: nativelib.ERR,
	errorFromErrno: function(errno) {
		var ret = nativelib.errorFromErrno(errno); // returns a Error()
		// do a reverse lookup to add 'code' in also - which is like the standard node.js errors
		ret.code = this.ERR[ret.errno];  
		return ret;
	},
	newNetlinkSocket: nativelib.newNetlinkSocket,
	newTunInterfaceRaw: nativelib.newTunInterface,
	newTapInterfaceRaw: function() {
		return nativelib.newTunInterface({tap:true});
	},	
	assignAddress: nativelib.assignAddress,
	assignRoute: nativelib.assignRoute,
	initIfFlags: nativelib.initIfFlags,
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
	AF_NETLINK:	16,

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

// for documentation see: /usr/include/linux/netlink.h
// 	__u32		nlmsg_len;	Length of message including header
//	__u16		nlmsg_type;	Message content
//	__u16		nlmsg_flags; Additional flags
//	__u32		nlmsg_seq;	 Sequence number 
//	__u32		nlmsg_pid;	Sending process port ID
var nlmsghdr_fmt = "<I(_len)H(_type)H(_flags)I(_seq)I(_pid)";
var error_nlmsghdr_fmt = "<i(_error)I(_len)H(_type)H(_flags)I(_seq)I(_pid)";

/**
 * Netlink related constants and functions
 * @type {Object}
 */
nk.nl = {

    // netlink message flags
	// See: linux/netlink.h
	
	NLM_F_REQUEST:		0x0001,	/* It is request message. 	*/
	NLM_F_MULTI:		0x0002,	/* Multipart message, terminated by NLMSG_DONE */
	NLM_F_ACK:   		0x0004,	/* Reply with ack, with zero or error code */
	NLM_F_ECHO:  		0x0008,	/* Echo this request 		*/
    NLM_F_DUMP_INTR:	0x0010, /* Dump was inconsistent due to sequence change */

   /* Modifiers to NEW request */
     NLM_F_ROOT:     	0x0100,	/* specify tree	root	*/
    NLM_F_MATCH:    	0x0200,	/* return all matching	*/
    NLM_F_ATOMIC:   	0x0400,	/* atomic GET		*/
    NLM_F_DUMP:     	(this.NLM_F_ROOT|this.NLM_F_MATCH),

    /* Modifiers to NEW request */
    NLM_F_REPLACE:	0x100,	/* Override existing		*/
    NLM_F_EXCL:	    0x200,	/* Do not touch, if it exists	*/
    NLM_F_CREATE:	0x400,	/* Create, if it does not exist	*/
    NLM_F_APPEND:	0x800,	/* Add to end of list		*/



    NETLINK_ADD_MEMBERSHIP:     1,
    NETLINK_DROP_MEMBERSHIP:    2,
    NETLINK_PKTINFO:            3,
    NETLINK_BROADCAST_ERROR:    4,
    NETLINK_NO_ENOBUFS:         5,
    NETLINK_RX_RING:            6,
    NETLINK_TX_RING:            7,

    NL_MMAP_STATUS_UNUSED:      0,
    NL_MMAP_STATUS_RESERVED:    1,
    NL_MMAP_STATUS_VALID:       2,
    NL_MMAP_STATUS_COPY:        3,
    NL_MMAP_STATUS_SKIP:        4,

    NETLINK_UNCONNECTED: 0,
    NETLINK_CONNECTED: 1,


	// Build a netlink header... returns a packbuffer 'meta' object
	// ._len, ._seq, ._pid are automatically filled in later.
	buildHdr: function() {
		var o = bufferpack.metaObject(nlmsghdr_fmt);
		  	o._len = 0;                  // auto - handled by native binding
			o._type = 0;                 // should be the netlink command
			o._flags = this.NLM_F_REQUEST;    // native will add NLM_F_ACK if needed
			o._seq = 0;                  // auto - handled by native binding
			o._pid = 0;                  // auto. keep at zero... this is not the process.pid - its a port ID
		return o;
	},

	parseErrorHdr: function(b) {
		return bufferpack.unpack(error_nlmsghdr_fmt,b,0);
	}
}

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

var nl = nk.nl;

/**
 * NETLINK_ROUTE related constants and functions
 * @type {[type]}
 */
var rt = nk.rt = require('./rtnetlink.js');


/**
 * General utility functions
 * @type {[type]}
 */
var netutil = nk.util = require('./netutils.js');



nk.addIPv6Neighbor = function(ifname,inet6dest,lladdr,cb,sock) {
	var ifndex = nk.ifNameToIndex(ifname);
	if(util.isError(ifndex)) {
		err("* Error: " + util.inspect(ans));
		cb(ifindex); // call w/ error
		return;
	}
	var bufs = [];

//<I(_len)H(_type)H(_flags)I(_seq)I(_pid)
	var len = 0; // updated at end
	var nl_hdr = nk.nl.buildHdr();
	nl_hdr._type = rt.RTM_NEWNEIGH; // the command
	nl_hdr._flags = nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK;
	var nd_msg = rt.buildNdmsg(nk.AF_INET6,ifndex,rt.NUD_PERMANENT,nl.NLM_F_REQUEST);
	nd_msg._family = nk.AF_INET6;
	nd_msg._ifindex = ifndex;
	nd_msg._state = rt.NUD_PERMANENT;
	nd_msg._flags = 0;
	//var rt_msg = nk.rt.buildRtmsg();
	
//	bufs.push(nl_hdr.pack());
	dbg("nd_msg---> " + asHexBuffer(nd_msg.pack()));
	bufs.push(nd_msg.pack());

	if(inet6dest) {
		if(typeof inet6dest === 'string') {
			var ans = nk.toAddress(inet6dest,nk.AF_INET6);
			if(util.isError(ans)) {
				cb(ans);
				return;
			}
			var destbuf = ans;
		} else
			var destbuf = inet6dest;
		var rt_attr = nk.rt.buildRtattrBuf(nk.rt.NDA_DST,destbuf.bytes);
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
			var macbuf = netutil.bufferifyMacString(lladdr,6); // we want 6 bytes no matter what
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
		var rt_attr = nk.rt.buildRtattrBuf(nk.rt.NDA_LLADDR,macbuf);
		dbg("rt_attr lladdr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}
	var len = 0;
	for (var n=0;n<bufs.length;n++)
		len += bufs[n].length;
	console.log("nl_hdr._length = " + nl_hdr._length);
	nl_hdr._len = nl_hdr._length + len;
	bufs.unshift(nl_hdr.pack());
	var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

	dbg("Sending---> " + asHexBuffer(all));

	if(sock) {
		cb("Not implemented");
	} else {
		var sock = nk.newNetlinkSocket();
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
	            }, function(err,bufs) {
	            	console.log("in reply cb...");
	            	if(err) {
	            		console.log("** Error in reply: ");
	            		for(var n=0;n<bufs.length;n++) {
	            			console.log('here');
	            			console.dir(bufs[n]);
	            			console.log('buf len = ' + bufs[n].length);
	            			var errobj = nk.nl.parseErrorHdr(bufs[n]);
	            			console.dir(nk.errorFromErrno(errobj._error));
	            			console.log(util.inspect(errobj));
	            		}
	            	}
	            });


	        });

	        // that was exciting. Now let's close it.
//	        sock.close();
	    }

//    cb(ifndex); // callback with error

}


nk.netlinkCommand = function(opts, ifname, sock, cb) {
	var ifndex = nk.ifNameToIndex(ifname);
	if(util.isError(ifndex)) {
		err("* Error: " + util.inspect(ans));
		cb(ifndex); // call w/ error
		return;
	}
	var bufs = [];

	var len = 0; // updated at end
	var nl_hdr = nk.nl.buildHdr();

	// command defaults
	nl_hdr._flags = nl.NLM_F_REQUEST|nl.NLM_F_ROOT|nl.NLM_F_MATCH;
	nl_hdr._type = rt.RTM_GETLINK; // the command

	if(typeof(opts) != 'undefined') {
		if(opts.hasOwnProperty('type')) {
			nl_hdr._type = opts['type'];
		}
		if(opts.hasOwnProperty('flags')) {
			nl_hdr._flags = opts['flags'];
		}
	} 

	//<B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)
	var info_msg = rt.buildInfomsg(nk.AF_INET,rt.ARPHRD_ETHER, ifndex,
									rt.IFF_RUNNING,rt.IFF_CHANGE);
	info_msg._family = rt.RTN_UNSPEC;

	dbg("info_msg---> " + asHexBuffer(info_msg.pack()));
	bufs.push(info_msg.pack());

 	var attr_data = Buffer(4);
 	attr_data.writeUInt32LE(rt.RTEXT_FILTER_VF, 0);
	var rt_attr = nk.rt.buildRtattrBuf(rt.IFLA_EXT_MASK, attr_data);
	dbg("rt_attr---> "  + asHexBuffer(rt_attr));
	bufs.push(rt_attr);

	var len = 0;
	for (var n=0;n<bufs.length;n++)
		len += bufs[n].length;
	console.log("nl_hdr._length = " + nl_hdr._length);
	nl_hdr._len = nl_hdr._length + len;
	bufs.unshift(nl_hdr.pack());
	var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

	dbg("Sending---> " + asHexBuffer(all));
	console.log('all len = ' + all.length);

    var msgreq = sock.createMsgReq();

    msgreq.addMsg(all);

    sock.sendMsg(msgreq, function(err,bytes) {
    	if(err) {
    		console.error("** Error: " + util.inspect(err));
    		cb(err);
    	} else {
    		console.log("in cb: " + util.inspect(arguments));
    		cb(err);//,msgreq);
    	}
    });

}



module.exports = nk;

