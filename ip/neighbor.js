
var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var ipcommand = require('../ip/ipcommand.js');
var cmn = require('../libs/common.js');

var asHexBuffer = cmn.asHexBuffer;
var dbg = cmn.dbg;
var netutils = cmn.netutils;


module.exports.neighbor = function(operation,ifname,inet4dest,lladdr,cb) {
	var netkitObject = this;
	var neigh_opts;
	var sock_opts = {};

	if(!operation || operation === 'show') {
		var getneigh_command_opts = {
			type: 	rt.RTM_GETNEIGH,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH
		};
		ipcommand.sendInquiry(netkitObject,null,getneigh_command_opts,cb);
		return;
	} else if(operation === 'add') {
		neigh_opts = {
			type: rt.RTM_NEWNEIGH, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
			family: rt.AF_INET,
			inet4dest: inet4dest,
			lladdr: lladdr,
			ifname: ifname
		}
	} else if(operation === 'change') {
		neigh_opts = {
			type: rt.RTM_NEWNEIGH, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
			family: rt.AF_INET,
			inet4dest: inet4dest,
			lladdr: lladdr,
			ifname: ifname
		}
	} else if(operation === 'replace') {
		neigh_opts = {
			type: rt.RTM_NEWNEIGH, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_REPLACE|nl.NLM_F_ACK,
			family: rt.AF_INET,
			inet4dest: inet4dest,
			lladdr: lladdr,
			ifname: ifname
		}
	} else if(operation === 'delete') {
		neigh_opts = {
			type: rt.RTM_DELNEIGH, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_ACK,
			family: rt.AF_INET,
			inet4dest: inet4dest,
			lladdr: lladdr,
			ifname: ifname
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
			console.log("Created netlink socket.");

			netlinkNeighCommand.call(netkitObject,neigh_opts, sock, function(err,bufs) {
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

module.exports.addIPv6Neighbor = function(ifname,inet6dest,lladdr,cb,sock) {
	var ifndex = this.ifNameToIndex(ifname);
	if(util.isError(ifndex)) {
		err("* Error: " + util.inspect(ifndex));
		cb(ifindex); // call w/ error
		return;
	}
	var bufs = [];

//<I(_len)H(_type)H(_flags)I(_seq)I(_pid)
	var len = 0; // updated at end
	var nl_hdr = this.nl.buildHdr();
	nl_hdr._type = rt.RTM_NEWNEIGH; // the command
	nl_hdr._flags = nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK;
	var nd_msg = rt.buildNdmsg(this.AF_INET6,ifndex,rt.NUD_PERMANENT,nl.NLM_F_REQUEST);
	nd_msg._family = this.AF_INET6;
	nd_msg._ifindex = ifndex;
	nd_msg._state = rt.NUD_PERMANENT;
	nd_msg._flags = 0;
	//var rt_msg = this.rt.buildRtmsg();

//	bufs.push(nl_hdr.pack());
	dbg("nd_msg---> " + asHexBuffer(nd_msg.pack()));
	bufs.push(nd_msg.pack());

	if(inet6dest) {
		if(typeof inet6dest === 'string') {
			var ans = this.toAddress(inet6dest,this.AF_INET6);
			if(util.isError(ans)) {
				cb(ans);
				return;
			}
			var destbuf = ans;
		} else
			var destbuf = inet6dest;
		var rt_attr = this.rt.buildRtattrBuf(this.rt.neigh_attributes.NDA_DST,destbuf.bytes);
		console.dir(destbuf);
		dbg("destbuf---> " + asHexBuffer(destbuf.bytes));
		dbg("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	} else {
		cb(new Error("bad parameters."));
		return;
	}

	if(lladdr) {
		if(typeof lladdr === 'string') {
			var macbuf = this.util.bufferifyMacString(lladdr,6); // we want 6 bytes no matter what
			if(!macbuf) {
				cb(new Error("bad lladdr"));
				return;
			}
		}
		else if(Buffer.isBuffer(macbuf))
			var macbuf = lladdr;
		else {
			cb(new Error("bad parameters."));
			return;
		}
		var rt_attr = this.rt.buildRtattrBuf(this.rt.neigh_attributes.NDA_LLADDR,macbuf);
		dbg("rt_attr lladdr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}
	var len = 0;
	for (var n=0;n<bufs.length;n++)
		len += bufs[n].length;
	console.log("nl_hdr._length = " + nl_hdr._length);
	nl_hdr._len = nl_hdr._length + len;
	bufs.unshift(nl_hdr.pack());
	var all = Buffer.concat(bufs,nl_hdr._len); // the entire message....

	dbg("Sending---> " + asHexBuffer(all));

	if(sock) {
		cb("Not implemented");
	} else {
		var sock = this.newNetlinkSocket();
		sock.create(null,function(err) {
			if(err) {
				console.log("socket.create() Error: " + util.inspect(err));
				cb(err);
				return;
			} else {
				console.log("Created netlink socket.");
			}
	            // that was exciting. Now let's close it.

	            var msgreq = sock.createMsgReq();

	            msgreq.addMsg(all);

	            sock.sendMsg(msgreq, function(err,bytes) {
	            	if(err) {
	            		console.error("** Error: " + util.inspect(err));
	            		cb(err);
	            	} else {
	            		console.log("in cb: " + util.inspect(arguments));
	            		cb();
	            	}
	            }, function(err,bufs) {
	            	console.log("in reply cb...");
	            	if(err) {
	            		console.log("** Error in reply: ");
	            		for(var n=0;n<bufs.length;n++) {
	            			console.log('here');
	            			console.dir(bufs[n]);
	            			console.log('buf len = ' + bufs[n].length);
	            			var errobj = this.nl.parseErrorHdr(bufs[n]);
	            			console.dir(this.errorFromErrno(errobj._error));
	            			console.log(util.inspect(errobj));
	            		}
	            	}
	            });


	        });

	        // that was exciting. Now let's close it.
//	        sock.close();
	    }

//    cb(ifndex); // callback with error
}

netlinkNeighCommand = function(opts,sock, cb) {

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

	// <B(_family)B(_pad1)H(_pad2)L(_ifindex)H(_state)B(_flags)B(_type)
	var nd_msg = rt.buildNdmsg();
	nd_msg._state = rt.NUD_PERMANENT;
	nd_msg._ifindex = ifndex;

	if(typeof(opts) !== 'undefined') {
		if(opts.hasOwnProperty('type')) {
			nl_hdr._type = opts['type'];
		}
		if(opts.hasOwnProperty('flags')) {
			nl_hdr._flags |= opts['flags'];
		}
		if(opts.hasOwnProperty("family")) {
			nl_hdr.family = opts['family'];
			nd_msg._family |= opts['family'];
		}
	}

	var bufs = [];

	dbg("nd_msg---> " + asHexBuffer(nd_msg.pack()));
	bufs.push(nd_msg.pack());

	// Build the rt attributes for the command
	if(opts.hasOwnProperty('inet4dest')) {
		var destbuf;
		var inet4dest = opts['inet4dest'];
		if(typeof inet4dest === 'string') {
			var ans = this.toAddress(inet4dest,this.AF_INET);
			if(util.isError(ans)) {
				cb(ans);
				return;
			}

			destbuf = ans;
		} else {
			destbuf = inet4dest;
		}

		var rt_attr = rt.buildRtattrBuf(rt.neigh_attributes.NDA_DST,destbuf.bytes);
		dbg("destbuf---> " + asHexBuffer(destbuf.bytes));
		dbg("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	if(opts.hasOwnProperty('lladdr')) {
		var lladdr = opts['lladdr'];
		if(typeof lladdr === 'string') {
			var macbuf = netutils.bufferifyMacString(lladdr,6); // we want 6 bytes no matter what
			if(!macbuf) {
				cb(new Error("bad lladdr"));
				return;
			}
		}
		else if(Buffer.isBuffer(macbuf))
			var macbuf = lladdr;
		else {
			cb(new Error("bad parameters."));
			return;
		}
		var rt_attr = rt.buildRtattrBuf(rt.neigh_attributes.NDA_LLADDR,macbuf);
		dbg("rt_attr lladdr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};
