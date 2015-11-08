
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


module.exports.address = function(operation,family,ifname,addr,label,cb) {
	// console.log("operation = " + operation);

	var netkitObject = this;
	var opts;
	var sock_opts = {};

	var fam = rt.AF_INET
	if(family !== null){
		if(family === 'inet') { fam = rt.AF_INET; }
		else if(family === 'inet6') { fam = rt.AF_INET6; }
		else {
			cb(new Error("Error: address " + operation + " unrecognized family " + family));
			return;
		}
	} else { fam = rt.AF_UNSPEC; }

	if(ifname === null && operation !== 'show'){
		cb(new Error("Error: address " + operation + " parameter ifname is required"));
		return;
	}

	var filters = {};
	if(family) filters['family'] = family;
	if(addr) filters['address'] = addr;
	if(label) filters['label'] = label;
	if(ifname) filters['ifname'] = ifname;

	// console.dir(filters);

	var sock = netkitObject.newNetlinkSocket();
	sock.create(sock_opts,function(err) {
		if(err) {
			console.log("socket.create() Error: " + util.inspect(err));
			cb(err);
			return;
		}
	});

	if(!operation || operation === 'show') {
		if(ifname === null){
			cb(new Error("Error: address " + operation + " ifname parameter required"));
			return;
		}
		var opts = {
			type: 	rt.RTM_GETADDR,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH,
			family: fam,
			addr: addr,
			ifname: ifname,
			label: label
		};
		ipcommand.sendInquiry(netkitObject,filters,opts,cb);
		return;
	} else if(operation === 'add') {
		if(addr === null){
			cb(new Error("Error: address " + operation + " addr required"));
			return;
		}

		opts = {
			type: rt.RTM_NEWADDR, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
			family: fam,
			addr: addr,
			ifname: ifname,
			label: label
		}
	} else if(operation === 'change') {
		if(addr === null){
			cb(new Error("Error: address " + operation + " addr parameter required"));
			return;
		}

		opts = {
			type: rt.RTM_NEWADDR, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
			family: fam,
			addr: addr,
			ifname: ifname,
			label: label
		}
	} else if(operation === 'delete') {
		if(addr === null && label === null){
			cb(new Error("Error: address " + operation + " addr or label parameters required"));
			return;
		}

		opts = {
			type: rt.RTM_DELADDR, // the command
			flags: nl.NLM_F_REQUEST,
			family: fam,
			addr: addr,
			ifname: ifname,
			label: label
		}
	} else if(operation === 'flush') {

		var netkitObject = this;
		var getaddr_command_opts = {
			type: 	rt.RTM_GETADDR,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};

		opts = {
			type: rt.RTM_DELADDR, // the command
			flags: nl.NLM_F_REQUEST,
			family: fam,
			ifname: ifname,
			label: null
		};

		ipcommand.sendInquiry(netkitObject,filters,getaddr_command_opts,function(err, bufs){
	        var onComplete = function() {
				sock.close();
	            return cb(null);
    	    };

			if(err) {
				console.log("* Error" + util.inspect(err));
				sock.close()
				return cb(err);
			} else {
				 //console.log("bufs --> ");
				 //console.dir(bufs);

				var keys = Object.keys(bufs);
				var keysToGo = keys.length;

		        if (keysToGo === 0) {
		            onComplete();
		        } else {
			        keys.forEach(function(key) {

						opts.addr = bufs[key]['event']['address'];

						// console.log("bufs.length = " + bufs.length + " i = " + key);
						// console.dir(opts);

						netlinkAddrCommand.call(netkitObject,opts, sock, function(err,bufs) {
							if(err) {
								//sock.close();
								//return cb(err);
							} else {
							}
		                    if (--keysToGo === 0) {
		                        onComplete();
		                    }
						});
			        });
			    }
			}
		});
	} else {
		console.error("event type = '" + operation + "'' : Not supported");
		return;
	}

	if(operation !== 'flush') {
		netlinkAddrCommand.call(netkitObject,opts, sock, function(err,bufs) {
			if(err) {
				sock.close();
				return cb(err);
			} else {
				//console.log("bufs--->");
				//console.dir(bufs);
				sock.close();
				return cb(null,bufs);
			}
		});
	}
};

netlinkAddrCommand = function(opts, sock, cb) {
	//console.dir(opts);

	var ifndex;
	if(opts.hasOwnProperty('ifname')) {
		console.log("ifname = " + opts['ifname']);
		ifndex = this.ifNameToIndex(opts['ifname']);
		if(util.isError(ifndex)) {
			error("* Error: " + util.inspect(ifndex));
			cb(ifndex); // call w/ error
			return;
		}
	}

	//console.log('ifndex = ' + ifndex);

	var nl_hdr = nl.buildHdr();

	// command defaults
	nl_hdr._flags = nl.NLM_F_REQUEST;
	nl_hdr._type = rt.RTM_GETLINK; // the command

	// The info message command
	//<B(_family)B(_prefix_len)B(_flags)B(_scope)I(_index)
	var family = this.AF_UNSPEC;
	var addr_msg = rt.buildIfaddressmsg();
	addr_msg._index = ifndex;
	addr_msg._flags = 0x80;

	if(typeof(opts) !== 'undefined') {
		if(opts.hasOwnProperty('type')) {
			var type = opts['type'];
			if(type)
				nl_hdr._type = type;
		}
		if(opts.hasOwnProperty('flags')) {
			var flags =  opts['flags'];
			if(flags)
				nl_hdr._flags |= flags;
		}
		if(opts.hasOwnProperty("family")) {
			var fam =  opts['family'];
			if(fam) {
				addr_msg._family |= fam;
				family = fam;
			}
		}
	}
	var bufs = [];

	// Build the rt attributes for the command
	if(opts.hasOwnProperty('addr') && opts['addr'] !== null) {
		var addr = opts['addr'];
		var destbuf;
		if(typeof addr === 'string') {
			console.log("family = " + family);
			if(family === this.AF_UNSPEC) {
				var f = cmn.isaddress(addr)
				if(util.isError(f)) {
					error("* Error: " + util.inspect(f));
					cb(f);
					return;
				}
				family = (f === 'inet6') ? this.AF_INET6 : this.AF_INET;
			}

			var ans = this.toAddress(addr, family);
			if(util.isError(ans)) {
				error("* Error: " + util.inspect(ans));
				cb(ans);
				return;
			}
			destbuf = ans;
			addr_msg._prefix_len = ans['mask'] ? ans['mask'] : 0;
		} else {
			cb(new Error("Error: netlinkAddrCommand() ip address is not a string"))
		}

		debug("addr_msg---> " + asHexBuffer(addr_msg.pack()));
		bufs.push(addr_msg.pack());

		if(opts.hasOwnProperty('label')) {
			var label = opts['label'];
			if(label) {
				var rt_attr = rt.buildRtattrBuf(rt.addr_attributes.IFA_LABEL, Buffer(label));
				debug("rt_attr label---> " + asHexBuffer(rt_attr));
				bufs.push(rt_attr);
			}
		}

		var rt_attr = rt.buildRtattrBuf(rt.route_attributes.RTA_DST,destbuf.bytes);
		debug("destbuf---> " + asHexBuffer(destbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);

		rt_attr = rt.buildRtattrBuf(rt.route_attributes.RTA_SRC,destbuf.bytes);
		debug("destbuf---> " + asHexBuffer(destbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};

