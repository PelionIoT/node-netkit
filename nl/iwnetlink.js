var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var util = require('util');
var nl80211 = require('../iw/nl80211.js');

/*
struct genlmsghdr {
	__u8	cmd;
	__u8	version;
	__u16	reserved;
};
*/
var generic_msg_fmt = "<B(_cmd)B(_version)H(_pad1)";


iwnl = {

	nl: nl,
	nl80211: nl80211,

	GENL_ID_CTRL: nl.NLMSG_MIN_TYPE,

	iw_types_name_map: [
		"link",
		"get_bss",
		"get_sta"
	],

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

	build_generic_msg: function(params) {
		var o = bufferpack.metaObject(generic_msg_fmt);
		o._cmd = 0;
		o._version = 0;
		o._pad1 = 0;
		return o;
	},

	addCommandMessage: function(msgreq, opts, cb) {
		iwnl.createCommandBuffer(opts, function(error, nl_hdr, bufs) {
			if(error) {
				cb(error);
			} else {
				nl.addNetlinkMessageToReq(msgreq, nl_hdr, bufs);
				cb(null);
			}
		});
	},

	sendIwCommand: function(sock, opts, cb) {

	    var msgreq = sock.createMsgReq();

	    iwnl.addCommandMessage(msgreq, opts, function(err){
	    	if(err) {
	    		return cb(err,null);
	    	} else {
				nl.sendNetlinkRequest(sock, msgreq, cb);
	    	}
	    });
	},

	createCommandBuffer: function(opts, cb) {
		var bufs = [];

		var nl_hdr = nl.buildHdr();

		var gen_hdr = iwnl.build_generic_msg();

		if(typeof(opts) !== 'undefined') {


			// if(opts.hasOwnProperty("family")) {
			// 	//debug('type=' + opts['family']);
			// 	nl_hdr._type |= opts['family'];
			// } else {
			// 	return cb(new Error("no family option specified"));
			// }
			if(opts.hasOwnProperty("cmd") && opts["cmd"] != null) {
				//debug('cmd=' + opts['cmd']);
				gen_hdr._cmd = opts['cmd'];
			} else {
				return cb(new Error("no cmd option specified"));
			}

			if(opts.hasOwnProperty("version") && opts["version"] != null) {
				//debug('version=' + opts['version']);
				gen_hdr._version = opts['version'];
			} else {
				return cb(new Error("no version option specified"));
			}

			if(opts.hasOwnProperty("type") && opts["type"] != null) {
				debug('type=' + opts['type']);
				nl_hdr._type |= opts['type'];
			} else {
				return cb(new Error("no type option specified"));
			}

			if(opts.hasOwnProperty("flags") && opts["flags"] != null) {
				debug('flags=' + opts['flags']);
				nl_hdr._flags |= opts['flags'];
			} else {
				return cb(new Error("no flags option specified"));
			}

			bufs.push(gen_hdr.pack());

			var attrs = opts.attributes;

			if(typeof(attrs) !== 'undefined') attrs.writeAttributes(bufs);

			cb(null, nl_hdr, bufs);
		} else {
			cb(new Error('Command options are undefined'));
		}
	}
};

module.exports = iwnl;