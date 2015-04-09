var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');
var rt = nl.rt;
var bufferpack = cmn.bufferpack;



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
			NFT_RULE_ATTR_MAX: 			8,
			NFT_RULE_TYPE: 				['n32','s','s','n/64','n/32','n/32','n/64','o']
		},

		table: {
			NFT_TABLE_ATTR_FAMILY: 		0,
			NFT_TABLE_ATTR_NAME: 		1,
			NFT_TABLE_ATTR_FLAGS: 		2,
			NFT_TABLE_ATTR_USE: 		3,
			NFT_TABLE_ATTR_MAX: 		4,
			NFT_TABLE_TYPE: 			['n/32','s','n/32','n/32']
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
			NFT_CHAIN_ATTR_MAX: 		11,
			NFT_CHAIN_TYPE: 			['s/32','n/32','s','n/32','n/32','n/32','n/32','n/64','n/64','n/64','s']
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
			NFT_SET_ATTR_MAX: 			11,
			NFT_SET_TYPE: 				['s','s','n/32','n/32','n/32','n/32','n/32','n/32','n/32','n/32','n/32']
		},
	},

	attrType: function(obj) {
	  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
	},

	addNfAttribute: function(bufs, attr, val, cb) {
		//console.log('attrType = ' + nf.attrType(attr));
		//console.log('attr = ' + attr);
		if(nf.attrType(attr) != 'string') {
			cb(new Error("attribute is not of type string"),null);
			return;
		}

		var attr_t = attr.split('_')[1].toLowerCase();
		//console.log('attr_t = ' + attr_t);
		if(attr_t === 'undefined' || !nf.attrs.hasOwnProperty(attr_t)) {
			cb(new Error("netfilter attribute not defined"),null);
			return;
		}

		var attr_subtype = nf.attrs[attr_t];
		//console.dir(attr_subtype);
		if(!attr_subtype.hasOwnProperty(attr)) {
			cb(new Error("netfilter " + attr_t + " attribute not defined"),null);
			return;
		}

		var attr_subtype_val = attr_subtype[attr];
		var attr_subtype_name = "NFT_" + attr_t.toUpperCase() + "_TYPE";
		var spec = attr_subtype[attr_subtype_name][attr_subtype_val];

		//console.log('spec = ' + spec);

		var slash = spec.indexOf('/');
		var attr_subtype_type;
		var attr_subtype_len = -1;

		//console.log("slash = " + slash);
		if(slash === -1) {
			attr_subtype_type = spec;
		} else {
			attr_subtype_type = spec.slice(0, slash - 1);
			attr_subtype_len = parseInt(spec.slice(slash + 1));
		}

		//console.log("attr_subtype_type = " + attr_subtype_type);
		//console.log("attr_subtype_len = " + attr_subtype_len);
		if((attr_subtype_len === -1 && attr_subtype_type !== 's' ) || attr_subtype_len === NaN) {
			cb(new Error("attribute type or length parse error"),null);
			return;
		}

		if(attr_subtype_type === 's') {
			if(nf.attrType(attr) !== 'string') {
				cb(new Error("attribute type " + attr + " does not match value: " + val),null);
				return;
			}

			console.dir(val);

			var b;
			if(attr_subtype_len > 0) {
				if(val.length >  attr_subtype_len) {
					cb(new Error("attribute value string is longer than " + attr_subtype_len),null);
					return;
				}

				b = Buffer(attr_subtype_len);
				b.write(val, 0 , attr_subtype_len);
			} else {
				b = Buffer(val + '\0');
			}

			console.dir(b);
			bufs.push(rt.buildRtattrBuf(attr_subtype_val, b));

		} else if(attr_subtype_type === 'n') {
			if(nf.attrType(attr) !== 'number') {
				cb(new Error("attribute type " + attr + " does not match value: " + val),null);
				return;
			}

			var b = Buffer(attr_subtype_len);
			b.writeUIntBE(val,0,attr_subtype_len);
			bufs.push(rt.buildRtattrBuf(attr_subtype_type, b));

		} else {
			cb(new Error("attribute type " + attr + " does not match value: " + val),null);
			return;
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

	addBatchMessages: function(msgreq, batch) {

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

	addCommandMessage: function(msgreq, opts, cb) {

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

			if(opts.hasOwnProperty("type")) {
				//console.log('type=' + opts['type']);
				nl_hdr._flags |= opts['type'];
			} else {
				return cb(new Error("no type option specified"));
			}

			if(opts.hasOwnProperty("family")) {
				nf_hdr._family = opts['family'];
			} else {
				return cb(new Error("no family option specified"));
			}

			bufs.push(nf_hdr.pack());

			if(opts.hasOwnProperty("attrs")) {
				var ats = opts['attrs'];
				ats.forEach(function(at) {
					var curvalue;
					var curtype;
					if(at.hasOwnProperty("type")) {
						curtype = at['type'];
					} else {
						return cb(new Error("no type in supplied attribute: " + JSON.stringify(at)));
					}

					if(at.hasOwnProperty("value")) {
						curvalue = at['value'];
					} else {
						return cb(new Error("no value in supplied attribute: " + JSON.stringify(at)));
					}

					nf.addNfAttribute(bufs,curtype,curvalue,function(err) {
						if(err) {
							return cb(err);
						}
					});
				});

			}
		} else {
			cb(new Error("no options specified"));
		}

		nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
		cb(null);
	},

	sendNetfilterCommand: function(opts, sock, cb) {

	    var msgreq = sock.createMsgReq();

	    nf.addBatchMessages(msgreq, nl.NLMSG_MIN_TYPE);
	    nf.addCommandMessage(msgreq, opts, function(err){
	    	if(err) {
	    		return cb(err,null);
	    	} else {

			    nf.addBatchMessages(msgreq, nl.NLMSG_MAX_TYPE);
				nl.sendNetlinkRaw(sock, msgreq, cb);
	    	}
	    });
	},
};

module.exports = nf;