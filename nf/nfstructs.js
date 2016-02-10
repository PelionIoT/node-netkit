'use-strict'

var nft = require('./nftables.js');

nfstructs = (function(){

	var get_number_value = function(value, size) {
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

	var get_string_value = function(value, value_size) {
		var b = new Buffer(value_size);
		b.fill(0);
		b.write(value);
		return b.toString('ascii');
	}


	var meta_int = function(meta_key, value, value_size) {

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
						DATA: 		{ VALUE: get_number_value(value, value_size) }
	                }
				}
			}
		];
	}

	var meta_string = function(meta_key, value, value_size) {

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
						DATA: 		{ VALUE: get_string_value(value, value_size) }
	                }
				}
			}
		];
	}

	var packet_selector = function(pt) {

			return {
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		pt.payload_base,
						OFFSET: 	pt.offset,
						LEN: 		pt.len
	                }
	            }
	        };
	}

	var protocol = function(prot) {
		return [
			{
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
						OFFSET: 	nft.iphdr_offsets.protocol,
						LEN: 		nft.iphdr_sizes.protocol
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
						DATA: 		{ VALUE: prot } //nft.ip_proto.IPPROTO_TCP
		            }
				}
			}
		];
	}


	return {

		build_meta_integer: meta_int,
		build_meta_string: meta_string,
		build_protocol: protocol,
		build_packet_selector: packet_selector
	}

})();

module.exports = nfstructs;
