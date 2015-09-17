var nlnf = require('./nlnetfilter.js');
var util = require('util');

nfcommand = {

	command: function(opts, cb) {
		var that = this;

		nfcommand.build_command(opts,function(err){
			console.dir(opts);
			if(err) {
				cb(err);
			} else {
				var attrs = nlnf.nf.Attributes(opts.type, opts.params);
				nlnf.netfilterSend.call(that, null, opts,
					attrs, function(err,result){
					if(err) {
						return cb(err);
					} else {
						return cb(null, result);
					}
				});
			}
		});
	},

	build_command: function(opts,cb) {

		nfcommand.set_cmd(opts,cb);
		nlnetfilter.set_family(opts,cb);
		nfcommand.set_type(opts,cb);
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
			case "del":
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
			case "del":
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