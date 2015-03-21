var cmn = require('../common.js');
var rtnetlink = require('../nl/rtnetlink.js')

var util = require('util');

var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;
var err = cmn.err;
var netutils = cmn.netutils;
var bufferpack = cmn.bufferpack;


// for documentation see: /usr/include/linux/netlink.h
// 	__u32		nlmsg_len;	Length of message including header
//	__u16		nlmsg_type;	Message content
//	__u16		nlmsg_flags; Additional flags
//	__u32		nlmsg_seq;	 Sequence number
//	__u32		nlmsg_pid;	Sending process port ID
var nlmsghdr_fmt = "<I(_len)H(_type)H(_flags)I(_seq)I(_pid)";
var error_nlmsghdr_fmt = "<i(_error)I(_len)H(_type)H(_flags)I(_seq)I(_pid)";

// for documentation see: /usr/include/uapi/linux/connector.h
// __u32 idx;
// __u32 val;

// __u32 seq;
// __u32 ack;

// __u16 len;		 Length of the following data
// __u16 flags;
// __u8 data[0];
var cn_msg_fmt = "<I(_idx)I(_val)I(_seq)I(_ack)H(_len)H(_flags)";

nl = {

	rt: rtnetlink,

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


    /* Netlink protocols */
	NETLINK_ROUTE:		0,	/* Routing/device hook				*/
	NETLINK_UNUSED:		1,	/* Unused number				*/
	NETLINK_USERSOCK:	2,	/* Reserved for user mode socket protocols 	*/
	NETLINK_FIREWALL:	3,	/* Unused number, formerly ip_queue		*/
	NETLINK_SOCK_DIAG:	4,	/* socket monitoring				*/
	NETLINK_NFLOG:		5,	/* netfilter/iptables ULOG */
	NETLINK_XFRM:		6,	/* ipsec */
	NETLINK_SELINUX:	7,	/* SELinux event notifications */
	NETLINK_ISCSI:		8,	/* Open-iSCSI */
	NETLINK_AUDIT:		9,	/* auditing */
	NETLINK_FIB_LOOKUP:	10,
	NETLINK_CONNECTOR:	11,
	NETLINK_NETFILTER:	12,	/* netfilter subsystem */
	NETLINK_IP6_FW:		13,
	NETLINK_DNRTMSG:	14,	/* DECnet routing messages */
	NETLINK_KOBJECT_UEVENT:	15,	/* Kernel messages to userspace */
	NETLINK_GENERIC:	16,
	/* leave room for NETLINK_DM (DM Events) */
	NETLINK_SCSITRANSPORT:	18,	/* SCSI Transports */
	NETLINK_ECRYPTFS:	19,
	NETLINK_RDMA:		20,
	NETLINK_CRYPTO:		21,	/* Crypto layer */

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

    	/*
	 * Process Events connector unique ids -- used for message routing
	 */
	CN_IDX_PROC:		0x1,
	CN_VAL_PROC:		0x1,
	CN_IDX_CIFS:		0x2,
	CN_VAL_CIFS:        0x1,
	CN_W1_IDX:			0x3,	/* w1 communication */
	CN_W1_VAL:			0x1,
	CN_IDX_V86D:		0x4,
	CN_VAL_V86D_UVESAFB:0x1,
	CN_IDX_BB:			0x5,	/* BlackBoard, from the TSP GPL sampling framework */
	CN_DST_IDX:			0x6,
	CN_DST_VAL:			0x1,
	CN_IDX_DM:			0x7,	/* Device Mapper */
	CN_VAL_DM_USERSPACE_LOG:	0x1,
	CN_IDX_DRBD:		0x8,
	CN_VAL_DRBD:		0x1,
	CN_KVP_IDX:			0x9,	/* HyperV KVP */
	CN_KVP_VAL:			0x1,	/* queries from the kernel */
	CN_VSS_IDX:			0xA,     /* HyperV VSS */
	CN_VSS_VAL:			0x1,     /* queries from the kernel */
	CN_NETLINK_USERS:	11,	/* Highest index + 1 */

	PROC_CN_MCAST_LISTEN: 1,
	PROC_CN_MCAST_IGNORE: 2,

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

	buildCnMsg: function() {
		var o = bufferpack.metaObject(cn_msg_fmt);
			o._idx = 0;
			o._val = 0;
			o._seq = 0;
			o._ack = 0;
			o._len = 0;
			o._flags = 0;
			o._pad1 = 0;
		return o;
	},

	parseErrorHdr: function(b) {
		return bufferpack.unpack(error_nlmsghdr_fmt,b,0);
	},

	sendNetlinkCommand: function(sock, nl_hdr, bufs,cb) {
		var len = 0;
		for (var n=0;n<bufs.length;n++)
			len += bufs[n].length;
		nl_hdr._len = nl_hdr._length + len;
		bufs.unshift(nl_hdr.pack());
		var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

		dbg("Sending---> " + asHexBuffer(all));
		console.log('all len = ' + all.length);

	    var msgreq = sock.createMsgReq();

	    msgreq.addMsg(all);

	    sock.sendMsg(msgreq, function(err,bytes) {
	    	if(err) {
	    		cb(err);
	    	} else {
	    		cb(err,bytes);
	    	}
	    });
	},

	netlinkInfoCommand: function(opts, sock, cb) {
		if(opts.hasOwnProperty('ifname')) {
			var ifndex = this.ifNameToIndex(opt['ifname']);
			if(util.isError(ifndex)) {
				err("* Error: " + util.inspect(ifndex));
				cb(ifndex); // call w/ error
				return;
			}
		}

		var nl_hdr = nl.buildHdr();

		// command defaults
		nl_hdr._flags = nl.NLM_F_REQUEST;
		nl_hdr._type = rt.RTM_GETLINK; // the command

		// The info message command
		//<B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)
		var info_msg = rt.buildInfomsg();

		if(typeof(opts) !== 'undefined') {
			if(opts.hasOwnProperty('type')) {
				nl_hdr._type = opts['type'];
			}
			if(opts.hasOwnProperty('flags')) {
				nl_hdr._flags |= opts['flags'];
			}
			if(opts.hasOwnProperty("family")) {
				nl_hdr.family = opts['family'];
				info_msg._family |= opts['family'];
			}

		}

		var bufs = [];

		dbg("info_msg---> " + asHexBuffer(info_msg.pack()));
		bufs.push(info_msg.pack());

	 	var attr_data = Buffer(4);
	 	attr_data.writeUInt32LE(rt.RTEXT_FILTER_VF, 0);
		var rt_attr = rt.buildRtattrBuf(rt.IFLA_EXT_MASK, attr_data);
		dbg("rt_attr---> "  + asHexBuffer(rt_attr));
		bufs.push(rt_attr);

		nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
	},

	netlinkNeighCommand: function(opts,sock, cb) {

		if(opts.hasOwnProperty('ifname')) {
			var ifndex = this.ifNameToIndex(opts['ifname']);
			if(util.isError(ifndex)) {
				err("* Error: " + util.inspect(ifndex));
				cb(ifndex); // call w/ error
				return;
			}
		}

		var nl_hdr = nl.buildHdr();

		// command defaults
		nl_hdr._flags = nl.NLM_F_REQUEST;
		nl_hdr._type = rt.RTM_GETLINK; // the command

		// <B(_family)B(_pad1)H(_pad2)L(_ifindex)H(_state)B(_flags)B(_type)
		var nd_msg = rt.buildNdmsg();
		nd_msg._state = rt.NUD_PERMANENT;
		nd_msg._ifindex = ifndex;

		if(typeof(opts) !== 'undefined') {
			if(opts.hasOwnProperty('type')) {
				nl_hdr._type = opts['type'];
			}
			if(opts.hasOwnProperty('flags')) {
				nl_hdr._flags |= opts['flags'];
			}
			if(opts.hasOwnProperty("family")) {
				nl_hdr.family = opts['family'];
				nd_msg._family |= opts['family'];
			}
		}

		var bufs = [];

		dbg("nd_msg---> " + asHexBuffer(nd_msg.pack()));
		bufs.push(nd_msg.pack());

		// Build the rt attributes for the command
		if(opts.hasOwnProperty('inet4dest')) {
			var inet4dest = opts['inet4dest'];
			if(typeof inet4dest === 'string') {
				var ans = this.toAddress(inet4dest,this.AF_INET);
				if(util.isError(ans)) {
					cb(ans);
					return;
				}
				var destbuf = ans;
			} else
				var destbuf = inet4dest;
			var rt_attr = rt.buildRtattrBuf(rt.NDA_DST,destbuf.bytes);
			dbg("destbuf---> " + asHexBuffer(destbuf.bytes));
			dbg("rt_attr---> " + asHexBuffer(rt_attr));
			bufs.push(rt_attr);
		}

		if(opts.hasOwnProperty('lladdr')) {
			var lladdr = opts['lladdr'];
			if(typeof lladdr === 'string') {
				var macbuf = netutils.bufferifyMacString(lladdr,6); // we want 6 bytes no matter what
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
			var rt_attr = rt.buildRtattrBuf(rt.NDA_LLADDR,macbuf);
			dbg("rt_attr lladdr---> " + asHexBuffer(rt_attr));
			bufs.push(rt_attr);
		}

		nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
	},

	sendConnectorMsg: function(sock,cb) {
		var bufs = [];

		var len = 0; // updated at end
		var nl_hdr = nl.buildHdr();

		nl_hdr._flags = 0;
		nl_hdr._type = rt.NLMSG_DONE; // the command

		var cn_msg = nl.buildCnMsg();
		cn_msg._idx = nl.CN_IDX_PROC;
		cn_msg._val = nl.CN_VAL_PROC;
		cn_msg._len = 4;
		dbg("cn_msg---> " + asHexBuffer(cn_msg.pack()));
		bufs.push(cn_msg.pack());

		var cn_op = Buffer(4);
		cn_op.writeUInt32LE(nl.PROC_CN_MCAST_LISTEN,0);
		dbg("cn_op---> "  + asHexBuffer(cn_op));
		bufs.push(cn_op);

		nl.sendNetlinkCommand.call(this,sock,nl_hdr,bufs,cb);
	}
};

module.exports = nl;