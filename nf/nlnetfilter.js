var nf = nfnetlink = require('../nl/nfnetlink.js')
var nl = require('../nl/netlink.js');
var util = require('util');

nlnetfilter = {

	nf: nfnetlink,

	netfilterSend: function(sock, opts, attrs, cb) {
		var netkitObject = this;
		var sock = netkitObject.newNetlinkSocket();

		var sock_opts = {
				sock_class: nl.NETLINK_NETFILTER,
			};

		sock.create(sock_opts,function(err) {
			if(err) {
				return cb(new Error("socket.create() Error: " + util.inspect(err)));
			} else {

				nf.sendNetfilterCommand(opts, sock, attrs, function(err,bufs){
					if(err) {
						return cb(err);
					} else {
						return cb(null, nlnetfilter.generateNetfilterResponse(bufs,attrs));
					}
				});
			}
		});
	},

	generateNetfilterResponse: function(bufs, attrs) {
		 // console.dir(bufs);

		var result_array = []; // array if this is a multipart message

		// parse all response messages
		for(var i = 0; i < bufs.length; i++) {
			var data = bufs[i];

			// is this the done message of a multi-part message?
			var type = data.readUInt16LE(4);
			if(type === nl.NLMSG_DONE) {
				return result_array;
			} else if(type === nl.NLMSG_ERROR) {
				return {};
			}

			// get the generic netfiler generation
			var nfgenmsg = nf.unpackNfgenmsg(data, 16);

			// get the total message length and parse all the raw attributes
			var total_len = data.readUInt32LE(0);
			var cur_result = attrs.parseNfAttrs(data, 20, total_len);
			cur_result['genmsg'] = nfgenmsg;

			// get the message flags
			var flags = data.readUInt16LE(6);
			if(flags & nl.NLM_F_MULTI) {
				// mutlipart message add to array result
				result_array[i] = cur_result;
			} else {
				// just one response message so return it
				return cur_result;
			}
		}
		return result_array;
	},

	set_family: function(opts,cb) {
		var fam = opts['family'];

		switch(fam) {
			case 'ip':
				opts['family'] = nf.family.NFPROTO_IPV4;
				break;
			case 'ip6':
				opts['family'] =  nf.family.NFPROTO_IPV6;
				break;
			case 'bridge':
				opts['family'] =  nf.family.NFPROTO_BRIDGE;
				break;
			case 'arp':
				opts['family'] =  nf.family.NFPROTO_ARP;
				break;
			case 'unspec':
				opts['family'] = nf.family.NFPROTO_UNSPECL;
				break;
			default:
				return cb(new Error('"Unknown family: ip, ip6, bridge, arp, unspec'));
				break;
		}
	},

	get_family_str: function(family) {
		for(var index in nf.family) {
		    var attr = nf.family[index];
		    if(family === attr) {
		    	return index;
		    }
		}
	}

};

module.exports = nlnetfilter;