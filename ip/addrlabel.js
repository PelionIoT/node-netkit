
var rt = require('../nl/rtnetlink.js');
var nl = require('../nl/netlink.js')
var util = require('util');
var ipparse = require('../ip/ipparse.js');
var cmn = require('../libs/common.js');
var bufferpack = require('../libs/bufferpack.js');

var asHexBuffer = cmn.asHexBuffer;
var debug = cmn.logger.debug;
var error = cmn.logger.error;
var netutils = cmn.netutils;

addrlbl_attributes = {
	IFA_ADDRESS: 1,
	IFA_LABEL: 2,
};


module.exports.addrlabel = function(operation, family, ifname, prefix, label, cb) {
	// debug("operation = " + operation);

	var netkitObject = this;
	var opts;
	var sock_opts = {};
	var filters = {};

	if(prefix) filters['address'] = prefix;
	if(label) filters['label'] = label;
	if(family) filters['family'] = family;

	// console.dir(filters);

	var sock = netkitObject.newNetlinkSocket();
	sock.create(sock_opts,function(err) {
		if(err) {
			error("socket.create() Error: " + util.inspect(err));
			cb(err);
			return;
		}
	});

	if(!operation || operation === 'list') {
		if(ifname === null){
			cb(new Error("Error: address " + operation + " ifname parameter required"));
			return;
		}
		var opts = {
			type: 	rt.RTM_GETADDRLABEL,
			flags: 	netkitObject.nl.NLM_F_REQUEST|netkitObject.nl.NLM_F_ROOT|netkitObject.nl.NLM_F_MATCH,
			family: family,
			ifname: ifname,
			label: label
		};
		ipcommand.sendInquiry(netkitObject,filters,opts,cb);
		return;
	} else if(operation === 'add') {
		if(prefix === null){
			cb(new Error("address " + operation + " prefix required"));
			return;
		}

		opts = {
			type: rt.RTM_NEWADDRLABEL, // the command
			flags: nl.NLM_F_REQUEST|nl.NLM_F_CREATE|nl.NLM_F_EXCL|nl.NLM_F_ACK,
			family: family,
			prefix: prefix,
			ifname: ifname,
			label: label
		}
	} else if(operation === 'delete') {
		if(prefix === null && label === null){
			cb(new Error("Error: address " + operation + " prefix or label parameters required"));
			return;
		}

		opts = {
			type: rt.RTM_DELADDR, // the command
			flags: nl.NLM_F_REQUEST,
			family: family,
			prefix: prefix,
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
			family: family,
			ifname: ifname,
			label: null
		};

		ipcommand.sendInquiry(netkitObject,filters,getaddr_command_opts,function(err, bufs){
			if(err) {
				error("* Error" + util.inspect(err));
				cb(err);
				return;
			} else {
				//debug("bufs --> ");
				//console.dir(bufs);

				var keep_going = true;
				for(var i = 0; i < bufs.length && keep_going; i++) {

					opts.prefix = bufs[i]['event']['address'];

					//debug("bufs.length = " + bufs.length + " i = " + i);
					//console.dir(opts);
					netlinkAddrLabelCommand.call(netkitObject,opts, sock, function(err,bufs) {
						if(err) {
							//error("err: " + util.inspect(err));
						} else {
							//cb(null,bufs);
							//return;
						}
					});
				}
				sock.close();
				cb(null);
				return;
			}
		});


	} else {
		console.error("event type = '" + operation + "'' : Not supported");
		return;
	}

	if(operation !== 'flush') {
		netlinkAddrLabelCommand.call(netkitObject,opts, sock, function(err,bufs) {
			if(err) {
				cb(err);
				return;
			} else {
				//debug("bufs--->");
				//console.dir(bufs);
				cb(null,bufs);
				return;
			}
			sock.close();
		});
	}
};

netlinkAddrLabelCommand = function(opts, sock, cb) {
	//console.dir(opts);

	var ifndex;
	if(opts.hasOwnProperty('ifname')) {
		ifndex = this.ifNameToIndex(opts['ifname']);
		if(util.isError(ifndex)) {
			error("* Error: " + util.inspect(ifndex));
			cb(ifndex); // call w/ error
			return;
		}
	}

	//debug('ifndex = ' + ifndex);

	var nl_hdr = nl.buildHdr();

	// command defaults
	nl_hdr._flags = nl.NLM_F_REQUEST;
	nl_hdr._type = rt.RTM_GETLINK; // the command

	// The info message command
	//<B(_family)B(_prefix_len)B(_flags)B(_scope)I(_index)
	var family = this.AF_UNSPEC;
	var addrlabl_msg = buildIfAddrlblMsg();
	addrlabl_msg._index = ifndex;

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
				addrlabl_msg._family |= fam;
				family = fam;
			}
		}
	}
	var bufs = [];

	// Build the rt attributes for the command
	if(opts.hasOwnProperty('prefix') && opts['prefix'] !== null) {
		var prefix = opts['prefix'];
		var destbuf;
		if(typeof prefix === 'string') {
			var f = cmn.isaddress(prefix)
			if(util.isError(f)) {
				error("* Error: " + util.inspect(f));
				cb(ans);
				return;
			}
			family = (f === 'inet6') ? this.AF_INET6 : this.AF_INET;

			var ans = this.toAddress(prefix, family);
			if(util.isError(ans)) {
				error("* Error: " + util.inspect(ans));
				cb(ans);
				return;
			}
			destbuf = ans;
			addrlabl_msg._prefix = ans['mask'] ? ans['mask'] : 0;
		} else {
			cb(new Error("Error: netlinkAddrCommand() ip address is not a string"))
		}

		debug("addrlabl_msg---> " + asHexBuffer(addrlabl_msg.pack()));
		bufs.push(addrlabl_msg.pack());

		if(opts.hasOwnProperty('label')) {
			var label = opts['label'];
			if(label) {
				var rt_attr = rt.buildRtattrBuf(addrlbl_attributes.IFA_LABEL, Buffer(label));
				debug("rt_attr label---> " + asHexBuffer(rt_attr));
				bufs.push(rt_attr);
			}
		}

		var rt_attr = rt.buildRtattrBuf(addrlbl_attributes.IFA_ADDRESS,destbuf.bytes);
		debug("destbuf---> " + asHexBuffer(destbuf.bytes));
		debug("rt_attr---> " + asHexBuffer(rt_attr));
		bufs.push(rt_attr);
	}

	nl.sendNetlinkCommand(sock,nl_hdr,bufs,cb);
};

buildIfAddrlblMsg = function(params) {

	// struct ifaddrlblmsg {
	// 	__u8		ifal_family;		/* Address family */
	// 	__u8		__ifal_reserved;	/* Reserved */
	// 	__u8		ifal_prefixlen;		 Prefix length
	// 	__u8		ifal_flags;		/* Flags */
	// 	__u32		ifal_index;		/* Link index */
	// 	__u32		ifal_seq;		/* sequence number */
	// };
	var ifaddrlblmsg_fmt = "<B(_family)B(_reserved)B(_prefix_len)B(_flags)B(_index)I(_sequence)";

	//<B(_family)B(_reserved)B(_prefix_len)B(_flags)B(_index)I(_sequence)
	var o = bufferpack.metaObject(ifaddrlblmsg_fmt);
	o._family = 0;
	o._reserved = 0;
	o._prefix_len = 0;
	o._flags = 0;
	o._index = 0;
	o._sequence = 0;
	return o;
};
