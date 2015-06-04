var nlnf = require('./nlnetfilter.js');

nfchain = {

	chain: function(opts, cb) {
		var that = this;

		nfchain.build_command(opts,function(err){
			if(err) {
				cb(err);
			} else {

				console.log("BOBBY!!!!!!");
				console.dir(opts);

				var attrs = nlnf.nf.Attributes("chain", opts.params);
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

	parse_chain: function(data,name) {
		var chain = {};

		chain.chain = name;
		chain.attributes = data['genmsg'];
		chain.attributes['_family'] =
		nlnf.get_family_str(data['genmsg']['_family']);
		return chain;
	},

	build_command: function(opts,cb) {

		//console.dir(opts);

		nfchain.set_cmd(opts,cb);
		nlnetfilter.set_family(opts,cb);
		nfchain.set_type(opts,cb);
		return cb();
	},

	set_cmd: function(opts, cb) {

		var command = opts['command'];
		console.log("command = " + command);

		switch(command) {
			case "get":
				opts['cmd'] = nf.NFT_MSG_GETCHAIN;
				break;
			case "add":
				opts['cmd'] =  nf.NFT_MSG_NEWCHAIN;
				break;
			case "del":
				opts['cmd'] =  nf.NFT_MSG_DELCHAIN;
				break;
			case "update":
				opts['cmd'] =  nf.NFT_MSG_NEWCHAIN
				break;
			default:
				return cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	},

	set_type: function(opts, cb) {

		var command = opts['command'];
		console.log("command = " + command);

		switch(command) {
			case "get":
				opts['type_flags'] = nl.NLM_F_ACK;
				break;
			case "add":
				opts['type_flags'] =  nl.NLM_F_ACK;
				break;
			case "del":
				opts['type_flags'] =  nl.NLM_F_ACK;
				break;
			case "update":
				opts['type_flags'] =  nl.NLM_F_ACK;
				break;
			default:
				return cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	},

};

module.exports = nfchain;