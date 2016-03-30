var util = require('util');
var cmn = require("../libs/common.js");
var fs = require("fs");
var iwnl = require('../nl/iwnetlink.js');
var nl = iwnl.nl;


iwcommand = {

	device_type: {
		"NL80211_STA",
		"NL80211_LINK"
	}


	iwsend: function(opts, cb) {

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

				iwnl.sendIwCommand(sock, opts, function(err,bufs){
					if(err) {
						sock.close();
						return cb(err);
					} else {
						sock.close();
						return cb(null, bufs);
					}
				});
			}
		});
	},

	command: function(opts, cb) {
		//console.dir(command);
		var that = this;
		opts = opts || {};

		// var opts = parser.parse(command);
		iwcommand.build_command(opts);

		iwcommand.iwsend.call(that, opts, function(err,bufs){
			if(err) {
				return cb(err);
			} else {
				return cb(null, bufs);
			}
		});
	},

	build_command: function(opts,cb) {


	    opts.attributes =  {
	    	writeAttributes: function(bufs) {
	    		bufs.push(opts.data);
	    	}
	    };
	},


	// set_cmd: function(opts, cb) {

	// 	var command = opts['command'];
	// 	var type = opts['type'].toUpperCase();
	// 	switch(command) {
	// 		case "link":
	// 			opts['cmd'] = nl.NLMSG_MIN_TYPE;
	// 			opts['verison'] = NLMSG_MIN_TYPE;
	// 			break;
	// 		default:
	// 			return cb(new Error(command +
	// 				" command not supported: get, add, del, update"));
	// 			break;
	// 	}
	// },

	// set_type: function(opts, cb) {

	// 	var command = opts['command'];
	// 	var type = opts['type'];
	// 	switch(command) {
	// 		case "link":
	// 			switch(type){
	// 				default:
	// 					opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ACK;
	// 					break;
	// 			}
	// 			break;
	// 		default:
	// 			return cb(new Error(command +
	// 				" command not supported: get, add, del, update"));
	// 			break;
	// 	}
	// },

};

module.exports = iwcommand;