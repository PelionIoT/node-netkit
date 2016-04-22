var link_attributes_spec = {
     0          : '',
     1          : 'm',                  // address
     2          : 'm',                  // broadcast
     3          : 's',                  // ifname
     4          : 'n/32',               // mtu
     5          : 'n/32',               // link
     6          : 's',               // qdisc
     7          : '',                  // stats
     8          : 'n/32',               // cost
     9          : 'n/32',               // priority
     10         : 'n/32',               // master
     11         : 'n/32',               // wireless extension
     12         : '', //'n/1:r/brport_attributes',  // protinfo
     13         : 'n/32',               // tx_queue_len
     14         : '',                   // map
     15         : '',                   // weight
     16         : 'n/8',                // oper state
     17         : 'n/8',                // link  mode
     18         : 'r/infotype_attributes',                  // linkinfo
     // 18         : 'g',                  // linkinfo
     19         : 'n/32',               // ns pid
     20         : 's',                  // ifalias
     21         : 'n/32',               // num vf
     22         : '',                  // vf info list
     23         : '',                  // stats64
     24         : '',                  // vf_ports
     25         : 'g', // vf_ports self
     26         : '',                  // af_spec
     27         : 'n/32',               // group
     28         : 'n/32',               // ns fd
     29         : 'n/32',               // ext mask
     30         : 'n/32',               // promiscuity
     31         : 'n/32',               // tx num queues
     32         : 'n/32',               // rx num queues
     33         : '',                  // carrier - stats 64
     34         : 'n/32',               // phys port id
     35         : '',                  // carrier changes
};



var linktypes = {


/*
 * IFLA_AF_SPEC
 *   Contains nested attributes for address family specific attributes.
 *   Each address family may create a attribute with the address family
 *   number as type and create its own attribute structure in it.
 *
 *   Example:
 *   [IFLA_AF_SPEC] = {
 *       [AF_INET] = {
 *           [IFLA_INET_CONF] = ...,
 *       },
 *       [AF_INET6] = {
 *           [IFLA_INET6_FLAGS] = ...,
 *           [IFLA_INET6_CONF] = ...,
 *       }
 *   }
 */
     link_attributes: {
          IFLA_LINK_UNSPEC:             0,
          IFLA_LINK_ADDRESS:            1,
          IFLA_LINK_BROADCAST:          2,
          IFLA_LINK_IFNAME:             3,
          IFLA_LINK_MTU:                4,
          IFLA_LINK_LINK:               5,
          IFLA_LINK_QDISC:              6,
          IFLA_LINK_STATS:              7,
          IFLA_LINK_COST:               8,
          IFLA_LINK_PRIORITY:           9,
          IFLA_LINK_MASTER:             10,
          IFLA_LINK_WIRELESS:           11,
          IFLA_LINK_PROTINFO:           12,
          IFLA_LINK_TXQLEN:             13,
          IFLA_LINK_MAP:                14,
          IFLA_LINK_WEIGHT:             15,
          IFLA_LINK_OPERSTATE:          16,
          IFLA_LINK_LINKMODE:           17,
          IFLA_LINK_LINKINFO:           18,
          IFLA_LINK_NET_NS_PID:         19,
          IFLA_LINK_IFALIAS:            20,
          IFLA_LINK_NUM_VF:             21,
          IFLA_LINK_VFINFO_LIST:        22,
          IFLA_LINK_STATS64:            23,
          IFLA_LINK_VF_PORTS:           24,
          IFLA_LINK_PORT_SELF:          25,
          IFLA_LINK_AF_SPEC:            26,
          IFLA_LINK_GROUP:              27,
          IFLA_LINK_NET_NS_FD:          28,
          IFLA_LINK_EXT_MASK:           29,
          IFLA_LINK_PROMISCUITY:        30,
          IFLA_LINK_NUM_TX_QUEUES:      31,
          IFLA_LINK_NUM_RX_QUEUES:      32,
          IFLA_LINK_CARRIER:            33,
          IFLA_LINK_PHYS_PORT_ID:       34,
          IFLA_LINK_CARRIER_CHANGES:    35,
          IFLA_LINK_SPEC:               link_attributes_spec
     },


     // enum {
     //      IFLA_INET_UNSPEC,
     //      IFLA_INET_CONF,
     //      __IFLA_INET_MAX,
     // };

     // /* ifi_flags.

     //    IFF_* flags.

     //    The only change is:
     //    IFF_LOOPBACK, IFF_BROADCAST and IFF_POINTOPOINT are
     //    more not changeable by user. They describe link media
     //    characteristics and set by device driver.

     //    Comments:
     //    - Combination IFF_BROADCAST|IFF_POINTOPOINT is invalid
     //    - If neither of these three flags are set;
     //      the interface is NBMA.

     //    - IFF_MULTICAST does not mean anything special:
     //    multicasts can be used on all not-NBMA links.
     //    IFF_MULTICAST means that this media uses special encapsulation
     //    for multicast frames. Apparently, all IFF_POINTOPOINT and
     //    IFF_BROADCAST devices are able to use multicasts too.
     //  */

     // /* IFLA_LINK.
     //    For usual devices it is equal ifi_index.
     //    If it is a "virtual interface" (f.e. tunnel), ifi_link
     //    can point to real physical interface (f.e. for bandwidth calculations),
     //    or maybe 0, what means, that real media is unknown (usual
     //    for IPIP tunnels, when route to endpoint is allowed to change)
     //  */

     /* Subtype attributes for IFLA_PROTINFO */
     protoinfo_attributes: {
          IFLA_INET6_UNSPEC:  0,
          IFLA_INET6_FLAGS:   1,   /* link flags            */
          IFLA_INET6_CONF:    2,    /* sysctl parameters          */
          IFLA_INET6_STATS:   3,   /* statistics            */
          IFLA_INET6_MCAST:   4,   /* MC things. What of them?   */
          IFLA_INET6_CACHEINFO:    5,    /* time values and max reasm size */
          IFLA_INET6_ICMP6STATS:   6,   /* statistics (icmpv6)        */
          IFLA_INET6_TOKEN:        7,   /* device token               */
          IFLA_INET6_ADDR_GEN_MODE:8, /* implicit address generator mode */
          IFLA_INET6_SPEC:    []
     },


     // enum in6_addr_gen_mode {
     //      IN6_ADDR_GEN_MODE_EUI64,
     //      IN6_ADDR_GEN_MODE_NONE,
     //      IN6_ADDR_GEN_MODE_STABLE_PRIVACY,
     // };

     // /* Bridge section */

     // enum {
     //      IFLA_BR_UNSPEC,
     //      IFLA_BR_FORWARD_DELAY,
     //      IFLA_BR_HELLO_TIME,
     //      IFLA_BR_MAX_AGE,
     //      IFLA_BR_AGEING_TIME,
     //      IFLA_BR_STP_STATE,
     //      IFLA_BR_PRIORITY,
     //      __IFLA_BR_MAX,
     // };

     // enum {
     //      BRIDGE_MODE_UNSPEC,
     //      BRIDGE_MODE_HAIRPIN,
     // };

     brport_attributes: {
          IFLA_BRPORT_UNSPEC:      0,
          IFLA_BRPORT_STATE:       1,  /* Spanning tree state     */
          IFLA_BRPORT_PRIORITY:    2,    /* "             priority  */
          IFLA_BRPORT_COST:        3,   /* "             cost      */
          IFLA_BRPORT_MODE:        4,   /* mode (hairpin)          */
          IFLA_BRPORT_GUARD:       5,  /* bpdu guard              */
          IFLA_BRPORT_PROTECT:     6,     /* root port protection    */
          IFLA_BRPORT_FAST_LEAVE:  7,  /* multicast fast leave    */
          IFLA_BRPORT_LEARNING:    8,    /* mac learning */
          IFLA_BRPORT_UNICAST_FLOOD: 9, /* flood unicast traffic */
          IFLA_BRPORT_PROXYARP:    10,    /* proxy ARP */
          IFLA_BRPORT_LEARNING_SYNC: 11, /* mac learning sync from device */
          IFLA_BRPORT_PROXYARP_WIFI: 12, /* proxy ARP for Wi-Fi */
          IFLA_BRPORT_SPEC: ['', 'n/8', 'n/16', 'n/32', 'n/8', 'n/8', 'n/8', 'n/8','n/8', 'n/8','n/8', 'n/8', 'n/8']
     },

     // struct ifla_cacheinfo {
     //      __u32     max_reasm_len;
     //      __u32     tstamp;        /* ipv6InterfaceTable updated timestamp */
     //      __u32     reachable_time;
     //      __u32     retrans_time;
     // };


     infotype_attributes: {
          IFLA_INFO_UNSPEC:        0,
          IFLA_INFO_KIND:          1,
          IFLA_INFO_INFODATA:      2,
          IFLA_INFO_XSTATS:        3,
          IFLA_INFO_SLAVE_KIND:    4,
          IFLA_INFO_SLAVE_DATA:    5,
          IFLA_INFO_SPEC:          ['','s','f/infotype_parser','','',''],
          infotype_parser: function(type) {
               console.log("type = " + type);
               switch(type) {
                    case 'vlan':
                         return 'vlan';
                         break;
                    case 'bridge':
                         return 'bridge';
                         break;
                    default:
                         throw new Error("type [" + type + "] does not exist for IFLA_INFO_KIND");
                         break;
               }
          },
     },


     // /* VLAN section */

     vlan_attributes: {
          IFLA_VLAN_UNSPEC:        0,
          IFLA_VLAN_ID:            1,
          IFLA_VLAN_FLAGS:         2,
          IFLA_VLAN_EGRESSQOS:     3,
          IFLA_VLAN_INGRESSQOS:    4,
          IFLA_VLAN_PROTOCOL:      5,
          IFLA_VLAN_SPEC:          ['', 'n/16','n/16','l/qosmapping_attributes', 'l/qosmapping_attributes', 'n/16' ],
     },


     /* Bridge management nested attributes
      * [IFLA_LINK_AF_SPECC] = {
      *     [IFLA_BRIDGE_FLAGS]
      *     [IFLA_BRIDGE_MODE]
      *     [IFLA_BRIDGE_VLAN_INFO]
      * }
      */
     bridge_attributes: {
          IFLA_BRIDGE_USPEC:       0,
          IFLA_BRIDGE_FLAGS:       1,
          IFLA_BRIDGE_MODE:        2,
          IFLA_BRIDGE_VLAN:        3,
          IFLA_BRIDGE_A1:          4,
          IFLA_BRIDGE_A2:          5,
          IFLA_BRIDGE_A3:          6,
          IFLA_BRIDGE_A4:          7,
          IFLA_BRIDGE_A5:          8,
          IFLA_BRIDGE_SPEC:        ['', 'n/16', 'n/16','','','','','','']
     },


     // struct ifla_vlan_flags {
     //      __u32     flags;
     //      __u32     mask;
     // };

     qosmapping_attributes: {
          IFLA_QOSMAPPING_UNSPEC: 0,
          IFLA_QOSMAPPING_QOSMAPPING:        1,
          IFLA_QOSMAPPING_SPEC:   ['', 'n/64'],
     },

     // struct ifla_vlan_qos_mapping {
     //      __u32 from;
     //      __u32 to;
     // };

     // /* MACVLAN section */
     // enum {
     //      IFLA_MACVLAN_UNSPEC,
     //      IFLA_MACVLAN_MODE,
     //      IFLA_MACVLAN_FLAGS,
     //      IFLA_MACVLAN_MACADDR_MODE,
     //      IFLA_MACVLAN_MACADDR,
     //      IFLA_MACVLAN_MACADDR_DATA,
     //      IFLA_MACVLAN_MACADDR_COUNT,
     //      __IFLA_MACVLAN_MAX,
     // };

     // enum macvlan_mode {
     //      MACVLAN_MODE_PRIVATE = 1, /* don't talk to other macvlans */
     //      MACVLAN_MODE_VEPA    = 2, /* talk to other ports through ext bridge */
     //      MACVLAN_MODE_BRIDGE  = 4, /* talk to bridge ports directly */
     //      MACVLAN_MODE_PASSTHRU = 8,/* take over the underlying device */
     //      MACVLAN_MODE_SOURCE  = 16,/* use source MAC address list to assign */
     // };

     // enum macvlan_macaddr_mode {
     //      MACVLAN_MACADDR_ADD,
     //      MACVLAN_MACADDR_DEL,
     //      MACVLAN_MACADDR_FLUSH,
     //      MACVLAN_MACADDR_SET,
     // };

     // /* VRF section */
     // enum {
     //      IFLA_VRF_UNSPEC,
     //      IFLA_VRF_TABLE,
     //      __IFLA_VRF_MAX
     // };


     // /* IPVLAN section */
     // enum {
     //      IFLA_IPVLAN_UNSPEC,
     //      IFLA_IPVLAN_MODE,
     //      __IFLA_IPVLAN_MAX
     // };

     // enum ipvlan_mode {
     //      IPVLAN_MODE_L2 = 0,
     //      IPVLAN_MODE_L3,
     //      IPVLAN_MODE_MAX
     // };

     // /* VXLAN section */
     // enum {
     //      IFLA_VXLAN_UNSPEC,
     //      IFLA_VXLAN_ID,
     //      IFLA_VXLAN_GROUP,   /* group or remote address */
     //      IFLA_VXLAN_LINK,
     //      IFLA_VXLAN_LOCAL,
     //      IFLA_VXLAN_TTL,
     //      IFLA_VXLAN_TOS,
     //      IFLA_VXLAN_LEARNING,
     //      IFLA_VXLAN_AGEING,
     //      IFLA_VXLAN_LIMIT,
     //      IFLA_VXLAN_PORT_RANGE,   /* source port */
     //      IFLA_VXLAN_PROXY,
     //      IFLA_VXLAN_RSC,
     //      IFLA_VXLAN_L2MISS,
     //      IFLA_VXLAN_L3MISS,
     //      IFLA_VXLAN_PORT,    /* destination port */
     //      IFLA_VXLAN_GROUP6,
     //      IFLA_VXLAN_LOCAL6,
     //      IFLA_VXLAN_UDP_CSUM,
     //      IFLA_VXLAN_UDP_ZERO_CSUM6_TX,
     //      IFLA_VXLAN_UDP_ZERO_CSUM6_RX,
     //      IFLA_VXLAN_REMCSUM_TX,
     //      IFLA_VXLAN_REMCSUM_RX,
     //      IFLA_VXLAN_GBP,
     //      IFLA_VXLAN_REMCSUM_NOPARTIAL,
     //      __IFLA_VXLAN_MAX
     // };

     // struct ifla_vxlan_port_range {
     //      __be16    low;
     //      __be16    high;
     // };

     // /* Bonding section */

     // enum {
     //      IFLA_BOND_UNSPEC,
     //      IFLA_BOND_MODE,
     //      IFLA_BOND_ACTIVE_SLAVE,
     //      IFLA_BOND_MIIMON,
     //      IFLA_BOND_UPDELAY,
     //      IFLA_BOND_DOWNDELAY,
     //      IFLA_BOND_USE_CARRIER,
     //      IFLA_BOND_ARP_INTERVAL,
     //      IFLA_BOND_ARP_IP_TARGET,
     //      IFLA_BOND_ARP_VALIDATE,
     //      IFLA_BOND_ARP_ALL_TARGETS,
     //      IFLA_BOND_PRIMARY,
     //      IFLA_BOND_PRIMARY_RESELECT,
     //      IFLA_BOND_FAIL_OVER_MAC,
     //      IFLA_BOND_XMIT_HASH_POLICY,
     //      IFLA_BOND_RESEND_IGMP,
     //      IFLA_BOND_NUM_PEER_NOTIF,
     //      IFLA_BOND_ALL_SLAVES_ACTIVE,
     //      IFLA_BOND_MIN_LINKS,
     //      IFLA_BOND_LP_INTERVAL,
     //      IFLA_BOND_PACKETS_PER_SLAVE,
     //      IFLA_BOND_AD_LACP_RATE,
     //      IFLA_BOND_AD_SELECT,
     //      IFLA_BOND_AD_INFO,
     //      __IFLA_BOND_MAX,
     // };

     // enum {
     //      IFLA_BOND_AD_INFO_UNSPEC,
     //      IFLA_BOND_AD_INFO_AGGREGATOR,
     //      IFLA_BOND_AD_INFO_NUM_PORTS,
     //      IFLA_BOND_AD_INFO_ACTOR_KEY,
     //      IFLA_BOND_AD_INFO_PARTNER_KEY,
     //      IFLA_BOND_AD_INFO_PARTNER_MAC,
     //      __IFLA_BOND_AD_INFO_MAX,
     // };

     // enum {
     //      IFLA_BOND_SLAVE_UNSPEC,
     //      IFLA_BOND_SLAVE_STATE,
     //      IFLA_BOND_SLAVE_MII_STATUS,
     //      IFLA_BOND_SLAVE_LINK_FAILURE_COUNT,
     //      IFLA_BOND_SLAVE_PERM_HWADDR,
     //      IFLA_BOND_SLAVE_QUEUE_ID,
     //      IFLA_BOND_SLAVE_AD_AGGREGATOR_ID,
     //      __IFLA_BOND_SLAVE_MAX,
     // };

     // /* SR-IOV virtual function management section */

     // enum {
     //      IFLA_VF_INFO_UNSPEC,
     //      IFLA_VF_INFO,
     //      __IFLA_VF_INFO_MAX,
     // };

     // enum {
     //      IFLA_VF_UNSPEC,
     //      IFLA_VF_MAC,        /* Hardware queue specific attributes */
     //      IFLA_VF_VLAN,
     //      IFLA_VF_TX_RATE,    /* Max TX Bandwidth Allocation */
     //      IFLA_VF_SPOOFCHK,   /* Spoof Checking on/off switch */
     //      IFLA_VF_LINK_STATE, /* link state enable/disable/auto switch */
     //      IFLA_VF_RATE,       /* Min and Max TX Bandwidth Allocation */
     //      IFLA_VF_RSS_QUERY_EN,    /* RSS Redirection Table and Hash Key query
     //                      * on/off switch
     //                      */
     //      __IFLA_VF_MAX,
     // };

     // struct ifla_vf_mac {
     //      __u32 vf;
     //      __u8 mac[32]; /* MAX_ADDR_LEN */
     // };

     // struct ifla_vf_vlan {
     //      __u32 vf;
     //      __u32 vlan; /* 0 - 4095, 0 disables VLAN filter */
     //      __u32 qos;
     // };

     // struct ifla_vf_tx_rate {
     //      __u32 vf;
     //      __u32 rate; /* Max TX bandwidth in Mbps, 0 disables throttling */
     // };

     // struct ifla_vf_rate {
     //      __u32 vf;
     //      __u32 min_tx_rate; /* Min Bandwidth in Mbps */
     //      __u32 max_tx_rate; /* Max Bandwidth in Mbps */
     // };

     // struct ifla_vf_spoofchk {
     //      __u32 vf;
     //      __u32 setting;
     // };

     // enum {
     //      IFLA_VF_LINK_STATE_AUTO, /* link state of the uplink */
     //      IFLA_VF_LINK_STATE_ENABLE,    /* link always up */
     //      IFLA_VF_LINK_STATE_DISABLE,   /* link always down */
     //      __IFLA_VF_LINK_STATE_MAX,
     // };

     // struct ifla_vf_link_state {
     //      __u32 vf;
     //      __u32 link_state;
     // };

     // struct ifla_vf_rss_query_en {
     //      __u32 vf;
     //      __u32 setting;
     // };

     // /* VF ports management section
     //  *
     //  *   Nested layout of set/get msg is:
     //  *
     //  *        [IFLA_NUM_VF]
     //  *        [IFLA_VF_PORTS]
     //  *             [IFLA_VF_PORT]
     //  *                  [IFLA_PORT_*], ...
     //  *             [IFLA_VF_PORT]
     //  *                  [IFLA_PORT_*], ...
     //  *             ...
     //  *        [IFLA_PORT_SELF]
     //  *             [IFLA_PORT_*], ...
     //  */

     // enum {
     //      IFLA_VF_PORT_UNSPEC,
     //      IFLA_VF_PORT,            /* nest */
     //      __IFLA_VF_PORT_MAX,
     // };

     // enum {
     //      IFLA_PORT_UNSPEC,
     //      IFLA_PORT_VF,            /* __u32 */
     //      IFLA_PORT_PROFILE,       /* string */
     //      IFLA_PORT_VSI_TYPE,      /* 802.1Qbg (pre-)standard VDP */
     //      IFLA_PORT_INSTANCE_UUID, /* binary UUID */
     //      IFLA_PORT_HOST_UUID,          /* binary UUID */
     //      IFLA_PORT_REQUEST,       /* __u8 */
     //      IFLA_PORT_RESPONSE,      /* __u16, output only */
     //      __IFLA_PORT_MAX,
     // };

     // enum {
     //      PORT_REQUEST_PREASSOCIATE = 0,
     //      PORT_REQUEST_PREASSOCIATE_RR,
     //      PORT_REQUEST_ASSOCIATE,
     //      PORT_REQUEST_DISASSOCIATE,
     // };

     // enum {
     //      PORT_VDP_RESPONSE_SUCCESS = 0,
     //      PORT_VDP_RESPONSE_INVALID_FORMAT,
     //      PORT_VDP_RESPONSE_INSUFFICIENT_RESOURCES,
     //      PORT_VDP_RESPONSE_UNUSED_VTID,
     //      PORT_VDP_RESPONSE_VTID_VIOLATION,
     //      PORT_VDP_RESPONSE_VTID_VERSION_VIOALTION,
     //      PORT_VDP_RESPONSE_OUT_OF_SYNC,
     //      /* 0x08-0xFF reserved for future VDP use */
     //      PORT_PROFILE_RESPONSE_SUCCESS = 0x100,
     //      PORT_PROFILE_RESPONSE_INPROGRESS,
     //      PORT_PROFILE_RESPONSE_INVALID,
     //      PORT_PROFILE_RESPONSE_BADSTATE,
     //      PORT_PROFILE_RESPONSE_INSUFFICIENT_RESOURCES,
     //      PORT_PROFILE_RESPONSE_ERROR,
     // };

     // struct ifla_port_vsi {
     //      __u8 vsi_mgr_id;
     //      __u8 vsi_type_id[3];
     //      __u8 vsi_type_version;
     //      __u8 pad[3];
     // };


     // /* IPoIB section */

     // enum {
     //      IFLA_IPOIB_UNSPEC,
     //      IFLA_IPOIB_PKEY,
     //      IFLA_IPOIB_MODE,
     //      IFLA_IPOIB_UMCAST,
     //      __IFLA_IPOIB_MAX
     // };

     // enum {
     //      IPOIB_MODE_DATAGRAM  = 0, /* using unreliable datagram QPs */
     //      IPOIB_MODE_CONNECTED = 1, /* using connected QPs */
     // };



     // /* HSR section */

     // enum {
     //      IFLA_HSR_UNSPEC,
     //      IFLA_HSR_SLAVE1,
     //      IFLA_HSR_SLAVE2,
     //      IFLA_HSR_MULTICAST_SPEC, /* Last byte of supervision addr */
     //      IFLA_HSR_SUPERVISION_ADDR,    /* Supervision frame multicast addr */
     //      IFLA_HSR_SEQ_NR,
     //      __IFLA_HSR_MAX,
     // };

};

module.exports = linktypes;