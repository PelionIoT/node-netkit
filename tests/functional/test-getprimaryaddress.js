var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');
var err = require('../../libs/common.js').err;


setInterval(function(){

	var default_unicast = [{
	    family: 'inet',
	    src: 'default',
	    type: 'unicast',
	    table: 'main',
	    address: 'default'
	}];
	nk.getRoutes(default_unicast, function(err, bufs) {
	    if (err) {
	        console.log("netlinkAddrCommand() Error: " + util.inspect(err));
	        return cb(err);
	    } else {
	        var primaryInterface = bufs[0].ifname;
	        var inet_addr_filter = [{
	            ifname: primaryInterface,
	            family: 'inet',
	            scope: 'global'
	        }];

	        nk.getAddresses(inet_addr_filter, function(err, addrs) {
	            if (err) {
	                return console.log(util.inspect(err));
	            } else {
	                var primaryIpV4Address = addrs[0].event.address;
	                console.log("primaryIpV4Address = " + primaryIpV4Address);
	            }
	        });

	    }
	});
}, 1000);
