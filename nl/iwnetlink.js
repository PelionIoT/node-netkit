var nl = require('../nl/netlink.js');
var cmn = require('../libs/common.js');

var bufferpack = cmn.bufferpack;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var util = require('util');
var nl80211 = require('../iw/nl80211.js');
var iwtypes = require('../iw/iwtypes.js');
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
	commands: nl80211.commands,

	GENL_ID_CTRL: nl.NLMSG_MIN_TYPE,

	types_name_map: nl80211.type_name_map,


	getAttributeMap: function(type) {

		var retVal = {};

		if(iwnl.commands.NL80211_CMD_GET_STATION <= type && type <= iwnl.commands.NL80211_CMD_DEL_STATION) {
		    //debug('TABLE');
			retVal.keys = iwtypes.nl80211_sta_info
			retVal.name = 'station';
		}else {
			var msg = "WARNING: ** Received unsupported message type from netlink socket(type="
				+ type + ") **"
			error(msg);
			throw new Error(msg);
		}

		return retVal;
	},

	getCommandObject: function(type){
		var command_object = iwtypes['nl80211_' + type + '_info'];
		if(typeof command_object === 'undefined'){
			throw Error("command type " + type + " does not exist");
		}
		this.command_type = type;
		return command_object;
	},

	getNfTypeName: function(type) {
		return iwnl.types_name_map[type];
	},

	get_prefix: function() {
		return "NL80211_";
	},

	parseGenmsg: function(data) {
		// get the generic netfiler generation
		return iwnl.unpackIwgenmsg(data, 16);
	},

	getTypeFromBuffer: function(buffer) {
		return buffer.readUInt8(16);
	},


	unpackIwgenmsg: function(data, pos) {
		return bufferpack.unpack(generic_msg_fmt, data, pos);
	},

	getFlags: function(f) {
		var flags_str = "";
		for (var k in iwnl.flags){
			if(iwnl.flags.hasOwnProperty(k)){
		 		if(f === iwnl.flags[k]) {
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