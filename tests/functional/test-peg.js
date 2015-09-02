var util = require('util');
var parser = require("../../nl/node-netfilter.js");

var ret;
try {
	ret = parser.parse("add ip table filter");
	console.log(util.inspect(ret, {depth:null}));
	ret = parser.parse("add ip chain filter input { type filter hook input priority 0 }");
	console.log(util.inspect(ret, {depth:null}));
	ret = parser.parse("add ip rule filter input tcp dport 22 saddr 192.168.56.0/23 accept");
	console.log(util.inspect(ret, {depth:null}));
	ret = parser.parse("add ip rule filter input tcp dport 22 drop");
	console.log(util.inspect(ret, {depth:null}));
} catch(err) {
	console.dir(err);
}
