

//See:  include/uapi/linux/netfilter/nfnetlink_log.h

nfulog = {

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

};

module.exports = nfulog;