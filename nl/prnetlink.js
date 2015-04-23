var nl = require('./netlink.js')
var cmn = require('../libs/common.js');
var bufferpack = cmn.bufferpack;
var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;

proc = {

// for documentation see: /usr/include/uapi/linux/connector.h
// __u32 idx;
// __u32 val;

// __u32 seq;
// __u32 ack;

// __u16 len;		 Length of the following data
// __u16 flags;
// __u8 data[0];
	cn_msg_fmt: "<I(_idx)I(_val)I(_seq)I(_ack)H(_len)H(_flags)",

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
	PROC_CN_MCAST_LISTEN: 1,
	PROC_CN_MCAST_IGNORE: 2,

	buildCnMsg: function() {
		var o = bufferpack.metaObject(proc.cn_msg_fmt);
			o._idx = 0;
			o._val = 0;
			o._seq = 0;
			o._ack = 0;
			o._len = 0;
			o._flags = 0;
			o._pad1 = 0;
		return o;
	},

	sendConnectorMsg: function(sock,cb) {
		var bufs = [];

		var len = 0; // updated at end
		var nl_hdr = nl.buildHdr();

		nl_hdr._flags = 0;
		nl_hdr._type = rt.NLMSG_DONE; // the command

		var cn_msg = proc.buildCnMsg();
		cn_msg._idx = proc.CN_IDX_PROC;
		cn_msg._val = proc.CN_VAL_PROC;
		cn_msg._len = 4;
		dbg("cn_msg---> " + asHexBuffer(cn_msg.pack()));
		bufs.push(cn_msg.pack());

		var cn_op = Buffer(4);
		cn_op.writeUInt32LE(proc.PROC_CN_MCAST_LISTEN,0);
		dbg("cn_op---> "  + asHexBuffer(cn_op));
		bufs.push(cn_op);

		nl.sendNetlinkCommand.call(this,sock,nl_hdr,bufs,cb);
	}
};

module.exports = proc;