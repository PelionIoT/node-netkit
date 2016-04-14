var nk = require('../../index.js');
var util = require('util');
var err = require('../../libs/common.js').err;

var opts = {
    operation: 'add',
    parameters: {
        link: nk.ifNameToIndex('enx00e07cc8db5b'),
        ifname: 'eth0.2',
        linkinfo: {
            kind:'vlan',
            infodata: {
                id: 2,
                egressqos: [
                    {
                        qosmapping: "0x0000000003000000",
                    },
                    {
                        qosmapping: "0x0100000002000000",
                    },
                    {
                        qosmapping: "0x0200000006000000"
                    },
                ]
            }
        }
    }
};


nk.link(opts , function(err, links) {
	if(err) {
		console.error("** Error: " + util.inspect(err) + err.stack);
	} else {
		console.log(util.inspect(links,{depth:null}));
	}
});
