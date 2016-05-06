'use strict';

var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');
var rttypes = require('./rttypes.js');
var NlAttributes = require('../nl/nlattributes.js');
var util = require('util');

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

	if(opts.hasOwnProperty('ifname')) {
		var ifndex = this.ifNameToIndex(opts.ifname);
		if(util.isError(ifndex)) {
			error("* Error: " + util.inspect(ifndex));
			return cb(ifndex); // call w/ error
		}
		opts.link = ifndex;
	}

	if(opts.hasOwnProperty('address')) {
		var addr = opts.address;
		if(typeof addr === 'string') {
			var macbuf = netkitObject.util.bufferifyMacString(addr,6); // we want 6 bytes no matter what
			if(!macbuf) {

				if(addr.length === 12) {
					macbuf = new Buffer(addr, 'hex');
				} else {
					throw(new Error("bad address, not a mac address: " + addr));
				}
			}

			opts.address = macbuf;
		}
	}


	if(!opts.operation || opts.operation === 'show') {
		opts.type = 	rt.RTM_GETLINK;
		opts.flags = 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH;
		//return ipcommand.sendInquiry(netkitObject,null,opts,cb);
	} else if(opts.operation === 'up') {
		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;
		opts.info_flags = 0x01; // up
		opts.info_change = 0x01;
	} else if(opts.operation === 'down') {
		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;
		opts.info_flags = 0x00;  // down
		opts.info_change = 0x01;
	} else if(opts.operation === 'set') {
		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_ACK;

	} else if(opts.operation === 'add') {

		opts.type = rt.RTM_NEWLINK; // the command
		opts.flags = nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK;
		opts.family = family;
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
			var attrs = new NlAttributes("link", opts.parameters, rt );

			rt.sendRtCommand(opts, sock, attrs, function(err,bufs){
				if(err) {
					sock.close();
					return cb(err);
				} else {
					sock.close();
					var result = attrs.generateNetlinkResponse(bufs, ipparse.transformInfoLinkFull, opts.filter);
					//error(util.inspect(result, {depth: null}));
					return cb(null, result);
				}
			});
		}
	});
};

