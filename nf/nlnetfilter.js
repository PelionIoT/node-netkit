var nf = require('../nl/nfnetlink.js')
var nl = require('../nl/netlink.js');
var util = require('util');

nlnetfilter = {

	fwTable: function(action, family, name, cb) {
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

				var opts = {
					cmd: nf.NFT_MSG_GETTABLE,
					family: nf.NFPROTO_IPV4,
					type: nl.NLM_F_ROOT | nl.NLM_F_MATCH
				};

				var attrs = Buffer(0);
				//nf.addAttribute()

				nf.sendNetfilterCommand(opts, sock, attrs, function(err,bufs){
					if(err) {
						cb( new Error("sendNetfilterCommand() Error: " + util.inspect(err)));
					} else {
						var data = bufs[0];
						var total_len = data.readUInt32LE(0);
						console.dir(data);
						console.log('total_len = ' + total_len);
						if(total_len != data.length) {
							cb( new Error("sendNetfilterCommand() Error: buffer len = " + data.length + " != nlhdr len = " + total_len));
						}

						// (data, attr_start, total_len, attr_map)
						var nfgenmsg = nf.unpackNfgenmsg(data, 16);
						var result = nl.rt.parseAttrs(data, 20, total_len, nf.nft_table_attributes);
						result['genmsg'] = nfgenmsg;
						cb(null, result);
					}
				});
			}
		});
	},
};

module.exports = nlnetfilter;