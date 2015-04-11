var nk = require('../../index.js');
var util = require('util');

nk.fwTable(null, null, null, function(err,bufs) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
		console.dir(bufs);
	}
});
