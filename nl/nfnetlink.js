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

	flags: {
		NFT_TABLE_F_ACTIVE:  0x00000000,
		NFT_TABLE_F_DORMANT: 0x01000000,
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


	nfAttribute: function(command_type) {

		var attr_name_map = [];
		var attr_type_map = [];
		var attr_size_map = [];

		var init_attribute = function() {

			// Init attributes here when this file is required
			var command_attrs = nf.attrs[command_type];
			if(typeof command_attrs === 'undefined'){
				err("command type " + command_type+ " does not exist");
				return;
			}

			// Build Attr_map
			for(key in command_attrs) {
				var name = key.split('_')[3];
				if(name) {
					attr_name_map.push(name.toLowerCase());
				}
			}

			var typename = "NFT_" + command_type.toUpperCase() + "_TYPE";
			var types = command_attrs[typename];
			for(var type in types) {
				var type_t = types[type].slice(0,1);
				attr_type_map.push(type_t);
				if(type_t === 's') {
					attr_size_map.push(-1);
				} else {
					attr_size_map.push(parseInt(types[type].slice(2)));
				}
			}
			// console.dir(command_attrs);
			// console.dir(attr_type_map);
			// console.dir(attr_size_map);
		}();

		var getAttribute = function(data, type){
			if(attr_type_map[type] === 's') {
				return data.toString('ascii', 0, data.length -1);
			} else {
				switch(attr_size_map[type]) {
					case 8:
						return data.readUInt8LE(0);
						break;
					case 16:
						return data.readUInt16LE(0);
						break;
					case 32:
						return data.readUInt32LE(0);
						break;
					case 64:
						return (data.readUInt32LE(0) << 32 + data.readUInt32LE(4));
						break;
				}
			}
		};

		var getFlags = function(f) {
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
		};

		return {

			parseNfAttrs: function(data, attr_start, total_len) {
				var ret = {};
				var index = attr_start;

				while(index < total_len) {
					// console.log('index = ' + index);
					var len = data.readUInt16LE(index) - 4; // attr header len == attr header + field
					var attr_type = data.readUInt16LE(index + 2);
					// console.log('attr = ' + attr_type + ' len = ' + len);
					// console.dir(data.slice(index, index + len + 4));

					index += 4; // index to the data
					var value;

					if(0 <= attr_type && attr_type < attr_name_map.length)
					{
						var key = attr_name_map[attr_type];
						var at_val = getAttribute(data.slice(index, index + len), attr_type);
						if(key === 'flags') at_val = getFlags(at_val);

						ret[key] = at_val;
						// console.log('added [' + key + '] = ' + ret[key])

						// get to next attribute padding to mod 4
				        var pad =  ((len + 3) & 0xFFFFFFFFFC) - len;
				        // console.log("pad: " + pad);
						index += (len + pad);
					}
				};

				return ret;
			},

			/*
			*
			*
			* sample attr: { type: "table", params: { name: "filter" }}
			*      	or:    { type: "chain", params: { type: "filter", hook: "input", priority: 0 }}
			*/
			addNfAttribute: function(bufs, attr, cb) {
				console.log("addNfAttribute");
				//console.log('attrType = ' + nf.attrType(attr));
				console.dir(attr);

				// validate attr type as a string
				if(nf.attrType(attr) !== 'object') {
					return cb(new Error("attribute is not of type object"),null);
				}

				// does netfilter have that type of attribute?
				var attr_t = attr['type'];
				//console.log('attr_t = ' + attr_t);
				if(attr_t === 'undefined' || !nf.attrs.hasOwnProperty(attr_t)) {
					return cb(new Error("netfilter attribute type '" + attr_t + "' not defined"),null);
				}

				// aquire the types attribute object
				var attr_subtype = nf.attrs[attr_t];

				// get and validate the params object
				var params = attr['params'];
				if(typeof(params) !== 'undefined') {
					if(nf.attrType(params) !== 'object') {
						return cb(new Error("invalid params specification"));
					}

					// loop through all fields in the params object
					for(var attribute_name in params) {

						// look for the paramter in the subtype
						var subtype_param_name = "NFT_" + attr_t.toUpperCase() + "_ATTR_"
							+ attribute_name.toUpperCase();
						if(!attr_subtype.hasOwnProperty(subtype_param_name)) {
							return cb(new Error("netfilter " + attr_t + " attribute '" + attribute_name + "' not defined"),null);
						}

						console.log('attribute_name = ' + attribute_name);
						console.log('subtype_param_name = ' + subtype_param_name);
						console.dir(attr_subtype);

						// retreive the value of the subtypes attribute with the given name
						var attr_subtype_val = attr_subtype[subtype_param_name];

						// retrive the field specification string for that attribute subtype
						var attr_subtype_specname = "NFT_" + attr_t.toUpperCase() + "_TYPE";
						var spec = attr_subtype[attr_subtype_specname][attr_subtype_val];
						var val = params[attribute_name];

						console.log('val = ' + val);
						console.log('spec name = ' + attr_subtype_specname);
						console.log('spec = ' + spec);

						var slash = spec.indexOf('/');
						var attr_subtype_type;
						var attr_subtype_len = -1;

						console.log("slash = " + slash);
						if(slash === -1) {
							attr_subtype_type = spec;
						} else {
							attr_subtype_type = spec.slice(0, slash);
							attr_subtype_len = parseInt(spec.slice(slash + 1) / 8); // on octect per byte
						}

						console.log("attr_subtype_type = " + attr_subtype_type);
						console.log("attr_subtype_len = " + attr_subtype_len);
						if((attr_subtype_len === -1 && attr_subtype_type !== 's' )
							|| attr_subtype_len === NaN) {
							cb(new Error("attribute type or length parse error"),null);
							return;
						}

						console.log("nf.attrType(val) = " + nf.attrType(val));
						if(attr_subtype_type === 's') {
							if(nf.attrType(val) !== 'string') {
								cb(new Error("attribute type " + val + " does not match value: "
									+ val),null);
								return;
							}

							console.dir(val);

							var b;
							if(attr_subtype_len > 0) {
								if(val.length >  attr_subtype_len) {
									cb(new Error("attribute value string is longer than "
										+ attr_subtype_len),null);
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
							if(nf.attrType(attr) !== 'object') {
								return cb(new Error("attribute type " + nf.attrType(attr) +
									" does not match type: 'object'"),null);
							}

							b = Buffer(attr_subtype_len);
							switch(attr_subtype_len) {
								case 1:
									b.writeUInt8LE(val.valueOf(),0,attr_subtype_len);
									break;
								case 2:
									b.writeUInt16LE(val.valueOf(),0,attr_subtype_len);
									break;
								case 4:
									b.writeUInt32LE(val.valueOf(),0,attr_subtype_len);
									break;
								case 8:
									// TODO: verify the ordering of the 4 byte chunks
									b.writeUInt32LE(val.valueOf() << 32,0,4 );
									b.writeUInt32LE(val.valueOf(),4,attr_subtype_len);
									break;
							}

							console.dir(b);
							bufs.push(rt.buildRtattrBuf(attr_subtype_val, b));

						} else {
							return cb(new Error("attribute type " + attr + " does not match value: "
								+ val),null);
						}

					} // for all params
				} // if params

				return cb(null);
			},
		};
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

			attrs.addNfAttribute(bufs,opts,function(err) {
				if(err) {
					return cb(err);
				} else {
					nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
					return cb(null);
				}
			});
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
};

module.exports = nf;