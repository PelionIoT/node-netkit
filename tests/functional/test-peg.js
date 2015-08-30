var util = require('util');
var parser = require("../../nl/node-netfilter.js");

var ret;
try {
	//rule filter input tcp dport 22 ip saddr 192.168.56.0/23 accept
	ret = parser.parse("add rule ip filter input tcp dport 22 saddr 192.168.56.0/23 accept");
	console.log(util.inspect(ret, {depth:null}));
	ret = parser.parse("add rule ip filter input tcp dport 22 drop");
	console.log(util.inspect(ret, {depth:null}));
} catch(err) {
	console.dir(err);
}

