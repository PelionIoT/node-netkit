var nk = require('../../index.js');
var util = require('util');
var parser = require("../../nf/node-netfilter.js");
var nft = nk.nf.nft;

/*
// Use this for testing nnf commands to show the corresponding nf attribute command object.
// The command object is returned from the pegjs parser called node-netfilter.js.
// When using the netkit library nnf command api or the nnf command line utility,
// it is this command object that is passed to the nfcommand processor to be converted to
// nfattributes and passed to the netfilter netlink interface.
//
// Some sample commands are:
//
// 		add ip table filter
// 		add ip chain filter input { type filter hook input priority 0 }
// 		add ip rule filter input tcp dport 22 saddr 192.168.56.0/23 accept
// 		add ip rule filter input tcp dport 22 drop
//
*/
var ret;
try {
	ret = parser.parse(process.argv.slice(2).join(" "));
	console.log(util.inspect(ret, {depth:null}));
} catch(err) {
	console.dir(err);
}
