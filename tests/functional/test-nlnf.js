var nk = require('../../index.js');
var util = require('util');

// nk.nfTable({ command: "add", type: "table", family: "ip", params: { name: "filter" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);

// 		nk.nfChain({ command: "add",
// 					 type: "chain",
// 					 family: "ip",
// 					 params: { table: "filter", name: "input", hook: {hooknum: 1, priority: 0} }},
// 					 function(err,bufs) {
// 			if(err) {
// 				console.error(util.inspect(err));
// 			} else {
// 				console.log("success!");
// 				console.dir(bufs);

// 				// nk.nfChain({ command: "del",
// 				// 			 type: "chain",
// 				// 			 family: "ip",
// 				// 			 params: { table: "filter", name: "input"}},
// 				// 			 function(err,bufs) {
// 				// 	if(err) {
// 				// 		console.error(util.inspect(err));
// 				// 	} else {
// 				// 		console.log("success!");
// 				// 		console.dir(bufs);

// 				// 		nk.nfTable({ command: "del", type: "table", family: "ip", params: { name: "filter" }}, function(err,bufs) {
// 				// 			if(err) {
// 				// 				console.error(util.inspect(err));
// 				// 			} else {
// 				// 				console.log("success!");
// 				// 				console.dir(bufs);
// 				// 			}
// 				// 		});
// 				// 	}
// 				// });
// 			}
// 		});
// 	}
// });


// //nft add rule filter input tcp dport 22 ip saddr 192.168.56.0/23 accept
nk.nfRule(
	{
		command: "add", type: "rule", family: "ip",
		params: {
			table: "filter",
			chain: "input",
			expressions: [
				{
					elem:
					{
						name: "payload",
						data: {
							DREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							BASE: 		nk.nf.nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
							OFFSET: 	nk.nf.nft.iphdr_offsets.protocol,
							LEN: 		nk.nf.nft.iphdr_sizes.protocol
		                }
		            }
		        },
		        {
		            elem:
		            {
						name: "cmp",
						data: {
							SREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							OP:			nk.nf.nft.nft_cmp_ops.NFT_CMP_EQ,
							DATA: 		{ VALUE: nk.nf.nft.ip_proto.IPPROTO_TCP },
										  //VERDICT: { CODE: nk.nf.nft.nft_verdicts.NFT_CONTINUE } },
		                }
					}
				},
				{
					elem:
					{
						name: "payload",
						data: {
							DREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							BASE: 		nk.nf.nft.nft_payload_bases.NFT_PAYLOAD_TRANSPORT_HEADER,
							OFFSET: 	nk.nf.nft.tcphdr_offsets.dest,
							LEN:		nk.nf.nft.tcphdr_sizes.dest
		                }
		            }
		        },
		        {
		            elem:
		            {
						name: "cmp",
						data: {
							SREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							OP: 		nk.nf.nft.nft_cmp_ops.NFT_CMP_EQ,
							DATA: 		{ VALUE: 22 }, // 22 - ssh protocol
										  //VERDICT: { CODE: nk.nf.nft.nft_verdicts.NFT_CONTINUE } },
		                }
					}
				},
				{
					elem:
					{
						name: "payload",
						data: {
							DREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							BASE: 		nk.nf.nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
							OFFSET: 	nk.nf.nft.iphdr_offsets.saddr,
							LEN: 		nk.nf.nft.iphdr_sizes.saddr
		                }
		            }
		        },
		        {
		            elem:
		            {
						name: "bitwise",
						data: {
							SREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							DREG:		nk.nf.nft.nft_registers.NFT_REG_1,
							LEN: 		nk.nf.nft.iphdr_sizes.daddr,
							MASK: 		{ VALUE: 0xFFFFFE00 },
							XOR: 		{ VALUE: 0x00000000 }
		                }
					}
				},
		        {
		            elem:
		            {
						name: "cmp",
						data: {
							SREG: 		nk.nf.nft.nft_registers.NFT_REG_1,
							OP: 		nk.nf.nft.nft_cmp_ops.NFT_CMP_EQ,
							DATA: 		{ VALUE: 0xC0A83800, // 192.168.56.0
										  VERDICT: { CODE: nk.nf.nft.nft_verdicts.NFT_CONTINUE } },
		                }
					}
				},
		        {
		            elem:
		            {
						name: "immediate",
						data: {
							DREG: 		nk.nf.nft.nft_registers.NFT_REG_VERDICT,
							DATA: 		{ VALUE: 0x00000001 }
		                }
					}
				},
			]
		}
	}, function(err,bufs) {
		if(err) {
		console.error(util.inspect(err));
	} else {
		console.log("success!");
		console.dir(bufs);
	}
});
