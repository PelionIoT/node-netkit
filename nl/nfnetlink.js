var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');
var nft = require('../nf/nftables.js');
var NfAttributes = require('../nf/nfattributes.js');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var util = require('util');

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

	nft_types_name_map: [
		"newtable",
		"gettable",
		"deltable",
		"newchain",
		"getchain",
		"delchain",
		"newrule",
		"getrule",
		"delrule",
		"newset",
		"getset",
		"delset",
		"newsetelem",
		"getsetelem",
		"delsetelem",
		"newgen",
		"getgen"
	],

	getNfTypeName: function(type) {
		return nf.nft_types_name_map[type];
	},

	attrType: function(obj) {
	  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
	},


	Attributes: function(command_type, parameters) {
		return new NfAttributes(command_type, parameters);
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

	unpackNfgenmsg: function(data, pos) {
		return bufferpack.unpack(nf.nfgenmsg_fmt, data, pos);
	},

	addBatchMessages: function(msgreq, batch) {
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

		var bufs = [];
		var attrs;

		var nl_hdr = nl.buildHdr();
		nl_hdr._type = (nf.NFNL_SUBSYS_NFTABLES << 8);
		nl_hdr._flags = nl.NLM_F_REQUEST;

		var nf_hdr = nf.buildNfgenmsg(this.nfgenmsg_fmt);
		nf_hdr._version = nf.NFNETLINK_V0;

		if(typeof(opts) !== 'undefined') {
			if(opts.hasOwnProperty("cmd")) {
				nl_hdr._type |= opts['cmd'];
			} else {
				return cb(new Error("no cmd option specified"));
			}

			if(opts.hasOwnProperty("type_flags")) {
				//console.log('type=' + opts['type']);
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

			attrs.writeAttributes(bufs);
			nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
			cb(null);
		} else {
			cb(new Error("no options specified"));
		}
	},

	sendNetfilterCommand: function(opts, sock, attrs, cb) {

	    var msgreq = sock.createMsgReq();
	    var batch = (opts['type_flags'] & nl.NLM_F_MATCH) ? false : true;

	    // wrap the netfilter netlink command with min/max netlink request types
	    // to satisfy the netfiler subsystem interface. Some ealier kernels don't support batching
	    // so netfiler would not be available. nft will check batching support for each command
	    // but we assume our kernel is late enough.
	    if(batch) nf.addBatchMessages(msgreq, nl.NLMSG_MIN_TYPE);
	    nf.addCommandMessage(msgreq, opts, attrs, function(err){
	    	if(err) {
	    		return cb(err,null);
	    	} else {
			    if(batch) nf.addBatchMessages(msgreq, nl.NLMSG_MAX_TYPE);
				nl.sendNetlinkRequest(sock, msgreq, cb);
	    	}
	    });
	},

	parseNfattributes: function(data) {
		var ret = {};
		console.log("data: " + data.toString('hex') );

		if(!data || !Buffer.isBuffer(data) || data.length < 16) {
			return ret;
		} else {
			var total_len = data.readUInt32LE(0);
			if(total_len != data.length) {
				return ret;
			}

			var type = data.readUInt16LE(4) & 0x00FF;
			var index = 16; // start after the msghdr

			var name = "";
			var keys;
			if(this.NFT_MSG_NEWTABLE <= type && type <= this.NFT_MSG_DELTABLE) {
			    //console.log('TABLE');
				name = 'table';
			} else if(this.NFT_MSG_NEWCHAIN <= type && type <= this.NFT_MSG_DELCHAIN) {
			    //console.log('CHAIN');
				name = 'chain';
			} else if(this.NFT_MSG_NEWRULE <= type && type <= this.NFT_MSG_DELRULE) {
			    //console.log('RULE');
				keys = nft.nft_rule_attributes
				// payload = bufferpack.unpack(rtmsg_fmt,data,index)
				name = 'rule';
			} else if(this.NFT_MSG_NEWSET <= type && type <= this.NFT_MSG_DELSET) {
			    //console.log('SET');
				name = 'set';
			} else if(this.NFT_MSG_NEWSETELEM <= type && type <= this.NFT_MSG_DELSETELEM) {
			    //console.log('SETELEM');
				name = 'setelem';
			} else if(this.NFT_MSG_NEWGEN <= type && type <= this.NFT_MSG_DELGEN) {
			    //console.log('GEN');
				name = 'gen';
			}else {
				console.warn("WARNING: ** Received unsupported message type from netlink socket(type="
					+ type + ") **");
				return ret;
			}

			// skip the nfgenmsg header
			index += 4;

			// console.log('start index = ' + index);
			var payload = nf.parseAttrs(data, index, total_len, keys );

			ret['operation'] = this.getNfTypeName(type);
			ret[name] = payload;
		}
		return ret;
	},

	parseAttrs: function(data, start, total_len, start_keys) {
		var ret = {};
		var index = start;

		//console.dir(start_keys);

		while(index < total_len) {
			var len = data.readUInt16LE(index);
			var round_len = len + ((len % 4) ? 4 - (len % 4) : 0);


			var attr_type_val = data.readUInt16LE(index + 2);
			var remaining = data.slice(index).length;

			console.log("attr_type_val: " + attr_type_val.toString(16) + " name: " + Object.keys(start_keys)[attr_type_val] + " len: " + len.toString(16)
			 	+ " round_len: " + round_len.toString(16) + " buf_len: " + remaining.toString(16));

			var field_name = Object.keys(start_keys)[attr_type_val].split('_')[2].toLowerCase();
			var field_type = Object.keys(start_keys)[attr_type_val].split('_')[1];
			var filed_spec = start_keys['NFTA_' + field_type + '_SPEC'][attr_type_val];



			var attr_value;
			if(len === remaining) {
				attr_value = data.slice(index, index + 4);
				console.log("NESTED -- attr_value: " + attr_value.toString('hex'));
				console.log("remaining: " + data.slice(index).toString('hex'));
			} else {
				attr_value = data.slice(index + 4, index + round_len);
				console.log("attr_value: " + attr_value.toString('hex'));
			}


			ret[field_name] = attr_value
			index += round_len; // index to the data
		};

		return ret;
	},


};

module.exports = nf;