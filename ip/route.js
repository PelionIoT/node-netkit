var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');

var asHexBuffer = cmn.asHexBuffer;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var netutils = cmn.netutils;


module.exports.route = function(operation,ifname,inetdest,inetsrc,cb) {
	var netkitObject = this;
	var route_opts;
	var sock_opts = {};
	var family;

	if(!inetdest) {
		family = rt.AF_INET | rt.AF_INET6
	} else {
		family = cmn.isaddress(inetdest);
		if (family === 'inet') {
			family = rt.AF_INET;
		} else if(family === 'inet6') {
			family = rt.AF_INET6;
		} else {
			return cb(family);
		}
	}
	// console.log("inetsrc = " + inetsrc);
	// console.log("inetdest = " + inetdest);

	if(!operation || operation === 'show') {
		var getneigh_command_opts = {
			type: 	rt.RTM_GETROUTE,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		return ipcommand.sendInquiry(netkitObject,null,getneigh_command_opts,cb);
	} else if(operation === 'add') {
		if(inetsrc === null && inetdest !== null) {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
				family: family,
				gateway: inetdest,
				ifname: ifname
			}
		} else {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
				family: family,
				inetdest: inetdest,
				inetsrc: inetsrc,
				ifname: ifname
			}
		}
	} else if(operation === 'change') {
		if(inetsrc === null && inetdest !== null) {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: family,
				gateway: inetdest,
				ifname: ifname
			}
		} else {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: family,
				inetdest: inetdest,
				inetsrc: inetsrc,
				ifname: ifname
			}
		}
	} else if(operation === 'replace') {
		if(inetsrc === null && inetdest !== null) {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: family,
				gateway: inetdest,
				ifname: ifname
			}
		} else {
			route_opts = {
				type: rt.RTM_NEWROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
				family: family,
				inetdest: inetdest,
				inetsrc: inetsrc,
				ifname: ifname
			}
		}
	} else if(operation === 'delete') {
		if(inetsrc === null && inetdest !== null) {

			route_opts = {
				type: rt.RTM_DELROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
				family: family,
				gateway: inetdest,
				ifname: ifname
			}
		} else {
			route_opts = {
				type: rt.RTM_DELROUTE, // the command
				flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
				family: family,
				inetdest: inetdest,
				inetsrc: inetsrc,
				ifname: ifname
			}
		}

	} else {
		console.error("event type = '" + operation + "'' : Not supported");
		return;
	}

	var sock = netkitObject.newNetlinkSocket();
	sock.create(sock_opts,function(err) {
		if(err) {
			console.log("socket.create() Error: " + util.inspect(err));
			cb(err);
			return;
		} else {
			//console.log("Created netlink socket.");

			netlinkRouteCommand.call(netkitObject,route_opts, sock, function(err,bufs) {
				if(err) {
					cb(err);
				} else {
					cb();
				}
				sock.close();
			});
		}
	});
};

netlinkRouteCommand = function(opts,sock, cb) {

	if(opts.hasOwnProperty('ifname')) {
		var ifndex = this.ifNameToIndex(opts['ifname']);
		if(util.isError(ifndex)) {
			error("* Error: " + util.inspect(ifndex));
			cb(ifndex); // call w/ error
			return;
		}
	}

	var nl_hdr = nl.buildHdr();

	// command defaults
	nl_hdr._flags = nl.NLM_F_REQUEST;
	nl_hdr._type = rt.RTM_GETLINK; // the command

	var rt_msg = rt.buildRtmsg();

	var family = 'inet'; // default
	if(typeof(opts) !== 'undefined') {
		if(opts.hasOwnProperty('type')) {
			nl_hdr._type = opts['type'];
		}
		if(opts.hasOwnProperty('flags')) {
			nl_hdr._flags |= opts['flags'];
		}
		if(opts.hasOwnProperty("family")) {
			var fam = opts['family'];
			nl_hdr.family = fam;
			rt_msg._family |= fam;
		}
	}

	/////// HACK!!!!!! to get add default route working
	/// need to pull these from opt object and make defines for them eventually
	// "<B(_family)B(_dst_len)B(_src_len)B(_tos)B(_table)B(_protocol)B(_scope)B(_type)I(_flags)";
	// 02          00         00         00     FE       03          00       01      80000000
	//rt_msg._family = 0;
	rt_msg._dst_len = 0;
	rt_msg._src_len = 0;
	rt_msg._tos = 0;
	rt_msg._table = 0xFE;
	rt_msg._protocol = 0x03;
	rt_msg._scope = 0;
	rt_msg._type = 01;
	rt_msg._flags = 0x80000000;

	var bufs = [];

	debug("rt_msg---> " + asHexBuffer(rt_msg.pack()));
	bufs.push(rt_msg.pack());

	// Build the rt attributes for the command
	if(opts.hasOwnProperty('inetdest')) {
		var destbuf;
		var inetdest = opts['inetdest'];
		if(typeof inetdest === 'string') {
			var ans;
			if(family === 'inet'){
				ans = this.toAddress(inetdest,this.AF_INET);
			} else {
				ans = this.toAddress(inetdest,this.AF_INET6);
			}

			if(util.isError(ans)) {
				cb(ans);
				return;
			}

			destbuf = ans;
		} else {
			destbuf = inetdest;
		}

		var rt_attr = rt.buildRtattrBuf(rt.route_attributes.RTA_DST,destbuf.bytes);
		debug("destbuf---> " + asHexBuffer(destbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	if(opts.hasOwnProperty('inetsrc')) {
		var srcbuf;
		var inetsrc = opts['inetsrc'];
		if(typeof inetsrc === 'string') {
			var ans;
			if(family === 'inet'){
				ans = this.toAddress(inetsrc,this.AF_INET);
			} else {
				ans = this.toAddress(inetsrc,this.AF_INET6);
			}

			if(util.isError(ans)) {
				cb(ans);
				return;
			}

			srcbuf = ans;
		} else {
			srcbuf = inetsrc;
		}

		var rt_attr = rt.buildRtattrBuf(rt.route_attributes.RTA_SRC,srcbuf.bytes);
		debug("srcbuf---> " + asHexBuffer(srcbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	if(opts.hasOwnProperty('gateway')) {
		var srcbuf;
		var gateway = opts['gateway'];
		if(typeof gateway === 'string') {
			var ans;
			if(family === 'inet'){
				ans = this.toAddress(gateway,this.AF_INET);
			} else {
				ans = this.toAddress(gateway,this.AF_INET6);
			}

			if(util.isError(ans)) {
				cb(ans);
				return;
			}

			srcbuf = ans;
		} else {
			srcbuf = gateway;
		}

		var rt_attr = rt.buildRtattrBuf(rt.route_attributes.RTA_GATEWAY,srcbuf.bytes);
		debug("srcbuf---> " + asHexBuffer(srcbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}
	nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};
