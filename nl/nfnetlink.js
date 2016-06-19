var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');
var nft = require('../nf/nftables.js');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var util = require('util');


// struct nfulnl_msg_packet_hdr {
// 	__be16		hw_protocol;	/* hw protocol (network order) */
// 	__u8	hook;		/* netfilter hook */
// 	__u8	_pad;
// };

// struct nfulnl_msg_packet_hw {
// 	__be16		hw_addrlen;
// 	__u16	_pad;
// 	__u8	hw_addr[8];
// };

// struct nfulnl_msg_packet_timestamp {
// 	__aligned_be64	sec;
// 	__aligned_be64	usec;
// };

var nfulnl_msg_packet_hdr = "<H(_hw_protocol)B(_hook)B(_pad)";
var nfulnl_msg_packet_hw  = "<H(_hw_addrlen)H(_pad0)B(_pad1)";
var nfulnl_msg_packet_timestamp = "<d(_sec)d(_usec)";
var nfulnl_msg_config_mode = "<I(_copy_range)B(_copy_mode)B(_pad1)";

nf = {

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


	NFNLGRP_NONE: 					0,
	NFNLGRP_CONNTRACK_NEW: 			1,
	NFNLGRP_CONNTRACK_UPDATE: 		2,
	NFNLGRP_CONNTRACK_DESTROY: 		3,
	NFNLGRP_CONNTRACK_EXP_NEW: 		4,
	NFNLGRP_CONNTRACK_EXP_UPDATE: 	5,
	NFNLGRP_CONNTRACK_EXP_DESTROY: 	6,
	NFNLGRP_NFTABLES: 				7,

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

	flags: {
		NFT_TABLE_F_ACTIVE:  0x00000000,
		NFT_TABLE_F_DORMANT: 0x01000000,
		NLA_F_NESTED:		(1 << 15),
		NLA_F_NET_BYTEORDER:(1 << 14),
		NLA_TYPE_MASK:		~(this.NLA_F_NESTED | this.NLA_F_NET_BYTEORDER),
	},


	family: {
		NFPROTO_UNSPECL: 	0,
		NFPROTO_INET: 		1,
		NFPROTO_IPV4: 		2,
		NFPROTO_ARP : 		3,
		NFPROTO_BRIDGE: 	7,
		NFPROTO_IPV6: 		10,
		NFPROTO_DECNET: 	12,
	},

	nft: nft,
	nl: nl,

	nft_command_map: [
		"add",
		"get",
		"delete",
		"add",
		"get",
		"delete",
		"add",
		"get",
		"delete",
		"add",
		"get",
		"delete",
		"add",
		"get",
		"delete",
		"add",
		"get"
	],

	nft_type_map: [
		"table",
		"table",
		"table",
		"chain",
		"chain",
		"chain",
		"rule",
		"rule",
		"rule",
		"set",
		"set",
		"set",
		"setelem",
		"setelem",
		"setelem",
		"gen",
		"gen"
	],

	getAttributeMap: function(type) {

		var retVal = {};

		if(nf.NFT_MSG_NEWTABLE <= type && type <= nf.NFT_MSG_DELTABLE) {
		    //debug('TABLE');
			retVal.keys = nft.nft_table_attributes
			retVal.name = 'table';
		} else if(nf.NFT_MSG_NEWCHAIN <= type && type <= nf.NFT_MSG_DELCHAIN) {
		    //debug('CHAIN');
			retVal.keys = nft.nft_chain_attributes
			retVal.name = 'chain';
		} else if(nf.NFT_MSG_NEWRULE <= type && type <= nf.NFT_MSG_DELRULE) {
		    //debug('RULE');
			retVal.keys = nft.nft_rule_attributes
			retVal.name = 'rule';
		} else if(nf.NFT_MSG_NEWSET <= type && type <= nf.NFT_MSG_DELSET) {
		    //debug('SET');
			retVal.keys = nft.nft_set_attributes
			retVal.name = 'set';
		} else if(nf.NFT_MSG_NEWSETELEM <= type && type <= nf.NFT_MSG_DELSETELEM) {
		    //debug('SETELEM');
			retVal.name = 'setelem';
			retVal.keys = nft.nft_setelemlist_attributes
		} else if(nf.NFT_MSG_NEWGEN <= type && type <= nf.NFT_MSG_DELGEN) {
		    //debug('GEN');
			retVal.name = 'gen';
			throw new Error("gen not implemented yet");
		}else {
			var msg = "WARNING: ** Received unsupported message type from netlink socket(type="
				+ type + ") **"
			debug(msg);
			//throw new Error(msg);
		}

		return retVal;
	},

	getCommandObject: function(type){
		var command_object = nft['nft_' + type + '_attributes'];
		if(typeof command_object === 'undefined'){
			throw Error("command type " + type + " does not exist");
		}
		this.command_type = type;
		return command_object;
	},

	updatePayloadParams: function(family, type, ret) {
		ret.command = nf.nft_command_map[type];
		ret.type = nf.nft_type_map[type];
		ret.family = family == 2 ? 'ip' : 'ip6'; 
	},

	get_prefix: function() {
		return "NFTA_";
	},

	parseGenmsg: function(data) {
		// get the generic netfiler generation
		return nf.unpackNfgenmsg(data, 16);
	},

	getTypeFromBuffer: function(buffer) {
		return buffer.readUInt16LE(4); //& 0x00FF;
	},

	readUInt16: function(buffer, idx) {
		return buffer.readUInt16BE(idx);
	},

	readUInt32: function(buffer, idx) {
		return buffer.readUInt32BE(idx);
	},

	writeUInt16: function(buffer, value, idx, len) {
		return buffer.writeUInt16BE(value, idx, len);
	},

	writeUInt32: function(buffer, value, idx, len) {
		return buffer.writeUInt32BE(value, idx, len);
	},

	attrType: function(obj) {
	  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
	},

	getFlags: function(f) {
		var flags_str = "";
		for (var k in nf.flags){
			if(nf.flags.hasOwnProperty(k)){
		 		if(f === nf.flags[k]) {
		 			if(flags_str.length)
		 				flags_str += "|";
		 			flags_str += k;
		 		}
	 		}
		}
		return flags_str;
	},

	nfgenmsg_fmt: "<B(_family)B(_version)H(_resid)",
	buildNfgenmsg: function(params) {
		var o = bufferpack.metaObject(params);
		o._family = 0;
		o._version = 0;
		o._resid = 0;
		return o;
	},


	// <H(_hw_protocol)B(_hook)B(_pad),
	build_nfulnl_msg_packet_hdr: function(params) {
		var o = bufferpack.metaObject(params);
		o._hw_protocol = 0;
		o._hook = 0;
		o._pad = 0;
		return o;
	},
	unpack_nfulnl_msg_packet_hdr: function(data, pos) {
		return bufferpack.unpack(nf.nfulnl_msg_packet_hdr, data, pos);
	},

	// <H(_hw_addrlen)H(_pad)B(_pad)
	build_nfulnl_msg_packet_hw: function(params) {
		var o = bufferpack.metaObject(params);
		o._hw_addrlen = 0;
		o._pad0 = 0;
		o._pad1 = 0;
		return o;
	},
	unpack_nfulnl_msg_packet_hw: function(data, pos) {
		return bufferpack.unpack(nf.nfulnl_msg_packet_hw, data, pos);
	},

	// <I(_copy_range)B(_copy_mode)B(_pad1)
	build_nfulnl_msg_config_mode: function(params) {
		var o = bufferpack.metaObject(nfulnl_msg_config_mode);
		o._copy_range = 0;
		o._copy_mode = 0;
		o._pad1 = 0;
		return o;
	},

	unpack_nfulnl_msg_config_mode: function(data,pos) {
		return bufferpack.unpack(nf.nfulnl_msg_config_mode,data,pos);
	},

	unpackNfgenmsg: function(data, pos) {
		return bufferpack.unpack(nf.nfgenmsg_fmt, data, pos);
	},

	addNfBatchMessages: function(msgreq, batch) {
		// addBatchMessages - add netlink min/max request packets to the buffer
		// \param msgreq - netlinksocket mesgreq type
		// \param batch - the batch message value to add

		var bufs = [];

		var nl_hdr = nl.buildHdr();
		nl_hdr._type = batch;
		nl_hdr._flags = nl.NLM_F_REQUEST;

		var nf_hdr = nf.buildNfgenmsg(this.nfgenmsg_fmt);
		nf_hdr._version = nf.NFNETLINK_V0;
		nf_hdr._resid = nf.NFNL_SUBSYS_NFTABLES;

		bufs.push(nf_hdr.pack());
		nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
	},

	addCommandMessage: function(msgreq, opts, attrs, cb) {
		nf.createCommandBuffer(opts, attrs, function(error, nl_hdr, bufs) {
			if(error) {
				cb(error);
			} else {
				nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
				cb(null);
			}
		});
	},

	sendNetfilterCommand: function(opts, sock, attrs, cb) {

	    var msgreq = sock.createMsgReq();
	    var batch = (opts['type_flags'] & nl.NLM_F_MATCH) ? false : true;
	    if(opts['batch'] != undefined) batch = opts['batch'];

	    // wrap the netfilter netlink command with min/max netlink request types
	    // to satisfy the netfiler subsystem interface. Some ealier kernels don't support batching
	    // so netfiler would not be available. nft will check batching support for each command
	    // but we assume our kernel is late enough.
	    if(batch) nf.addNfBatchMessages(msgreq, nl.NLMSG_MIN_TYPE);
	    nf.addCommandMessage(msgreq, opts, attrs, function(err){
	    	if(err) {
	    		return cb(err,null);
	    	} else {
			    if(batch) nf.addNfBatchMessages(msgreq, nl.NLMSG_MAX_TYPE);
				nl.sendNetlinkRequest(sock, msgreq, cb);
	    	}
	    });
	},

	createCommandBuffer: function(opts, attrs, cb) {
		var bufs = [];

		var nl_hdr = nl.buildHdr();
		nl_hdr._flags = nl.NLM_F_REQUEST;

		var nf_hdr = nf.buildNfgenmsg(this.nfgenmsg_fmt);
		nf_hdr._version = nf.NFNETLINK_V0;

		if(typeof(opts) !== 'undefined') {

			if(opts.hasOwnProperty("res_id")) {
				nf_hdr._resid = opts['res_id'];
			}

			if(opts.hasOwnProperty("subsys")) {
				nl_hdr._type |= opts['subsys'] << 8;
			} else {
				return cb(new Error("no subsys option specified"));
			}

			if(opts.hasOwnProperty("cmd")) {
				nl_hdr._type |= opts['cmd'];
			} else {
				return cb(new Error("no cmd option specified"));
			}

			if(opts.hasOwnProperty("type_flags")) {
				//debug('type=' + opts['type']);
				nl_hdr._flags |= opts['type_flags'];
			} else {
				return cb(new Error("no type option specified"));
			}

			if(opts.hasOwnProperty("family")) {
				nf_hdr._family = opts['family'];
			} else {
				return cb(new Error("no family option specified"));
			}

			bufs.push(nf_hdr.pack());

			if(typeof(attrs) !== 'undefined') attrs.writeAttributes(bufs);

			cb(null, nl_hdr, bufs);
		} else {
			cb(new Error('Command options are undefined'));
		}
	}
};

module.exports = nf;