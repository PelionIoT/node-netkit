
var nk = require('../../index.js');
var exec  = require('child_process').exec, child;
var util = require('util');
var err = require('../../libs/common.js').err;

var test = {


	getDefaultRoute: function(cb) {
	    var default_unicast = [{
	        family: 'inet',
	        src: 'default',
	        type: 'unicast',
	        table: 'main',
	        address: 'default'
	    }];
	    nk.getRoutes(default_unicast, function(err, bufs) {
	        if (err) {
	            log.error("netlinkAddrCommand() Error: " + util.inspect(err));
	            return cb(err);
	        } else {
	            if (bufs.length === 0) {
	                cb(new Error("no default route found."));
	            } else if (bufs.length > 1) {
	                cb(new Error("more than one default route found in: " + util.inspect(bufs)));
	            } else {
	                return cb(null, bufs);
	            }
	        }
	    });
	},


	getPrimaryIpV4Address: function() {
	    test.getDefaultRoute(function(err, bufs) {

	        if (err) {
	            console.error(util.inspect(err));
	            return undefined;
	        } else {

	            // the only route in the system
	            var primaryInterface = bufs[0].ifname;

	            var inet_addr_filter = [{
	                ifname: primaryInterface,
	                family: 'inet',
	                scope: 'global'
	            }];
	            nk.getAddresses(inet_addr_filter, function(err, addrs) {
	                if (err) {
	                    return console.error(util.inspect(err));
	                } else {
	                    var primaryIpV4Address = addrs[0].event.address;
	                    console.log("primaryIpV4Address = " + primaryIpV4Address);
	                    return primaryIpV4Address;
	                }
	            });
	        }
	    });
	}

}

nk.onNetworkChange("eth2", "link", function (data) {
	console.log("changed...");
	console.dir(data);
});


setInterval(function(){
	test.getPrimaryIpV4Address();
}, 200);

