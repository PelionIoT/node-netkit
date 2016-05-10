'use strict';

var util = require('util');
var cmn = require("../libs/common.js");
var fs = require("fs");
var NlAttributes = require('../nl/nlattributes.js');
var iwnl = require('../nl/iwnetlink.js');
var nl80211 = iwnl.nl80211;
var nl = iwnl.nl;
var nk = cmn.nativelib;
var transforms = require('./iwtransform.js');
var debug = cmn.logger.debug;
var error = cmn.logger.error;

var iwcommand = (function() {

	var command = function(opts, cb) {
		//console.dir(command);
		var that = this;
		opts = opts || {};

		// var opts = parser.parse(command);

		opts = build_command(opts);

		iwsend.call(that, opts, function(err,bufs){
			if(err) {
				return cb(err);
			} else {
				return cb(null, bufs);
			}
		});
	};

	var build_command = function(opts,cb) {

		//console.dir(opts);

		var cmd = opts.command.toUpperCase();
		if(typeof cmd === 'undefined') {
			throw new Error("command option must defined");
		}

		var command = cmd;
		cmd = nl80211.commands['NL80211_CMD_' + cmd];
		if(typeof cmd === 'undefined') {
			throw new Error("command option not defined as valid");
		}

		var cmd_opts = {
			command:    command,
		    cmd:        cmd,
		    version:    nl80211.CTRL_VERSION,
		    flags:      nl.NLM_F_REQUEST | nl.NLM_F_ACK | nl.NLM_F_ROOT | nl.NLM_F_MATCH,
		    type:       nl.NETLINK_GENERIC | 0x0a,

		    data:       new Buffer(0), 

		    infotype: 'wlanattr',
		    params: iwnl.nl80211_sta_info,
		};

		if(typeof opts.ifname !== 'undefined') {
			var ifindex_buf = new Buffer("0800030000000000", 'hex');
			ifindex_buf.writeUInt32LE(nk.ifNameToIndex(opts.ifname), 4);
			cmd_opts.data = ifindex_buf;
		}

	    cmd_opts.attributes =  {
	    	writeAttributes: function(bufs) {
	    		bufs.push(cmd_opts.data);
	    	}
	    };

		switch(cmd) {
			case nl80211.commands.NL80211_CMD_GET_STATION:
				break;
			case nl80211.commands.NL80211_CMD_GET_INTERFACE:
				break;
			default:
				throw new Error("command option not supported yet");
		}


		return cmd_opts;
	};

	var transform_command = function(command, obj) {
		command = command.toLowerCase();
	 	var transformer = transforms[command] || function(d) { return d; };

	 	var ret = [];
	 	for( var client = 0; client < obj.length; client++ ) {
	 		var result = transformer(obj[client]);
	 		if(result) {
				ret.push(result);
	 		}
	 	} 

	 	return ret;
	};

	var iwsend =  function(opts, cb) {

		var netkitObject = this;
		var sock = netkitObject.newNetlinkSocket();

		var sock_opts = {
				sock_class: nl.NETLINK_GENERIC,
		};

		sock.create(sock_opts,function(err) {
			if(err) {
				sock.close();
				return cb(new Error("socket.create() Error: " + util.inspect(err)));
			} else {

				var attrs = new NlAttributes(opts.infotype, opts.params, iwnl );

				iwnl.sendIwCommand(sock, opts, function(err,bufs){
					if(err) {
						sock.close();
						return cb(err);
					} else {
						sock.close();
						var retval = attrs.generateNetlinkResponse(bufs);
						retval = transform_command(opts.command, retval);
						return cb(null, retval);
					}
				});
			}
		});
	};

	return {
		command: command
	};

})();

module.exports = iwcommand;