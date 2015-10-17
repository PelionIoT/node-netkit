var nk = require('../../index.js');
var util = require('util');
var err = require('../../libs/common.js').err;


nk.link("show",null, null , function(err, links) {
	if(err) {
		console.error("** Error: " + util.inspect(err));
	} else {
		console.log(links);
	}
});
