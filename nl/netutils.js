
// matches a EUI-48 or EUI-64 address. more here: http://en.wikipedia.org/wiki/MAC_address
var re_EUI = /([a-fA-F0-9]{2})\:([a-fA-F0-9]{2})\:([a-fA-F0-9]{2})\:([a-fA-F0-9]{2})\:([a-fA-F0-9]{2})\:([a-fA-F0-9]{2})(?:\:([a-fA-F0-9]{2})\:([a-fA-F0-9]{2}))?/;

module.exports = {
	bufferifyMacString: function(str,size) {
		var m = re_EUI.exec(str);

		if(!size) {
			if(m[8])
				size = 8;
			else
		        size = 6; // normally 6 bytes
	    }
		if(m && m.length > 6) { // 6 is the minimum length of a MAC
			var ret = new Buffer(size);
			for(var n=0;n<size;n++) {
				if(m[n+1])
					ret.writeUInt8(parseInt(m[n+1],16),n);
				else
					ret.writeUInt8(0,n);
			}
			return ret;
		} else {
			return null;
		}
	}

};