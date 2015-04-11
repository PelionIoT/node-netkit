var nk = require('../../index.js');
var util = require('util');

nk.ipAddrLabel("add","inet6","aaaa::1/64",25,function(err,bufs){
	if(err) throw new Error("testAddrlabelAdd() Error: " + util.inspect(err));
 	test.ok(true);
    test.done();
} );

