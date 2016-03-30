var NlAttributes = require('../nl/nlattributes.js');
var nlnetfilter = require('./nlnetfilter.js');
var nlnf = require('../nl/nfnetlink.js');
var util = require('util');
var cmn = require("../libs/common.js");
var fs = require("fs");
var parser = require("./node-netfilter.js");

nfcommand = {

	command: function(command, cb) {
		//console.dir(command);
		var that = this;
		var nft = that.nf.nft;

		var opts = parser.parse(command);
		opts['sybsys'] = nlnf.NFNL_SUBSYS_NFTABLES;
		nfcommand.build_command(opts,function(err){
			//console.log(util.inspect(opts, {depth: null}));
			if(err) {
				cb(err);
			} else {

				var attrs = new NlAttributes(opts.type, opts.params, nlnf.getAttributeMap. nlnf.getCommandObject );
				nlnetfilter.netfilterSend.call(that, null, opts,
					attrs, function(err,bufs){
					if(err) {
						return cb(err);
					} else {
						return cb(null, attrs.generateNetfilterResponse(bufs));
					}
				});
			}
		});
	},

	build_command: function(opts,cb) {
		nfcommand.set_cmd(opts,cb);
		nlnetfilter.set_family(opts,cb);
		nfcommand.set_type(opts,cb);
		opts['subsys'] = nf.NFNL_SUBSYS_NFTABLES;

		return cb();
	},

	set_cmd: function(opts, cb) {

		var command = opts['command'];
		var type = opts['type'].toUpperCase();
		switch(command) {
			case "get":
				opts['cmd'] = nf['NFT_MSG_GET'+ type];
				break;
			case "add":
				opts['cmd'] =  nf['NFT_MSG_NEW' + type];
				break;
			case "insert":
				switch(type) {
					case "RULE":
						opts['cmd'] =  nf.NFT_MSG_NEWRULE;
						break;
					default:
						return cb(new Error(command + "only implemented for type rule"));
						break;
				}
				break;
			case "delete":
				opts['cmd'] =  nf['NFT_MSG_DEL' + type];
			case "flush":
				switch(type) {
					case "TABLE":
						opts['cmd'] =  nf.NFT_MSG_DELRULE;
						break;
					default:
						opts['cmd'] =  nf['NFT_MSG_DEL' + type];
						break;
				}
				break;
			case "update":
				opts['cmd'] =  nf['NFT_MSG_NEW' + type];
				break;
			case "list":
				opts['cmd'] =  nf['NFT_MSG_GET' + type];
				break;
			default:
				return cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	},

	set_type: function(opts, cb) {

		var command = opts['command'];
		var type = opts['type'];
		switch(command) {
			case "get":
				switch(type){
					case "table":
						opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "rule":
						opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					default:
						opts['type_flags'] = nl.NLM_F_ACK;
						break;
				}
				break;
			case "add":
				switch(type) {
					case "rule":
						opts['type_flags'] =  nl.NLM_F_APPEND | nl.NLM_F_CREATE |nl.NLM_F_ACK;
						break;
					default:
						opts['type_flags'] =  nl.NLM_F_ACK;
						break;
				}
				break;
			case "insert":
				switch(type) {
					case "rule":
						opts['type_flags'] =  nl.NLM_F_REQUEST | nl.NLM_F_MATCH | nl.NLM_F_ATOMIC;
						opts['batch'] = true; // up until using atomic all types containing match would not require a batch
						                      // netfilter netlink command. See: nfnetlink.sendNetfilterCommand()
						break;
					default:
						return cb(new Error(command + "only implemented for type rule"));
						break;
				}
				break;
			case "delete":
			case "flush":
				opts['type_flags'] = nl.NLM_F_ACK;
				break;
			case "update":
				opts['type_flags'] =  nl.NLM_F_ACK;
				break;
			case "list":
				switch(type){
					case "table":
						opts['type_flags'] = nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "rule":
						opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
					case "chain":
						opts['type_flags'] = nl.NLM_F_REQUEST | nl.NLM_F_ROOT | nl.NLM_F_MATCH;
						break;
				}
				break;
			default:
				return cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	},

};

module.exports = nfcommand;