var nk = require('../../index.js');
var util = require('util');

nk.ipAddrLabel("add","inet6","enp0s8", "aaaa::a/64", 25, function(err,bufs){
	if(err) console.log(util.inspect(err));
} );

