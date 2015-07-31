
var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');

var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;
var netutils = cmn.netutils;


module.exports.link = function(operation,ifname, attrs, cb) {
	var netkitObject = this;
	var link_opts;
	var sock_opts = {};
	var family;

	if(arguments.length < 4) {
		cb = attrs;
	}

	if(!operation || operation === 'show') {
		var getlink_command_opts = {
			type: 	rt.RTM_GETLINK,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		return ipcommand.sendInquiry(netkitObject,null,getlink_command_opts,cb);
	} else if(operation === 'up') {
		link_opts = {
			type: rt.RTM_NEWLINK, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
			ifname: ifname,
			info_flags: 0x01, // up
			info_change: 0x01
		}
	} else if(operation === 'down') {
		link_opts = {
			type: rt.RTM_NEWLINK, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
			ifname: ifname,
			info_flags: 0x00,  // down
			info_change: 0x01
		}
	} else if(operation === 'set') {
		if(attrs === null || typeof attrs !== 'object') {
			return cb(new Error("set link rquires attributes object"));
		}

		link_opts = {
			type: rt.RTM_NEWLINK, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
			ifname: ifname,
			attributes: attrs
		}
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
		console.error("event type = '" + operation + "'' : Not supported");
		return;
	}

	var sock = netkitObject.newNetlinkSocket();
	sock.create(sock_opts,function(err) {
		if(err) {
			console.log("socket.create() Error: " + util.inspect(err));
			sock.close();
			return cb(err);
		} else {
			//console.log("Created netlink socket.");

			netlinkLinkCommand.call(netkitObject,link_opts, sock, function(err,bufs) {
				if(err) {
					sock.close();
					return cb(err);
				} else {
					sock.close();
					return cb();
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
			err("* Error: " + util.inspect(ifndex));
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

	dbg("info_msg---> " + asHexBuffer(info_msg.pack()));
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

							dbg("info_msg---> " + asHexBuffer(macbuf));
							bufs.push(rt.buildRtattrBuf(attr_num,macbuf));
						}
					}
		    	} else {
		    		throw(new Error(key + " is not a link attribute"));
		    	}
		    });
		} catch(err) {
			return cb(err);
		}
	}

	nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};
