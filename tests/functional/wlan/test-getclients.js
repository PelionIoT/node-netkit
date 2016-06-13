var nk = require('../../../index.js');
var util = require('util');


var opts = {
    command: "get_station",
    ifname:  "wls1",
    transform: false
};


//console.dir(opts);
nk.iw(opts, function(err,bufs) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log("success!");
        console.log(util.inspect(bufs, {depth:null}));
	}
});

