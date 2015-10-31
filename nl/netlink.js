var cmn = require('../libs/common.js');
var rtnetlink = require('./rtnetlink.js')

var util = require('util');

var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;
var err = cmn.err;
var bufferpack = cmn.bufferpack;


// for documentation see: /usr/include/linux/netlink.h
// 	__u32		nlmsg_len;	Length of message including header
//	__u16		nlmsg_type;	Message content
//	__u16		nlmsg_flags; Additional flags
//	__u32		nlmsg_seq;	 Sequence number
//	__u32		nlmsg_pid;	Sending process port ID
var nlmsghdr_fmt = "<I(_len)H(_type)H(_flags)I(_seq)I(_pid)";
var error_nlmsghdr_fmt = "<i(_error)I(_len)H(_type)H(_flags)I(_seq)I(_pid)";

nl = {

	rt: rtnetlink,

	AF_UNSPEC: 0,


    // netlink message flags
	// See: linux/netlink.h

	/* Flags */
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

	NLMSG_MIN_TYPE:		0x10,	/* < 0x10: reserved control messages */
	NLMSG_NOOP:			0x1,	/* Nothing.		*/
	NLMSG_ERROR:		0x2,	/* Error		*/
	NLMSG_DONE:			0x3,	/* End of a dump	*/
	NLMSG_OVERRUN:		0x4,	/* Data lost		*/
	NLMSG_MAX_TYPE:		0x11,	/* < 0x11: reserved control messages */


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

		dbg("nl_hdr.type ---> " + nl_hdr._type + ' (' + nl_hdr._type.toString(16) + ')');
		dbg("nl_hdr.flags ---> " + nl_hdr._flags + ' (' + nl_hdr._flags.toString(16) + ')');

		var len = 0;
		for (var n=0;n<bufs.length;n++)
			len += bufs[n].length;
		nl_hdr._len = nl_hdr._length + len;
		bufs.unshift(nl_hdr.pack());
		var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

		dbg("Sending---> " + asHexBuffer(all));
		//console.log('all len = ' + all.length);

	    var msgreq = sock.createMsgReq();

	    msgreq.addMsg(all);

	    sock.sendMsg(msgreq, function(err,bytes) {
	    	if(err) {
	    		cb(err);
	    	} else {
	    		cb(err,bytes);
	    		//console.log("snedMsg resp --> " + asHexBuffer(bytes[0]));
	    	}
	    });
	},

	sendNetlinkRequest: function(sock, msgreq, cb) {
		//dbg("Sending---> " + asHexBuffer(buf));
		//console.log('all len = ' + all.length);

	    sock.sendMsg(msgreq, function(err,bytes) {
	    	if(err) {
	    		cb(err);
	    	} else {
	    		cb(err,bytes);
	    		//console.log("snedMsg resp --> " + asHexBuffer(bytes[0]));
	    	}
	    });
	},

	addNetlinkMessageToReq: function(msgreq, nl_hdr, bufs) {
-		dbg("nl_hdr.type ---> " + nl_hdr._type + ' (' + nl_hdr._type.toString(16) + ')');
		dbg("nl_hdr.flags ---> " + nl_hdr._flags + ' (' + nl_hdr._flags.toString(16) + ')');

		var len = 0;
		for (var n=0;n<bufs.length;n++)
			len += bufs[n].length;
		nl_hdr._len = nl_hdr._length + len;
		bufs.unshift(nl_hdr.pack());

		var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

		dbg("Adding---> " + asHexBuffer(all));

	    msgreq.addMsg(all);
	},
};

module.exports = nl;