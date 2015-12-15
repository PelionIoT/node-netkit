var cmn = require('../libs/common.js');

nfulog = {
	//See:  include/uapi/linux/netfilter/nfnetlink_log.h

	nfulnl_msg_types: {
		NFULNL_MSG_PACKET: 0,		/* packet from kernel to userspace */
		NFULNL_MSG_CONFIG: 1,		/* connect to a particular queue */
	},

	nfulnl_msg_config_cmds: {
		NFULNL_CFG_CMD_NONE: 		0,
		NFULNL_CFG_CMD_BIND: 		1,
		NFULNL_CFG_CMD_UNBIND: 		2,
		NFULNL_CFG_CMD_PF_BIND: 	3,
		NFULNL_CFG_CMD_PF_UNBIND: 	4
	},

	nfulnl_attr_type: {
		NFULA_UNSPEC: 				0,
		NFULA_PACKET_HDR: 			1,
		NFULA_MARK: 				2,			/* __u32 nfmark */
		NFULA_TIMESTAMP: 			3,		/* nfulnl_msg_packet_timestamp */
		NFULA_IFINDEX_INDEV: 		4,		/* __u32 ifindex */
		NFULA_IFINDEX_OUTDEV: 		5,		/* __u32 ifindex */
		NFULA_IFINDEX_PHYSINDEV: 	6,	/* __u32 ifindex */
		NFULA_IFINDEX_PHYSOUTDEV: 	7,	/* __u32 ifindex */
		NFULA_HWADDR: 				8,			/* nfulnl_msg_packet_hw */
		NFULA_PAYLOAD: 				9,			/* opaque data payload */
		NFULA_PREFIX: 				10,			/* string prefix */
		NFULA_UID: 					11,			/* user id of socket */
		NFULA_SEQ: 					12,			/* instance-local sequence number */
		NFULA_SEQ_GLOBAL: 			13,		/* global sequence number */
		NFULA_GID: 					14,			/* group id of socket */
		NFULA_HWTYPE: 				15,			/* hardware type */
		NFULA_HWHEADER: 			16,			/* hardware header */
		NFULA_HWLEN: 				17,			/* hardware header length */
	},

	nfulnl_attr_config: {
		NFULA_CFG_UNSPEC: 		0,
		NFULA_CFG_CMD: 			1,			/* nfulnl_msg_config_cmd */
		NFULA_CFG_MODE: 		2,			/* nfulnl_msg_config_mode */
		NFULA_CFG_NLBUFSIZ: 	3,		/* __u32 buffer size */
		NFULA_CFG_TIMEOUT: 		4,		/* __u32 in 1/100 s */
		NFULA_CFG_QTHRESH: 		5,		/* __u32 */
		NFULA_CFG_FLAGS: 		6,		/* __u16 */
	},

	NFULNL_COPY_NONE:	0x00,
	NFULNL_COPY_META:	0x01,
	NFULNL_COPY_PACKET:	0x02,
	/* 0xff is reserved, don't use it for new copy modes. */

	NFULNL_CFG_F_SEQ:			0x0001,
	NFULNL_CFG_F_SEQ_GLOBAL:	0x0002,
	NFNL_TYPE_ULOG: 			0x0400,

	parseNfulogAttributes(bufs) {
		var ret = {};
		var data = bufs[0];
		var total_len = data.readUInt32LE(0);
		var type = data.readUInt16LE(4);
		var ul = nfulog.nfulnl_attr_type;

		if(type !== nfulog.NFNL_TYPE_ULOG) return {};

		var index = 20; //nl_hdr + nfpayload
		ret.event = "netfilter/log_msg::new";
		ret.data = {};

		while(index < total_len) {
			//debug('index = ' + index);
			var len = data.readUInt16LE(index) - 4; // attr header len == attr header + field
			var attr_type = data.readUInt16LE(index + 2);
			cmn.logger.debug('attr = ' + attr_type + ' len = ' + len);

			index += 4; // index to the data
			var value;

			attr_buf = data.slice(index, index + len);

			try {
				switch(attr_type) {
					case ul.NFULA_PACKET_HDR:
						ret.data.packet_hdr = attr_buf.toString('hex');
						break;
					case ul.NFULA_MARK:
						ret.data.mark = attr_buf.readUInt32BE(0);
						break;
					case ul.NFULA_TIMESTAMP:
						ret.data.timestamp = {};
						ret.data.timestamp.seconds = attr_buf.readUInt32BE(4) << 32 + attr_buf.readUInt32BE(0);
						ret.data.timestamp.useconds = attr_buf.readUInt32BE(12) << 32 + attr_buf.readUInt32BE(8);
						break;
					case ul.NFULA_IFINDEX_INDEV:
						ret.data.indev = attr_buf.readUInt32BE(0);
						break;
					case ul.NFULA_IFINDEX_OUTDEV:
						ret.data.outdev = attr_buf.readUInt32BE(0);
						break;
					case ul.NFULA_IFINDEX_PHYSINDEV:
						ret.data.ifindex_physindev = attr_buf.readUInt32BE(0);
						break;
					case ul.NFULA_IFINDEX_PHYSOUTDEV:
						ret.data.ifindex_physoutdev = attr_buf.readUInt32BE(0);
						break;
					case ul.NFULA_HWADDR:
						var hwaddrlen = attr_buf.readUInt16BE();
						attr_buf = attr_buf.slice(4, len);
						var mac = "";
						for(var i = 0; i < hwaddrlen; i++) {
							if(mac !== "") mac += ':';
							mac += attr_buf[i].toString(16);
						}
						ret.data.hwaddr = mac;
						break;
					case ul.NFULA_PAYLOAD:
						ret.data.payload = attr_buf.toString('hex');
						break;
					case ul.NFULA_PREFIX:
						ret.data.prefix = attr_buf.toString('ascii');
						break;
					case ul.NFULA_UID:
						ret.data.socket_uid = attr_buf.toString('ascii');
						break;
					case ul.NFULA_SEQ:
					     ret.data.sequence_no = attr_buf.readUInt32BE(0)
						break;
					case ul.NFULA_SEQ_GLOBAL:
					     ret.data.global_sequence_no = attr_buf.readUInt32BE(0)
						break;
					case ul.NFULA_GID:
						ret.data.socket_gid = attr_buf.toString('ascii');
						break;
					case ul.NFULA_HWTYPE:
						ret.data.hwtype = attr_buf.readUInt16BE(0);
						break;
					case ul.NFULA_HWHEADER:
						ret.data.hwheader = attr_buf.toString('hex');
						break;
					case ul.NFULA_HWLEN:
						ret.data.hwlen = attr_buf.readUInt16BE(0);
						break;
				}
			} catch(err) {
				cmn.logger.error(err.stack);
			}

			// get to next attribute padding to mod 4
			var pad =  ((len + 3) & 0xFFFFFFFFFC) - len;
			// debug("pad: " + pad);
			index += (len + pad);
		};

		return ret;

	},

};

module.exports = nfulog;