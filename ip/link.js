
var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');
var linktypes = require('./linktypes.js');
var NlAttributes = require('../nl/nlattributes.js');

var asHexBuffer = cmn.asHexBuffer;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var netutils = cmn.netutils;

module.exports.link = function(opts, cb) {
	var netkitObject = this;
	var sock_opts = {};
	var family;

	if(typeof opts !== 'object') {
		throw new Error("opttions parameter has to be an object");
	}

	if(!opts.operation || opts.operation === 'show') {
		opts.type = 	rt.RTM_GETLINK;
		opts.flags = 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH;
		//return ipcommand.sendInquiry(netkitObject,null,opts,cb);
	} else if(opts.operation === 'up') {
		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;
		opts.ifname = ifname;
		opts.info_flags = 0x01; // up
		opts.info_change = 0x01;
	} else if(opts.operation === 'down') {
		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;
		opts.ifname = ifname;
		opts.info_flags = 0x00;  // down
		opts.info_change = 0x01;
	} else if(opts.operation === 'set') {
		if(attrs === null || typeof attrs !== 'object') {
			return cb(new Error("set link rquires attributes object"));
		}

		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;
		opts.ifname = ifname;
		opts.attributes = attrs;
	// } else if(operation === 'add') {
	// 	link_opts = {
	// 		type: rt.RTM_NEWLINK, // the command
	// 		flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
	// 		family: family,
	// 		inetdest: inetdest,
	// 		lladdr: lladdr,
	// 		ifname: ifname
	// 	}
	// } else if(operation === 'delete') {
	// 	link_opts = {
	// 		type: rt.RTM_DELLINK, // the command
	// 		flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
	// 		family: family,
	// 		inetdest: inetdest,
	// 		lladdr: lladdr,
	// 		ifname: ifname
	// 	}
	} else {
		console.error("event type = '" + opts.operation + "'' : Not supported");
		return;
	}

	var sock = netkitObject.newNetlinkSocket();
	sock.create(sock_opts,function(err) {
		if(err) {
			error("socket.create() Error: " + util.inspect(err));
			sock.close();
			return cb(err);
		} else {
			//debug("Created netlink socket.");
			var attrs = new NlAttributes("link", opts.params, rt );

			rt.sendRtCommand(sock, opts, function(err,bufs){
				if(err) {
					sock.close();
					return cb(err);
				} else {
					sock.close();
					return cb(null, attrs.generateNetlinkResponse(bufs,ipparse.packageInfoLink));
				}
			});
		}
	});
};


netlinkLinkCommand = function(opts,sock, cb) {

	var that = this;

	var nl_hdr = nl.buildHdr();

	// <B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)";
	var info_msg = rt.buildInfomsg();

	var fake = false;
	if(opts.hasOwnProperty('fake')) {
		fake = true;
	}

	if(opts.hasOwnProperty('ifname')) {
		var ifndex = this.ifNameToIndex(opts['ifname']);
		if(util.isError(ifndex)) {
			error("* Error: " + util.inspect(ifndex));
			cb(ifndex); // call w/ error
			return;
		}
		if(!fake) info_msg._if_index = ifndex;
	}

	if(typeof(opts) !== 'undefined') {
		if(opts.hasOwnProperty('type')) {
			nl_hdr._type = opts['type'];
		}
		if(opts.hasOwnProperty('flags')) {
			nl_hdr._flags = opts['flags'];
		}

		if(opts.hasOwnProperty('info_flags')) {
			if(!fake) info_msg._if_flags |= opts['info_flags'];
		}
		if(opts.hasOwnProperty('info_change')) {
			if(!fake) info_msg._if_change = opts['info_change'];
		}

	}

	var bufs = [];

	debug("info_msg---> " + asHexBuffer(info_msg.pack()));
	bufs.push(info_msg.pack());

	if(typeof opts.attributes !== 'undefined')
	{
		try {
			var keys = Object.keys(opts.attributes);
		    keys.forEach(function(key) {
		    	if(rt.link_info_attr_name_map.indexOf(key.toLowerCase()) !== -1){
		    		var attr_num = rt.link_attributes["IFLA_" + key.toUpperCase()];
		    		var attr_val = opts.attributes[key];

		    		if(key === 'address') {
			    		if(typeof attr_val === 'string') {
							var macbuf = that.util.bufferifyMacString(attr_val,6); // we want 6 bytes no matter what
							if(!macbuf) {

								if(attr_val.length === 12) {
									macbuf = new Buffer(attr_val, 'hex');
								} else {
									throw(new Error("bad address, not a mac address: " + attr_val));
								}
							}

							debug("info_msg---> " + asHexBuffer(macbuf));
							bufs.push(rt.buildRtattrBuf(attr_num,macbuf));
						}
					} else if(key === 'linkinfo' && attr_val === 'vlan') {
							var vlan_params = opts.attributes.vlan_parameters;


							console.dir(opts);


							if(typeof vlan_params !== 'object') {
								throw(new Error("vlan_parameters must be type object"));
							}

							var link = vlan_params.link;
							if(typeof link !== 'string') {
								throw(new Error("vlan_parameters link name must be string"));
							}

							bufs.push(rt.buildRtattrBuf(linktypes.link_attributes.IFLA_IFNAME,
								new Buffer(link)) );

							var vlan_nest = [];

							vlan_nest.push(rt.buildRtattrBuf(linktypes.info_types.IFLA_INFO_KIND,
								new Buffer("vlan")) );

							var vlanid = vlan_params.id;
							if(typeof vlanid !== 'number'){
								throw(new Error("vlan_parameters id name must be a number"));
							}

							var vlanid_buf = new Buffer(2);
							vlanid_buf.writeUInt16LE(vlanid, 0);
							vlan_nest.push(rt.buildRtattrBuf(linktypes.vlan_attributes.IFLA_VLAN_ID, vlanid_buf) );

							var vlan_nest_buf = new Buffer.concat(vlan_nest);

							vlan_nest_buf.writeUInt16LE(vlan_nest_buf.length, 0);
							bufs.push(vlan_nest_buf);


					}
		    	} else {
		    		throw(new Error(key + " is not a link attribute"));
		    	}
		    });
		} catch(err) {
			return cb(err);
		}
	}

 	return nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};
