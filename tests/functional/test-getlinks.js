var nk = require('../../index.js');
var util = require('util');
var err = require('../../libs/common.js').err;

var opts = {
    operation: 'show'
};


nk.link(opts , function(err, links) {
	if(err) {
		console.error("** Error: " + util.inspect(err) + err.stack);
	} else {
		console.log(util.inspect(links,{depth:null}));
	}
});
