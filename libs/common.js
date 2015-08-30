var colors = require('./colors.js');

module.exports = {

	nativelib: function() {
		var nativelib = null;
		try {
			nativelib = require('../build/Release/netkit.node');
		} catch(e) {
			if(e.code == 'MODULE_NOT_FOUND')
				nativelib = require('../build/Debug/netkit.node');
			else
				console.error("Error in nativelib [debug]: " + e + " --> " + e.stack);
		}
		return nativelib;
	}(),

	asHexBuffer: function(b) {
		return b.toString('hex');
	},

	dbg: function() {
		console.log(colors.greyFG('dbg: ') + colors.yellowFG.apply(undefined,arguments));
	},

	err: function() {
		console.log(colors.redFG('err: ') + colors.redFG.apply(undefined,arguments));
	},

	bufferpack: function() {
		return require('./bufferpack.js');
	}(),

	netutils: function() {
		return require('../nl/netutils.js');
	}(),

	isaddress: function(str) {
		var ipv6 = "(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))";
		var ipv4 = "((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])";
		if(str.match(ipv4)) return 'inet';
		else if(str.match(ipv6)) return 'inet6';
		else return (new Error("* Error: isaddress fail : " + str));
	},

	maskFromCidr: function (mask, ip) {
		var bits;
		var SIZE_BYTE = 8;
		if(ip == 'inet')
			var mbits = new Buffer(4);
		else
			var mbits = new Buffer(16);

		for (var i =0; i < mbits.length; i++) {
		    if (mask >= SIZE_BYTE) {
		        bits = Array(SIZE_BYTE+1).join(1+'');
		        mask -= SIZE_BYTE;
		    } else {
		        bits = Array(mask+1).join(1+'');
		        bits += Array(SIZE_BYTE+1-mask).join(0+'');
		        mask -= mask;
		    }
		    mbits[i] = parseInt(bits, 2);
		}

		return mbits.toString('hex');
	}
};
