var nk = require('../../index.js');
var util = require('util');
var err = require('../../libs/common.js').err;

var opts = {
    operation: 'add',
    parameters: {
        link: nk.ifNameToIndex('enp0s8'),
        ifname: 'enp0s8.100',
        linkinfo: { kind:'vlan', infodata: { id: 100 } }
    }
};


nk.link(opts , function(err, links) {
	if(err) {
		console.error("** Error: " + util.inspect(err) + err.stack);
	} else {
		console.log(util.inspect(links,{depth:null}));
	}
});
