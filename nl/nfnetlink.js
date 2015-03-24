var nl = require('../nl/netlink.js');
var cmn = require('../common.js');
var rt = nl.rt;
var bufferpack = cmn.bufferpack;



nf = {

	nft_table_attributes:
	[
		"unspec",
		"name",
		"flags",
		"use",
	],

	NFNETLINK_V0: 					0,

	NFNL_SUBSYS_NONE: 				0,
	NFNL_SUBSYS_CTNETLINK: 			1,
	NFNL_SUBSYS_CTNETLINK_EXP: 		2,
	NFNL_SUBSYS_QUEUE: 				3,
	NFNL_SUBSYS_ULOG: 				4,
	NFNL_SUBSYS_OSF: 				5,
	NFNL_SUBSYS_IPSET:				6,
	NFNL_SUBSYS_ACCT:				7,
	NFNL_SUBSYS_CTNETLINK_TIMEOUT:	8,
	NFNL_SUBSYS_CTHELPER:			9,
	NFNL_SUBSYS_NFTABLES:			10,
	NFNL_SUBSYS_NFT_COMPAT:			11,
	NFNL_SUBSYS_COUNT:				12,

	NFT_TABLE_ATTR_NAME: 	0,
	NFT_TABLE_ATTR_FAMILY: 	1,
	NFT_TABLE_ATTR_FLAGS: 	2,
	NFT_TABLE_ATTR_USE: 	3,

	NFT_MSG_NEWTABLE: 		0,
	NFT_MSG_GETTABLE: 		1,
	NFT_MSG_DELTABLE: 		2,
	NFT_MSG_NEWCHAIN: 		3,
	NFT_MSG_GETCHAIN: 		4,
	NFT_MSG_DELCHAIN: 		5,
	NFT_MSG_NEWRULE: 		6,
	NFT_MSG_GETRULE: 		7,
	NFT_MSG_DELRULE: 		8,
	NFT_MSG_NEWSET: 		9,
	NFT_MSG_GETSET: 		10,
	NFT_MSG_DELSET: 		11,
	NFT_MSG_NEWSETELEM: 	12,
	NFT_MSG_GETSETELEM: 	13,
	NFT_MSG_DELSETELEM: 	14,
	NFT_MSG_NEWGEN: 		15,
	NFT_MSG_GETGEN: 		16,

	NFPROTO_UNSPECL: 	0,
	NFPROTO_INET: 		1,
	NFPROTO_IPV4: 		2,
	NFPROTO_ARP : 		3,
	NFPROTO_BRIDGE: 	7,
	NFPROTO_IPV6: 		10,
	NFPROTO_DECNET: 	12,


	attrs: {
		rule: {
			NFT_RULE_ATTR_FAMILY: 		0,
			NFT_RULE_ATTR_TABLE: 		1,
			NFT_RULE_ATTR_CHAIN: 		2,
			NFT_RULE_ATTR_HANDLE: 		3,
			NFT_RULE_ATTR_COMPAT_PROTO: 4,
			NFT_RULE_ATTR_COMPAT_FLAGS: 5,
			NFT_RULE_ATTR_POSITION: 	6,
			NFT_RULE_ATTR_USERDATA: 	7,
			NFT_RULE_ATTR_MAX: 			8
		},

		table: {
			NFT_TABLE_ATTR_NAME: 		0,
			NFT_TABLE_ATTR_FAMILY: 		2,
			NFT_TABLE_ATTR_FLAGS: 		3,
			NFT_TABLE_ATTR_USE: 		4,
			NFT_TABLE_ATTR_MAX: 		5
		},

		chain: {
			NFT_CHAIN_ATTR_NAME: 		0,
			NFT_CHAIN_ATTR_FAMILY: 		1,
			NFT_CHAIN_ATTR_TABLE: 		2,
			NFT_CHAIN_ATTR_HOOKNUM: 	3,
			NFT_CHAIN_ATTR_PRIO: 		4,
			NFT_CHAIN_ATTR_POLICY: 		5,
			NFT_CHAIN_ATTR_USE: 		6,
			NFT_CHAIN_ATTR_BYTES: 		7,
			NFT_CHAIN_ATTR_PACKETS: 	8,
			NFT_CHAIN_ATTR_HANDLE: 		9,
			NFT_CHAIN_ATTR_TYPE: 		10,
			NFT_CHAIN_ATTR_MAX: 		11
		},

		set: {
			NFT_SET_ATTR_TABLE: 		0,
			NFT_SET_ATTR_NAME: 			1,
			NFT_SET_ATTR_FLAGS: 		2,
			NFT_SET_ATTR_KEY_TYPE: 		3,
			NFT_SET_ATTR_KEY_LEN: 		4,
			NFT_SET_ATTR_DATA_TYPE: 	5,
			NFT_SET_ATTR_DATA_LEN: 		6,
			NFT_SET_ATTR_FAMILY: 		7,
			NFT_SET_ATTR_ID: 			8,
			NFT_SET_ATTR_POLICY: 		9,
			NFT_SET_ATTR_DESC_SIZE: 	10,
			NFT_SET_ATTR_MAX: 			11
		},
	},

	addNfAttribute: function(buf, attr, val) {
		switch(attr){
			case nf.NFT_TABLE_ATTR_NAME:
				break;
		}
	},

	nfgenmsg_fmt: "<B(_family)B(_version)H(_resid)",
	buildNfgenmsg: function(params) {
		var o = bufferpack.metaObject(params);
		o._family = 0;
		o._version = 0;
		o._resid = 0;
		return o;
	},

	unpackNfgenmsg: function(data, pos) {
		return bufferpack.unpack(nf.nfgenmsg_fmt, data, pos);
	},

	sendNetfilterCommand: function(opts, sock, attrs,  cb) {
		var bufs = [];

		var nl_hdr = nl.buildHdr();
		nl_hdr._type = (nf.NFNL_SUBSYS_NFTABLES << 8);
		nl_hdr._flags = nl.NLM_F_REQUEST;

		var nf_hdr = nf.buildNfgenmsg(this.nfgenmsg_fmt);
		nf_hdr._version = nf.NFNETLINK_V0;

		if(typeof(opts) !== 'undefined') {
			if(opts.hasOwnProperty("cmd")) {
				nl_hdr._type |= opts['cmd'];
			} else {
				cb(new Error("Error: no cmd option specified"), null);
			}

			if(opts.hasOwnProperty("type")) {
				console.log('type=' + opts['type']);
				nl_hdr._flags |= opts['type'];
			} else {
				cb(new Error("Error: no type option specified"), null);
			}

			if(opts.hasOwnProperty("family")) {
				nf_hdr._family = opts['family'];
			} else {
				cb(new Error("Error: no family option specified"), null);
			}

		} else {
			cb(new Error("Error: no options specified"), null);
		}
		bufs.push(nf_hdr.pack());
		if(typeof(attrs) != 'undefined') bufs.push(attrs);
		nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
	},
};

module.exports = nf;