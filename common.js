var colors = require('./libs/colors.js');

module.exports = {

	nativelib: function() {
		var nativelib = null;
		try {
			nativelib = require('./build/Release/netkit.node');
		} catch(e) {
			if(e.code == 'MODULE_NOT_FOUND')
				nativelib = require('./build/Debug/netkit.node');
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
		return require('./libs/bufferpack.js');
	}(),

	netutils: function() {
		return require('./nl/netutils.js');
	}(),

};
