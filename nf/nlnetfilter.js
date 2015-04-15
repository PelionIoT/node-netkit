var nf = require('../nl/nfnetlink.js')
var nl = require('../nl/netlink.js');
var util = require('util');

nlnetfilter = {

	netfilterSend: function(sock, opts, parse_attrs, cb) {
		var netkitObject = this;
		var sock = netkitObject.newNetlinkSocket();

		var sock_opts = {
				sock_class: nl.NETLINK_NETFILTER,
			};

		sock.create(sock_opts,function(err) {
			if(err) {
				return cb(new Error("socket.create() Error: " + util.inspect(err)));
			} else {

				nf.sendNetfilterCommand(opts, sock, function(err,bufs){
					if(err) {
						return cb(err);
					} else {
						return cb(null, nlnetfilter.generateNetfilterResponse(bufs,parse_attrs));
					}
				});
			}
		});
	},


	generateNetfilterResponse: function(bufs, parseAttributes) {
		var data = bufs[0];
		var total_len = data.readUInt32LE(0);
		var nfgenmsg = nf.unpackNfgenmsg(data, 16);
		var result = nl.rt.parseAttrs(data, 20, total_len, parseAttributes);
		result['genmsg'] = nfgenmsg;
		return result;
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

	get_flag: function(fla) {
		switch(fla) {
			case 'active':
				return 0;
			case 'dormant':
				return nf.flags.NFT_TABLE_F_DORMANT;
			default:
				return cb(new Error('"Unknown flag: active, dormant'));
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