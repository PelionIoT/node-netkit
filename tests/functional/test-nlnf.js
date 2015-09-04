var nk = require('../../index.js');
var util = require('util');
var nft = nk.nf.nft;

// nk.nfTable({ command: "add", type: "table", family: "ip", params: { name: "filter" }}, function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {

// 		nk.nfChain({ command: "add",
// 					 type: "chain",
// 					 family: "ip",
// 					 params: { table: "filter", name: "input", hook: {hooknum: 1, priority: 0} }},
// 					 function(err,bufs) {
// 			if(err) {
// 				console.error(util.inspect(err));
// 			} else {

				//nft add rule filter input tcp dport 22 ip saddr 192.168.56.0/23 accept
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
											DATA: 		{ VALUE: "0x06" } //nft.ip_proto.IPPROTO_TCP
						                }
									}
								},
								{
									elem:
									{
										name: "payload",
										data: {
											DREG: 		nft.nft_registers.NFT_REG_1,
											BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_TRANSPORT_HEADER,
											OFFSET: 	nft.tcphdr_offsets.dest,
											LEN:		nft.tcphdr_sizes.dest
						                }
						            }
						        },
						        {
						            elem:
						            {
										name: "cmp",
										data: {
											SREG: 		nft.nft_registers.NFT_REG_1,
											OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
											DATA: 		{ VALUE: "0x0016" } // 22 - ssh protocol
						                }
									}
								},
								{
									elem:
									{
										name: "payload",
										data: {
											DREG: 		nft.nft_registers.NFT_REG_1,
											BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
											OFFSET: 	nft.iphdr_offsets.saddr,
											LEN: 		nft.iphdr_sizes.saddr
						                }
						            }
						        },
						        {
						            elem:
						            {
										name: "bitwise",
										data: {
											SREG: 		nft.nft_registers.NFT_REG_1,
											DREG:		nft.nft_registers.NFT_REG_1,
											LEN: 		nft.iphdr_sizes.daddr,
											MASK: 		{ VALUE: "0xFFFFFE00" },
											XOR: 		{ VALUE: "0x00000000" }
						                }
									}
								},
						        {
						            elem:
						            {
										name: "cmp",
										data: {
											SREG: 		nft.nft_registers.NFT_REG_1,
											OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
											DATA: 		{ VALUE: "0xC0A83800" } // 192.168.56.0
						                }
									}
								},
						        {
						            elem:
						            {
										name: "immediate",
										data: {
											DREG: 		nft.nft_registers.NFT_REG_VERDICT,
											DATA: 		{ VERDICT: { CODE: 0x00000001 } }
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


// 				//nft add rule filter input tcp dport 22 drop
// 				nk.nfRule(
// 					{
// 						command: "add", type: "rule", family: "ip",
// 						params: {
// 							table: "filter",
// 							chain: "input",
// 							expressions: [
// 								{
// 									elem:
// 									{
// 										name: "payload",
// 										data: {
// 											DREG: 		nft.nft_registers.NFT_REG_1,
// 											BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_NETWORK_HEADER,
// 											OFFSET: 	nft.iphdr_offsets.protocol,
// 											LEN: 		nft.iphdr_sizes.protocol
// 						                }
// 						            }
// 						        },
// 						        {
// 						            elem:
// 						            {
// 										name: "cmp",
// 										data: {
// 											SREG: 		nft.nft_registers.NFT_REG_1,
// 											OP:			nft.nft_cmp_ops.NFT_CMP_EQ,
// 											DATA: 		{ VALUE: "0x06" } //nft.ip_proto.IPPROTO_TCP
// 						                }
// 									}
// 								},
// 								{
// 									elem:
// 									{
// 										name: "payload",
// 										data: {
// 											DREG: 		nft.nft_registers.NFT_REG_1,
// 											BASE: 		nft.nft_payload_bases.NFT_PAYLOAD_TRANSPORT_HEADER,
// 											OFFSET: 	nft.tcphdr_offsets.dest,
// 											LEN:		nft.tcphdr_sizes.dest
// 						                }
// 						            }
// 						        },
// 						        {
// 						            elem:
// 						            {
// 										name: "cmp",
// 										data: {
// 											SREG: 		nft.nft_registers.NFT_REG_1,
// 											OP: 		nft.nft_cmp_ops.NFT_CMP_EQ,
// 											DATA: 		{ VALUE: "0x0016" } // 22 - ssh protocol
// 						                }
// 									}
// 								},
// 						        {
// 						            elem:
// 						            {
// 										name: "immediate",
// 										data: {
// 											DREG: 		nft.nft_registers.NFT_REG_VERDICT,
// 											DATA: 		{ VERDICT: { CODE: 0x00000000 } }
// 						                }
// 									}
// 								},
// 							]
// 						}
// 					}, function(err,bufs) {
// 						if(err) {
// 						console.error(util.inspect(err));
// 					} else {
// 						console.log("success!");
// 						console.dir(bufs);
// 					}
// 				});


// 			}
// 		});
// 	}
// });


// nk.nfChain({ command: "del",
// 			 type: "chain",
// 			 family: "ip",
// 			 params: { table: "filter", name: "input"}},
// 			 function(err,bufs) {
// 	if(err) {
// 		console.error(util.inspect(err));
// 	} else {
// 		console.log("success!");
// 		console.dir(bufs);

// 		nk.nfTable({ command: "del", type: "table", family: "ip", params: { name: "filter" }}, function(err,bufs) {
// 			if(err) {
// 				console.error(util.inspect(err));
// 			} else {
// 				console.log("success!");
// 				console.dir(bufs);
// 			}
// 		});
// 	}
// });

