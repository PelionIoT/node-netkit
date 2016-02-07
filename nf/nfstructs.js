'use-strict'

var nft = require('./nftables.js');

nfstructs = (function(){

	var get_value = function(value, size) {
		var b = new Buffer(size);
		b.fill(0);
		switch(size) {
			case 1:
				b.writeUInt8(value);
				break;
			case 2:
				b.writeUInt16BE(value);
				break;
			case 4:
				b.writeUInt32BE(value);
				break;
			// case 8:
			// 	b.writeUInt
			// 	break;
			default:
				throw new Error("Bad meta value size specified: " + size);
		}
		return "0x" + b.toString('hex');
	}



	return {

		build_meta: function(meta_key, value, value_size) {

	        return [ 
		        {
		            elem:
		            {
						name: "meta",
						data: {
							KEY: 		meta_key,
							DREG: 		nft.nft_registers.NFT_REG_1,
		                }
					}
				},
				{
		            elem:
		            {
						name: "cmp",
						data: {
							SREG: 		nft.nft_registers.NFT_REG_1,
							OP:			nft.nft_cmp_ops.NFT_CMP_EQ,
							DATA: 		{ VALUE: get_value(value, value_size) }
		                }
					}
				}
			];
		},
	}

})();

module.exports = nfstructs;
