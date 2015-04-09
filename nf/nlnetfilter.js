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
				cb(new Error("socket.create() Error: " + util.inspect(err)));
				return;
			} else {

				nf.sendNetfilterCommand(opts, sock, function(err,bufs){
					if(err) {
						cb(err);
						return;
					} else {
						cb(null, nlnetfilter.generateNetfilterResponse(bufs,parse_attrs));
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
	}

};

module.exports = nlnetfilter;