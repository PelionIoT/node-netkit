var nk = require('../../index.js');
var util = require('util');

nk.addNameServers("8.8.8.8", nk.AF_INET, function(err,bufs) {
	if(err) {
		console.error(util.inspect(err));
	} else {
	}
});


