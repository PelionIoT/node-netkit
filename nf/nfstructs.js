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
				b.writeUInt16LE(value);
				break;
			case 4:
				b.writeUInt32LE(value);
				break;
			// case 8:
			// 	b.writeUInt
			// 	break;
			default:
				throw new Error("Bad meta value size specified: " + size);
		}
		return "0x" + b.toString('hex');
	}

	var get_number_value_be = function(value, size) {
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


	var meta_int = function(meta_key, value, value_size, set) {
		if(typeof set === 'undefined') {
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
		} else {
			// return a meta set expression
	        return [
		        {
		            elem:
		            {
						name: "immediate",
						data: {
							DREG: 		nft.nft_registers.NFT_REG_1,
							DATA: 		{ VALUE: get_number_value(value, value_size) }
		                }
					}
				},
				{
		            elem:
		            {
						name: "meta",
						data: {
							KEY: 		meta_key,
							SREG: 		nft.nft_registers.NFT_REG_1,
		                }
					}
				}

			];
		}
	}

	var meta_string = function(meta_key, value, value_size, set) {

		if(typeof set === 'undefined') {
			// just return a meta match expression
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
		} else {
			// return a meta set expression
	        return [
		        {
		            elem:
		            {
						name: "immediate",
						data: {
							DREG: 		nft.nft_registers.NFT_REG_1,
							DATA: 		{ VALUE: get_string_value(value, value_size) }
		                }
					}
				},
				{
		            elem:
		            {
						name: "meta",
						data: {
							KEY: 		meta_key,
							SREG: 		nft.nft_registers.NFT_REG_1,
		                }
					}
				}

			];
		}
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

	var nat_expression = function(type, address, port, family) {

		var ret = [];

		ret.push({
	            elem:
	            {
					name: "immediate",
					data: {
						DREG: 	nft.nft_registers.NFT_REG_1,
						DATA: {
							VALUE: '0x' + address
						}		
	                }
				}
			});

		if(port !== null) {
			ret.push(
				{
		            elem:
		            {
						name: "immediate",
						data: {
							DREG: 	nft.nft_registers.NFT_REG_2,
							DATA: {
								VALUE: get_number_value_be(port,2)
							}		
		                }
					}
				});
			ret.push({
				elem:
				{
					name: "nat",
					data: {
						TYPE:       (type === 'snat' ? 0 : 1),
						FAMILY: 	(family === 'ip' ? 2 : 6),
						REGADDRMIN: nft.nft_registers.NFT_REG_1,
						REGPROTOMIN: nft.nft_registers.NFT_REG_2
	                }
	            }
	        });
		} else {
					ret.push({
			elem:
			{
				name: "nat",
				data: {
					TYPE:       (type === 'snat' ? 0 : 1),
					FAMILY: 	(family === 'ip' ? 2 : 6),
					REGADDRMIN: 1
                }
            }
        });

		}


      	return ret;
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

	var mac_payload = function(mac) {

		return [
			{
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_LL_HEADER,
						OFFSET: 	nft.llhdr_offsets.saddr,
						LEN: 		nft.llhdr_sizes.saddr
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
						DATA: 		{ VALUE: "0x" + mac } //nft.ip_proto.IPPROTO_TCP
		            }
				}
			}
		];

	}

	var protocol_ip6 = function(prot) {
		return [
			{
				elem:
				{
					name: "payload",
					data: {
						DREG: 		nft.nft_registers.NFT_REG_1,
						BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
						OFFSET: 	nft.ipv6hdr_offsets.nexthdr,
						LEN: 		nft.ipv6hdr_sizes.nexthdr
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


	var icmp6_type = function(type) {
		return {
			elem:
			{
				name: "cmp",
				data: {
					SREG: 		nft.nft_registers.NFT_REG_1,
					OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
					DATA: 		{ VALUE: get_number_value(type, 1) } // 0x0016 = 22 - ssh protocol
				}
			}
		};
	}

	return {

		build_meta_integer: meta_int,
		build_meta_string: meta_string,
		build_protocol: protocol,
		build_packet_selector: packet_selector,
		build_nat_expression: nat_expression,
		build_mac_payload: mac_payload,
		build_icmp6_type: icmp6_type,
		build_protocol_ip6: protocol_ip6
	}

})();

module.exports = nfstructs;
