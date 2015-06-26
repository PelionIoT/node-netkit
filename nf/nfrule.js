var nlnf = require('./nlnetfilter.js');

nfrule = {

	rule: function(opts, cb) {
		var that = this;

		nfrule.build_command(opts,function(err){
			if(err) {
				cb(err);
			} else {

				var attrs = nlnf.nf.Attributes("rule", opts.params);
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

	parse_rule: function(data,name) {
		var rule = {};

		rule.rule = name;
		rule.attributes = data['genmsg'];
		rule.attributes['_family'] =
		nlnf.get_family_str(data['genmsg']['_family']);
		return rule;
	},

	build_command: function(opts,cb) {

		//console.dir(opts);

		nfrule.set_cmd(opts,cb);
		nlnetfilter.set_family(opts,cb);
		nfrule.set_type(opts,cb);
		return cb();
	},

	set_cmd: function(opts, cb) {

		var command = opts['command'];
		switch(command) {
			case "get":
				opts['cmd'] = nf.NFT_MSG_GETRULE;
				break;
			case "add":
				opts['cmd'] =  nf.NFT_MSG_NEWRULE ;
				break;
			case "del":
				opts['cmd'] =  nf.NFT_MSG_DERULE;
				break;
			case "update":
				opts['cmd'] =  nf.NFT_MSG_NEWRULE
				break;
			default:
				return cb(new Error(command +
					" command not supported: get, add, del, update"));
				break;
		}
	},

	set_type: function(opts, cb) {

		var command = opts['command'];
		switch(command) {
			case "get":
				opts['type_flags'] = nl.NLM_F_ACK;
				break;
			case "add":
				opts['type_flags'] =  nl.NLM_F_APPEND | nl.NLM_F_CREATE |nl.NLM_F_ACK;
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

module.exports = nfrule;