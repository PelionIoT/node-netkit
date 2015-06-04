var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');
var nft = require('./nftables.js');

var rt = nl.rt;
var bufferpack = cmn.bufferpack;
var dbg = cmn.dbg;


var Attribute = function(spec, value) {
    this.buffer = this.setBuffer(spec, value);
    this.isNestHdr = false;
	this.AttributeType = -1;
};

Attribute.prototype.incrementNestLength = function(size) {
	//if(!this.isNestHdr) throw Error("not a nest header attribute");
	var len = this.buffer.readUInt16LE(0);
	this.buffer.writeUInt16LE(size + len, 0 );
};


Attribute.prototype.getSize = function() {
	var len = this.buffer.readUInt16LE(0);
	return len;
};

Attribute.prototype.getBuffer = function(spec, value) {
	return this.buffer;
};

Attribute.prototype.setBuffer = function(spec, value) {
	var buf = null;
	console.dir(spec);
	if(spec.type === 's'){
		buf = this.getStringBuffer(spec, value);
	} else if(spec.type === 'n') {
		buf = this.getNumberBuffer(spec, value);
	} else if(spec.type === 'r') {
		buf = this.getNestedBuf(spec,value);
		this.isNestHdr = true;
	}
	return buf;
};

Attribute.prototype.getStringBuffer = function(spec, value) {
	var buf = Buffer(value + '\0');
	var full_attribute = rt.buildRtattrBuf(spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getNumberBuffer = function(spec, value) {
	var len = spec.size / 8;
	var buf = Buffer(len);
	switch(len) {
		case 1:
			buf.writeUInt8BE(value.valueOf(),0,len);
			break;
		case 2:
			buf.writeUInt16BE(value.valueOf(),0,len);
			break;
		case 4:
			buf.writeUInt32BE(value.valueOf(),0,len);
			break;
		case 8:
			// TODO: verify the ordering of the 4 byte chunks
			buf.writeUInt32BE(value.valueOf() << 32,0,4 );
			buf.writeUInt32BE(value.valueOf(),4,len);
			break;
	}
	var full_attribute = rt.buildRtattrBuf(spec.typeval, buf);
	return full_attribute;
};

Attribute.prototype.getNestedBuf = function(spec, value) {
	var buf = Buffer([0,0,0,0]);
	buf.writeUInt16LE(4, 0);
	buf.writeUInt16LE(nf.flags.NLA_F_NESTED | spec.typeval, 2 );
	return buf;
};


var nfAttributes = function(command_type, parameters) {
	this.that = this;
	this.command_type = null;
	this.attribute_array = [];

	// The object that has the attribute defines
	this.command_object = this.getCommandObject(command_type);

	// The command line attribute object passed in
	this.parameters = parameters;

	// Get the array of Attribute objects
	this.parseNfAttrs(this.parameters, this.command_object);
};

nfAttributes.prototype.updateNestHdrLen = function(a, nstart) {
	for(var i = nstart; i < this.attribute_array.length; i++) {
		a.incrementNestLength(this.attribute_array[i].getSize());
	}
};

nfAttributes.prototype.getKeyValue = function(attrObject, key) {
	// retrive the field specification string for that attribute subtype
	var key_name = "NFTA_" + this.command_type.toUpperCase() + "_" + key.toUpperCase();
	var key_value = attrObject[key_name];
	if(typeof key_value === 'undefined'){
		throw Error("key " + key_name +
			" does not exist in command object for type " + this.command_type);
	}
	return key_value;
};


nfAttributes.prototype.getSpec = function(attrObject,key){
	// retrive the field specification string for that attribute subtype
	var attr_subtype_specname = "NFTA_" + this.command_type.toUpperCase() + "_SPEC";
	var spec_array = attrObject[attr_subtype_specname];
	if(typeof this.command_object === 'undefined'){
		throw Error("command type " + type + " does not exist");
	}

	var siz = -1;
	var typ = null;

	var keyval = this.getKeyValue(attrObject, key);
	var spec = spec_array[keyval];
	var sl = spec.indexOf('/');
	if(sl > -1){
		typ = spec.slice(0,sl);
		siz = spec.slice(sl+1);
	} else {
		typ = spec;
	}

	return { typeval: keyval, type: typ, size: siz };
};

nfAttributes.prototype.getCommandObject = function(type){
	var command_object = nft['nft_' + type + '_attributes'];
	if(typeof command_object === 'undefined'){
		throw Error("command type " + type + " does not exist");
	}
	this.command_type = type;
	return command_object;
};

nfAttributes.prototype.parseNfAttrs = function(params, attrs) {
    var that = this;
    var keys = Object.keys(params);
	keys.forEach(function(key) {

		// get the keyvalue and use that to get the spec
		var spec = that.getSpec(attrs, key);
		var val = params[key];

		dbg("typeval = " + spec.typeval + " type = " + spec.type + " size = " + spec.size + " val = " + val);
		if(nf.attrType(val) === 'object') {
			// push a nest header attribute
			var a = new Attribute(spec,val);
			var nstart = that.attribute_array.push(a);

			// recurse over the nested params
			var nest_attrs_type = spec.size.split('_')[1];
			var nest_attrs = that.getCommandObject(nest_attrs_type);
			that.parseNfAttrs(val, nest_attrs);

			that.updateNestHdrLen(a, nstart);
		} else {
			// push a normal attribute
			var a = new Attribute(spec,val);
			that.attribute_array.push(a);
		}
	});
};



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
		//NLA_TYPE_MASK:		~(NLA_F_NESTED | NLA_F_NET_BYTEORDER),
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

	attrType: function(obj) {
	  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
	},


	Attributes: function(command_type, parameters) {
		return new nfAttributes(command_type, parameters);
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

	writeAttributes: function(bufs, attrs) {
	    var that = this;
	    var keys = Object.keys(attrs.attribute_array);
		keys.forEach(function(attr) {
			var bf = attrs.attribute_array[attr].getBuffer();
			dbg("attr ---> " + bf.toString('hex'));
			bufs.push(bf);
		});
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

			nf.writeAttributes(bufs,attrs);
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
};

module.exports = nf;