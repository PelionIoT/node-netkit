var nk = require('../../../index.js');
var util = require('util');

var opts = {
    command: "get_interface"
};

nk.iw(opts, function(err,bufs) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
        console.log(util.inspect(bufs, {depth:null}));
	}
});

