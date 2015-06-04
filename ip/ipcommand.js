var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var cmn = require('../libs/common.js');

var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;
var netutils = cmn.netutils;

var ipcommand = {

	getRoutes: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		} else {
			filters['table'] = 'main';
		}

		var netkitObject = this;
		var getroute_command_opts = {
			type: 	rt.RTM_GETROUTE,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		ipcommand.sendInquiry(netkitObject,filters,getroute_command_opts,cb);
	},

	getAddresses: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var netkitObject = this;
		var getaddr_command_opts = {
			type: 	rt.RTM_GETADDR,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		ipcommand.sendInquiry(netkitObject,filters,getaddr_command_opts,cb);
	},

	getLinks: function(filter_spec,cb) {
		var filters = {};
		if(filter_spec !== null){
			filters = filter_spec;
		}

		var netkitObject = this;
		ipcommand.sendInquiry(netkitObject,filters,null,cb);
	},


	sendInquiry: function(nkObject,filters,command,cb) {
		var sock = nkObject.newNetlinkSocket();
		var sock_opts = {};
		sock.create(sock_opts,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				sock.close();
				return cb(err);
			} else {
				//console.log("Created netlink socket.");

				var getlink_command_opts = {
					type: 	rt.RTM_GETLINK, // get link
					flags: 	nkObject.nl.NLM_F_REQUEST|nkObject.nl.NLM_F_ROOT|nkObject.nl.NLM_F_MATCH
				};

				ipcommand.netlinkInfoCommand.call(nkObject,getlink_command_opts, sock, function(err,bufs) {
					if(err) {
						console.error("** Error: " + util.inspect(err));
						sock.close();
						return cb(err);
					} else {
						// get the attributes of all the links first for later reference
						var links = [];
						for(var i = 0; i < bufs.length; i++) {
							var l = rt.parseRtattributes(bufs[i]);
							links[i] = l;
							//console.dir(l);
						}

						if(!command) {
							var ldata = [];
							for(var l = 0; l < links.length; l++) {
								var link = ipparse.parseAttributes(filters,null,bufs[l]);
								if(typeof(link) !== 'undefined') {
									ldata.push(link);
								}
							}
							sock.close();
							return cb(null, ldata);
						} else {
							ipcommand.netlinkInfoCommand.call(nkObject, command, sock, function(err,c_bufs) {
								if(err) {
									console.error("** Error: " + util.inspect(err));
									sock.close();
									return cb(err);
								} else {
									var cdata = [];
									for(var n = 0; n < c_bufs.length; n++) {
										var cObject = ipparse.parseAttributes(filters,links,c_bufs[n]);
										if(typeof(cObject) !== 'undefined') {
											cdata.push(cObject);
										}
									}
									//console.log("cdata ---> ");
									//console.dir(cdata);
									sock.close();
									return cb(null, cdata);
								}
							});
						}
					}
				});
			}
		 });
		//sock.close();
	},

	netlinkInfoCommand: function(opts, sock, cb) {
		if(opts.hasOwnProperty('ifname')) {
			var ifndex = this.ifNameToIndex(opts['ifname']);
			if(util.isError(ifndex)) {
				err("* Error: " + util.inspect(ifndex));
				cb(ifndex); // call w/ error
				return;
			}
		}

		var nl_hdr = nl.buildHdr();

		// command defaults
		nl_hdr._flags = nl.NLM_F_REQUEST;
		nl_hdr._type = rt.RTM_GETLINK; // the command

		// The info message command
		//<B(_family)B(_if_pad)H(_if_type)i(_if_index)I(_if_flags)I(_if_change)
		var info_msg = rt.buildInfomsg();

		if(typeof(opts) !== 'undefined') {
			if(opts.hasOwnProperty('type')) {
				nl_hdr._type = opts['type'];
			}
			if(opts.hasOwnProperty('flags')) {
				nl_hdr._flags |= opts['flags'];
			}
			if(opts.hasOwnProperty("family")) {
				nl_hdr.family = opts['family'];
				info_msg._family |= opts['family'];
			}

		}

		var bufs = [];

		dbg("info_msg---> " + asHexBuffer(info_msg.pack()));
		bufs.push(info_msg.pack());

	 	var attr_data = Buffer(4);
	 	attr_data.writeUInt32LE(rt.RTEXT_FILTER_VF, 0);
		var rt_attr = rt.buildRtattrBuf(rt.IFLA_EXT_MASK, attr_data);
		dbg("rt_attr---> "  + asHexBuffer(rt_attr));
		bufs.push(rt_attr);

		nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
	},

};

module.exports = ipcommand;