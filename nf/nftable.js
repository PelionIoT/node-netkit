var nlnf = require('./nlnetfilter.js');

nftable = {

	that: null,

	nft_table_attributes:
	[
		"unspec",
		"name",
		"flags",
		"use",
	],


	table: function(action, family, name, cb) {
		console.log("action = " + action);

		that = this;

		switch(action) {
			case "get":
				nftable.get_table(action, family, name, cb);
				break;
			case "add":
				nftable.add_table(action, family, name, cb);
				break;
			default:
				return cb(new Error(action + " :operation not supported"));
				break;
		}
	},

	get_table: function(action, family, name, cb) {
		var opts = {
			cmd: nf.NFT_MSG_GETTABLE,
			family: nf.NFPROTO_IPV4,
			type: nl.NLM_F_ACK,
			attrs: [{ type: "NFT_TABLE_ATTR_NAME", value: name }]
		};

		nlnf.netfilterSend.call(that, null, opts, nftable.nft_table_attributes, function(err,result){
			if(err) {
				return cb(err);
			} else {
				cb(null, nftable.parse_table(result));
			}
		});
	},

	add_table: function(action, family, name, cb) {
		var opts = {
			cmd: nf.NFT_MSG_NEWTABLE,
			family: nf.NFPROTO_IPV4,
			type: nl.NLM_F_ACK,
			attrs: [{ type: "NFT_TABLE_ATTR_NAME", value: name }]
		};

		nlnf.netfilterSend.call(that, null, opts, nftable.nft_table_attributes, function(err,result){
			if(err) {
				return cb(err);
			} else {
				cb(null, nftable.parse_table(result));
			}
		});
	},

	parse_table: function(data) {
		return data;
	},
};

module.exports = nftable;