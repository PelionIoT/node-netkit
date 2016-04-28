var util = require('util');
var cmn = require("../libs/common.js");
var fs = require("fs");
var NlAttributes = require('../nl/nlattributes.js');
var iwnl = require('../nl/iwnetlink.js');
var nl = iwnl.nl;


iwcommand = {



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

				var attrs = new NlAttributes(opts.infotype, opts.params, iwnl );

				iwnl.sendIwCommand(sock, opts, function(err,bufs){
					if(err) {
						sock.close();
						return cb(err);
					} else {
						sock.close();
						return cb(null, attrs.generateNetlinkResponse(bufs));
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
};

module.exports = iwcommand;