var nf = nfnetlink = require('../nl/nfnetlink.js')
var nl = require('../nl/netlink.js');
var util = require('util');
var cmn = require("../libs/common.js");

nlnetfilter = {

	nf: nfnetlink,

	netfilterSend: function(sock, opts, attrs, cb) {
		var netkitObject = cmn.nativelib;
		var sock = netkitObject.newNetlinkSocket();
		var listen = (opts.command === 'monitor') ? true : false; 
		var subs = listen ? (0x1 << (nf.NFNLGRP_NFTABLES -1)) : 0;

		var sock_opts = {
				sock_class: nl.NETLINK_NETFILTER,
				subscriptions: subs
			};

		sock.create(sock_opts,function(err) {
			if(err) {
				sock.close();
				return cb(new Error("socket.create() Error: " + util.inspect(err)));
			} else {
				nf.sendNetfilterCommand(opts, sock, attrs, function(err,bufs){
					if(listen) {
						sock.onRecv(function(err,bufs){
							if(err) {
								cb(new Error("onRecv() Error: " + util.inspect(err)));
							} else {
								cb(null, bufs);
							}
						});
					} else if(err) {
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