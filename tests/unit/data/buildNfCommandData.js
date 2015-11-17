var util = require('util');
var parser = require("../../../nf/node-netfilter.js");
var fs = require('fs');

var writeDataFile = function (name, data) {
	var fd = fs.openSync('./' + name, 'w+');
	fs.writeSync(fd, JSON.stringify(data));
	fs.closeSync(fd);
}

var ret;
try {
	ret = parser.parse("add table ip filter");
	console.log(util.inspect(ret, {depth:null}));
	writeDataFile("add_table", ret);

	ret = parser.parse("add chain ip filter input { type filter hook input priority 0 }");
	console.log(util.inspect(ret, {depth:null}));
	writeDataFile("add_chain", ret);

	ret = parser.parse("add rule ip filter input tcp dport 22 saddr 192.168.56.0/23 accept");
	console.log(util.inspect(ret, {depth:null}));
	writeDataFile("add_accept", ret);

	ret = parser.parse("add rule ip filter input tcp dport 22 drop");
	console.log(util.inspect(ret, {depth:null}));
	writeDataFile("add_drop", ret);


} catch(err) {
	console.dir(err);
}
