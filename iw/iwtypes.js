var nl80211 = require('./nl80211.js');

var iwtypes = {



        /**
     * enum nl80211_attrs - nl80211 netlink attributes
     *
     * @NL80211_ATTR_UNSPEC: unspecified attribute to catch errors
     *
     * @NL80211_ATTR_WIPHY: index of wiphy to operate on, cf.
     *  /sys/class/ieee80211/<phyname>/index
     * @NL80211_ATTR_WIPHY_NAME: wiphy name (used for renaming)
     * @NL80211_ATTR_WIPHY_TXQ_PARAMS: a nested array of TX queue parameters
     * @NL80211_ATTR_WIPHY_FREQ: frequency of the selected channel in MHz,
     *  defines the channel together with the (deprecated)
     *  %NL80211_ATTR_WIPHY_CHANNEL_TYPE attribute or the attributes
     *  %NL80211_ATTR_CHANNEL_WIDTH and if needed %NL80211_ATTR_CENTER_FREQ1
     *  and %NL80211_ATTR_CENTER_FREQ2
     * @NL80211_ATTR_CHANNEL_WIDTH: u32 attribute containing one of the values
     *  of &enum nl80211_chan_width, describing the channel width. See the
     *  documentation of the enum for more information.
     * @NL80211_ATTR_CENTER_FREQ1: Center frequency of the first part of the
     *  channel, used for anything but 20 MHz bandwidth
     * @NL80211_ATTR_CENTER_FREQ2: Center frequency of the second part of the
     *  channel, used only for 80+80 MHz bandwidth
     * @NL80211_ATTR_WIPHY_CHANNEL_TYPE: included with NL80211_ATTR_WIPHY_FREQ
     *  if HT20 or HT40 are to be used (i.e., HT disabled if not included):
     *  NL80211_CHAN_NO_HT = HT not allowed (i.e., same as not including
     *      this attribute)
     *  NL80211_CHAN_HT20 = HT20 only
     *  NL80211_CHAN_HT40MINUS = secondary channel is below the primary channel
     *  NL80211_CHAN_HT40PLUS = secondary channel is above the primary channel
     *  This attribute is now deprecated.
     * @NL80211_ATTR_WIPHY_RETRY_SHORT: TX retry limit for frames whose length is
     *  less than or equal to the RTS threshold; allowed range: 1..255;
     *  dot11ShortRetryLimit; u8
     * @NL80211_ATTR_WIPHY_RETRY_LONG: TX retry limit for frames whose length is
     *  greater than the RTS threshold; allowed range: 1..255;
     *  dot11ShortLongLimit; u8
     * @NL80211_ATTR_WIPHY_FRAG_THRESHOLD: fragmentation threshold, i.e., maximum
     *  length in octets for frames; allowed range: 256..8000, disable
     *  fragmentation with (u32)-1; dot11FragmentationThreshold; u32
     * @NL80211_ATTR_WIPHY_RTS_THRESHOLD: RTS threshold (TX frames with length
     *  larger than or equal to this use RTS/CTS handshake); allowed range:
     *  0..65536, disable with (u32)-1; dot11RTSThreshold; u32
     * @NL80211_ATTR_WIPHY_COVERAGE_CLASS: Coverage Class as defined by IEEE 802.11
     *  section 7.3.2.9; dot11CoverageClass; u8
     *
     * @NL80211_ATTR_IFINDEX: network interface index of the device to operate on
     * @NL80211_ATTR_IFNAME: network interface name
     * @NL80211_ATTR_IFTYPE: type of virtual interface, see &enum nl80211_iftype
     *
     * @NL80211_ATTR_WDEV: wireless device identifier, used for pseudo-devices
     *  that don't have a netdev (u64)
     *
     * @NL80211_ATTR_MAC: MAC address (various uses)
     *
     * @NL80211_ATTR_KEY_DATA: (temporal) key data; for TKIP this consists of
     *  16 bytes encryption key followed by 8 bytes each for TX and RX MIC
     *  keys
     * @NL80211_ATTR_KEY_IDX: key ID (u8, 0-3)
     * @NL80211_ATTR_KEY_CIPHER: key cipher suite (u32, as defined by IEEE 802.11
     *  section 7.3.2.25.1, e.g. 0x000FAC04)
     * @NL80211_ATTR_KEY_SEQ: transmit key sequence number (IV/PN) for TKIP and
     *  CCMP keys, each six bytes in little endian
     * @NL80211_ATTR_KEY_DEFAULT: Flag attribute indicating the key is default key
     * @NL80211_ATTR_KEY_DEFAULT_MGMT: Flag attribute indicating the key is the
     *  default management key
     * @NL80211_ATTR_CIPHER_SUITES_PAIRWISE: For crypto settings for connect or
     *  other commands, indicates which pairwise cipher suites are used
     * @NL80211_ATTR_CIPHER_SUITE_GROUP: For crypto settings for connect or
     *  other commands, indicates which group cipher suite is used
     *
     * @NL80211_ATTR_BEACON_INTERVAL: beacon interval in TU
     * @NL80211_ATTR_DTIM_PERIOD: DTIM period for beaconing
     * @NL80211_ATTR_BEACON_HEAD: portion of the beacon before the TIM IE
     * @NL80211_ATTR_BEACON_TAIL: portion of the beacon after the TIM IE
     *
     * @NL80211_ATTR_STA_AID: Association ID for the station (u16)
     * @NL80211_ATTR_STA_FLAGS: flags, nested element with NLA_FLAG attributes of
     *  &enum nl80211_sta_flags (deprecated, use %NL80211_ATTR_STA_FLAGS2)
     * @NL80211_ATTR_STA_LISTEN_INTERVAL: listen interval as defined by
     *  IEEE 802.11 7.3.1.6 (u16).
     * @NL80211_ATTR_STA_SUPPORTED_RATES: supported rates, array of supported
     *  rates as defined by IEEE 802.11 7.3.2.2 but without the length
     *  restriction (at most %NL80211_MAX_SUPP_RATES).
     * @NL80211_ATTR_STA_VLAN: interface index of VLAN interface to move station
     *  to, or the AP interface the station was originally added to to.
     * @NL80211_ATTR_STA_INFO: information about a station, part of station info
     *  given for %NL80211_CMD_GET_STATION, nested attribute containing
     *  info as possible, see &enum nl80211_sta_info.
     *
     * @NL80211_ATTR_WIPHY_BANDS: Information about an operating bands,
     *  consisting of a nested array.
     *
     * @NL80211_ATTR_MESH_ID: mesh id (1-32 bytes).
     * @NL80211_ATTR_STA_PLINK_ACTION: action to perform on the mesh peer link
     *  (see &enum nl80211_plink_action).
     * @NL80211_ATTR_MPATH_NEXT_HOP: MAC address of the next hop for a mesh path.
     * @NL80211_ATTR_MPATH_INFO: information about a mesh_path, part of mesh path
     *  info given for %NL80211_CMD_GET_MPATH, nested attribute described at
     *  &enum nl80211_mpath_info.
     *
     * @NL80211_ATTR_MNTR_FLAGS: flags, nested element with NLA_FLAG attributes of
     *      &enum nl80211_mntr_flags.
     *
     * @NL80211_ATTR_REG_ALPHA2: an ISO-3166-alpha2 country code for which the
     *  current regulatory domain should be set to or is already set to.
     *  For example, 'CR', for Costa Rica. This attribute is used by the kernel
     *  to query the CRDA to retrieve one regulatory domain. This attribute can
     *  also be used by userspace to query the kernel for the currently set
     *  regulatory domain. We chose an alpha2 as that is also used by the
     *  IEEE-802.11 country information element to identify a country.
     *  Users can also simply ask the wireless core to set regulatory domain
     *  to a specific alpha2.
     * @NL80211_ATTR_REG_RULES: a nested array of regulatory domain regulatory
     *  rules.
     *
     * @NL80211_ATTR_BSS_CTS_PROT: whether CTS protection is enabled (u8, 0 or 1)
     * @NL80211_ATTR_BSS_SHORT_PREAMBLE: whether short preamble is enabled
     *  (u8, 0 or 1)
     * @NL80211_ATTR_BSS_SHORT_SLOT_TIME: whether short slot time enabled
     *  (u8, 0 or 1)
     * @NL80211_ATTR_BSS_BASIC_RATES: basic rates, array of basic
     *  rates in format defined by IEEE 802.11 7.3.2.2 but without the length
     *  restriction (at most %NL80211_MAX_SUPP_RATES).
     *
     * @NL80211_ATTR_HT_CAPABILITY: HT Capability information element (from
     *  association request when used with NL80211_CMD_NEW_STATION)
     *
     * @NL80211_ATTR_SUPPORTED_IFTYPES: nested attribute containing all
     *  supported interface types, each a flag attribute with the number
     *  of the interface mode.
     *
     * @NL80211_ATTR_MGMT_SUBTYPE: Management frame subtype for
     *  %NL80211_CMD_SET_MGMT_EXTRA_IE.
     *
     * @NL80211_ATTR_IE: Information element(s) data (used, e.g., with
     *  %NL80211_CMD_SET_MGMT_EXTRA_IE).
     *
     * @NL80211_ATTR_MAX_NUM_SCAN_SSIDS: number of SSIDs you can scan with
     *  a single scan request, a wiphy attribute.
     * @NL80211_ATTR_MAX_NUM_SCHED_SCAN_SSIDS: number of SSIDs you can
     *  scan with a single scheduled scan request, a wiphy attribute.
     * @NL80211_ATTR_MAX_SCAN_IE_LEN: maximum length of information elements
     *  that can be added to a scan request
     * @NL80211_ATTR_MAX_SCHED_SCAN_IE_LEN: maximum length of information
     *  elements that can be added to a scheduled scan request
     * @NL80211_ATTR_MAX_MATCH_SETS: maximum number of sets that can be
     *  used with @NL80211_ATTR_SCHED_SCAN_MATCH, a wiphy attribute.
     *
     * @NL80211_ATTR_SCAN_FREQUENCIES: nested attribute with frequencies (in MHz)
     * @NL80211_ATTR_SCAN_SSIDS: nested attribute with SSIDs, leave out for passive
     *  scanning and include a zero-length SSID (wildcard) for wildcard scan
     * @NL80211_ATTR_BSS: scan result BSS
     *
     * @NL80211_ATTR_REG_INITIATOR: indicates who requested the regulatory domain
     *  currently in effect. This could be any of the %NL80211_REGDOM_SET_BY_*
     * @NL80211_ATTR_REG_TYPE: indicates the type of the regulatory domain currently
     *  set. This can be one of the nl80211_reg_type (%NL80211_REGDOM_TYPE_*)
     *
     * @NL80211_ATTR_SUPPORTED_COMMANDS: wiphy attribute that specifies
     *  an array of command numbers (i.e. a mapping index to command number)
     *  that the driver for the given wiphy supports.
     *
     * @NL80211_ATTR_FRAME: frame data (binary attribute), including frame header
     *  and body, but not FCS; used, e.g., with NL80211_CMD_AUTHENTICATE and
     *  NL80211_CMD_ASSOCIATE events
     * @NL80211_ATTR_SSID: SSID (binary attribute, 0..32 octets)
     * @NL80211_ATTR_AUTH_TYPE: AuthenticationType, see &enum nl80211_auth_type,
     *  represented as a u32
     * @NL80211_ATTR_REASON_CODE: ReasonCode for %NL80211_CMD_DEAUTHENTICATE and
     *  %NL80211_CMD_DISASSOCIATE, u16
     *
     * @NL80211_ATTR_KEY_TYPE: Key Type, see &enum nl80211_key_type, represented as
     *  a u32
     *
     * @NL80211_ATTR_FREQ_BEFORE: A channel which has suffered a regulatory change
     *  due to considerations from a beacon hint. This attribute reflects
     *  the state of the channel _before_ the beacon hint processing. This
     *  attributes consists of a nested attribute containing
     *  NL80211_FREQUENCY_ATTR_*
     * @NL80211_ATTR_FREQ_AFTER: A channel which has suffered a regulatory change
     *  due to considerations from a beacon hint. This attribute reflects
     *  the state of the channel _after_ the beacon hint processing. This
     *  attributes consists of a nested attribute containing
     *  NL80211_FREQUENCY_ATTR_*
     *
     * @NL80211_ATTR_CIPHER_SUITES: a set of u32 values indicating the supported
     *  cipher suites
     *
     * @NL80211_ATTR_FREQ_FIXED: a flag indicating the IBSS should not try to look
     *  for other networks on different channels
     *
     * @NL80211_ATTR_TIMED_OUT: a flag indicating than an operation timed out; this
     *  is used, e.g., with %NL80211_CMD_AUTHENTICATE event
     *
     * @NL80211_ATTR_USE_MFP: Whether management frame protection (IEEE 802.11w) is
     *  used for the association (&enum nl80211_mfp, represented as a u32);
     *  this attribute can be used
     *  with %NL80211_CMD_ASSOCIATE and %NL80211_CMD_CONNECT requests
     *
     * @NL80211_ATTR_STA_FLAGS2: Attribute containing a
     *  &struct nl80211_sta_flag_update.
     *
     * @NL80211_ATTR_CONTROL_PORT: A flag indicating whether user space controls
     *  IEEE 802.1X port, i.e., sets/clears %NL80211_STA_FLAG_AUTHORIZED, in
     *  station mode. If the flag is included in %NL80211_CMD_ASSOCIATE
     *  request, the driver will assume that the port is unauthorized until
     *  authorized by user space. Otherwise, port is marked authorized by
     *  default in station mode.
     * @NL80211_ATTR_CONTROL_PORT_ETHERTYPE: A 16-bit value indicating the
     *  ethertype that will be used for key negotiation. It can be
     *  specified with the associate and connect commands. If it is not
     *  specified, the value defaults to 0x888E (PAE, 802.1X). This
     *  attribute is also used as a flag in the wiphy information to
     *  indicate that protocols other than PAE are supported.
     * @NL80211_ATTR_CONTROL_PORT_NO_ENCRYPT: When included along with
     *  %NL80211_ATTR_CONTROL_PORT_ETHERTYPE, indicates that the custom
     *  ethertype frames used for key negotiation must not be encrypted.
     *
     * @NL80211_ATTR_TESTDATA: Testmode data blob, passed through to the driver.
     *  We recommend using nested, driver-specific attributes within this.
     *
     * @NL80211_ATTR_DISCONNECTED_BY_AP: A flag indicating that the DISCONNECT
     *  event was due to the AP disconnecting the station, and not due to
     *  a local disconnect request.
     * @NL80211_ATTR_STATUS_CODE: StatusCode for the %NL80211_CMD_CONNECT
     *  event (u16)
     * @NL80211_ATTR_PRIVACY: Flag attribute, used with connect(), indicating
     *  that protected APs should be used. This is also used with NEW_BEACON to
     *  indicate that the BSS is to use protection.
     *
     * @NL80211_ATTR_CIPHERS_PAIRWISE: Used with CONNECT, ASSOCIATE, and NEW_BEACON
     *  to indicate which unicast key ciphers will be used with the connection
     *  (an array of u32).
     * @NL80211_ATTR_CIPHER_GROUP: Used with CONNECT, ASSOCIATE, and NEW_BEACON to
     *  indicate which group key cipher will be used with the connection (a
     *  u32).
     * @NL80211_ATTR_WPA_VERSIONS: Used with CONNECT, ASSOCIATE, and NEW_BEACON to
     *  indicate which WPA version(s) the AP we want to associate with is using
     *  (a u32 with flags from &enum nl80211_wpa_versions).
     * @NL80211_ATTR_AKM_SUITES: Used with CONNECT, ASSOCIATE, and NEW_BEACON to
     *  indicate which key management algorithm(s) to use (an array of u32).
     *
     * @NL80211_ATTR_REQ_IE: (Re)association request information elements as
     *  sent out by the card, for ROAM and successful CONNECT events.
     * @NL80211_ATTR_RESP_IE: (Re)association response information elements as
     *  sent by peer, for ROAM and successful CONNECT events.
     *
     * @NL80211_ATTR_PREV_BSSID: previous BSSID, to be used by in ASSOCIATE
     *  commands to specify using a reassociate frame
     *
     * @NL80211_ATTR_KEY: key information in a nested attribute with
     *  %NL80211_KEY_* sub-attributes
     * @NL80211_ATTR_KEYS: array of keys for static WEP keys for connect()
     *  and join_ibss(), key information is in a nested attribute each
     *  with %NL80211_KEY_* sub-attributes
     *
     * @NL80211_ATTR_PID: Process ID of a network namespace.
     *
     * @NL80211_ATTR_GENERATION: Used to indicate consistent snapshots for
     *  dumps. This number increases whenever the object list being
     *  dumped changes, and as such userspace can verify that it has
     *  obtained a complete and consistent snapshot by verifying that
     *  all dump messages contain the same generation number. If it
     *  changed then the list changed and the dump should be repeated
     *  completely from scratch.
     *
     * @NL80211_ATTR_4ADDR: Use 4-address frames on a virtual interface
     *
     * @NL80211_ATTR_SURVEY_INFO: survey information about a channel, part of
     *      the survey response for %NL80211_CMD_GET_SURVEY, nested attribute
     *      containing info as possible, see &enum survey_info.
     *
     * @NL80211_ATTR_PMKID: PMK material for PMKSA caching.
     * @NL80211_ATTR_MAX_NUM_PMKIDS: maximum number of PMKIDs a firmware can
     *  cache, a wiphy attribute.
     *
     * @NL80211_ATTR_DURATION: Duration of an operation in milliseconds, u32.
     * @NL80211_ATTR_MAX_REMAIN_ON_CHANNEL_DURATION: Device attribute that
     *  specifies the maximum duration that can be requested with the
     *  remain-on-channel operation, in milliseconds, u32.
     *
     * @NL80211_ATTR_COOKIE: Generic 64-bit cookie to identify objects.
     *
     * @NL80211_ATTR_TX_RATES: Nested set of attributes
     *  (enum nl80211_tx_rate_attributes) describing TX rates per band. The
     *  enum nl80211_band value is used as the index (nla_type() of the nested
     *  data. If a band is not included, it will be configured to allow all
     *  rates based on negotiated supported rates information. This attribute
     *  is used with %NL80211_CMD_SET_TX_BITRATE_MASK.
     *
     * @NL80211_ATTR_FRAME_MATCH: A binary attribute which typically must contain
     *  at least one byte, currently used with @NL80211_CMD_REGISTER_FRAME.
     * @NL80211_ATTR_FRAME_TYPE: A u16 indicating the frame type/subtype for the
     *  @NL80211_CMD_REGISTER_FRAME command.
     * @NL80211_ATTR_TX_FRAME_TYPES: wiphy capability attribute, which is a
     *  nested attribute of %NL80211_ATTR_FRAME_TYPE attributes, containing
     *  information about which frame types can be transmitted with
     *  %NL80211_CMD_FRAME.
     * @NL80211_ATTR_RX_FRAME_TYPES: wiphy capability attribute, which is a
     *  nested attribute of %NL80211_ATTR_FRAME_TYPE attributes, containing
     *  information about which frame types can be registered for RX.
     *
     * @NL80211_ATTR_ACK: Flag attribute indicating that the frame was
     *  acknowledged by the recipient.
     *
     * @NL80211_ATTR_PS_STATE: powersave state, using &enum nl80211_ps_state values.
     *
     * @NL80211_ATTR_CQM: connection quality monitor configuration in a
     *  nested attribute with %NL80211_ATTR_CQM_* sub-attributes.
     *
     * @NL80211_ATTR_LOCAL_STATE_CHANGE: Flag attribute to indicate that a command
     *  is requesting a local authentication/association state change without
     *  invoking actual management frame exchange. This can be used with
     *  NL80211_CMD_AUTHENTICATE, NL80211_CMD_DEAUTHENTICATE,
     *  NL80211_CMD_DISASSOCIATE.
     *
     * @NL80211_ATTR_AP_ISOLATE: (AP mode) Do not forward traffic between stations
     *  connected to this BSS.
     *
     * @NL80211_ATTR_WIPHY_TX_POWER_SETTING: Transmit power setting type. See
     *      &enum nl80211_tx_power_setting for possible values.
     * @NL80211_ATTR_WIPHY_TX_POWER_LEVEL: Transmit power level in signed mBm units.
     *      This is used in association with @NL80211_ATTR_WIPHY_TX_POWER_SETTING
     *      for non-automatic settings.
     *
     * @NL80211_ATTR_SUPPORT_IBSS_RSN: The device supports IBSS RSN, which mostly
     *  means support for per-station GTKs.
     *
     * @NL80211_ATTR_WIPHY_ANTENNA_TX: Bitmap of allowed antennas for transmitting.
     *  This can be used to mask out antennas which are not attached or should
     *  not be used for transmitting. If an antenna is not selected in this
     *  bitmap the hardware is not allowed to transmit on this antenna.
     *
     *  Each bit represents one antenna, starting with antenna 1 at the first
     *  bit. Depending on which antennas are selected in the bitmap, 802.11n
     *  drivers can derive which chainmasks to use (if all antennas belonging to
     *  a particular chain are disabled this chain should be disabled) and if
     *  a chain has diversity antennas wether diversity should be used or not.
     *  HT capabilities (STBC, TX Beamforming, Antenna selection) can be
     *  derived from the available chains after applying the antenna mask.
     *  Non-802.11n drivers can derive wether to use diversity or not.
     *  Drivers may reject configurations or RX/TX mask combinations they cannot
     *  support by returning -EINVAL.
     *
     * @NL80211_ATTR_WIPHY_ANTENNA_RX: Bitmap of allowed antennas for receiving.
     *  This can be used to mask out antennas which are not attached or should
     *  not be used for receiving. If an antenna is not selected in this bitmap
     *  the hardware should not be configured to receive on this antenna.
     *  For a more detailed description see @NL80211_ATTR_WIPHY_ANTENNA_TX.
     *
     * @NL80211_ATTR_WIPHY_ANTENNA_AVAIL_TX: Bitmap of antennas which are available
     *  for configuration as TX antennas via the above parameters.
     *
     * @NL80211_ATTR_WIPHY_ANTENNA_AVAIL_RX: Bitmap of antennas which are available
     *  for configuration as RX antennas via the above parameters.
     *
     * @NL80211_ATTR_MCAST_RATE: Multicast tx rate (in 100 kbps) for IBSS
     *
     * @NL80211_ATTR_OFFCHANNEL_TX_OK: For management frame TX, the frame may be
     *  transmitted on another channel when the channel given doesn't match
     *  the current channel. If the current channel doesn't match and this
     *  flag isn't set, the frame will be rejected. This is also used as an
     *  nl80211 capability flag.
     *
     * @NL80211_ATTR_BSS_HT_OPMODE: HT operation mode (u16)
     *
     * @NL80211_ATTR_KEY_DEFAULT_TYPES: A nested attribute containing flags
     *  attributes, specifying what a key should be set as default as.
     *  See &enum nl80211_key_default_types.
     *
     * @NL80211_ATTR_MESH_SETUP: Optional mesh setup parameters.  These cannot be
     *  changed once the mesh is active.
     * @NL80211_ATTR_MESH_CONFIG: Mesh configuration parameters, a nested attribute
     *  containing attributes from &enum nl80211_meshconf_params.
     * @NL80211_ATTR_SUPPORT_MESH_AUTH: Currently, this means the underlying driver
     *  allows auth frames in a mesh to be passed to userspace for processing via
     *  the @NL80211_MESH_SETUP_USERSPACE_AUTH flag.
     * @NL80211_ATTR_STA_PLINK_STATE: The state of a mesh peer link as defined in
     *  &enum nl80211_plink_state. Used when userspace is driving the peer link
     *  management state machine.  @NL80211_MESH_SETUP_USERSPACE_AMPE or
     *  @NL80211_MESH_SETUP_USERSPACE_MPM must be enabled.
     *
     * @NL80211_ATTR_WOWLAN_TRIGGERS_SUPPORTED: indicates, as part of the wiphy
     *  capabilities, the supported WoWLAN triggers
     * @NL80211_ATTR_WOWLAN_TRIGGERS: used by %NL80211_CMD_SET_WOWLAN to
     *  indicate which WoW triggers should be enabled. This is also
     *  used by %NL80211_CMD_GET_WOWLAN to get the currently enabled WoWLAN
     *  triggers.
     *
     * @NL80211_ATTR_SCHED_SCAN_INTERVAL: Interval between scheduled scan
     *  cycles, in msecs.
     *
     * @NL80211_ATTR_SCHED_SCAN_MATCH: Nested attribute with one or more
     *  sets of attributes to match during scheduled scans.  Only BSSs
     *  that match any of the sets will be reported.  These are
     *  pass-thru filter rules.
     *  For a match to succeed, the BSS must match all attributes of a
     *  set.  Since not every hardware supports matching all types of
     *  attributes, there is no guarantee that the reported BSSs are
     *  fully complying with the match sets and userspace needs to be
     *  able to ignore them by itself.
     *  Thus, the implementation is somewhat hardware-dependent, but
     *  this is only an optimization and the userspace application
     *  needs to handle all the non-filtered results anyway.
     *  If the match attributes don't make sense when combined with
     *  the values passed in @NL80211_ATTR_SCAN_SSIDS (eg. if an SSID
     *  is included in the probe request, but the match attributes
     *  will never let it go through), -EINVAL may be returned.
     *  If ommited, no filtering is done.
     *
     * @NL80211_ATTR_INTERFACE_COMBINATIONS: Nested attribute listing the supported
     *  interface combinations. In each nested item, it contains attributes
     *  defined in &enum nl80211_if_combination_attrs.
     * @NL80211_ATTR_SOFTWARE_IFTYPES: Nested attribute (just like
     *  %NL80211_ATTR_SUPPORTED_IFTYPES) containing the interface types that
     *  are managed in software: interfaces of these types aren't subject to
     *  any restrictions in their number or combinations.
     *
     * @NL80211_ATTR_REKEY_DATA: nested attribute containing the information
     *  necessary for GTK rekeying in the device, see &enum nl80211_rekey_data.
     *
     * @NL80211_ATTR_SCAN_SUPP_RATES: rates per to be advertised as supported in scan,
     *  nested array attribute containing an entry for each band, with the entry
     *  being a list of supported rates as defined by IEEE 802.11 7.3.2.2 but
     *  without the length restriction (at most %NL80211_MAX_SUPP_RATES).
     *
     * @NL80211_ATTR_HIDDEN_SSID: indicates whether SSID is to be hidden from Beacon
     *  and Probe Response (when response to wildcard Probe Request); see
     *  &enum nl80211_hidden_ssid, represented as a u32
     *
     * @NL80211_ATTR_IE_PROBE_RESP: Information element(s) for Probe Response frame.
     *  This is used with %NL80211_CMD_NEW_BEACON and %NL80211_CMD_SET_BEACON to
     *  provide extra IEs (e.g., WPS/P2P IE) into Probe Response frames when the
     *  driver (or firmware) replies to Probe Request frames.
     * @NL80211_ATTR_IE_ASSOC_RESP: Information element(s) for (Re)Association
     *  Response frames. This is used with %NL80211_CMD_NEW_BEACON and
     *  %NL80211_CMD_SET_BEACON to provide extra IEs (e.g., WPS/P2P IE) into
     *  (Re)Association Response frames when the driver (or firmware) replies to
     *  (Re)Association Request frames.
     *
     * @NL80211_ATTR_STA_WME: Nested attribute containing the wme configuration
     *  of the station, see &enum nl80211_sta_wme_attr.
     * @NL80211_ATTR_SUPPORT_AP_UAPSD: the device supports uapsd when working
     *  as AP.
     *
     * @NL80211_ATTR_ROAM_SUPPORT: Indicates whether the firmware is capable of
     *  roaming to another AP in the same ESS if the signal lever is low.
     *
     * @NL80211_ATTR_PMKSA_CANDIDATE: Nested attribute containing the PMKSA caching
     *  candidate information, see &enum nl80211_pmksa_candidate_attr.
     *
     * @NL80211_ATTR_TX_NO_CCK_RATE: Indicates whether to use CCK rate or not
     *  for management frames transmission. In order to avoid p2p probe/action
     *  frames are being transmitted at CCK rate in 2GHz band, the user space
     *  applications use this attribute.
     *  This attribute is used with %NL80211_CMD_TRIGGER_SCAN and
     *  %NL80211_CMD_FRAME commands.
     *
     * @NL80211_ATTR_TDLS_ACTION: Low level TDLS action code (e.g. link setup
     *  request, link setup confirm, link teardown, etc.). Values are
     *  described in the TDLS (802.11z) specification.
     * @NL80211_ATTR_TDLS_DIALOG_TOKEN: Non-zero token for uniquely identifying a
     *  TDLS conversation between two devices.
     * @NL80211_ATTR_TDLS_OPERATION: High level TDLS operation; see
     *  &enum nl80211_tdls_operation, represented as a u8.
     * @NL80211_ATTR_TDLS_SUPPORT: A flag indicating the device can operate
     *  as a TDLS peer sta.
     * @NL80211_ATTR_TDLS_EXTERNAL_SETUP: The TDLS discovery/setup and teardown
     *  procedures should be performed by sending TDLS packets via
     *  %NL80211_CMD_TDLS_MGMT. Otherwise %NL80211_CMD_TDLS_OPER should be
     *  used for asking the driver to perform a TDLS operation.
     *
     * @NL80211_ATTR_DEVICE_AP_SME: This u32 attribute may be listed for devices
     *  that have AP support to indicate that they have the AP SME integrated
     *  with support for the features listed in this attribute, see
     *  &enum nl80211_ap_sme_features.
     *
     * @NL80211_ATTR_DONT_WAIT_FOR_ACK: Used with %NL80211_CMD_FRAME, this tells
     *  the driver to not wait for an acknowledgement. Note that due to this,
     *  it will also not give a status callback nor return a cookie. This is
     *  mostly useful for probe responses to save airtime.
     *
     * @NL80211_ATTR_FEATURE_FLAGS: This u32 attribute contains flags from
     *  &enum nl80211_feature_flags and is advertised in wiphy information.
     * @NL80211_ATTR_PROBE_RESP_OFFLOAD: Indicates that the HW responds to probe
     *  requests while operating in AP-mode.
     *  This attribute holds a bitmap of the supported protocols for
     *  offloading (see &enum nl80211_probe_resp_offload_support_attr).
     *
     * @NL80211_ATTR_PROBE_RESP: Probe Response template data. Contains the entire
     *  probe-response frame. The DA field in the 802.11 header is zero-ed out,
     *  to be filled by the FW.
     * @NL80211_ATTR_DISABLE_HT:  Force HT capable interfaces to disable
     *      this feature.  Currently, only supported in mac80211 drivers.
     * @NL80211_ATTR_HT_CAPABILITY_MASK: Specify which bits of the
     *      ATTR_HT_CAPABILITY to which attention should be paid.
     *      Currently, only mac80211 NICs support this feature.
     *      The values that may be configured are:
     *       MCS rates, MAX-AMSDU, HT-20-40 and HT_CAP_SGI_40
     *       AMPDU density and AMPDU factor.
     *      All values are treated as suggestions and may be ignored
     *      by the driver as required.  The actual values may be seen in
     *      the station debugfs ht_caps file.
     *
     * @NL80211_ATTR_DFS_REGION: region for regulatory rules which this country
     *    abides to when initiating radiation on DFS channels. A country maps
     *    to one DFS region.
     *
     * @NL80211_ATTR_NOACK_MAP: This u16 bitmap contains the No Ack Policy of
     *      up to 16 TIDs.
     *
     * @NL80211_ATTR_INACTIVITY_TIMEOUT: timeout value in seconds, this can be
     *  used by the drivers which has MLME in firmware and does not have support
     *  to report per station tx/rx activity to free up the staion entry from
     *  the list. This needs to be used when the driver advertises the
     *  capability to timeout the stations.
     *
     * @NL80211_ATTR_RX_SIGNAL_DBM: signal strength in dBm (as a 32-bit int);
     *  this attribute is (depending on the driver capabilities) added to
     *  received frames indicated with %NL80211_CMD_FRAME.
     *
     * @NL80211_ATTR_BG_SCAN_PERIOD: Background scan period in seconds
     *      or 0 to disable background scan.
     *
     * @NL80211_ATTR_USER_REG_HINT_TYPE: type of regulatory hint passed from
     *  userspace. If unset it is assumed the hint comes directly from
     *  a user. If set code could specify exactly what type of source
     *  was used to provide the hint. For the different types of
     *  allowed user regulatory hints see nl80211_user_reg_hint_type.
     *
     * @NL80211_ATTR_CONN_FAILED_REASON: The reason for which AP has rejected
     *  the connection request from a station. nl80211_connect_failed_reason
     *  enum has different reasons of connection failure.
     *
     * @NL80211_ATTR_SAE_DATA: SAE elements in Authentication frames. This starts
     *  with the Authentication transaction sequence number field.
     *
     * @NL80211_ATTR_VHT_CAPABILITY: VHT Capability information element (from
     *  association request when used with NL80211_CMD_NEW_STATION)
     *
     * @NL80211_ATTR_SCAN_FLAGS: scan request control flags (u32)
     *
     * @NL80211_ATTR_P2P_CTWINDOW: P2P GO Client Traffic Window (u8), used with
     *  the START_AP and SET_BSS commands
     * @NL80211_ATTR_P2P_OPPPS: P2P GO opportunistic PS (u8), used with the
     *  START_AP and SET_BSS commands. This can have the values 0 or 1;
     *  if not given in START_AP 0 is assumed, if not given in SET_BSS
     *  no change is made.
     *
     * @NL80211_ATTR_LOCAL_MESH_POWER_MODE: local mesh STA link-specific power mode
     *  defined in &enum nl80211_mesh_power_mode.
     *
     * @NL80211_ATTR_ACL_POLICY: ACL policy, see &enum nl80211_acl_policy,
     *  carried in a u32 attribute
     *
     * @NL80211_ATTR_MAC_ADDRS: Array of nested MAC addresses, used for
     *  MAC ACL.
     *
     * @NL80211_ATTR_MAC_ACL_MAX: u32 attribute to advertise the maximum
     *  number of MAC addresses that a device can support for MAC
     *  ACL.
     *
     * @NL80211_ATTR_RADAR_EVENT: Type of radar event for notification to userspace,
     *  contains a value of enum nl80211_radar_event (u32).
     *
     * @NL80211_ATTR_EXT_CAPA: 802.11 extended capabilities that the kernel driver
     *  has and handles. The format is the same as the IE contents. See
     *  802.11-2012 8.4.2.29 for more information.
     * @NL80211_ATTR_EXT_CAPA_MASK: Extended capabilities that the kernel driver
     *  has set in the %NL80211_ATTR_EXT_CAPA value, for multibit fields.
     *
     * @NL80211_ATTR_STA_CAPABILITY: Station capabilities (u16) are advertised to
     *  the driver, e.g., to enable TDLS power save (PU-APSD).
     *
     * @NL80211_ATTR_STA_EXT_CAPABILITY: Station extended capabilities are
     *  advertised to the driver, e.g., to enable TDLS off channel operations
     *  and PU-APSD.
     *
     * @NL80211_ATTR_PROTOCOL_FEATURES: global nl80211 feature flags, see
     *  &enum nl80211_protocol_features, the attribute is a u32.
     *
     * @NL80211_ATTR_SPLIT_WIPHY_DUMP: flag attribute, userspace supports
     *  receiving the data for a single wiphy split across multiple
     *  messages, given with wiphy dump message
     *
     * @NL80211_ATTR_MDID: Mobility Domain Identifier
     *
     * @NL80211_ATTR_IE_RIC: Resource Information Container Information
     *  Element
     *
     * @NL80211_ATTR_CRIT_PROT_ID: critical protocol identifier requiring increased
     *  reliability, see &enum nl80211_crit_proto_id (u16).
     * @NL80211_ATTR_MAX_CRIT_PROT_DURATION: duration in milliseconds in which
     *      the connection should have increased reliability (u16).
     *
     * @NL80211_ATTR_PEER_AID: Association ID for the peer TDLS station (u16).
     *  This is similar to @NL80211_ATTR_STA_AID but with a difference of being
     *  allowed to be used with the first @NL80211_CMD_SET_STATION command to
     *  update a TDLS peer STA entry.
     *
     * @NL80211_ATTR_COALESCE_RULE: Coalesce rule information.
     *
     * @NL80211_ATTR_CH_SWITCH_COUNT: u32 attribute specifying the number of TBTT's
     *  until the channel switch event.
     * @NL80211_ATTR_CH_SWITCH_BLOCK_TX: flag attribute specifying that transmission
     *  must be blocked on the current channel (before the channel switch
     *  operation).
     * @NL80211_ATTR_CSA_IES: Nested set of attributes containing the IE information
     *  for the time while performing a channel switch.
     * @NL80211_ATTR_CSA_C_OFF_BEACON: An array of offsets (u16) to the channel
     *  switch counters in the beacons tail (%NL80211_ATTR_BEACON_TAIL).
     * @NL80211_ATTR_CSA_C_OFF_PRESP: An array of offsets (u16) to the channel
     *  switch counters in the probe response (%NL80211_ATTR_PROBE_RESP).
     *
     * @NL80211_ATTR_RXMGMT_FLAGS: flags for nl80211_send_mgmt(), u32.
     *  As specified in the &enum nl80211_rxmgmt_flags.
     *
     * @NL80211_ATTR_STA_SUPPORTED_CHANNELS: array of supported channels.
     *
     * @NL80211_ATTR_STA_SUPPORTED_OPER_CLASSES: array of supported
     *      supported operating classes.
     *
     * @NL80211_ATTR_HANDLE_DFS: A flag indicating whether user space
     *  controls DFS operation in IBSS mode. If the flag is included in
     *  %NL80211_CMD_JOIN_IBSS request, the driver will allow use of DFS
     *  channels and reports radar events to userspace. Userspace is required
     *  to react to radar events, e.g. initiate a channel switch or leave the
     *  IBSS network.
     *
     * @NL80211_ATTR_SUPPORT_5_MHZ: A flag indicating that the device supports
     *  5 MHz channel bandwidth.
     * @NL80211_ATTR_SUPPORT_10_MHZ: A flag indicating that the device supports
     *  10 MHz channel bandwidth.
     *
     * @NL80211_ATTR_OPMODE_NOTIF: Operating mode field from Operating Mode
     *  Notification Element based on association request when used with
     *  %NL80211_CMD_NEW_STATION; u8 attribute.
     *
     * @NL80211_ATTR_VENDOR_ID: The vendor ID, either a 24-bit OUI or, if
     *  %NL80211_VENDOR_ID_IS_LINUX is set, a special Linux ID (not used yet)
     * @NL80211_ATTR_VENDOR_SUBCMD: vendor sub-command
     * @NL80211_ATTR_VENDOR_DATA: data for the vendor command, if any; this
     *  attribute is also used for vendor command feature advertisement
     * @NL80211_ATTR_VENDOR_EVENTS: used for event list advertising in the wiphy
     *  info, containing a nested array of possible events
     *
     * @NL80211_ATTR_QOS_MAP: IP DSCP mapping for Interworking QoS mapping. This
     *  data is in the format defined for the payload of the QoS Map Set element
     *  in IEEE Std 802.11-2012, 8.4.2.97.
     *
     * @NL80211_ATTR_MAC_HINT: MAC address recommendation as initial BSS
     * @NL80211_ATTR_WIPHY_FREQ_HINT: frequency of the recommended initial BSS
     *
     * @NL80211_ATTR_MAX_AP_ASSOC_STA: Device attribute that indicates how many
     *  associated stations are supported in AP mode (including P2P GO); u32.
     *  Since drivers may not have a fixed limit on the maximum number (e.g.,
     *  other concurrent operations may affect this), drivers are allowed to
     *  advertise values that cannot always be met. In such cases, an attempt
     *  to add a new station entry with @NL80211_CMD_NEW_STATION may fail.
     *
     * @NL80211_ATTR_CSA_C_OFFSETS_TX: An array of csa counter offsets (u16) which
     *  should be updated when the frame is transmitted.
     * @NL80211_ATTR_MAX_CSA_COUNTERS: U8 attribute used to advertise the maximum
     *  supported number of csa counters.
     *
     * @NL80211_ATTR_TDLS_PEER_CAPABILITY: flags for TDLS peer capabilities, u32.
     *  As specified in the &enum nl80211_tdls_peer_capability.
     *
     * @NL80211_ATTR_SOCKET_OWNER: Flag attribute, if set during interface
     *  creation then the new interface will be owned by the netlink socket
     *  that created it and will be destroyed when the socket is closed.
     *  If set during scheduled scan start then the new scan req will be
     *  owned by the netlink socket that created it and the scheduled scan will
     *  be stopped when the socket is closed.
     *  If set during configuration of regulatory indoor operation then the
     *  regulatory indoor configuration would be owned by the netlink socket
     *  that configured the indoor setting, and the indoor operation would be
     *  cleared when the socket is closed.
     *
     * @NL80211_ATTR_TDLS_INITIATOR: flag attribute indicating the current end is
     *  the TDLS link initiator.
     *
     * @NL80211_ATTR_USE_RRM: flag for indicating whether the current connection
     *  shall support Radio Resource Measurements (11k). This attribute can be
     *  used with %NL80211_CMD_ASSOCIATE and %NL80211_CMD_CONNECT requests.
     *  User space applications are expected to use this flag only if the
     *  underlying device supports these minimal RRM features:
     *      %NL80211_FEATURE_DS_PARAM_SET_IE_IN_PROBES,
     *      %NL80211_FEATURE_QUIET,
     *  If this flag is used, driver must add the Power Capabilities IE to the
     *  association request. In addition, it must also set the RRM capability
     *  flag in the association request's Capability Info field.
     *
     * @NL80211_ATTR_WIPHY_DYN_ACK: flag attribute used to enable ACK timeout
     *  estimation algorithm (dynack). In order to activate dynack
     *  %NL80211_FEATURE_ACKTO_ESTIMATION feature flag must be set by lower
     *  drivers to indicate dynack capability. Dynack is automatically disabled
     *  setting valid value for coverage class.
     *
     * @NL80211_ATTR_TSID: a TSID value (u8 attribute)
     * @NL80211_ATTR_USER_PRIO: user priority value (u8 attribute)
     * @NL80211_ATTR_ADMITTED_TIME: admitted time in units of 32 microseconds
     *  (per second) (u16 attribute)
     *
     * @NL80211_ATTR_SMPS_MODE: SMPS mode to use (ap mode). see
     *  &enum nl80211_smps_mode.
     *
     * @NL80211_ATTR_OPER_CLASS: operating class
     *
     * @NL80211_ATTR_MAC_MASK: MAC address mask
     *
     * @NL80211_ATTR_WIPHY_SELF_MANAGED_REG: flag attribute indicating this device
     *  is self-managing its regulatory information and any regulatory domain
     *  obtained from it is coming from the device's wiphy and not the global
     *  cfg80211 regdomain.
     *
     * @NL80211_ATTR_EXT_FEATURES: extended feature flags contained in a byte
     *  array. The feature flags are identified by their bit index (see &enum
     *  nl80211_ext_feature_index). The bit index is ordered starting at the
     *  least-significant bit of the first byte in the array, ie. bit index 0
     *  is located at bit 0 of byte 0. bit index 25 would be located at bit 1
     *  of byte 3 (u8 array).
     *
     * @NL80211_ATTR_SURVEY_RADIO_STATS: Request overall radio statistics to be
     *  returned along with other survey data. If set, @NL80211_CMD_GET_SURVEY
     *  may return a survey entry without a channel indicating global radio
     *  statistics (only some values are valid and make sense.)
     *  For devices that don't return such an entry even then, the information
     *  should be contained in the result as the sum of the respective counters
     *  over all channels.
     *
     * @NL80211_ATTR_SCHED_SCAN_DELAY: delay before the first cycle of a
     *  scheduled scan is started.  Or the delay before a WoWLAN
     *  net-detect scan is started, counting from the moment the
     *  system is suspended.  This value is a u32, in seconds.

     * @NL80211_ATTR_REG_INDOOR: flag attribute, if set indicates that the device
     *      is operating in an indoor environment.
     *
     * @NL80211_ATTR_MAX_NUM_SCHED_SCAN_PLANS: maximum number of scan plans for
     *  scheduled scan supported by the device (u32), a wiphy attribute.
     * @NL80211_ATTR_MAX_SCAN_PLAN_INTERVAL: maximum interval (in seconds) for
     *  a scan plan (u32), a wiphy attribute.
     * @NL80211_ATTR_MAX_SCAN_PLAN_ITERATIONS: maximum number of iterations in
     *  a scan plan (u32), a wiphy attribute.
     * @NL80211_ATTR_SCHED_SCAN_PLANS: a list of scan plans for scheduled scan.
     *  Each scan plan defines the number of scan iterations and the interval
     *  between scans. The last scan plan will always run infinitely,
     *  thus it must not specify the number of iterations, only the interval
     *  between scans. The scan plans are executed sequentially.
     *  Each scan plan is a nested attribute of &enum nl80211_sched_scan_plan.
     *
     * @NUM_NL80211_ATTR: total number of nl80211_attrs available
     * @NL80211_ATTR_MAX: highest attribute number currently defined
     * @__NL80211_ATTR_AFTER_LAST: internal use
     */

    nl80211_wlanattr_info: {
    /* don't change the order or add anything between, this is ABI! */
        NL80211_WLANATTR_UNSPEC                         : 0,

        NL80211_WLANATTR_WIPHY                          : 1,
        NL80211_WLANATTR_WIPHYNAME                     : 2,

        NL80211_WLANATTR_IFINDEX                        : 3,
        NL80211_WLANATTR_IFNAME                         : 4,
        NL80211_WLANATTR_IFTYPE                         : 5,

        NL80211_WLANATTR_MAC                            : 6,

        NL80211_WLANATTR_KEYDATA                       : 7,
        NL80211_WLANATTR_KEYIDX                        : 8,
        NL80211_WLANATTR_KEYCIPHER                     : 9,
        NL80211_WLANATTR_KEYSEQ                        : 10,
        NL80211_WLANATTR_KEYDEFAULT                    : 11,

        NL80211_WLANATTR_BEACONINTERVAL                : 12,
        NL80211_WLANATTR_DTIMPERIOD                    : 13,
        NL80211_WLANATTR_BEACONHEAD                    : 14,
        NL80211_WLANATTR_BEACONTAIL                    : 15,

        NL80211_WLANATTR_STAAID                        : 16,
        NL80211_WLANATTR_STAFLAGS                      : 17,
        NL80211_WLANATTR_STALISTENINTERVAL            : 18,
        NL80211_WLANATTR_STASUPPORTEDRATES            : 19,
        NL80211_WLANATTR_STAVLAN                       : 20,
        NL80211_WLANATTR_STAINFO                        : 21,

        NL80211_WLANATTR_WIPHYBANDS                    : 22,

        NL80211_WLANATTR_MNTRFLAGS                     : 23,

        NL80211_WLANATTR_MESHID                        : 24,
        NL80211_WLANATTR_STAPLINKACTION               : 25,
        NL80211_WLANATTR_MPATHNEXTHOP                 : 26,
        NL80211_WLANATTR_MPATHINFO                     : 27,

        NL80211_WLANATTR_BSSCTSPROT                   : 28,
        NL80211_WLANATTR_BSSSHORTPREAMBLE             : 29,
        NL80211_WLANATTR_BSSSHORTSLOT_TIME            : 30,

        NL80211_WLANATTR_HTCAPABILITY                  : 31,

        NL80211_WLANATTR_SUPPORTEDIFTYPES              : 32,

        NL80211_WLANATTR_REGALPHA2                     : 33,
        NL80211_WLANATTR_REGRULES                      : 34,

        NL80211_WLANATTR_MESHCONFIG                    : 35,

        NL80211_WLANATTR_BSSBASICRATES                : 36,

        NL80211_WLANATTR_WIPHYTXQPARAMS               : 37,
        NL80211_WLANATTR_WIPHYFREQ                     : 38,
        NL80211_WLANATTR_WIPHYCHANNELTYPE             : 39,

        NL80211_WLANATTR_KEYDEFAULTMGMT               : 40,

        NL80211_WLANATTR_MGMTSUBTYPE                   : 41,
        NL80211_WLANATTR_IE                             : 42,

        NL80211_WLANATTR_MAXNUMSCANSSIDS             : 43,

        NL80211_WLANATTR_SCANFREQUENCIES               : 44,
        NL80211_WLANATTR_SCANSSIDS                     : 45,
        NL80211_WLANATTR_GENERATION                     : 46, /* replaces old SCAN_GENERATION */
        NL80211_WLANATTR_BSS                            : 47,

        NL80211_WLANATTR_REGINITIATOR                  : 48,
        NL80211_WLANATTR_REGTYPE                       : 49,

        NL80211_WLANATTR_SUPPORTEDCOMMANDS             : 50,

        NL80211_WLANATTR_FRAME                          : 51,
        NL80211_WLANATTR_SSID                           : 52,
        NL80211_WLANATTR_AUTH_TYPE                      : 53,
        NL80211_WLANATTR_REASON_CODE                    : 54,

        NL80211_WLANATTR_KEYTYPE                       : 55,

        NL80211_WLANATTR_MAXSCANIELEN                : 56,
        NL80211_WLANATTR_CIPHERSUITES                  : 57,

        NL80211_WLANATTR_FREQBEFORE                    : 58,
        NL80211_WLANATTR_FREQAFTER                     : 59,

        NL80211_WLANATTR_FREQFIXED                     : 60,


        NL80211_WLANATTR_WIPHYRETRYSHORT              : 61,
        NL80211_WLANATTR_WIPHYRETRYLONG               : 62,
        NL80211_WLANATTR_WIPHYFRAGTHRESHOLD           : 63,
        NL80211_WLANATTR_WIPHYRTSTHRESHOLD            : 64,

        NL80211_WLANATTR_TIMEDOUT                      : 65,

        NL80211_WLANATTR_USEMFP                        : 66,

        NL80211_WLANATTR_STAFLAGS2                     : 67,

        NL80211_WLANATTR_CONTROLPORT                   : 68,

        NL80211_WLANATTR_TESTDATA                       : 69,

        NL80211_WLANATTR_PRIVACY                        : 70,

        NL80211_WLANATTR_DISCONNECTEDBYAP             : 71,
        NL80211_WLANATTR_STATUSCODE                    : 72,

        NL80211_WLANATTR_CIPHERSUITESPAIRWISE         : 73,
        NL80211_WLANATTR_CIPHERSUITEGROUP             : 74,
        NL80211_WLANATTR_WPAVERSIONS                   : 75,
        NL80211_WLANATTR_AKMSUITES                     : 76,

        NL80211_WLANATTR_REQIE                         : 77,
        NL80211_WLANATTR_RESPIE                        : 78,

        NL80211_WLANATTR_PREVBSSID                     : 79,

        NL80211_WLANATTR_KEY                            : 80,
        NL80211_WLANATTR_KEYS                           : 81,

        NL80211_WLANATTR_PID                            : 82,

        NL80211_WLANATTR_4ADDR                          : 83,

        NL80211_WLANATTR_SURVEYINFO                    : 84,

        NL80211_WLANATTR_PMKID                          : 85,
        NL80211_WLANATTR_MAXNUMPMKIDS                 : 86,

        NL80211_WLANATTR_DURATION                       : 87,

        NL80211_WLANATTR_COOKIE                         : 88,

        NL80211_WLANATTR_WIPHYCOVERAGECLASS           : 89,

        NL80211_WLANATTR_TXRATES                       : 90,

        NL80211_WLANATTR_FRAMEMATCH                    : 91,

        NL80211_WLANATTR_ACK                            : 92,

        NL80211_WLANATTR_PSSTATE                       : 93,

        NL80211_WLANATTR_CQM                            : 94,

        NL80211_WLANATTR_LOCALSTATECHANGE             : 95,

        NL80211_WLANATTR_APISOLATE                     : 96,

        NL80211_WLANATTR_WIPHYTXPOWERSETTING         : 97,
        NL80211_WLANATTR_WIPHYTXPOWERLEVEL           : 98,

        NL80211_WLANATTR_TXFRAMETYPES                 : 99,
        NL80211_WLANATTR_RXFRAMETYPES                 : 100,
        NL80211_WLANATTR_FRAMETYPE                     : 101,

        NL80211_WLANATTR_CONTROLPORTETHERTYPE         : 102,
        NL80211_WLANATTR_CONTROLPORTNOENCRYPT        : 103,

        NL80211_WLANATTR_SUPPORTIBSSRSN               : 104,

        NL80211_WLANATTR_WIPHYANTENNATX               : 105,
        NL80211_WLANATTR_WIPHYANTENNARX               : 106,

        NL80211_WLANATTR_MCASTRATE                     : 107,

        NL80211_WLANATTR_OFFCHANNELTXOK               : 108,

        NL80211_WLANATTR_BSSHTOPMODE                  : 109,

        NL80211_WLANATTR_KEYDEFAULTTYPES              : 110,

        NL80211_WLANATTR_MAXREMAINONCHANNELDURATION : 111,

        NL80211_WLANATTR_MESHSETUP                     : 112,

        NL80211_WLANATTR_WIPHYANTENNAAVAILTX         : 113,
        NL80211_WLANATTR_WIPHYANTENNAAVAILRX         : 114,

        NL80211_WLANATTR_SUPPORTMESHAUTH              : 115,
        NL80211_WLANATTR_STAPLINKSTATE                : 116,

        NL80211_WLANATTR_WOWLANTRIGGERS                : 117,
        NL80211_WLANATTR_WOWLANTRIGGERSSUPPORTED      : 118,

        NL80211_WLANATTR_SCHEDSCANINTERVAL            : 119,

        NL80211_WLANATTR_INTERFACECOMBINATIONS         : 120,
        NL80211_WLANATTR_SOFTWAREIFTYPES               : 121,

        NL80211_WLANATTR_REKEYDATA                     : 122,

        NL80211_WLANATTR_MAXNUMSCHEDSCANSSIDS       : 123,
        NL80211_WLANATTR_MAXSCHEDSCANIELEN          : 124,

        NL80211_WLANATTR_SCANSUPPRATES                : 125,

        NL80211_WLANATTR_HIDDENSSID                    : 126,

        NL80211_WLANATTR_IEPROBERESP                  : 127,
        NL80211_WLANATTR_IEASSOCRESP                  : 128,

        NL80211_WLANATTR_STAWME                        : 129,
        NL80211_WLANATTR_SUPPORTAPUAPSD               : 130,

        NL80211_WLANATTR_ROAMSUPPORT                   : 131,

        NL80211_WLANATTR_SCHEDSCANMATCH               : 132,
        NL80211_WLANATTR_MAXMATCHSETS                 : 133,

        NL80211_WLANATTR_PMKSACANDIDATE                : 134,

        NL80211_WLANATTR_TXNOCCKRATE                 : 135,

        NL80211_WLANATTR_TDLSACTION                    : 136,
        NL80211_WLANATTR_TDLSDIALOGTOKEN              : 137,
        NL80211_WLANATTR_TDLSOPERATION                 : 138,
        NL80211_WLANATTR_TDLSSUPPORT                   : 139,
        NL80211_WLANATTR_TDLSEXTERNALSETUP            : 140,

        NL80211_WLANATTR_DEVICEAPSME                  : 141,

        NL80211_WLANATTR_DONTWAITFORACK              : 142,

        NL80211_WLANATTR_FEATUREFLAGS                  : 143,

        NL80211_WLANATTR_PROBERESPOFFLOAD             : 144,

        NL80211_WLANATTR_PROBERESP                     : 145,

        NL80211_WLANATTR_DFSREGION                     : 146,

        NL80211_WLANATTR_DISABLEHT                     : 147,
        NL80211_WLANATTR_HTCAPABILITYMASK             : 148,

        NL80211_WLANATTR_NOACKMAP                      : 149,

        NL80211_WLANATTR_INACTIVITYTIMEOUT             : 150,

        NL80211_WLANATTR_RXSIGNALDBM                  : 151,

        NL80211_WLANATTR_BGSCANPERIOD                 : 152,

        NL80211_WLANATTR_WDEV                           : 153,

        NL80211_WLANATTR_USERREGHINTTYPE             : 154,

        NL80211_WLANATTR_CONNFAILEDREASON             : 155,

        NL80211_WLANATTR_SAEDATA                       : 156,

        NL80211_WLANATTR_VHTCAPABILITY                 : 157,

        NL80211_WLANATTR_SCANFLAGS                     : 158,

        NL80211_WLANATTR_CHANNELWIDTH                  : 159,
        NL80211_WLANATTR_CENTERFREQ1                   : 160,
        NL80211_WLANATTR_CENTERFREQ2                   : 161,

        NL80211_WLANATTR_P2PCTWINDOW                   : 162,
        NL80211_WLANATTR_P2POPPPS                      : 163,

        NL80211_WLANATTR_LOCALMESHPOWERMODE          : 164,

        NL80211_WLANATTR_ACLPOLICY                     : 165,

        NL80211_WLANATTR_MACADDRS                      : 166,

        NL80211_WLANATTR_MACACLMAX                    : 167,

        NL80211_WLANATTR_RADAREVENT                    : 168,

        NL80211_WLANATTR_EXTCAPA                       : 169,
        NL80211_WLANATTR_EXTCAPAMASK                  : 170,

        NL80211_WLANATTR_STACAPABILITY                 : 171,
        NL80211_WLANATTR_STAEXTCAPABILITY             : 172,

        NL80211_WLANATTR_PROTOCOLFEATURES              : 173,
        NL80211_WLANATTR_SPLITWIPHYDUMP               : 174,

        NL80211_WLANATTR_DISABLEVHT                    : 175,
        NL80211_WLANATTR_VHTCAPABILITYMASK            : 176,

        NL80211_WLANATTR_MDID                           : 177,
        NL80211_WLANATTR_IERIC                         : 178,

        NL80211_WLANATTR_CRITPROTID                   : 179,
        NL80211_WLANATTR_MAXCRITPROTDURATION         : 180,

        NL80211_WLANATTR_PEERAID                       : 181,

        NL80211_WLANATTR_COALESCERULE                  : 182,

        NL80211_WLANATTR_CHSWITCHCOUNT                : 183,
        NL80211_WLANATTR_CHSWITCHBLOCKTX             : 184,
        NL80211_WLANATTR_CSAIES                        : 185,
        NL80211_WLANATTR_CSACOFFBEACON               : 186,
        NL80211_WLANATTR_CSACOFFPRESP                : 187,

        NL80211_WLANATTR_RXMGMTFLAGS                   : 188,

        NL80211_WLANATTR_STASUPPORTEDCHANNELS         : 189,

        NL80211_WLANATTR_STASUPPORTEDOPERCLASSES     : 190,

        NL80211_WLANATTR_HANDLEDFS                     : 191,

        NL80211_WLANATTR_SUPPORT5MHZ                  : 192,
        NL80211_WLANATTR_SUPPORT10MHZ                 : 193,

        NL80211_WLANATTR_OPMODENOTIF                   : 194,

        NL80211_WLANATTR_VENDORID                      : 195,
        NL80211_WLANATTR_VENDORSUBCMD                  : 196,
        NL80211_WLANATTR_VENDORDATA                    : 197,
        NL80211_WLANATTR_VENDOREVENTS                  : 198,

        NL80211_WLANATTR_QOSMAP                        : 199,

        NL80211_WLANATTR_MACHINT                       : 200,
        NL80211_WLANATTR_WIPHYFREQHINT                : 201,

        NL80211_WLANATTR_MAXAPASSOCSTA               : 202,

        NL80211_WLANATTR_TDLSPEERCAPABILITY           : 203,

        NL80211_WLANATTR_SOCKETOWNER                   : 204,

        NL80211_WLANATTR_CSACOFFSETSTX               : 205,
        NL80211_WLANATTR_MAXCSACOUNTERS               : 206,

        NL80211_WLANATTR_TDLSINITIATOR                 : 207,

        NL80211_WLANATTR_USERRM                        : 208,

        NL80211_WLANATTR_WIPHYDYNACK                  : 209,

        NL80211_WLANATTR_TSID                           : 210,
        NL80211_WLANATTR_USERPRIO                      : 211,
        NL80211_WLANATTR_ADMITTEDTIME                  : 212,

        NL80211_WLANATTR_SMPSMODE                      : 213,

        NL80211_WLANATTR_OPERCLASS                     : 214,

        NL80211_WLANATTR_MACMASK                       : 215,

        NL80211_WLANATTR_WIPHYSELFMANAGEDREG         : 216,

        NL80211_WLANATTR_EXTFEATURES                   : 217,

        NL80211_WLANATTR_SURVEYRADIOSTATS             : 218,

        NL80211_WLANATTR_NETNSFD                       : 219,

        NL80211_WLANATTR_SCHEDSCANDELAY               : 220,

        NL80211_WLANATTR_REGINDOOR                     : 221,

        NL80211_WLANATTR_MAXNUMSCHEDSCANPLANS       : 222,
        NL80211_WLANATTR_MAXSCANPLANINTERVAL         : 223,
        NL80211_WLANATTR_MAXSCANPLANITERATIONS       : 224,
        NL80211_WLANATTR_SCHEDSCANPLANS               : 225,
        NL80211_WLANATTR_SPEC                           :  {
                                                            1            : 'n/32',
                                                            3            : 'n/32',
                                                            4            : 's',
                                                            5            : 'n/32',
                                                            6            : 'm',
                                                            38           : 'n/32',
                                                            39           : 'n/32',
                                                            46           : 'n/32',
                                                            52           : 's',
                                                            21           : 'r/nl80211_sta_info',
                                                            84           : 'r/nl80211_survey_info',
                                                           153           : 'n/64',
                                                           159           : 'n/32',
                                                           160           : 'n/32',
                                                           161           : 'n/32'
                                                    }
    },

    // **
    //  * enum nl80211_iftype - (virtual) interface types
    //  *
    //  * @NL80211_IFTYPE_UNSPECIFIED: unspecified type, driver decides
    //  * @NL80211_IFTYPE_ADHOC: independent BSS member
    //  * @NL80211_IFTYPE_STATION: managed BSS member
    //  * @NL80211_IFTYPE_AP: access point
    //  * @NL80211_IFTYPE_AP_VLAN: VLAN interface for access points; VLAN interfaces
    //  *  are a bit special in that they must always be tied to a pre-existing
    //  *  AP type interface.
    //  * @NL80211_IFTYPE_WDS: wireless distribution interface
    //  * @NL80211_IFTYPE_MONITOR: monitor interface receiving all frames
    //  * @NL80211_IFTYPE_MESH_POINT: mesh point
    //  * @NL80211_IFTYPE_P2P_CLIENT: P2P client
    //  * @NL80211_IFTYPE_P2P_GO: P2P group owner
    //  * @NL80211_IFTYPE_P2P_DEVICE: P2P device interface type, this is not a netdev
    //  *  and therefore can't be created in the normal ways, use the
    //  *  %NL80211_CMD_START_P2P_DEVICE and %NL80211_CMD_STOP_P2P_DEVICE
    //  *  commands to create and destroy one
    //  * @NL80211_IF_TYPE_OCB: Outside Context of a BSS
    //  *  This mode corresponds to the MIB variable dot11OCBActivated=true
    //  * @NL80211_IFTYPE_MAX: highest interface type number currently defined
    //  * @NUM_NL80211_IFTYPES: number of defined interface types
    //  *
    //  * These values are used with the %NL80211_ATTR_IFTYPE
    //  * to set the type of an interface.
    //  *
    //  */
    // enum_nl80211_iftype: {
    //     NL80211_IFTYPE_UNSPECIFIED:     0,
    //     NL80211_IFTYPE_ADHOC:           1,
    //     NL80211_IFTYPE_STATION:         2,
    //     NL80211_IFTYPE_AP:              3,
    //     NL80211_IFTYPE_AP_VLAN:         4,
    //     NL80211_IFTYPE_WDS:             5,
    //     NL80211_IFTYPE_MONITOR:         6,
    //     NL80211_IFTYPE_MESH_POINT:      7,
    //     NL80211_IFTYPE_P2P_CLIENT:      8,
    //     NL80211_IFTYPE_P2P_GO:          9,
    //     NL80211_IFTYPE_P2P_DEVICE:      10,
    //     NL80211_IFTYPE_OCB:             11,
    // },

    // /**
    //  * enum nl80211_sta_flags - station flags
    //  *
    //  * Station flags. When a station is added to an AP interface, it is
    //  * assumed to be already associated (and hence authenticated.)
    //  *
    //  * @__NL80211_STA_FLAG_INVALID: attribute number 0 is reserved
    //  * @NL80211_STA_FLAG_AUTHORIZED: station is authorized (802.1X)
    //  * @NL80211_STA_FLAG_SHORT_PREAMBLE: station is capable of receiving frames
    //  *  with short barker preamble
    //  * @NL80211_STA_FLAG_WME: station is WME/QoS capable
    //  * @NL80211_STA_FLAG_MFP: station uses management frame protection
    //  * @NL80211_STA_FLAG_AUTHENTICATED: station is authenticated
    //  * @NL80211_STA_FLAG_TDLS_PEER: station is a TDLS peer -- this flag should
    //  *  only be used in managed mode (even in the flags mask). Note that the
    //  *  flag can't be changed, it is only valid while adding a station, and
    //  *  attempts to change it will silently be ignored (rather than rejected
    //  *  as errors.)
    //  * @NL80211_STA_FLAG_ASSOCIATED: station is associated; used with drivers
    //  *  that support %NL80211_FEATURE_FULL_AP_CLIENT_STATE to transition a
    //  *  previously added station into associated state
    //  * @NL80211_STA_FLAG_MAX: highest station flag number currently defined
    //  * @__NL80211_STA_FLAG_AFTER_LAST: internal use
    //  */
    // enum nl80211_sta_flags {
    //     __NL80211_STA_FLAG_INVALID,
    //     NL80211_STA_FLAG_AUTHORIZED,
    //     NL80211_STA_FLAG_SHORT_PREAMBLE,
    //     NL80211_STA_FLAG_WME,
    //     NL80211_STA_FLAG_MFP,
    //     NL80211_STA_FLAG_AUTHENTICATED,
    //     NL80211_STA_FLAG_TDLS_PEER,
    //     NL80211_STA_FLAG_ASSOCIATED,

    //     /* keep last */
    //     __NL80211_STA_FLAG_AFTER_LAST,
    //     NL80211_STA_FLAG_MAX = __NL80211_STA_FLAG_AFTER_LAST - 1
    // };

    // #define NL80211_STA_FLAG_MAX_OLD_API    NL80211_STA_FLAG_TDLS_PEER

    // /**
    //  * struct nl80211_sta_flag_update - station flags mask/set
    //  * @mask: mask of station flags to set
    //  * @set: which values to set them to
    //  *
    //  * Both mask and set contain bits as per &enum nl80211_sta_flags.
    //  */
    // struct nl80211_sta_flag_update {
    //     __u32 mask;
    //     __u32 set;
    // } __attribute__((packed));

    // /**
    //  * enum nl80211_rate_info - bitrate information
    //  *
    //  * These attribute types are used with %NL80211_STA_INFO_TXRATE
    //  * when getting information about the bitrate of a station.
    //  * There are 2 attributes for bitrate, a legacy one that represents
    //  * a 16-bit value, and new one that represents a 32-bit value.
    //  * If the rate value fits into 16 bit, both attributes are reported
    //  * with the same value. If the rate is too high to fit into 16 bits
    //  * (>6.5535Gbps) only 32-bit attribute is included.
    //  * User space tools encouraged to use the 32-bit attribute and fall
    //  * back to the 16-bit one for compatibility with older kernels.
    //  *
    //  * @__NL80211_RATE_INFO_INVALID: attribute number 0 is reserved
    //  * @NL80211_RATE_INFO_BITRATE: total bitrate (u16, 100kbit/s)
    //  * @NL80211_RATE_INFO_MCS: mcs index for 802.11n (u8)
    //  * @NL80211_RATE_INFO_40_MHZ_WIDTH: 40 MHz dualchannel bitrate
    //  * @NL80211_RATE_INFO_SHORT_GI: 400ns guard interval
    //  * @NL80211_RATE_INFO_BITRATE32: total bitrate (u32, 100kbit/s)
    //  * @NL80211_RATE_INFO_MAX: highest rate_info number currently defined
    //  * @NL80211_RATE_INFO_VHT_MCS: MCS index for VHT (u8)
    //  * @NL80211_RATE_INFO_VHT_NSS: number of streams in VHT (u8)
    //  * @NL80211_RATE_INFO_80_MHZ_WIDTH: 80 MHz VHT rate
    //  * @NL80211_RATE_INFO_80P80_MHZ_WIDTH: unused - 80+80 is treated the
    //  *  same as 160 for purposes of the bitrates
    //  * @NL80211_RATE_INFO_160_MHZ_WIDTH: 160 MHz VHT rate
    //  * @NL80211_RATE_INFO_10_MHZ_WIDTH: 10 MHz width - note that this is
    //  *  a legacy rate and will be reported as the actual bitrate, i.e.
    //  *  half the base (20 MHz) rate
    //  * @NL80211_RATE_INFO_5_MHZ_WIDTH: 5 MHz width - note that this is
    //  *  a legacy rate and will be reported as the actual bitrate, i.e.
    //  *  a quarter of the base (20 MHz) rate
    //  * @__NL80211_RATE_INFO_AFTER_LAST: internal use
    //  */
    nl80211_rxrate_info: {
        NL80211_RXRATE_RXINVALID         : 0,
        NL80211_RXRATE_RXBITRATE         : 1,
        NL80211_RXRATE_RXMCS             : 2,
        NL80211_RXRATE_RX40MHZWIDTH    : 3,
        NL80211_RXRATE_RXSHORTGI        : 4,
        NL80211_RXRATE_RXBITRATE32       : 5,
        NL80211_RXRATE_RXVHTMCS         : 6,
        NL80211_RXRATE_RXVHTNSS         : 7,
        NL80211_RXRATE_RX80MHZWIDTH    : 8,
        NL80211_RXRATE_RX80P80MHZWIDTH : 9,
        NL80211_RXRATE_RX160MHZWIDTH   : 10,
        NL80211_RXRATE_RX10MHZWIDTH    : 11,
        NL80211_RXRATE_RX5MHZWIDTH     : 12,
        NL80211_RXRATE_SPEC            : ['', 'n/16', 'n/8', 's', 's', 'n/32', 'n/8', 'n/8', 's', 's', 's', 's','s'],
    },

    nl80211_txrate_info: {
        NL80211_TXRATE_TXINVALID         : 0,
        NL80211_TXRATE_TXBITRATE         : 1,
        NL80211_TXRATE_TXMCS             : 2,
        NL80211_TXRATE_TX40MHZWIDTH    : 3,
        NL80211_TXRATE_TXSHORTGI        : 4,
        NL80211_TXRATE_TXBITRATE32       : 5,
        NL80211_TXRATE_TXVHTMCS         : 6,
        NL80211_TXRATE_TXVHTNSS         : 7,
        NL80211_TXRATE_TX80MHZWIDTH    : 8,
        NL80211_TXRATE_TX80P80MHZWIDTH : 9,
        NL80211_TXRATE_TX160MHZWIDTH   : 10,
        NL80211_TXRATE_TX10MHZWIDTH    : 11,
        NL80211_TXRATE_TX5MHZWIDTH     : 12,
        NL80211_TXRATE_SPEC            : ['', 'n/16', 'n/8', 's', 's', 'n/32', 'n/8', 'n/8', 's', 's', 's', 's','s'],
    },

    // /**
    //  * enum nl80211_sta_bss_param - BSS information collected by STA
    //  *
    //  * These attribute types are used with %NL80211_STA_INFO_BSS_PARAM
    //  * when getting information about the bitrate of a station.
    //  *
    //  * @__NL80211_STA_BSS_PARAM_INVALID: attribute number 0 is reserved
    //  * @NL80211_STA_BSS_PARAM_CTS_PROT: whether CTS protection is enabled (flag)
    //  * @NL80211_STA_BSS_PARAM_SHORT_PREAMBLE:  whether short preamble is enabled
    //  *  (flag)
    //  * @NL80211_STA_BSS_PARAM_SHORT_SLOT_TIME:  whether short slot time is enabled
    //  *  (flag)
    //  * @NL80211_STA_BSS_PARAM_DTIM_PERIOD: DTIM period for beaconing (u8)
    //  * @NL80211_STA_BSS_PARAM_BEACON_INTERVAL: Beacon interval (u16)
    //  * @NL80211_STA_BSS_PARAM_MAX: highest sta_bss_param number currently defined
    //  * @__NL80211_STA_BSS_PARAM_AFTER_LAST: internal use
    //  */
    nl80211_stabss_info: {
        NL80211_STABSS_INVALID         : 0,
        NL80211_STABSS_CTSPROT         : 1,
        NL80211_STABSS_SHORTPREAMBLE   : 2,
        NL80211_STABSS_SHORTSLOTTIME   : 3,
        NL80211_STABSS_DTIMPERIOD      : 4,
        NL80211_STABSS_BEACONINTERVAL  : 5,
        NL80211_STABSS_SPEC            : ['', 'n64', 'n/64', 'n/64', 'n8', 'n16'],
    },

    // /**
    //  * enum nl80211_sta_info - station information
    //  *
    //  * These attribute types are used with %NL80211_ATTR_STA_INFO
    //  * when getting information about a station.
    //  *
    //  * @__NL80211_STA_INFO_INVALID: attribute number 0 is reserved
    //  * @NL80211_STA_INFO_INACTIVE_TIME: time since last activity (u32, msecs)
    //  * @NL80211_STA_INFO_RX_BYTES: total received bytes (MPDU length)
    //  *  (u32, from this station)
    //  * @NL80211_STA_INFO_TX_BYTES: total transmitted bytes (MPDU length)
    //  *  (u32, to this station)
    //  * @NL80211_STA_INFO_RX_BYTES64: total received bytes (MPDU length)
    //  *  (u64, from this station)
    //  * @NL80211_STA_INFO_TX_BYTES64: total transmitted bytes (MPDU length)
    //  *  (u64, to this station)
    //  * @NL80211_STA_INFO_SIGNAL: signal strength of last received PPDU (u8, dBm)
    //  * @NL80211_STA_INFO_TX_BITRATE: current unicast tx rate, nested attribute
    //  *  containing info as possible, see &enum nl80211_rate_info
    //  * @NL80211_STA_INFO_RX_PACKETS: total received packet (MSDUs and MMPDUs)
    //  *  (u32, from this station)
    //  * @NL80211_STA_INFO_TX_PACKETS: total transmitted packets (MSDUs and MMPDUs)
    //  *  (u32, to this station)
    //  * @NL80211_STA_INFO_TX_RETRIES: total retries (MPDUs) (u32, to this station)
    //  * @NL80211_STA_INFO_TX_FAILED: total failed packets (MPDUs)
    //  *  (u32, to this station)
    //  * @NL80211_STA_INFO_SIGNAL_AVG: signal strength average (u8, dBm)
    //  * @NL80211_STA_INFO_LLID: the station's mesh LLID
    //  * @NL80211_STA_INFO_PLID: the station's mesh PLID
    //  * @NL80211_STA_INFO_PLINK_STATE: peer link state for the station
    //  *  (see %enum nl80211_plink_state)
    //  * @NL80211_STA_INFO_RX_BITRATE: last unicast data frame rx rate, nested
    //  *  attribute, like NL80211_STA_INFO_TX_BITRATE.
    //  * @NL80211_STA_INFO_BSS_PARAM: current station's view of BSS, nested attribute
    //  *     containing info as possible, see &enum nl80211_sta_bss_param
    //  * @NL80211_STA_INFO_CONNECTED_TIME: time since the station is last connected
    //  * @NL80211_STA_INFO_STA_FLAGS: Contains a struct nl80211_sta_flag_update.
    //  * @NL80211_STA_INFO_BEACON_LOSS: count of times beacon loss was detected (u32)
    //  * @NL80211_STA_INFO_T_OFFSET: timing offset with respect to this STA (s64)
    //  * @NL80211_STA_INFO_LOCAL_PM: local mesh STA link-specific power mode
    //  * @NL80211_STA_INFO_PEER_PM: peer mesh STA link-specific power mode
    //  * @NL80211_STA_INFO_NONPEER_PM: neighbor mesh STA power save mode towards
    //  *  non-peer STA
    //  * @NL80211_STA_INFO_CHAIN_SIGNAL: per-chain signal strength of last PPDU
    //  *  Contains a nested array of signal strength attributes (u8, dBm)
    //  * @NL80211_STA_INFO_CHAIN_SIGNAL_AVG: per-chain signal strength average
    //  *  Same format as NL80211_STA_INFO_CHAIN_SIGNAL.
    //  * @NL80211_STA_EXPECTED_THROUGHPUT: expected throughput considering also the
    //  *  802.11 header (u32, kbps)
    //  * @NL80211_STA_INFO_RX_DROP_MISC: RX packets dropped for unspecified reasons
    //  *  (u64)
    //  * @NL80211_STA_INFO_BEACON_RX: number of beacons received from this peer (u64)
    //  * @NL80211_STA_INFO_BEACON_SIGNAL_AVG: signal strength average
    //  *  for beacons only (u8, dBm)
    //  * @NL80211_STA_INFO_TID_STATS: per-TID statistics (see &enum nl80211_tid_stats)
    //  *  This is a nested attribute where each the inner attribute number is the
    //  *  TID+1 and the special TID 16 (i.e. value 17) is used for non-QoS frames;
    //  *  each one of those is again nested with &enum nl80211_tid_stats
    //  *  attributes carrying the actual values.
    //  * @__NL80211_STA_INFO_AFTER_LAST: internal
    //  * @NL80211_STA_INFO_MAX: highest possible station info attribute
    //

    /*
        [NL80211_STA_INFO_INACTIVE_TIME] = { .type = NLA_U32 },
        [NL80211_STA_INFO_RX_BYTES] = { .type = NLA_U32 },
        [NL80211_STA_INFO_TX_BYTES] = { .type = NLA_U32 },
        [NL80211_STA_INFO_RX_PACKETS] = { .type = NLA_U32 },
        [NL80211_STA_INFO_TX_PACKETS] = { .type = NLA_U32 },
        [NL80211_STA_INFO_SIGNAL] = { .type = NLA_U8 },
        [NL80211_STA_INFO_T_OFFSET] = { .type = NLA_U64 },
        [NL80211_STA_INFO_TX_BITRATE] = { .type = NLA_NESTED },
        [NL80211_STA_INFO_RX_BITRATE] = { .type = NLA_NESTED },
        [NL80211_STA_INFO_LLID] = { .type = NLA_U16 },
        [NL80211_STA_INFO_PLID] = { .type = NLA_U16 },
        [NL80211_STA_INFO_PLINK_STATE] = { .type = NLA_U8 },
        [NL80211_STA_INFO_TX_RETRIES] = { .type = NLA_U32 },
        [NL80211_STA_INFO_TX_FAILED] = { .type = NLA_U32 },
        [NL80211_STA_INFO_STA_FLAGS] =
            { .minlen = sizeof(struct nl80211_sta_flag_update) },
        [NL80211_STA_INFO_LOCAL_PM] = { .type = NLA_U32},
        [NL80211_STA_INFO_PEER_PM] = { .type = NLA_U32},
        [NL80211_STA_INFO_NONPEER_PM] = { .type = NLA_U32},
        [NL80211_STA_INFO_CHAIN_SIGNAL] = { .type = NLA_NESTED },
        [NL80211_STA_INFO_CHAIN_SIGNAL_AVG] = { .type = NLA_NESTED },


    */

    nl80211_sta_info: {
        NL80211_STA_INVALID            : 0,
        NL80211_STA_INACTIVETIME      : 1,
        NL80211_STA_RXBYTES           : 2,
        NL80211_STA_TXBYTES           : 3,
        NL80211_STA_LLID               : 4,
        NL80211_STA_PLID               : 5,
        NL80211_STA_PLINKSTATE        : 6,
        NL80211_STA_SIGNAL             : 7,
        NL80211_STA_TXBITRATE         : 8,
        NL80211_STA_RXPACKETS         : 9,
        NL80211_STA_TXPACKETS         : 10,
        NL80211_STA_TXRETRIES         : 11,
        NL80211_STA_TXFAILED          : 12,
        NL80211_STA_SIGNALAVG         : 13,
        NL80211_STA_RXBITRATE         : 14,
        NL80211_STA_BSSPARAM          : 15,
        NL80211_STA_CONNECTEDTIME     : 16,
        NL80211_STA_FLAGS             : 17,
        NL80211_STA_BEACONLOSS        : 18,
        NL80211_STA_TOFFSET           : 19,
        NL80211_STA_LOCALPM           : 20,
        NL80211_STA_PEERPM            : 21,
        NL80211_STA_NONPEERPM         : 22,
        NL80211_STA_RXBYTES64         : 23,
        NL80211_STA_TXBYTES64         : 24,
        NL80211_STA_CHAINSIGNAL       : 25,
        NL80211_STA_CHAINSIGNAL_AVG   : 26,
        NL80211_STA_EXPECTEDTHROUGHPUT: 27,
        NL80211_STA_RXDROPMISC       : 28,
        NL80211_STA_BEACONRX          : 29,
        NL80211_STA_BEACONSIGNALAVG  : 30,
        NL80211_STA_TIDSTATS          : 31,
        NL80211_STA_SPEC               : ['','n/32','n/32','n/32','n/16','n/16','n/8','n/8','r/nl80211_txrate_info','n/32',
                                               'n/32',  'n/32', 'n/32', 'n/8','r/nl80211_rxrate_info', '',//l/nl80211_stabss_info',
                                               'n/32', 'n64', 'n/32', 'n/64', 'n/32', 'n/32', 'n/32', 'n/64', 'n/64',
                                               'l/nl80211_signal_info', 'l/nl80211_signal_info', 'n/32', 'n/64', 'n/64', 'n/8',
                                               ''] //i/nl80211_tidstatscontainer_info']
    },

    nl80211_signal_info:  {
        NL80211_SIGNAL_UNSPEC:    0,
        NL80211_SIGNAL_ELEM:     1,
        NL80211_SIGNAL_SPEC:     ['','n/8'],
    },



    nl80211_tidstatscontainer_info: {
        NL80211_TIDSTATSCONTAINER_INVALID:             0,
        NL80211_TIDSTATSCONTAINER_TID:                 1,
        NL80211_TIDSTATSCONTAINER_SPEC:                ['', 'r/nl80211_tidstats_info']
    },

    // /**
    //  * enum nl80211_tid_stats - per TID statistics attributes
    //  * @__NL80211_TID_STATS_INVALID: attribute number 0 is reserved
    //  * @NL80211_TID_STATS_RX_MSDU: number of MSDUs received (u64)
    //  * @NL80211_TID_STATS_TX_MSDU: number of MSDUs transmitted (or
    //  *  attempted to transmit; u64)
    //  * @NL80211_TID_STATS_TX_MSDU_RETRIES: number of retries for
    //  *  transmitted MSDUs (not counting the first attempt; u64)
    //  * @NL80211_TID_STATS_TX_MSDU_FAILED: number of failed transmitted
    //  *  MSDUs (u64)
    //  * @NUM_NL80211_TID_STATS: number of attributes here
    //  * @NL80211_TID_STATS_MAX: highest numbered attribute here
    //  */
    nl80211_tidstats_info : {
        NL80211_TIDSTATS_INVALID:             0,
        NL80211_TIDSTATS_RXMSDU:              1,
        NL80211_TIDSTATS_TXMSDU:              2,
        NL80211_TIDSTATS_TXMSDURETRIES:       3,
        NL80211_TIDSTATS_TXMSDUFAILED:        4,
        NL80211_TIDSTATS_SPEC:                ['', 'n/64', 'n/64', 'n/64', 'n/64'],
    },

    // /**
    //  * enum nl80211_mpath_flags - nl80211 mesh path flags
    //  *
    //  * @NL80211_MPATH_FLAG_ACTIVE: the mesh path is active
    //  * @NL80211_MPATH_FLAG_RESOLVING: the mesh path discovery process is running
    //  * @NL80211_MPATH_FLAG_SN_VALID: the mesh path contains a valid SN
    //  * @NL80211_MPATH_FLAG_FIXED: the mesh path has been manually set
    //  * @NL80211_MPATH_FLAG_RESOLVED: the mesh path discovery process succeeded
    //  */
    // enum nl80211_mpath_flags {
    //     NL80211_MPATH_FLAG_ACTIVE = 1<<0,
    //     NL80211_MPATH_FLAG_RESOLVING =  1<<1,
    //     NL80211_MPATH_FLAG_SN_VALID =   1<<2,
    //     NL80211_MPATH_FLAG_FIXED =  1<<3,
    //     NL80211_MPATH_FLAG_RESOLVED =   1<<4,
    // };

    // /**
    //  * enum nl80211_mpath_info - mesh path information
    //  *
    //  * These attribute types are used with %NL80211_ATTR_MPATH_INFO when getting
    //  * information about a mesh path.
    //  *
    //  * @__NL80211_MPATH_INFO_INVALID: attribute number 0 is reserved
    //  * @NL80211_MPATH_INFO_FRAME_QLEN: number of queued frames for this destination
    //  * @NL80211_MPATH_INFO_SN: destination sequence number
    //  * @NL80211_MPATH_INFO_METRIC: metric (cost) of this mesh path
    //  * @NL80211_MPATH_INFO_EXPTIME: expiration time for the path, in msec from now
    //  * @NL80211_MPATH_INFO_FLAGS: mesh path flags, enumerated in
    //  *  &enum nl80211_mpath_flags;
    //  * @NL80211_MPATH_INFO_DISCOVERY_TIMEOUT: total path discovery timeout, in msec
    //  * @NL80211_MPATH_INFO_DISCOVERY_RETRIES: mesh path discovery retries
    //  * @NL80211_MPATH_INFO_MAX: highest mesh path information attribute number
    //  *  currently defind
    //  * @__NL80211_MPATH_INFO_AFTER_LAST: internal use
    //  */
    // enum nl80211_mpath_info {
    //     __NL80211_MPATH_INFO_INVALID,
    //     NL80211_MPATH_INFO_FRAME_QLEN,
    //     NL80211_MPATH_INFO_SN,
    //     NL80211_MPATH_INFO_METRIC,
    //     NL80211_MPATH_INFO_EXPTIME,
    //     NL80211_MPATH_INFO_FLAGS,
    //     NL80211_MPATH_INFO_DISCOVERY_TIMEOUT,
    //     NL80211_MPATH_INFO_DISCOVERY_RETRIES,

    //     /* keep last */
    //     __NL80211_MPATH_INFO_AFTER_LAST,
    //     NL80211_MPATH_INFO_MAX = __NL80211_MPATH_INFO_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_band_attr - band attributes
    //  * @__NL80211_BAND_ATTR_INVALID: attribute number 0 is reserved
    //  * @NL80211_BAND_ATTR_FREQS: supported frequencies in this band,
    //  *  an array of nested frequency attributes
    //  * @NL80211_BAND_ATTR_RATES: supported bitrates in this band,
    //  *  an array of nested bitrate attributes
    //  * @NL80211_BAND_ATTR_HT_MCS_SET: 16-byte attribute containing the MCS set as
    //  *  defined in 802.11n
    //  * @NL80211_BAND_ATTR_HT_CAPA: HT capabilities, as in the HT information IE
    //  * @NL80211_BAND_ATTR_HT_AMPDU_FACTOR: A-MPDU factor, as in 11n
    //  * @NL80211_BAND_ATTR_HT_AMPDU_DENSITY: A-MPDU density, as in 11n
    //  * @NL80211_BAND_ATTR_VHT_MCS_SET: 32-byte attribute containing the MCS set as
    //  *  defined in 802.11ac
    //  * @NL80211_BAND_ATTR_VHT_CAPA: VHT capabilities, as in the HT information IE
    //  * @NL80211_BAND_ATTR_MAX: highest band attribute currently defined
    //  * @__NL80211_BAND_ATTR_AFTER_LAST: internal use
    //  */
    // enum nl80211_band_attr {
    //     __NL80211_BAND_ATTR_INVALID,
    //     NL80211_BAND_ATTR_FREQS,
    //     NL80211_BAND_ATTR_RATES,

    //     NL80211_BAND_ATTR_HT_MCS_SET,
    //     NL80211_BAND_ATTR_HT_CAPA,
    //     NL80211_BAND_ATTR_HT_AMPDU_FACTOR,
    //     NL80211_BAND_ATTR_HT_AMPDU_DENSITY,

    //     NL80211_BAND_ATTR_VHT_MCS_SET,
    //     NL80211_BAND_ATTR_VHT_CAPA,

    //     /* keep last */
    //     __NL80211_BAND_ATTR_AFTER_LAST,
    //     NL80211_BAND_ATTR_MAX = __NL80211_BAND_ATTR_AFTER_LAST - 1
    // };

    // #define NL80211_BAND_ATTR_HT_CAPA NL80211_BAND_ATTR_HT_CAPA

    // /**
    //  * enum nl80211_frequency_attr - frequency attributes
    //  * @__NL80211_FREQUENCY_ATTR_INVALID: attribute number 0 is reserved
    //  * @NL80211_FREQUENCY_ATTR_FREQ: Frequency in MHz
    //  * @NL80211_FREQUENCY_ATTR_DISABLED: Channel is disabled in current
    //  *  regulatory domain.
    //  * @NL80211_FREQUENCY_ATTR_NO_IR: no mechanisms that initiate radiation
    //  *  are permitted on this channel, this includes sending probe
    //  *  requests, or modes of operation that require beaconing.
    //  * @NL80211_FREQUENCY_ATTR_RADAR: Radar detection is mandatory
    //  *  on this channel in current regulatory domain.
    //  * @NL80211_FREQUENCY_ATTR_MAX_TX_POWER: Maximum transmission power in mBm
    //  *  (100 * dBm).
    //  * @NL80211_FREQUENCY_ATTR_DFS_STATE: current state for DFS
    //  *  (enum nl80211_dfs_state)
    //  * @NL80211_FREQUENCY_ATTR_DFS_TIME: time in miliseconds for how long
    //  *  this channel is in this DFS state.
    //  * @NL80211_FREQUENCY_ATTR_NO_HT40_MINUS: HT40- isn't possible with this
    //  *  channel as the control channel
    //  * @NL80211_FREQUENCY_ATTR_NO_HT40_PLUS: HT40+ isn't possible with this
    //  *  channel as the control channel
    //  * @NL80211_FREQUENCY_ATTR_NO_80MHZ: any 80 MHz channel using this channel
    //  *  as the primary or any of the secondary channels isn't possible,
    //  *  this includes 80+80 channels
    //  * @NL80211_FREQUENCY_ATTR_NO_160MHZ: any 160 MHz (but not 80+80) channel
    //  *  using this channel as the primary or any of the secondary channels
    //  *  isn't possible
    //  * @NL80211_FREQUENCY_ATTR_DFS_CAC_TIME: DFS CAC time in milliseconds.
    //  * @NL80211_FREQUENCY_ATTR_INDOOR_ONLY: Only indoor use is permitted on this
    //  *  channel. A channel that has the INDOOR_ONLY attribute can only be
    //  *  used when there is a clear assessment that the device is operating in
    //  *  an indoor surroundings, i.e., it is connected to AC power (and not
    //  *  through portable DC inverters) or is under the control of a master
    //  *  that is acting as an AP and is connected to AC power.
    //  * @NL80211_FREQUENCY_ATTR_IR_CONCURRENT: IR operation is allowed on this
    //  *  channel if it's connected concurrently to a BSS on the same channel on
    //  *  the 2 GHz band or to a channel in the same UNII band (on the 5 GHz
    //  *  band), and IEEE80211_CHAN_RADAR is not set. Instantiating a GO or TDLS
    //  *  off-channel on a channel that has the IR_CONCURRENT attribute set can be
    //  *  done when there is a clear assessment that the device is operating under
    //  *  the guidance of an authorized master, i.e., setting up a GO or TDLS
    //  *  off-channel while the device is also connected to an AP with DFS and
    //  *  radar detection on the UNII band (it is up to user-space, i.e.,
    //  *  wpa_supplicant to perform the required verifications). Using this
    //  *  attribute for IR is disallowed for master interfaces (IBSS, AP).
    //  * @NL80211_FREQUENCY_ATTR_NO_20MHZ: 20 MHz operation is not allowed
    //  *  on this channel in current regulatory domain.
    //  * @NL80211_FREQUENCY_ATTR_NO_10MHZ: 10 MHz operation is not allowed
    //  *  on this channel in current regulatory domain.
    //  * @NL80211_FREQUENCY_ATTR_MAX: highest frequency attribute number
    //  *  currently defined
    //  * @__NL80211_FREQUENCY_ATTR_AFTER_LAST: internal use
    //  *
    //  * See https://apps.fcc.gov/eas/comments/GetPublishedDocument.html?id=327&tn=528122
    //  * for more information on the FCC description of the relaxations allowed
    //  * by NL80211_FREQUENCY_ATTR_INDOOR_ONLY and
    //  * NL80211_FREQUENCY_ATTR_IR_CONCURRENT.
    //  */
    // enum nl80211_frequency_attr {
    //     __NL80211_FREQUENCY_ATTR_INVALID,
    //     NL80211_FREQUENCY_ATTR_FREQ,
    //     NL80211_FREQUENCY_ATTR_DISABLED,
    //     NL80211_FREQUENCY_ATTR_NO_IR,
    //     __NL80211_FREQUENCY_ATTR_NO_IBSS,
    //     NL80211_FREQUENCY_ATTR_RADAR,
    //     NL80211_FREQUENCY_ATTR_MAX_TX_POWER,
    //     NL80211_FREQUENCY_ATTR_DFS_STATE,
    //     NL80211_FREQUENCY_ATTR_DFS_TIME,
    //     NL80211_FREQUENCY_ATTR_NO_HT40_MINUS,
    //     NL80211_FREQUENCY_ATTR_NO_HT40_PLUS,
    //     NL80211_FREQUENCY_ATTR_NO_80MHZ,
    //     NL80211_FREQUENCY_ATTR_NO_160MHZ,
    //     NL80211_FREQUENCY_ATTR_DFS_CAC_TIME,
    //     NL80211_FREQUENCY_ATTR_INDOOR_ONLY,
    //     NL80211_FREQUENCY_ATTR_IR_CONCURRENT,
    //     NL80211_FREQUENCY_ATTR_NO_20MHZ,
    //     NL80211_FREQUENCY_ATTR_NO_10MHZ,

    //     /* keep last */
    //     __NL80211_FREQUENCY_ATTR_AFTER_LAST,
    //     NL80211_FREQUENCY_ATTR_MAX = __NL80211_FREQUENCY_ATTR_AFTER_LAST - 1
    // };

    // #define NL80211_FREQUENCY_ATTR_MAX_TX_POWER NL80211_FREQUENCY_ATTR_MAX_TX_POWER
    // #define NL80211_FREQUENCY_ATTR_PASSIVE_SCAN NL80211_FREQUENCY_ATTR_NO_IR
    // #define NL80211_FREQUENCY_ATTR_NO_IBSS      NL80211_FREQUENCY_ATTR_NO_IR
    // #define NL80211_FREQUENCY_ATTR_NO_IR        NL80211_FREQUENCY_ATTR_NO_IR
    // #define NL80211_FREQUENCY_ATTR_GO_CONCURRENT \
    //                     NL80211_FREQUENCY_ATTR_IR_CONCURRENT

    // /**
    //  * enum nl80211_bitrate_attr - bitrate attributes
    //  * @__NL80211_BITRATE_ATTR_INVALID: attribute number 0 is reserved
    //  * @NL80211_BITRATE_ATTR_RATE: Bitrate in units of 100 kbps
    //  * @NL80211_BITRATE_ATTR_2GHZ_SHORTPREAMBLE: Short preamble supported
    //  *  in 2.4 GHz band.
    //  * @NL80211_BITRATE_ATTR_MAX: highest bitrate attribute number
    //  *  currently defined
    //  * @__NL80211_BITRATE_ATTR_AFTER_LAST: internal use
    //  */
    // enum nl80211_bitrate_attr {
    //     __NL80211_BITRATE_ATTR_INVALID,
    //     NL80211_BITRATE_ATTR_RATE,
    //     NL80211_BITRATE_ATTR_2GHZ_SHORTPREAMBLE,

    //     /* keep last */
    //     __NL80211_BITRATE_ATTR_AFTER_LAST,
    //     NL80211_BITRATE_ATTR_MAX = __NL80211_BITRATE_ATTR_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_initiator - Indicates the initiator of a reg domain request
    //  * @NL80211_REGDOM_SET_BY_CORE: Core queried CRDA for a dynamic world
    //  *  regulatory domain.
    //  * @NL80211_REGDOM_SET_BY_USER: User asked the wireless core to set the
    //  *  regulatory domain.
    //  * @NL80211_REGDOM_SET_BY_DRIVER: a wireless drivers has hinted to the
    //  *  wireless core it thinks its knows the regulatory domain we should be in.
    //  * @NL80211_REGDOM_SET_BY_COUNTRY_IE: the wireless core has received an
    //  *  802.11 country information element with regulatory information it
    //  *  thinks we should consider. cfg80211 only processes the country
    //  *  code from the IE, and relies on the regulatory domain information
    //  *  structure passed by userspace (CRDA) from our wireless-regdb.
    //  *  If a channel is enabled but the country code indicates it should
    //  *  be disabled we disable the channel and re-enable it upon disassociation.
    //  */
    // enum nl80211_reg_initiator {
    //     NL80211_REGDOM_SET_BY_CORE,
    //     NL80211_REGDOM_SET_BY_USER,
    //     NL80211_REGDOM_SET_BY_DRIVER,
    //     NL80211_REGDOM_SET_BY_COUNTRY_IE,
    // };

    // /**
    //  * enum nl80211_reg_type - specifies the type of regulatory domain
    //  * @NL80211_REGDOM_TYPE_COUNTRY: the regulatory domain set is one that pertains
    //  *  to a specific country. When this is set you can count on the
    //  *  ISO / IEC 3166 alpha2 country code being valid.
    //  * @NL80211_REGDOM_TYPE_WORLD: the regulatory set domain is the world regulatory
    //  *  domain.
    //  * @NL80211_REGDOM_TYPE_CUSTOM_WORLD: the regulatory domain set is a custom
    //  *  driver specific world regulatory domain. These do not apply system-wide
    //  *  and are only applicable to the individual devices which have requested
    //  *  them to be applied.
    //  * @NL80211_REGDOM_TYPE_INTERSECTION: the regulatory domain set is the product
    //  *  of an intersection between two regulatory domains -- the previously
    //  *  set regulatory domain on the system and the last accepted regulatory
    //  *  domain request to be processed.
    //  */
    // enum nl80211_reg_type {
    //     NL80211_REGDOM_TYPE_COUNTRY,
    //     NL80211_REGDOM_TYPE_WORLD,
    //     NL80211_REGDOM_TYPE_CUSTOM_WORLD,
    //     NL80211_REGDOM_TYPE_INTERSECTION,
    // };

    // /**
    //  * enum nl80211_reg_rule_attr - regulatory rule attributes
    //  * @__NL80211_REG_RULE_ATTR_INVALID: attribute number 0 is reserved
    //  * @NL80211_ATTR_REG_RULE_FLAGS: a set of flags which specify additional
    //  *  considerations for a given frequency range. These are the
    //  *  &enum nl80211_reg_rule_flags.
    //  * @NL80211_ATTR_FREQ_RANGE_START: starting frequencry for the regulatory
    //  *  rule in KHz. This is not a center of frequency but an actual regulatory
    //  *  band edge.
    //  * @NL80211_ATTR_FREQ_RANGE_END: ending frequency for the regulatory rule
    //  *  in KHz. This is not a center a frequency but an actual regulatory
    //  *  band edge.
    //  * @NL80211_ATTR_FREQ_RANGE_MAX_BW: maximum allowed bandwidth for this
    //  *  frequency range, in KHz.
    //  * @NL80211_ATTR_POWER_RULE_MAX_ANT_GAIN: the maximum allowed antenna gain
    //  *  for a given frequency range. The value is in mBi (100 * dBi).
    //  *  If you don't have one then don't send this.
    //  * @NL80211_ATTR_POWER_RULE_MAX_EIRP: the maximum allowed EIRP for
    //  *  a given frequency range. The value is in mBm (100 * dBm).
    //  * @NL80211_ATTR_DFS_CAC_TIME: DFS CAC time in milliseconds.
    //  *  If not present or 0 default CAC time will be used.
    //  * @NL80211_REG_RULE_ATTR_MAX: highest regulatory rule attribute number
    //  *  currently defined
    //  * @__NL80211_REG_RULE_ATTR_AFTER_LAST: internal use
    //  */
    // enum nl80211_reg_rule_attr {
    //     __NL80211_REG_RULE_ATTR_INVALID,
    //     NL80211_ATTR_REG_RULE_FLAGS,

    //     NL80211_ATTR_FREQ_RANGE_START,
    //     NL80211_ATTR_FREQ_RANGE_END,
    //     NL80211_ATTR_FREQ_RANGE_MAX_BW,

    //     NL80211_ATTR_POWER_RULE_MAX_ANT_GAIN,
    //     NL80211_ATTR_POWER_RULE_MAX_EIRP,

    //     NL80211_ATTR_DFS_CAC_TIME,

    //     /* keep last */
    //     __NL80211_REG_RULE_ATTR_AFTER_LAST,
    //     NL80211_REG_RULE_ATTR_MAX = __NL80211_REG_RULE_ATTR_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_sched_scan_match_attr - scheduled scan match attributes
    //  * @__NL80211_SCHED_SCAN_MATCH_ATTR_INVALID: attribute number 0 is reserved
    //  * @NL80211_SCHED_SCAN_MATCH_ATTR_SSID: SSID to be used for matching,
    //  *  only report BSS with matching SSID.
    //  * @NL80211_SCHED_SCAN_MATCH_ATTR_RSSI: RSSI threshold (in dBm) for reporting a
    //  *  BSS in scan results. Filtering is turned off if not specified. Note that
    //  *  if this attribute is in a match set of its own, then it is treated as
    //  *  the default value for all matchsets with an SSID, rather than being a
    //  *  matchset of its own without an RSSI filter. This is due to problems with
    //  *  how this API was implemented in the past. Also, due to the same problem,
    //  *  the only way to create a matchset with only an RSSI filter (with this
    //  *  attribute) is if there's only a single matchset with the RSSI attribute.
    //  * @NL80211_SCHED_SCAN_MATCH_ATTR_MAX: highest scheduled scan filter
    //  *  attribute number currently defined
    //  * @__NL80211_SCHED_SCAN_MATCH_ATTR_AFTER_LAST: internal use
    //  */
    // enum nl80211_sched_scan_match_attr {
    //     __NL80211_SCHED_SCAN_MATCH_ATTR_INVALID,

    //     NL80211_SCHED_SCAN_MATCH_ATTR_SSID,
    //     NL80211_SCHED_SCAN_MATCH_ATTR_RSSI,

    //     /* keep last */
    //     __NL80211_SCHED_SCAN_MATCH_ATTR_AFTER_LAST,
    //     NL80211_SCHED_SCAN_MATCH_ATTR_MAX =
    //         __NL80211_SCHED_SCAN_MATCH_ATTR_AFTER_LAST - 1
    // };

    // /* only for backward compatibility */
    // #define NL80211_ATTR_SCHED_SCAN_MATCH_SSID NL80211_SCHED_SCAN_MATCH_ATTR_SSID

    // /**
    //  * enum nl80211_reg_rule_flags - regulatory rule flags
    //  *
    //  * @NL80211_RRF_NO_OFDM: OFDM modulation not allowed
    //  * @NL80211_RRF_NO_CCK: CCK modulation not allowed
    //  * @NL80211_RRF_NO_INDOOR: indoor operation not allowed
    //  * @NL80211_RRF_NO_OUTDOOR: outdoor operation not allowed
    //  * @NL80211_RRF_DFS: DFS support is required to be used
    //  * @NL80211_RRF_PTP_ONLY: this is only for Point To Point links
    //  * @NL80211_RRF_PTMP_ONLY: this is only for Point To Multi Point links
    //  * @NL80211_RRF_NO_IR: no mechanisms that initiate radiation are allowed,
    //  *  this includes probe requests or modes of operation that require
    //  *  beaconing.
    //  * @NL80211_RRF_AUTO_BW: maximum available bandwidth should be calculated
    //  *  base on contiguous rules and wider channels will be allowed to cross
    //  *  multiple contiguous/overlapping frequency ranges.
    //  * @NL80211_RRF_IR_CONCURRENT: See &NL80211_FREQUENCY_ATTR_IR_CONCURRENT
    //  * @NL80211_RRF_NO_HT40MINUS: channels can't be used in HT40- operation
    //  * @NL80211_RRF_NO_HT40PLUS: channels can't be used in HT40+ operation
    //  * @NL80211_RRF_NO_80MHZ: 80MHz operation not allowed
    //  * @NL80211_RRF_NO_160MHZ: 160MHz operation not allowed
    //  */
    // enum nl80211_reg_rule_flags {
    //     NL80211_RRF_NO_OFDM     = 1<<0,
    //     NL80211_RRF_NO_CCK      = 1<<1,
    //     NL80211_RRF_NO_INDOOR       = 1<<2,
    //     NL80211_RRF_NO_OUTDOOR      = 1<<3,
    //     NL80211_RRF_DFS         = 1<<4,
    //     NL80211_RRF_PTP_ONLY        = 1<<5,
    //     NL80211_RRF_PTMP_ONLY       = 1<<6,
    //     NL80211_RRF_NO_IR       = 1<<7,
    //     __NL80211_RRF_NO_IBSS       = 1<<8,
    //     NL80211_RRF_AUTO_BW     = 1<<11,
    //     NL80211_RRF_IR_CONCURRENT   = 1<<12,
    //     NL80211_RRF_NO_HT40MINUS    = 1<<13,
    //     NL80211_RRF_NO_HT40PLUS     = 1<<14,
    //     NL80211_RRF_NO_80MHZ        = 1<<15,
    //     NL80211_RRF_NO_160MHZ       = 1<<16,
    // };

    // #define NL80211_RRF_PASSIVE_SCAN    NL80211_RRF_NO_IR
    // #define NL80211_RRF_NO_IBSS     NL80211_RRF_NO_IR
    // #define NL80211_RRF_NO_IR       NL80211_RRF_NO_IR
    // #define NL80211_RRF_NO_HT40     (NL80211_RRF_NO_HT40MINUS |\
    //                      NL80211_RRF_NO_HT40PLUS)
    // #define NL80211_RRF_GO_CONCURRENT   NL80211_RRF_IR_CONCURRENT

    // /* For backport compatibility with older userspace */
    // #define NL80211_RRF_NO_IR_ALL       (NL80211_RRF_NO_IR | __NL80211_RRF_NO_IBSS)

    // /**
    //  * enum nl80211_dfs_regions - regulatory DFS regions
    //  *
    //  * @NL80211_DFS_UNSET: Country has no DFS master region specified
    //  * @NL80211_DFS_FCC: Country follows DFS master rules from FCC
    //  * @NL80211_DFS_ETSI: Country follows DFS master rules from ETSI
    //  * @NL80211_DFS_JP: Country follows DFS master rules from JP/MKK/Telec
    //  */
    // enum nl80211_dfs_regions {
    //     NL80211_DFS_UNSET   = 0,
    //     NL80211_DFS_FCC     = 1,
    //     NL80211_DFS_ETSI    = 2,
    //     NL80211_DFS_JP      = 3,
    // };

    // /**
    //  * enum nl80211_user_reg_hint_type - type of user regulatory hint
    //  *
    //  * @NL80211_USER_REG_HINT_USER: a user sent the hint. This is always
    //  *  assumed if the attribute is not set.
    //  * @NL80211_USER_REG_HINT_CELL_BASE: the hint comes from a cellular
    //  *  base station. Device drivers that have been tested to work
    //  *  properly to support this type of hint can enable these hints
    //  *  by setting the NL80211_FEATURE_CELL_BASE_REG_HINTS feature
    //  *  capability on the struct wiphy. The wireless core will
    //  *  ignore all cell base station hints until at least one device
    //  *  present has been registered with the wireless core that
    //  *  has listed NL80211_FEATURE_CELL_BASE_REG_HINTS as a
    //  *  supported feature.
    //  * @NL80211_USER_REG_HINT_INDOOR: a user sent an hint indicating that the
    //  *  platform is operating in an indoor environment.
    //  */
    // enum nl80211_user_reg_hint_type {
    //     NL80211_USER_REG_HINT_USER  = 0,
    //     NL80211_USER_REG_HINT_CELL_BASE = 1,
    //     NL80211_USER_REG_HINT_INDOOR    = 2,
    // };

    /**
     * enum nl80211_survey_info - survey information
     *
     * These attribute types are used with %NL80211_ATTR_SURVEY_INFO
     * when getting information about a survey.
     *
     * @__NL80211_SURVEY_INFO_INVALID: attribute number 0 is reserved
     * @NL80211_SURVEY_INFO_FREQUENCY: center frequency of channel
     * @NL80211_SURVEY_INFO_NOISE: noise level of channel (u8, dBm)
     * @NL80211_SURVEY_INFO_IN_USE: channel is currently being used
     * @NL80211_SURVEY_INFO_TIME: amount of time (in ms) that the radio
     *  was turned on (on channel or globally)
     * @NL80211_SURVEY_INFO_TIME_BUSY: amount of the time the primary
     *  channel was sensed busy (either due to activity or energy detect)
     * @NL80211_SURVEY_INFO_TIME_EXT_BUSY: amount of time the extension
     *  channel was sensed busy
     * @NL80211_SURVEY_INFO_TIME_RX: amount of time the radio spent
     *  receiving data (on channel or globally)
     * @NL80211_SURVEY_INFO_TIME_TX: amount of time the radio spent
     *  transmitting data (on channel or globally)
     * @NL80211_SURVEY_INFO_TIME_SCAN: time the radio spent for scan
     *  (on this channel or globally)
     * @NL80211_SURVEY_INFO_MAX: highest survey info attribute number
     *  currently defined
     * @__NL80211_SURVEY_INFO_AFTER_LAST: internal use
     */
    nl80211_survey_info: {
        NL80211_SURVEY_UNSPEC:          0,
        NL80211_SURVEY_FREQUENCY:       1,
        NL80211_SURVEY_NOISE:           2,
        NL80211_SURVEY_INUSE:          3,
        NL80211_SURVEY_TIME:            4,
        NL80211_SURVEY_TIMEBUSY:       5,
        NL80211_SURVEY_TIMEEXTBUSY:   6,
        NL80211_SURVEY_TIMERX:         7,
        NL80211_SURVEY_TIMETX:         8,
        NL80211_SURVEY_TIMESCAN:       9,
        NL80211_SURVEY_SPEC:            ['', 'n/32', 'n/8', '', 'n/64', 'n/64', 'n/64', 'n/64', 'n/64', 'n/64']

    },

    // /* keep old names for compatibility */
    // #define NL80211_SURVEY_INFO_CHANNEL_TIME        NL80211_SURVEY_INFO_TIME
    // #define NL80211_SURVEY_INFO_CHANNEL_TIME_BUSY       NL80211_SURVEY_INFO_TIME_BUSY
    // #define NL80211_SURVEY_INFO_CHANNEL_TIME_EXT_BUSY   NL80211_SURVEY_INFO_TIME_EXT_BUSY
    // #define NL80211_SURVEY_INFO_CHANNEL_TIME_RX     NL80211_SURVEY_INFO_TIME_RX
    // #define NL80211_SURVEY_INFO_CHANNEL_TIME_TX     NL80211_SURVEY_INFO_TIME_TX

    // /**
    //  * enum nl80211_mntr_flags - monitor configuration flags
    //  *
    //  * Monitor configuration flags.
    //  *
    //  * @__NL80211_MNTR_FLAG_INVALID: reserved
    //  *
    //  * @NL80211_MNTR_FLAG_FCSFAIL: pass frames with bad FCS
    //  * @NL80211_MNTR_FLAG_PLCPFAIL: pass frames with bad PLCP
    //  * @NL80211_MNTR_FLAG_CONTROL: pass control frames
    //  * @NL80211_MNTR_FLAG_OTHER_BSS: disable BSSID filtering
    //  * @NL80211_MNTR_FLAG_COOK_FRAMES: report frames after processing.
    //  *  overrides all other flags.
    //  * @NL80211_MNTR_FLAG_ACTIVE: use the configured MAC address
    //  *  and ACK incoming unicast packets.
    //  *
    //  * @__NL80211_MNTR_FLAG_AFTER_LAST: internal use
    //  * @NL80211_MNTR_FLAG_MAX: highest possible monitor flag
    //  */
    // enum nl80211_mntr_flags {
    //     __NL80211_MNTR_FLAG_INVALID,
    //     NL80211_MNTR_FLAG_FCSFAIL,
    //     NL80211_MNTR_FLAG_PLCPFAIL,
    //     NL80211_MNTR_FLAG_CONTROL,
    //     NL80211_MNTR_FLAG_OTHER_BSS,
    //     NL80211_MNTR_FLAG_COOK_FRAMES,
    //     NL80211_MNTR_FLAG_ACTIVE,

    //     /* keep last */
    //     __NL80211_MNTR_FLAG_AFTER_LAST,
    //     NL80211_MNTR_FLAG_MAX = __NL80211_MNTR_FLAG_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_mesh_power_mode - mesh power save modes
    //  *
    //  * @NL80211_MESH_POWER_UNKNOWN: The mesh power mode of the mesh STA is
    //  *  not known or has not been set yet.
    //  * @NL80211_MESH_POWER_ACTIVE: Active mesh power mode. The mesh STA is
    //  *  in Awake state all the time.
    //  * @NL80211_MESH_POWER_LIGHT_SLEEP: Light sleep mode. The mesh STA will
    //  *  alternate between Active and Doze states, but will wake up for
    //  *  neighbor's beacons.
    //  * @NL80211_MESH_POWER_DEEP_SLEEP: Deep sleep mode. The mesh STA will
    //  *  alternate between Active and Doze states, but may not wake up
    //  *  for neighbor's beacons.
    //  *
    //  * @__NL80211_MESH_POWER_AFTER_LAST - internal use
    //  * @NL80211_MESH_POWER_MAX - highest possible power save level
    //  */

    // enum nl80211_mesh_power_mode {
    //     NL80211_MESH_POWER_UNKNOWN,
    //     NL80211_MESH_POWER_ACTIVE,
    //     NL80211_MESH_POWER_LIGHT_SLEEP,
    //     NL80211_MESH_POWER_DEEP_SLEEP,

    //     __NL80211_MESH_POWER_AFTER_LAST,
    //     NL80211_MESH_POWER_MAX = __NL80211_MESH_POWER_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_meshconf_params - mesh configuration parameters
    //  *
    //  * Mesh configuration parameters. These can be changed while the mesh is
    //  * active.
    //  *
    //  * @__NL80211_MESHCONF_INVALID: internal use
    //  *
    //  * @NL80211_MESHCONF_RETRY_TIMEOUT: specifies the initial retry timeout in
    //  *  millisecond units, used by the Peer Link Open message
    //  *
    //  * @NL80211_MESHCONF_CONFIRM_TIMEOUT: specifies the initial confirm timeout, in
    //  *  millisecond units, used by the peer link management to close a peer link
    //  *
    //  * @NL80211_MESHCONF_HOLDING_TIMEOUT: specifies the holding timeout, in
    //  *  millisecond units
    //  *
    //  * @NL80211_MESHCONF_MAX_PEER_LINKS: maximum number of peer links allowed
    //  *  on this mesh interface
    //  *
    //  * @NL80211_MESHCONF_MAX_RETRIES: specifies the maximum number of peer link
    //  *  open retries that can be sent to establish a new peer link instance in a
    //  *  mesh
    //  *
    //  * @NL80211_MESHCONF_TTL: specifies the value of TTL field set at a source mesh
    //  *  point.
    //  *
    //  * @NL80211_MESHCONF_AUTO_OPEN_PLINKS: whether we should automatically open
    //  *  peer links when we detect compatible mesh peers. Disabled if
    //  *  @NL80211_MESH_SETUP_USERSPACE_MPM or @NL80211_MESH_SETUP_USERSPACE_AMPE are
    //  *  set.
    //  *
    //  * @NL80211_MESHCONF_HWMP_MAX_PREQ_RETRIES: the number of action frames
    //  *  containing a PREQ that an MP can send to a particular destination (path
    //  *  target)
    //  *
    //  * @NL80211_MESHCONF_PATH_REFRESH_TIME: how frequently to refresh mesh paths
    //  *  (in milliseconds)
    //  *
    //  * @NL80211_MESHCONF_MIN_DISCOVERY_TIMEOUT: minimum length of time to wait
    //  *  until giving up on a path discovery (in milliseconds)
    //  *
    //  * @NL80211_MESHCONF_HWMP_ACTIVE_PATH_TIMEOUT: The time (in TUs) for which mesh
    //  *  points receiving a PREQ shall consider the forwarding information from
    //  *  the root to be valid. (TU = time unit)
    //  *
    //  * @NL80211_MESHCONF_HWMP_PREQ_MIN_INTERVAL: The minimum interval of time (in
    //  *  TUs) during which an MP can send only one action frame containing a PREQ
    //  *  reference element
    //  *
    //  * @NL80211_MESHCONF_HWMP_NET_DIAM_TRVS_TIME: The interval of time (in TUs)
    //  *  that it takes for an HWMP information element to propagate across the
    //  *  mesh
    //  *
    //  * @NL80211_MESHCONF_HWMP_ROOTMODE: whether root mode is enabled or not
    //  *
    //  * @NL80211_MESHCONF_ELEMENT_TTL: specifies the value of TTL field set at a
    //  *  source mesh point for path selection elements.
    //  *
    //  * @NL80211_MESHCONF_HWMP_RANN_INTERVAL:  The interval of time (in TUs) between
    //  *  root announcements are transmitted.
    //  *
    //  * @NL80211_MESHCONF_GATE_ANNOUNCEMENTS: Advertise that this mesh station has
    //  *  access to a broader network beyond the MBSS.  This is done via Root
    //  *  Announcement frames.
    //  *
    //  * @NL80211_MESHCONF_HWMP_PERR_MIN_INTERVAL: The minimum interval of time (in
    //  *  TUs) during which a mesh STA can send only one Action frame containing a
    //  *  PERR element.
    //  *
    //  * @NL80211_MESHCONF_FORWARDING: set Mesh STA as forwarding or non-forwarding
    //  *  or forwarding entity (default is TRUE - forwarding entity)
    //  *
    //  * @NL80211_MESHCONF_RSSI_THRESHOLD: RSSI threshold in dBm. This specifies the
    //  *  threshold for average signal strength of candidate station to establish
    //  *  a peer link.
    //  *
    //  * @NL80211_MESHCONF_SYNC_OFFSET_MAX_NEIGHBOR: maximum number of neighbors
    //  *  to synchronize to for 11s default synchronization method
    //  *  (see 11C.12.2.2)
    //  *
    //  * @NL80211_MESHCONF_HT_OPMODE: set mesh HT protection mode.
    //  *
    //  * @NL80211_MESHCONF_ATTR_MAX: highest possible mesh configuration attribute
    //  *
    //  * @NL80211_MESHCONF_HWMP_PATH_TO_ROOT_TIMEOUT: The time (in TUs) for
    //  *  which mesh STAs receiving a proactive PREQ shall consider the forwarding
    //  *  information to the root mesh STA to be valid.
    //  *
    //  * @NL80211_MESHCONF_HWMP_ROOT_INTERVAL: The interval of time (in TUs) between
    //  *  proactive PREQs are transmitted.
    //  *
    //  * @NL80211_MESHCONF_HWMP_CONFIRMATION_INTERVAL: The minimum interval of time
    //  *  (in TUs) during which a mesh STA can send only one Action frame
    //  *  containing a PREQ element for root path confirmation.
    //  *
    //  * @NL80211_MESHCONF_POWER_MODE: Default mesh power mode for new peer links.
    //  *  type &enum nl80211_mesh_power_mode (u32)
    //  *
    //  * @NL80211_MESHCONF_AWAKE_WINDOW: awake window duration (in TUs)
    //  *
    //  * @NL80211_MESHCONF_PLINK_TIMEOUT: If no tx activity is seen from a STA we've
    //  *  established peering with for longer than this time (in seconds), then
    //  *  remove it from the STA's list of peers. You may set this to 0 to disable
    //  *  the removal of the STA. Default is 30 minutes.
    //  *
    //  * @__NL80211_MESHCONF_ATTR_AFTER_LAST: internal use
    //  */
    // enum nl80211_meshconf_params {
    //     __NL80211_MESHCONF_INVALID,
    //     NL80211_MESHCONF_RETRY_TIMEOUT,
    //     NL80211_MESHCONF_CONFIRM_TIMEOUT,
    //     NL80211_MESHCONF_HOLDING_TIMEOUT,
    //     NL80211_MESHCONF_MAX_PEER_LINKS,
    //     NL80211_MESHCONF_MAX_RETRIES,
    //     NL80211_MESHCONF_TTL,
    //     NL80211_MESHCONF_AUTO_OPEN_PLINKS,
    //     NL80211_MESHCONF_HWMP_MAX_PREQ_RETRIES,
    //     NL80211_MESHCONF_PATH_REFRESH_TIME,
    //     NL80211_MESHCONF_MIN_DISCOVERY_TIMEOUT,
    //     NL80211_MESHCONF_HWMP_ACTIVE_PATH_TIMEOUT,
    //     NL80211_MESHCONF_HWMP_PREQ_MIN_INTERVAL,
    //     NL80211_MESHCONF_HWMP_NET_DIAM_TRVS_TIME,
    //     NL80211_MESHCONF_HWMP_ROOTMODE,
    //     NL80211_MESHCONF_ELEMENT_TTL,
    //     NL80211_MESHCONF_HWMP_RANN_INTERVAL,
    //     NL80211_MESHCONF_GATE_ANNOUNCEMENTS,
    //     NL80211_MESHCONF_HWMP_PERR_MIN_INTERVAL,
    //     NL80211_MESHCONF_FORWARDING,
    //     NL80211_MESHCONF_RSSI_THRESHOLD,
    //     NL80211_MESHCONF_SYNC_OFFSET_MAX_NEIGHBOR,
    //     NL80211_MESHCONF_HT_OPMODE,
    //     NL80211_MESHCONF_HWMP_PATH_TO_ROOT_TIMEOUT,
    //     NL80211_MESHCONF_HWMP_ROOT_INTERVAL,
    //     NL80211_MESHCONF_HWMP_CONFIRMATION_INTERVAL,
    //     NL80211_MESHCONF_POWER_MODE,
    //     NL80211_MESHCONF_AWAKE_WINDOW,
    //     NL80211_MESHCONF_PLINK_TIMEOUT,

    //     /* keep last */
    //     __NL80211_MESHCONF_ATTR_AFTER_LAST,
    //     NL80211_MESHCONF_ATTR_MAX = __NL80211_MESHCONF_ATTR_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_mesh_setup_params - mesh setup parameters
    //  *
    //  * Mesh setup parameters.  These are used to start/join a mesh and cannot be
    //  * changed while the mesh is active.
    //  *
    //  * @__NL80211_MESH_SETUP_INVALID: Internal use
    //  *
    //  * @NL80211_MESH_SETUP_ENABLE_VENDOR_PATH_SEL: Enable this option to use a
    //  *  vendor specific path selection algorithm or disable it to use the
    //  *  default HWMP.
    //  *
    //  * @NL80211_MESH_SETUP_ENABLE_VENDOR_METRIC: Enable this option to use a
    //  *  vendor specific path metric or disable it to use the default Airtime
    //  *  metric.
    //  *
    //  * @NL80211_MESH_SETUP_IE: Information elements for this mesh, for instance, a
    //  *  robust security network ie, or a vendor specific information element
    //  *  that vendors will use to identify the path selection methods and
    //  *  metrics in use.
    //  *
    //  * @NL80211_MESH_SETUP_USERSPACE_AUTH: Enable this option if an authentication
    //  *  daemon will be authenticating mesh candidates.
    //  *
    //  * @NL80211_MESH_SETUP_USERSPACE_AMPE: Enable this option if an authentication
    //  *  daemon will be securing peer link frames.  AMPE is a secured version of
    //  *  Mesh Peering Management (MPM) and is implemented with the assistance of
    //  *  a userspace daemon.  When this flag is set, the kernel will send peer
    //  *  management frames to a userspace daemon that will implement AMPE
    //  *  functionality (security capabilities selection, key confirmation, and
    //  *  key management).  When the flag is unset (default), the kernel can
    //  *  autonomously complete (unsecured) mesh peering without the need of a
    //  *  userspace daemon.
    //  *
    //  * @NL80211_MESH_SETUP_ENABLE_VENDOR_SYNC: Enable this option to use a
    //  *  vendor specific synchronization method or disable it to use the default
    //  *  neighbor offset synchronization
    //  *
    //  * @NL80211_MESH_SETUP_USERSPACE_MPM: Enable this option if userspace will
    //  *  implement an MPM which handles peer allocation and state.
    //  *
    //  * @NL80211_MESH_SETUP_AUTH_PROTOCOL: Inform the kernel of the authentication
    //  *  method (u8, as defined in IEEE 8.4.2.100.6, e.g. 0x1 for SAE).
    //  *  Default is no authentication method required.
    //  *
    //  * @NL80211_MESH_SETUP_ATTR_MAX: highest possible mesh setup attribute number
    //  *
    //  * @__NL80211_MESH_SETUP_ATTR_AFTER_LAST: Internal use
    //  */
    // enum nl80211_mesh_setup_params {
    //     __NL80211_MESH_SETUP_INVALID,
    //     NL80211_MESH_SETUP_ENABLE_VENDOR_PATH_SEL,
    //     NL80211_MESH_SETUP_ENABLE_VENDOR_METRIC,
    //     NL80211_MESH_SETUP_IE,
    //     NL80211_MESH_SETUP_USERSPACE_AUTH,
    //     NL80211_MESH_SETUP_USERSPACE_AMPE,
    //     NL80211_MESH_SETUP_ENABLE_VENDOR_SYNC,
    //     NL80211_MESH_SETUP_USERSPACE_MPM,
    //     NL80211_MESH_SETUP_AUTH_PROTOCOL,

    //     /* keep last */
    //     __NL80211_MESH_SETUP_ATTR_AFTER_LAST,
    //     NL80211_MESH_SETUP_ATTR_MAX = __NL80211_MESH_SETUP_ATTR_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_txq_attr - TX queue parameter attributes
    //  * @__NL80211_TXQ_ATTR_INVALID: Attribute number 0 is reserved
    //  * @NL80211_TXQ_ATTR_AC: AC identifier (NL80211_AC_*)
    //  * @NL80211_TXQ_ATTR_TXOP: Maximum burst time in units of 32 usecs, 0 meaning
    //  *  disabled
    //  * @NL80211_TXQ_ATTR_CWMIN: Minimum contention window [a value of the form
    //  *  2^n-1 in the range 1..32767]
    //  * @NL80211_TXQ_ATTR_CWMAX: Maximum contention window [a value of the form
    //  *  2^n-1 in the range 1..32767]
    //  * @NL80211_TXQ_ATTR_AIFS: Arbitration interframe space [0..255]
    //  * @__NL80211_TXQ_ATTR_AFTER_LAST: Internal
    //  * @NL80211_TXQ_ATTR_MAX: Maximum TXQ attribute number
    //  */
    // enum nl80211_txq_attr {
    //     __NL80211_TXQ_ATTR_INVALID,
    //     NL80211_TXQ_ATTR_AC,
    //     NL80211_TXQ_ATTR_TXOP,
    //     NL80211_TXQ_ATTR_CWMIN,
    //     NL80211_TXQ_ATTR_CWMAX,
    //     NL80211_TXQ_ATTR_AIFS,

    //     /* keep last */
    //     __NL80211_TXQ_ATTR_AFTER_LAST,
    //     NL80211_TXQ_ATTR_MAX = __NL80211_TXQ_ATTR_AFTER_LAST - 1
    // };

    // enum nl80211_ac {
    //     NL80211_AC_VO,
    //     NL80211_AC_VI,
    //     NL80211_AC_BE,
    //     NL80211_AC_BK,
    //     NL80211_NUM_ACS
    // };

    // /* backward compat */
    // #define NL80211_TXQ_ATTR_QUEUE  NL80211_TXQ_ATTR_AC
    // #define NL80211_TXQ_Q_VO    NL80211_AC_VO
    // #define NL80211_TXQ_Q_VI    NL80211_AC_VI
    // #define NL80211_TXQ_Q_BE    NL80211_AC_BE
    // #define NL80211_TXQ_Q_BK    NL80211_AC_BK

    // /**
    //  * enum nl80211_channel_type - channel type
    //  * @NL80211_CHAN_NO_HT: 20 MHz, non-HT channel
    //  * @NL80211_CHAN_HT20: 20 MHz HT channel
    //  * @NL80211_CHAN_HT40MINUS: HT40 channel, secondary channel
    //  *  below the control channel
    //  * @NL80211_CHAN_HT40PLUS: HT40 channel, secondary channel
    //  *  above the control channel
    //  */
    // enum nl80211_channel_type {
    //     NL80211_CHAN_NO_HT,
    //     NL80211_CHAN_HT20,
    //     NL80211_CHAN_HT40MINUS,
    //     NL80211_CHAN_HT40PLUS
    // };

    // /**
    //  * enum nl80211_chan_width - channel width definitions
    //  *
    //  * These values are used with the %NL80211_ATTR_CHANNEL_WIDTH
    //  * attribute.
    //  *
    //  * @NL80211_CHAN_WIDTH_20_NOHT: 20 MHz, non-HT channel
    //  * @NL80211_CHAN_WIDTH_20: 20 MHz HT channel
    //  * @NL80211_CHAN_WIDTH_40: 40 MHz channel, the %NL80211_ATTR_CENTER_FREQ1
    //  *  attribute must be provided as well
    //  * @NL80211_CHAN_WIDTH_80: 80 MHz channel, the %NL80211_ATTR_CENTER_FREQ1
    //  *  attribute must be provided as well
    //  * @NL80211_CHAN_WIDTH_80P80: 80+80 MHz channel, the %NL80211_ATTR_CENTER_FREQ1
    //  *  and %NL80211_ATTR_CENTER_FREQ2 attributes must be provided as well
    //  * @NL80211_CHAN_WIDTH_160: 160 MHz channel, the %NL80211_ATTR_CENTER_FREQ1
    //  *  attribute must be provided as well
    //  * @NL80211_CHAN_WIDTH_5: 5 MHz OFDM channel
    //  * @NL80211_CHAN_WIDTH_10: 10 MHz OFDM channel
    //  */
    // enum nl80211_chan_width {
    //     NL80211_CHAN_WIDTH_20_NOHT,
    //     NL80211_CHAN_WIDTH_20,
    //     NL80211_CHAN_WIDTH_40,
    //     NL80211_CHAN_WIDTH_80,
    //     NL80211_CHAN_WIDTH_80P80,
    //     NL80211_CHAN_WIDTH_160,
    //     NL80211_CHAN_WIDTH_5,
    //     NL80211_CHAN_WIDTH_10,
    // };

    // /**
    //  * enum nl80211_bss_scan_width - control channel width for a BSS
    //  *
    //  * These values are used with the %NL80211_BSS_CHAN_WIDTH attribute.
    //  *
    //  * @NL80211_BSS_CHAN_WIDTH_20: control channel is 20 MHz wide or compatible
    //  * @NL80211_BSS_CHAN_WIDTH_10: control channel is 10 MHz wide
    //  * @NL80211_BSS_CHAN_WIDTH_5: control channel is 5 MHz wide
    //  */
    // enum nl80211_bss_scan_width {
    //     NL80211_BSS_CHAN_WIDTH_20,
    //     NL80211_BSS_CHAN_WIDTH_10,
    //     NL80211_BSS_CHAN_WIDTH_5,
    // };

    // /**
    //  * enum nl80211_bss - netlink attributes for a BSS
    //  *
    //  * @__NL80211_BSS_INVALID: invalid
    //  * @NL80211_BSS_BSSID: BSSID of the BSS (6 octets)
    //  * @NL80211_BSS_FREQUENCY: frequency in MHz (u32)
    //  * @NL80211_BSS_TSF: TSF of the received probe response/beacon (u64)
    //  *  (if @NL80211_BSS_PRESP_DATA is present then this is known to be
    //  *  from a probe response, otherwise it may be from the same beacon
    //  *  that the NL80211_BSS_BEACON_TSF will be from)
    //  * @NL80211_BSS_BEACON_INTERVAL: beacon interval of the (I)BSS (u16)
    //  * @NL80211_BSS_CAPABILITY: capability field (CPU order, u16)
    //  * @NL80211_BSS_INFORMATION_ELEMENTS: binary attribute containing the
    //  *  raw information elements from the probe response/beacon (bin);
    //  *  if the %NL80211_BSS_BEACON_IES attribute is present and the data is
    //  *  different then the IEs here are from a Probe Response frame; otherwise
    //  *  they are from a Beacon frame.
    //  *  However, if the driver does not indicate the source of the IEs, these
    //  *  IEs may be from either frame subtype.
    //  *  If present, the @NL80211_BSS_PRESP_DATA attribute indicates that the
    //  *  data here is known to be from a probe response, without any heuristics.
    //  * @NL80211_BSS_SIGNAL_MBM: signal strength of probe response/beacon
    //  *  in mBm (100 * dBm) (s32)
    //  * @NL80211_BSS_SIGNAL_UNSPEC: signal strength of the probe response/beacon
    //  *  in unspecified units, scaled to 0..100 (u8)
    //  * @NL80211_BSS_STATUS: status, if this BSS is "used"
    //  * @NL80211_BSS_SEEN_MS_AGO: age of this BSS entry in ms
    //  * @NL80211_BSS_BEACON_IES: binary attribute containing the raw information
    //  *  elements from a Beacon frame (bin); not present if no Beacon frame has
    //  *  yet been received
    //  * @NL80211_BSS_CHAN_WIDTH: channel width of the control channel
    //  *  (u32, enum nl80211_bss_scan_width)
    //  * @NL80211_BSS_BEACON_TSF: TSF of the last received beacon (u64)
    //  *  (not present if no beacon frame has been received yet)
    //  * @NL80211_BSS_PRESP_DATA: the data in @NL80211_BSS_INFORMATION_ELEMENTS and
    //  *  @NL80211_BSS_TSF is known to be from a probe response (flag attribute)
    //  * @NL80211_BSS_LAST_SEEN_BOOTTIME: CLOCK_BOOTTIME timestamp when this entry
    //  *  was last updated by a received frame. The value is expected to be
    //  *  accurate to about 10ms. (u64, nanoseconds)
    //  * @__NL80211_BSS_AFTER_LAST: internal
    //  * @NL80211_BSS_MAX: highest BSS attribute
    //  */
    // enum nl80211_bss {
    //     __NL80211_BSS_INVALID,
    //     NL80211_BSS_BSSID,
    //     NL80211_BSS_FREQUENCY,
    //     NL80211_BSS_TSF,
    //     NL80211_BSS_BEACON_INTERVAL,
    //     NL80211_BSS_CAPABILITY,
    //     NL80211_BSS_INFORMATION_ELEMENTS,
    //     NL80211_BSS_SIGNAL_MBM,
    //     NL80211_BSS_SIGNAL_UNSPEC,
    //     NL80211_BSS_STATUS,
    //     NL80211_BSS_SEEN_MS_AGO,
    //     NL80211_BSS_BEACON_IES,
    //     NL80211_BSS_CHAN_WIDTH,
    //     NL80211_BSS_BEACON_TSF,
    //     NL80211_BSS_PRESP_DATA,
    //     NL80211_BSS_LAST_SEEN_BOOTTIME,

    //     /* keep last */
    //     __NL80211_BSS_AFTER_LAST,
    //     NL80211_BSS_MAX = __NL80211_BSS_AFTER_LAST - 1
    // };

    // *
    //  * enum nl80211_bss_status - BSS "status"
    //  * @NL80211_BSS_STATUS_AUTHENTICATED: Authenticated with this BSS.
    //  *  Note that this is no longer used since cfg80211 no longer
    //  *  keeps track of whether or not authentication was done with
    //  *  a given BSS.
    //  * @NL80211_BSS_STATUS_ASSOCIATED: Associated with this BSS.
    //  * @NL80211_BSS_STATUS_IBSS_JOINED: Joined to this IBSS.
    //  *
    //  * The BSS status is a BSS attribute in scan dumps, which
    //  * indicates the status the interface has wrt. this BSS.

    // enum nl80211_bss_status {
    //     NL80211_BSS_STATUS_AUTHENTICATED,
    //     NL80211_BSS_STATUS_ASSOCIATED,
    //     NL80211_BSS_STATUS_IBSS_JOINED,
    // };

    // /**
    //  * enum nl80211_auth_type - AuthenticationType
    //  *
    //  * @NL80211_AUTHTYPE_OPEN_SYSTEM: Open System authentication
    //  * @NL80211_AUTHTYPE_SHARED_KEY: Shared Key authentication (WEP only)
    //  * @NL80211_AUTHTYPE_FT: Fast BSS Transition (IEEE 802.11r)
    //  * @NL80211_AUTHTYPE_NETWORK_EAP: Network EAP (some Cisco APs and mainly LEAP)
    //  * @NL80211_AUTHTYPE_SAE: Simultaneous authentication of equals
    //  * @__NL80211_AUTHTYPE_NUM: internal
    //  * @NL80211_AUTHTYPE_MAX: maximum valid auth algorithm
    //  * @NL80211_AUTHTYPE_AUTOMATIC: determine automatically (if necessary by
    //  *  trying multiple times); this is invalid in netlink -- leave out
    //  *  the attribute for this on CONNECT commands.
    //  */
    // enum nl80211_auth_type {
    //     NL80211_AUTHTYPE_OPEN_SYSTEM,
    //     NL80211_AUTHTYPE_SHARED_KEY,
    //     NL80211_AUTHTYPE_FT,
    //     NL80211_AUTHTYPE_NETWORK_EAP,
    //     NL80211_AUTHTYPE_SAE,

    //     /* keep last */
    //     __NL80211_AUTHTYPE_NUM,
    //     NL80211_AUTHTYPE_MAX = __NL80211_AUTHTYPE_NUM - 1,
    //     NL80211_AUTHTYPE_AUTOMATIC
    // };

    // /**
    //  * enum nl80211_key_type - Key Type
    //  * @NL80211_KEYTYPE_GROUP: Group (broadcast/multicast) key
    //  * @NL80211_KEYTYPE_PAIRWISE: Pairwise (unicast/individual) key
    //  * @NL80211_KEYTYPE_PEERKEY: PeerKey (DLS)
    //  * @NUM_NL80211_KEYTYPES: number of defined key types
    //  */
    // enum nl80211_key_type {
    //     NL80211_KEYTYPE_GROUP,
    //     NL80211_KEYTYPE_PAIRWISE,
    //     NL80211_KEYTYPE_PEERKEY,

    //     NUM_NL80211_KEYTYPES
    // };

    // /**
    //  * enum nl80211_mfp - Management frame protection state
    //  * @NL80211_MFP_NO: Management frame protection not used
    //  * @NL80211_MFP_REQUIRED: Management frame protection required
    //  */
    // enum nl80211_mfp {
    //     NL80211_MFP_NO,
    //     NL80211_MFP_REQUIRED,
    // };

    // enum nl80211_wpa_versions {
    //     NL80211_WPA_VERSION_1 = 1 << 0,
    //     NL80211_WPA_VERSION_2 = 1 << 1,
    // };

    // /**
    //  * enum nl80211_key_default_types - key default types
    //  * @__NL80211_KEY_DEFAULT_TYPE_INVALID: invalid
    //  * @NL80211_KEY_DEFAULT_TYPE_UNICAST: key should be used as default
    //  *  unicast key
    //  * @NL80211_KEY_DEFAULT_TYPE_MULTICAST: key should be used as default
    //  *  multicast key
    //  * @NUM_NL80211_KEY_DEFAULT_TYPES: number of default types
    //  */
    // enum nl80211_key_default_types {
    //     __NL80211_KEY_DEFAULT_TYPE_INVALID,
    //     NL80211_KEY_DEFAULT_TYPE_UNICAST,
    //     NL80211_KEY_DEFAULT_TYPE_MULTICAST,

    //     NUM_NL80211_KEY_DEFAULT_TYPES
    // };

    // /**
    //  * enum nl80211_key_attributes - key attributes
    //  * @__NL80211_KEY_INVALID: invalid
    //  * @NL80211_KEY_DATA: (temporal) key data; for TKIP this consists of
    //  *  16 bytes encryption key followed by 8 bytes each for TX and RX MIC
    //  *  keys
    //  * @NL80211_KEY_IDX: key ID (u8, 0-3)
    //  * @NL80211_KEY_CIPHER: key cipher suite (u32, as defined by IEEE 802.11
    //  *  section 7.3.2.25.1, e.g. 0x000FAC04)
    //  * @NL80211_KEY_SEQ: transmit key sequence number (IV/PN) for TKIP and
    //  *  CCMP keys, each six bytes in little endian
    //  * @NL80211_KEY_DEFAULT: flag indicating default key
    //  * @NL80211_KEY_DEFAULT_MGMT: flag indicating default management key
    //  * @NL80211_KEY_TYPE: the key type from enum nl80211_key_type, if not
    //  *  specified the default depends on whether a MAC address was
    //  *  given with the command using the key or not (u32)
    //  * @NL80211_KEY_DEFAULT_TYPES: A nested attribute containing flags
    //  *  attributes, specifying what a key should be set as default as.
    //  *  See &enum nl80211_key_default_types.
    //  * @__NL80211_KEY_AFTER_LAST: internal
    //  * @NL80211_KEY_MAX: highest key attribute
    //  */
    // enum nl80211_key_attributes {
    //     __NL80211_KEY_INVALID,
    //     NL80211_KEY_DATA,
    //     NL80211_KEY_IDX,
    //     NL80211_KEY_CIPHER,
    //     NL80211_KEY_SEQ,
    //     NL80211_KEY_DEFAULT,
    //     NL80211_KEY_DEFAULT_MGMT,
    //     NL80211_KEY_TYPE,
    //     NL80211_KEY_DEFAULT_TYPES,

    //     /* keep last */
    //     __NL80211_KEY_AFTER_LAST,
    //     NL80211_KEY_MAX = __NL80211_KEY_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_tx_rate_attributes - TX rate set attributes
    //  * @__NL80211_TXRATE_INVALID: invalid
    //  * @NL80211_TXRATE_LEGACY: Legacy (non-MCS) rates allowed for TX rate selection
    //  *  in an array of rates as defined in IEEE 802.11 7.3.2.2 (u8 values with
    //  *  1 = 500 kbps) but without the IE length restriction (at most
    //  *  %NL80211_MAX_SUPP_RATES in a single array).
    //  * @NL80211_TXRATE_HT: HT (MCS) rates allowed for TX rate selection
    //  *  in an array of MCS numbers.
    //  * @NL80211_TXRATE_VHT: VHT rates allowed for TX rate selection,
    //  *  see &struct nl80211_txrate_vht
    //  * @NL80211_TXRATE_GI: configure GI, see &enum nl80211_txrate_gi
    //  * @__NL80211_TXRATE_AFTER_LAST: internal
    //  * @NL80211_TXRATE_MAX: highest TX rate attribute
    //  */
    // enum nl80211_tx_rate_attributes {
    //     __NL80211_TXRATE_INVALID,
    //     NL80211_TXRATE_LEGACY,
    //     NL80211_TXRATE_HT,
    //     NL80211_TXRATE_VHT,
    //     NL80211_TXRATE_GI,

    //     /* keep last */
    //     __NL80211_TXRATE_AFTER_LAST,
    //     NL80211_TXRATE_MAX = __NL80211_TXRATE_AFTER_LAST - 1
    // };

    // #define NL80211_TXRATE_MCS NL80211_TXRATE_HT
    // #define NL80211_VHT_NSS_MAX     8

    // /**
    //  * struct nl80211_txrate_vht - VHT MCS/NSS txrate bitmap
    //  * @mcs: MCS bitmap table for each NSS (array index 0 for 1 stream, etc.)
    //  */
    // struct nl80211_txrate_vht {
    //     __u16 mcs[NL80211_VHT_NSS_MAX];
    // };

    // enum nl80211_txrate_gi {
    //     NL80211_TXRATE_DEFAULT_GI,
    //     NL80211_TXRATE_FORCE_SGI,
    //     NL80211_TXRATE_FORCE_LGI,
    // };

    // /**
    //  * enum nl80211_band - Frequency band
    //  * @NL80211_BAND_2GHZ: 2.4 GHz ISM band
    //  * @NL80211_BAND_5GHZ: around 5 GHz band (4.9 - 5.7 GHz)
    //  * @NL80211_BAND_60GHZ: around 60 GHz band (58.32 - 64.80 GHz)
    //  */
    // enum nl80211_band {
    //     NL80211_BAND_2GHZ,
    //     NL80211_BAND_5GHZ,
    //     NL80211_BAND_60GHZ,
    // };

    // /**
    //  * enum nl80211_ps_state - powersave state
    //  * @NL80211_PS_DISABLED: powersave is disabled
    //  * @NL80211_PS_ENABLED: powersave is enabled
    //  */
    // enum nl80211_ps_state {
    //     NL80211_PS_DISABLED,
    //     NL80211_PS_ENABLED,
    // };

    // /**
    //  * enum nl80211_attr_cqm - connection quality monitor attributes
    //  * @__NL80211_ATTR_CQM_INVALID: invalid
    //  * @NL80211_ATTR_CQM_RSSI_THOLD: RSSI threshold in dBm. This value specifies
    //  *  the threshold for the RSSI level at which an event will be sent. Zero
    //  *  to disable.
    //  * @NL80211_ATTR_CQM_RSSI_HYST: RSSI hysteresis in dBm. This value specifies
    //  *  the minimum amount the RSSI level must change after an event before a
    //  *  new event may be issued (to reduce effects of RSSI oscillation).
    //  * @NL80211_ATTR_CQM_RSSI_THRESHOLD_EVENT: RSSI threshold event
    //  * @NL80211_ATTR_CQM_PKT_LOSS_EVENT: a u32 value indicating that this many
    //  *  consecutive packets were not acknowledged by the peer
    //  * @NL80211_ATTR_CQM_TXE_RATE: TX error rate in %. Minimum % of TX failures
    //  *  during the given %NL80211_ATTR_CQM_TXE_INTVL before an
    //  *  %NL80211_CMD_NOTIFY_CQM with reported %NL80211_ATTR_CQM_TXE_RATE and
    //  *  %NL80211_ATTR_CQM_TXE_PKTS is generated.
    //  * @NL80211_ATTR_CQM_TXE_PKTS: number of attempted packets in a given
    //  *  %NL80211_ATTR_CQM_TXE_INTVL before %NL80211_ATTR_CQM_TXE_RATE is
    //  *  checked.
    //  * @NL80211_ATTR_CQM_TXE_INTVL: interval in seconds. Specifies the periodic
    //  *  interval in which %NL80211_ATTR_CQM_TXE_PKTS and
    //  *  %NL80211_ATTR_CQM_TXE_RATE must be satisfied before generating an
    //  *  %NL80211_CMD_NOTIFY_CQM. Set to 0 to turn off TX error reporting.
    //  * @NL80211_ATTR_CQM_BEACON_LOSS_EVENT: flag attribute that's set in a beacon
    //  *  loss event
    //  * @__NL80211_ATTR_CQM_AFTER_LAST: internal
    //  * @NL80211_ATTR_CQM_MAX: highest key attribute
    //  */
    // enum nl80211_attr_cqm {
    //     __NL80211_ATTR_CQM_INVALID,
    //     NL80211_ATTR_CQM_RSSI_THOLD,
    //     NL80211_ATTR_CQM_RSSI_HYST,
    //     NL80211_ATTR_CQM_RSSI_THRESHOLD_EVENT,
    //     NL80211_ATTR_CQM_PKT_LOSS_EVENT,
    //     NL80211_ATTR_CQM_TXE_RATE,
    //     NL80211_ATTR_CQM_TXE_PKTS,
    //     NL80211_ATTR_CQM_TXE_INTVL,
    //     NL80211_ATTR_CQM_BEACON_LOSS_EVENT,

    //     /* keep last */
    //     __NL80211_ATTR_CQM_AFTER_LAST,
    //     NL80211_ATTR_CQM_MAX = __NL80211_ATTR_CQM_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_cqm_rssi_threshold_event - RSSI threshold event
    //  * @NL80211_CQM_RSSI_THRESHOLD_EVENT_LOW: The RSSI level is lower than the
    //  *      configured threshold
    //  * @NL80211_CQM_RSSI_THRESHOLD_EVENT_HIGH: The RSSI is higher than the
    //  *      configured threshold
    //  * @NL80211_CQM_RSSI_BEACON_LOSS_EVENT: (reserved, never sent)
    //  */
    // enum nl80211_cqm_rssi_threshold_event {
    //     NL80211_CQM_RSSI_THRESHOLD_EVENT_LOW,
    //     NL80211_CQM_RSSI_THRESHOLD_EVENT_HIGH,
    //     NL80211_CQM_RSSI_BEACON_LOSS_EVENT,
    // };


    // /**
    //  * enum nl80211_tx_power_setting - TX power adjustment
    //  * @NL80211_TX_POWER_AUTOMATIC: automatically determine transmit power
    //  * @NL80211_TX_POWER_LIMITED: limit TX power by the mBm parameter
    //  * @NL80211_TX_POWER_FIXED: fix TX power to the mBm parameter
    //  */
    // enum nl80211_tx_power_setting {
    //     NL80211_TX_POWER_AUTOMATIC,
    //     NL80211_TX_POWER_LIMITED,
    //     NL80211_TX_POWER_FIXED,
    // };

    // /**
    //  * enum nl80211_packet_pattern_attr - packet pattern attribute
    //  * @__NL80211_PKTPAT_INVALID: invalid number for nested attribute
    //  * @NL80211_PKTPAT_PATTERN: the pattern, values where the mask has
    //  *  a zero bit are ignored
    //  * @NL80211_PKTPAT_MASK: pattern mask, must be long enough to have
    //  *  a bit for each byte in the pattern. The lowest-order bit corresponds
    //  *  to the first byte of the pattern, but the bytes of the pattern are
    //  *  in a little-endian-like format, i.e. the 9th byte of the pattern
    //  *  corresponds to the lowest-order bit in the second byte of the mask.
    //  *  For example: The match 00:xx:00:00:xx:00:00:00:00:xx:xx:xx (where
    //  *  xx indicates "don't care") would be represented by a pattern of
    //  *  twelve zero bytes, and a mask of "0xed,0x01".
    //  *  Note that the pattern matching is done as though frames were not
    //  *  802.11 frames but 802.3 frames, i.e. the frame is fully unpacked
    //  *  first (including SNAP header unpacking) and then matched.
    //  * @NL80211_PKTPAT_OFFSET: packet offset, pattern is matched after
    //  *  these fixed number of bytes of received packet
    //  * @NUM_NL80211_PKTPAT: number of attributes
    //  * @MAX_NL80211_PKTPAT: max attribute number
    //  */
    // enum nl80211_packet_pattern_attr {
    //     __NL80211_PKTPAT_INVALID,
    //     NL80211_PKTPAT_MASK,
    //     NL80211_PKTPAT_PATTERN,
    //     NL80211_PKTPAT_OFFSET,

    //     NUM_NL80211_PKTPAT,
    //     MAX_NL80211_PKTPAT = NUM_NL80211_PKTPAT - 1,
    // };

    // /**
    //  * struct nl80211_pattern_support - packet pattern support information
    //  * @max_patterns: maximum number of patterns supported
    //  * @min_pattern_len: minimum length of each pattern
    //  * @max_pattern_len: maximum length of each pattern
    //  * @max_pkt_offset: maximum Rx packet offset
    //  *
    //  * This struct is carried in %NL80211_WOWLAN_TRIG_PKT_PATTERN when
    //  * that is part of %NL80211_ATTR_WOWLAN_TRIGGERS_SUPPORTED or in
    //  * %NL80211_ATTR_COALESCE_RULE_PKT_PATTERN when that is part of
    //  * %NL80211_ATTR_COALESCE_RULE in the capability information given
    //  * by the kernel to userspace.
    //  */
    // struct nl80211_pattern_support {
    //     __u32 max_patterns;
    //     __u32 min_pattern_len;
    //     __u32 max_pattern_len;
    //     __u32 max_pkt_offset;
    // } __attribute__((packed));

    // /* only for backward compatibility */
    // #define __NL80211_WOWLAN_PKTPAT_INVALID __NL80211_PKTPAT_INVALID
    // #define NL80211_WOWLAN_PKTPAT_MASK NL80211_PKTPAT_MASK
    // #define NL80211_WOWLAN_PKTPAT_PATTERN NL80211_PKTPAT_PATTERN
    // #define NL80211_WOWLAN_PKTPAT_OFFSET NL80211_PKTPAT_OFFSET
    // #define NUM_NL80211_WOWLAN_PKTPAT NUM_NL80211_PKTPAT
    // #define MAX_NL80211_WOWLAN_PKTPAT MAX_NL80211_PKTPAT
    // #define nl80211_wowlan_pattern_support nl80211_pattern_support

    // /**
    //  * enum nl80211_wowlan_triggers - WoWLAN trigger definitions
    //  * @__NL80211_WOWLAN_TRIG_INVALID: invalid number for nested attributes
    //  * @NL80211_WOWLAN_TRIG_ANY: wake up on any activity, do not really put
    //  *  the chip into a special state -- works best with chips that have
    //  *  support for low-power operation already (flag)
    //  *  Note that this mode is incompatible with all of the others, if
    //  *  any others are even supported by the device.
    //  * @NL80211_WOWLAN_TRIG_DISCONNECT: wake up on disconnect, the way disconnect
    //  *  is detected is implementation-specific (flag)
    //  * @NL80211_WOWLAN_TRIG_MAGIC_PKT: wake up on magic packet (6x 0xff, followed
    //  *  by 16 repetitions of MAC addr, anywhere in payload) (flag)
    //  * @NL80211_WOWLAN_TRIG_PKT_PATTERN: wake up on the specified packet patterns
    //  *  which are passed in an array of nested attributes, each nested attribute
    //  *  defining a with attributes from &struct nl80211_wowlan_trig_pkt_pattern.
    //  *  Each pattern defines a wakeup packet. Packet offset is associated with
    //  *  each pattern which is used while matching the pattern. The matching is
    //  *  done on the MSDU, i.e. as though the packet was an 802.3 packet, so the
    //  *  pattern matching is done after the packet is converted to the MSDU.
    //  *
    //  *  In %NL80211_ATTR_WOWLAN_TRIGGERS_SUPPORTED, it is a binary attribute
    //  *  carrying a &struct nl80211_pattern_support.
    //  *
    //  *  When reporting wakeup. it is a u32 attribute containing the 0-based
    //  *  index of the pattern that caused the wakeup, in the patterns passed
    //  *  to the kernel when configuring.
    //  * @NL80211_WOWLAN_TRIG_GTK_REKEY_SUPPORTED: Not a real trigger, and cannot be
    //  *  used when setting, used only to indicate that GTK rekeying is supported
    //  *  by the device (flag)
    //  * @NL80211_WOWLAN_TRIG_GTK_REKEY_FAILURE: wake up on GTK rekey failure (if
    //  *  done by the device) (flag)
    //  * @NL80211_WOWLAN_TRIG_EAP_IDENT_REQUEST: wake up on EAP Identity Request
    //  *  packet (flag)
    //  * @NL80211_WOWLAN_TRIG_4WAY_HANDSHAKE: wake up on 4-way handshake (flag)
    //  * @NL80211_WOWLAN_TRIG_RFKILL_RELEASE: wake up when rfkill is released
    //  *  (on devices that have rfkill in the device) (flag)
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211: For wakeup reporting only, contains
    //  *  the 802.11 packet that caused the wakeup, e.g. a deauth frame. The frame
    //  *  may be truncated, the @NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211_LEN
    //  *  attribute contains the original length.
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211_LEN: Original length of the 802.11
    //  *  packet, may be bigger than the @NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211
    //  *  attribute if the packet was truncated somewhere.
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023: For wakeup reporting only, contains the
    //  *  802.11 packet that caused the wakeup, e.g. a magic packet. The frame may
    //  *  be truncated, the @NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023_LEN attribute
    //  *  contains the original length.
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023_LEN: Original length of the 802.3
    //  *  packet, may be bigger than the @NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023
    //  *  attribute if the packet was truncated somewhere.
    //  * @NL80211_WOWLAN_TRIG_TCP_CONNECTION: TCP connection wake, see DOC section
    //  *  "TCP connection wakeup" for more details. This is a nested attribute
    //  *  containing the exact information for establishing and keeping alive
    //  *  the TCP connection.
    //  * @NL80211_WOWLAN_TRIG_TCP_WAKEUP_MATCH: For wakeup reporting only, the
    //  *  wakeup packet was received on the TCP connection
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_TCP_CONNLOST: For wakeup reporting only, the
    //  *  TCP connection was lost or failed to be established
    //  * @NL80211_WOWLAN_TRIG_WAKEUP_TCP_NOMORETOKENS: For wakeup reporting only,
    //  *  the TCP connection ran out of tokens to use for data to send to the
    //  *  service
    //  * @NL80211_WOWLAN_TRIG_NET_DETECT: wake up when a configured network
    //  *  is detected.  This is a nested attribute that contains the
    //  *  same attributes used with @NL80211_CMD_START_SCHED_SCAN.  It
    //  *  specifies how the scan is performed (e.g. the interval, the
    //  *  channels to scan and the initial delay) as well as the scan
    //  *  results that will trigger a wake (i.e. the matchsets).  This
    //  *  attribute is also sent in a response to
    //  *  @NL80211_CMD_GET_WIPHY, indicating the number of match sets
    //  *  supported by the driver (u32).
    //  * @NL80211_WOWLAN_TRIG_NET_DETECT_RESULTS: nested attribute
    //  *  containing an array with information about what triggered the
    //  *  wake up.  If no elements are present in the array, it means
    //  *  that the information is not available.  If more than one
    //  *  element is present, it means that more than one match
    //  *  occurred.
    //  *  Each element in the array is a nested attribute that contains
    //  *  one optional %NL80211_ATTR_SSID attribute and one optional
    //  *  %NL80211_ATTR_SCAN_FREQUENCIES attribute.  At least one of
    //  *  these attributes must be present.  If
    //  *  %NL80211_ATTR_SCAN_FREQUENCIES contains more than one
    //  *  frequency, it means that the match occurred in more than one
    //  *  channel.
    //  * @NUM_NL80211_WOWLAN_TRIG: number of wake on wireless triggers
    //  * @MAX_NL80211_WOWLAN_TRIG: highest wowlan trigger attribute number
    //  *
    //  * These nested attributes are used to configure the wakeup triggers and
    //  * to report the wakeup reason(s).
    //  */
    // enum nl80211_wowlan_triggers {
    //     __NL80211_WOWLAN_TRIG_INVALID,
    //     NL80211_WOWLAN_TRIG_ANY,
    //     NL80211_WOWLAN_TRIG_DISCONNECT,
    //     NL80211_WOWLAN_TRIG_MAGIC_PKT,
    //     NL80211_WOWLAN_TRIG_PKT_PATTERN,
    //     NL80211_WOWLAN_TRIG_GTK_REKEY_SUPPORTED,
    //     NL80211_WOWLAN_TRIG_GTK_REKEY_FAILURE,
    //     NL80211_WOWLAN_TRIG_EAP_IDENT_REQUEST,
    //     NL80211_WOWLAN_TRIG_4WAY_HANDSHAKE,
    //     NL80211_WOWLAN_TRIG_RFKILL_RELEASE,
    //     NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211,
    //     NL80211_WOWLAN_TRIG_WAKEUP_PKT_80211_LEN,
    //     NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023,
    //     NL80211_WOWLAN_TRIG_WAKEUP_PKT_8023_LEN,
    //     NL80211_WOWLAN_TRIG_TCP_CONNECTION,
    //     NL80211_WOWLAN_TRIG_WAKEUP_TCP_MATCH,
    //     NL80211_WOWLAN_TRIG_WAKEUP_TCP_CONNLOST,
    //     NL80211_WOWLAN_TRIG_WAKEUP_TCP_NOMORETOKENS,
    //     NL80211_WOWLAN_TRIG_NET_DETECT,
    //     NL80211_WOWLAN_TRIG_NET_DETECT_RESULTS,

    //     /* keep last */
    //     NUM_NL80211_WOWLAN_TRIG,
    //     MAX_NL80211_WOWLAN_TRIG = NUM_NL80211_WOWLAN_TRIG - 1
    // };

    // /**
    //  * DOC: TCP connection wakeup
    //  *
    //  * Some devices can establish a TCP connection in order to be woken up by a
    //  * packet coming in from outside their network segment, or behind NAT. If
    //  * configured, the device will establish a TCP connection to the given
    //  * service, and periodically send data to that service. The first data
    //  * packet is usually transmitted after SYN/ACK, also ACKing the SYN/ACK.
    //  * The data packets can optionally include a (little endian) sequence
    //  * number (in the TCP payload!) that is generated by the device, and, also
    //  * optionally, a token from a list of tokens. This serves as a keep-alive
    //  * with the service, and for NATed connections, etc.
    //  *
    //  * During this keep-alive period, the server doesn't send any data to the
    //  * client. When receiving data, it is compared against the wakeup pattern
    //  * (and mask) and if it matches, the host is woken up. Similarly, if the
    //  * connection breaks or cannot be established to start with, the host is
    //  * also woken up.
    //  *
    //  * Developer's note: ARP offload is required for this, otherwise TCP
    //  * response packets might not go through correctly.
    //  */

    // /**
    //  * struct nl80211_wowlan_tcp_data_seq - WoWLAN TCP data sequence
    //  * @start: starting value
    //  * @offset: offset of sequence number in packet
    //  * @len: length of the sequence value to write, 1 through 4
    //  *
    //  * Note: don't confuse with the TCP sequence number(s), this is for the
    //  * keepalive packet payload. The actual value is written into the packet
    //  * in little endian.
    //  */
    // struct nl80211_wowlan_tcp_data_seq {
    //     __u32 start, offset, len;
    // };

    // /**
    //  * struct nl80211_wowlan_tcp_data_token - WoWLAN TCP data token config
    //  * @offset: offset of token in packet
    //  * @len: length of each token
    //  * @token_stream: stream of data to be used for the tokens, the length must
    //  *  be a multiple of @len for this to make sense
    //  */
    // struct nl80211_wowlan_tcp_data_token {
    //     __u32 offset, len;
    //     __u8 token_stream[];
    // };

    // /**
    //  * struct nl80211_wowlan_tcp_data_token_feature - data token features
    //  * @min_len: minimum token length
    //  * @max_len: maximum token length
    //  * @bufsize: total available token buffer size (max size of @token_stream)
    //  */
    // struct nl80211_wowlan_tcp_data_token_feature {
    //     __u32 min_len, max_len, bufsize;
    // };

    // /**
    //  * enum nl80211_wowlan_tcp_attrs - WoWLAN TCP connection parameters
    //  * @__NL80211_WOWLAN_TCP_INVALID: invalid number for nested attributes
    //  * @NL80211_WOWLAN_TCP_SRC_IPV4: source IPv4 address (in network byte order)
    //  * @NL80211_WOWLAN_TCP_DST_IPV4: destination IPv4 address
    //  *  (in network byte order)
    //  * @NL80211_WOWLAN_TCP_DST_MAC: destination MAC address, this is given because
    //  *  route lookup when configured might be invalid by the time we suspend,
    //  *  and doing a route lookup when suspending is no longer possible as it
    //  *  might require ARP querying.
    //  * @NL80211_WOWLAN_TCP_SRC_PORT: source port (u16); optional, if not given a
    //  *  socket and port will be allocated
    //  * @NL80211_WOWLAN_TCP_DST_PORT: destination port (u16)
    //  * @NL80211_WOWLAN_TCP_DATA_PAYLOAD: data packet payload, at least one byte.
    //  *  For feature advertising, a u32 attribute holding the maximum length
    //  *  of the data payload.
    //  * @NL80211_WOWLAN_TCP_DATA_PAYLOAD_SEQ: data packet sequence configuration
    //  *  (if desired), a &struct nl80211_wowlan_tcp_data_seq. For feature
    //  *  advertising it is just a flag
    //  * @NL80211_WOWLAN_TCP_DATA_PAYLOAD_TOKEN: data packet token configuration,
    //  *  see &struct nl80211_wowlan_tcp_data_token and for advertising see
    //  *  &struct nl80211_wowlan_tcp_data_token_feature.
    //  * @NL80211_WOWLAN_TCP_DATA_INTERVAL: data interval in seconds, maximum
    //  *  interval in feature advertising (u32)
    //  * @NL80211_WOWLAN_TCP_WAKE_PAYLOAD: wake packet payload, for advertising a
    //  *  u32 attribute holding the maximum length
    //  * @NL80211_WOWLAN_TCP_WAKE_MASK: Wake packet payload mask, not used for
    //  *  feature advertising. The mask works like @NL80211_PKTPAT_MASK
    //  *  but on the TCP payload only.
    //  * @NUM_NL80211_WOWLAN_TCP: number of TCP attributes
    //  * @MAX_NL80211_WOWLAN_TCP: highest attribute number
    //  */
    // enum nl80211_wowlan_tcp_attrs {
    //     __NL80211_WOWLAN_TCP_INVALID,
    //     NL80211_WOWLAN_TCP_SRC_IPV4,
    //     NL80211_WOWLAN_TCP_DST_IPV4,
    //     NL80211_WOWLAN_TCP_DST_MAC,
    //     NL80211_WOWLAN_TCP_SRC_PORT,
    //     NL80211_WOWLAN_TCP_DST_PORT,
    //     NL80211_WOWLAN_TCP_DATA_PAYLOAD,
    //     NL80211_WOWLAN_TCP_DATA_PAYLOAD_SEQ,
    //     NL80211_WOWLAN_TCP_DATA_PAYLOAD_TOKEN,
    //     NL80211_WOWLAN_TCP_DATA_INTERVAL,
    //     NL80211_WOWLAN_TCP_WAKE_PAYLOAD,
    //     NL80211_WOWLAN_TCP_WAKE_MASK,

    //     /* keep last */
    //     NUM_NL80211_WOWLAN_TCP,
    //     MAX_NL80211_WOWLAN_TCP = NUM_NL80211_WOWLAN_TCP - 1
    // };

    // /**
    //  * struct nl80211_coalesce_rule_support - coalesce rule support information
    //  * @max_rules: maximum number of rules supported
    //  * @pat: packet pattern support information
    //  * @max_delay: maximum supported coalescing delay in msecs
    //  *
    //  * This struct is carried in %NL80211_ATTR_COALESCE_RULE in the
    //  * capability information given by the kernel to userspace.
    //  */
    // struct nl80211_coalesce_rule_support {
    //     __u32 max_rules;
    //     struct nl80211_pattern_support pat;
    //     __u32 max_delay;
    // } __attribute__((packed));

    // /**
    //  * enum nl80211_attr_coalesce_rule - coalesce rule attribute
    //  * @__NL80211_COALESCE_RULE_INVALID: invalid number for nested attribute
    //  * @NL80211_ATTR_COALESCE_RULE_DELAY: delay in msecs used for packet coalescing
    //  * @NL80211_ATTR_COALESCE_RULE_CONDITION: condition for packet coalescence,
    //  *  see &enum nl80211_coalesce_condition.
    //  * @NL80211_ATTR_COALESCE_RULE_PKT_PATTERN: packet offset, pattern is matched
    //  *  after these fixed number of bytes of received packet
    //  * @NUM_NL80211_ATTR_COALESCE_RULE: number of attributes
    //  * @NL80211_ATTR_COALESCE_RULE_MAX: max attribute number
    //  */
    // enum nl80211_attr_coalesce_rule {
    //     __NL80211_COALESCE_RULE_INVALID,
    //     NL80211_ATTR_COALESCE_RULE_DELAY,
    //     NL80211_ATTR_COALESCE_RULE_CONDITION,
    //     NL80211_ATTR_COALESCE_RULE_PKT_PATTERN,

    //     /* keep last */
    //     NUM_NL80211_ATTR_COALESCE_RULE,
    //     NL80211_ATTR_COALESCE_RULE_MAX = NUM_NL80211_ATTR_COALESCE_RULE - 1
    // };

    // /**
    //  * enum nl80211_coalesce_condition - coalesce rule conditions
    //  * @NL80211_COALESCE_CONDITION_MATCH: coalaesce Rx packets when patterns
    //  *  in a rule are matched.
    //  * @NL80211_COALESCE_CONDITION_NO_MATCH: coalesce Rx packets when patterns
    //  *  in a rule are not matched.
    //  */
    // enum nl80211_coalesce_condition {
    //     NL80211_COALESCE_CONDITION_MATCH,
    //     NL80211_COALESCE_CONDITION_NO_MATCH
    // };

    // /**
    //  * enum nl80211_iface_limit_attrs - limit attributes
    //  * @NL80211_IFACE_LIMIT_UNSPEC: (reserved)
    //  * @NL80211_IFACE_LIMIT_MAX: maximum number of interfaces that
    //  *  can be chosen from this set of interface types (u32)
    //  * @NL80211_IFACE_LIMIT_TYPES: nested attribute containing a
    //  *  flag attribute for each interface type in this set
    //  * @NUM_NL80211_IFACE_LIMIT: number of attributes
    //  * @MAX_NL80211_IFACE_LIMIT: highest attribute number
    //  */
    // enum nl80211_iface_limit_attrs {
    //     NL80211_IFACE_LIMIT_UNSPEC,
    //     NL80211_IFACE_LIMIT_MAX,
    //     NL80211_IFACE_LIMIT_TYPES,

    //     /* keep last */
    //     NUM_NL80211_IFACE_LIMIT,
    //     MAX_NL80211_IFACE_LIMIT = NUM_NL80211_IFACE_LIMIT - 1
    // };

    // /**
    //  * enum nl80211_if_combination_attrs -- interface combination attributes
    //  *
    //  * @NL80211_IFACE_COMB_UNSPEC: (reserved)
    //  * @NL80211_IFACE_COMB_LIMITS: Nested attributes containing the limits
    //  *  for given interface types, see &enum nl80211_iface_limit_attrs.
    //  * @NL80211_IFACE_COMB_MAXNUM: u32 attribute giving the total number of
    //  *  interfaces that can be created in this group. This number doesn't
    //  *  apply to interfaces purely managed in software, which are listed
    //  *  in a separate attribute %NL80211_ATTR_INTERFACES_SOFTWARE.
    //  * @NL80211_IFACE_COMB_STA_AP_BI_MATCH: flag attribute specifying that
    //  *  beacon intervals within this group must be all the same even for
    //  *  infrastructure and AP/GO combinations, i.e. the GO(s) must adopt
    //  *  the infrastructure network's beacon interval.
    //  * @NL80211_IFACE_COMB_NUM_CHANNELS: u32 attribute specifying how many
    //  *  different channels may be used within this group.
    //  * @NL80211_IFACE_COMB_RADAR_DETECT_WIDTHS: u32 attribute containing the bitmap
    //  *  of supported channel widths for radar detection.
    //  * @NL80211_IFACE_COMB_RADAR_DETECT_REGIONS: u32 attribute containing the bitmap
    //  *  of supported regulatory regions for radar detection.
    //  * @NUM_NL80211_IFACE_COMB: number of attributes
    //  * @MAX_NL80211_IFACE_COMB: highest attribute number
    //  *
    //  * Examples:
    //  *  limits = [ #{STA} <= 1, #{AP} <= 1 ], matching BI, channels = 1, max = 2
    //  *  => allows an AP and a STA that must match BIs
    //  *
    //  *  numbers = [ #{AP, P2P-GO} <= 8 ], channels = 1, max = 8
    //  *  => allows 8 of AP/GO
    //  *
    //  *  numbers = [ #{STA} <= 2 ], channels = 2, max = 2
    //  *  => allows two STAs on different channels
    //  *
    //  *  numbers = [ #{STA} <= 1, #{P2P-client,P2P-GO} <= 3 ], max = 4
    //  *  => allows a STA plus three P2P interfaces
    //  *
    //  * The list of these four possiblities could completely be contained
    //  * within the %NL80211_ATTR_INTERFACE_COMBINATIONS attribute to indicate
    //  * that any of these groups must match.
    //  *
    //  * "Combinations" of just a single interface will not be listed here,
    //  * a single interface of any valid interface type is assumed to always
    //  * be possible by itself. This means that implicitly, for each valid
    //  * interface type, the following group always exists:
    //  *  numbers = [ #{<type>} <= 1 ], channels = 1, max = 1
    //  */
    // enum nl80211_if_combination_attrs {
    //     NL80211_IFACE_COMB_UNSPEC,
    //     NL80211_IFACE_COMB_LIMITS,
    //     NL80211_IFACE_COMB_MAXNUM,
    //     NL80211_IFACE_COMB_STA_AP_BI_MATCH,
    //     NL80211_IFACE_COMB_NUM_CHANNELS,
    //     NL80211_IFACE_COMB_RADAR_DETECT_WIDTHS,
    //     NL80211_IFACE_COMB_RADAR_DETECT_REGIONS,

    //     /* keep last */
    //     NUM_NL80211_IFACE_COMB,
    //     MAX_NL80211_IFACE_COMB = NUM_NL80211_IFACE_COMB - 1
    // };


    // /**
    //  * enum nl80211_plink_state - state of a mesh peer link finite state machine
    //  *
    //  * @NL80211_PLINK_LISTEN: initial state, considered the implicit
    //  *  state of non existant mesh peer links
    //  * @NL80211_PLINK_OPN_SNT: mesh plink open frame has been sent to
    //  *  this mesh peer
    //  * @NL80211_PLINK_OPN_RCVD: mesh plink open frame has been received
    //  *  from this mesh peer
    //  * @NL80211_PLINK_CNF_RCVD: mesh plink confirm frame has been
    //  *  received from this mesh peer
    //  * @NL80211_PLINK_ESTAB: mesh peer link is established
    //  * @NL80211_PLINK_HOLDING: mesh peer link is being closed or cancelled
    //  * @NL80211_PLINK_BLOCKED: all frames transmitted from this mesh
    //  *  plink are discarded
    //  * @NUM_NL80211_PLINK_STATES: number of peer link states
    //  * @MAX_NL80211_PLINK_STATES: highest numerical value of plink states
    //  */
    // enum nl80211_plink_state {
    //     NL80211_PLINK_LISTEN,
    //     NL80211_PLINK_OPN_SNT,
    //     NL80211_PLINK_OPN_RCVD,
    //     NL80211_PLINK_CNF_RCVD,
    //     NL80211_PLINK_ESTAB,
    //     NL80211_PLINK_HOLDING,
    //     NL80211_PLINK_BLOCKED,

    //     /* keep last */
    //     NUM_NL80211_PLINK_STATES,
    //     MAX_NL80211_PLINK_STATES = NUM_NL80211_PLINK_STATES - 1
    // };

    // /**
    //  * enum nl80211_plink_action - actions to perform in mesh peers
    //  *
    //  * @NL80211_PLINK_ACTION_NO_ACTION: perform no action
    //  * @NL80211_PLINK_ACTION_OPEN: start mesh peer link establishment
    //  * @NL80211_PLINK_ACTION_BLOCK: block traffic from this mesh peer
    //  * @NUM_NL80211_PLINK_ACTIONS: number of possible actions
    //  */
    // enum plink_actions {
    //     NL80211_PLINK_ACTION_NO_ACTION,
    //     NL80211_PLINK_ACTION_OPEN,
    //     NL80211_PLINK_ACTION_BLOCK,

    //     NUM_NL80211_PLINK_ACTIONS,
    // };


    // #define NL80211_KCK_LEN         16
    // #define NL80211_KEK_LEN         16
    // #define NL80211_REPLAY_CTR_LEN      8

    // /**
    //  * enum nl80211_rekey_data - attributes for GTK rekey offload
    //  * @__NL80211_REKEY_DATA_INVALID: invalid number for nested attributes
    //  * @NL80211_REKEY_DATA_KEK: key encryption key (binary)
    //  * @NL80211_REKEY_DATA_KCK: key confirmation key (binary)
    //  * @NL80211_REKEY_DATA_REPLAY_CTR: replay counter (binary)
    //  * @NUM_NL80211_REKEY_DATA: number of rekey attributes (internal)
    //  * @MAX_NL80211_REKEY_DATA: highest rekey attribute (internal)
    //  */
    // enum nl80211_rekey_data {
    //     __NL80211_REKEY_DATA_INVALID,
    //     NL80211_REKEY_DATA_KEK,
    //     NL80211_REKEY_DATA_KCK,
    //     NL80211_REKEY_DATA_REPLAY_CTR,

    //     /* keep last */
    //     NUM_NL80211_REKEY_DATA,
    //     MAX_NL80211_REKEY_DATA = NUM_NL80211_REKEY_DATA - 1
    // };

    // /**
    //  * enum nl80211_hidden_ssid - values for %NL80211_ATTR_HIDDEN_SSID
    //  * @NL80211_HIDDEN_SSID_NOT_IN_USE: do not hide SSID (i.e., broadcast it in
    //  *  Beacon frames)
    //  * @NL80211_HIDDEN_SSID_ZERO_LEN: hide SSID by using zero-length SSID element
    //  *  in Beacon frames
    //  * @NL80211_HIDDEN_SSID_ZERO_CONTENTS: hide SSID by using correct length of SSID
    //  *  element in Beacon frames but zero out each byte in the SSID
    //  */
    // enum nl80211_hidden_ssid {
    //     NL80211_HIDDEN_SSID_NOT_IN_USE,
    //     NL80211_HIDDEN_SSID_ZERO_LEN,
    //     NL80211_HIDDEN_SSID_ZERO_CONTENTS
    // };

    // /**
    //  * enum nl80211_sta_wme_attr - station WME attributes
    //  * @__NL80211_STA_WME_INVALID: invalid number for nested attribute
    //  * @NL80211_STA_WME_UAPSD_QUEUES: bitmap of uapsd queues. the format
    //  *  is the same as the AC bitmap in the QoS info field.
    //  * @NL80211_STA_WME_MAX_SP: max service period. the format is the same
    //  *  as the MAX_SP field in the QoS info field (but already shifted down).
    //  * @__NL80211_STA_WME_AFTER_LAST: internal
    //  * @NL80211_STA_WME_MAX: highest station WME attribute
    //  */
    // enum nl80211_sta_wme_attr {
    //     __NL80211_STA_WME_INVALID,
    //     NL80211_STA_WME_UAPSD_QUEUES,
    //     NL80211_STA_WME_MAX_SP,

    //     /* keep last */
    //     __NL80211_STA_WME_AFTER_LAST,
    //     NL80211_STA_WME_MAX = __NL80211_STA_WME_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_pmksa_candidate_attr - attributes for PMKSA caching candidates
    //  * @__NL80211_PMKSA_CANDIDATE_INVALID: invalid number for nested attributes
    //  * @NL80211_PMKSA_CANDIDATE_INDEX: candidate index (u32; the smaller, the higher
    //  *  priority)
    //  * @NL80211_PMKSA_CANDIDATE_BSSID: candidate BSSID (6 octets)
    //  * @NL80211_PMKSA_CANDIDATE_PREAUTH: RSN pre-authentication supported (flag)
    //  * @NUM_NL80211_PMKSA_CANDIDATE: number of PMKSA caching candidate attributes
    //  *  (internal)
    //  * @MAX_NL80211_PMKSA_CANDIDATE: highest PMKSA caching candidate attribute
    //  *  (internal)
    //  */
    // enum nl80211_pmksa_candidate_attr {
    //     __NL80211_PMKSA_CANDIDATE_INVALID,
    //     NL80211_PMKSA_CANDIDATE_INDEX,
    //     NL80211_PMKSA_CANDIDATE_BSSID,
    //     NL80211_PMKSA_CANDIDATE_PREAUTH,

    //     /* keep last */
    //     NUM_NL80211_PMKSA_CANDIDATE,
    //     MAX_NL80211_PMKSA_CANDIDATE = NUM_NL80211_PMKSA_CANDIDATE - 1
    // };

    // /**
    //  * enum nl80211_tdls_operation - values for %NL80211_ATTR_TDLS_OPERATION
    //  * @NL80211_TDLS_DISCOVERY_REQ: Send a TDLS discovery request
    //  * @NL80211_TDLS_SETUP: Setup TDLS link
    //  * @NL80211_TDLS_TEARDOWN: Teardown a TDLS link which is already established
    //  * @NL80211_TDLS_ENABLE_LINK: Enable TDLS link
    //  * @NL80211_TDLS_DISABLE_LINK: Disable TDLS link
    //  */
    // enum nl80211_tdls_operation {
    //     NL80211_TDLS_DISCOVERY_REQ,
    //     NL80211_TDLS_SETUP,
    //     NL80211_TDLS_TEARDOWN,
    //     NL80211_TDLS_ENABLE_LINK,
    //     NL80211_TDLS_DISABLE_LINK,
    // };

    // /*
    //  * enum nl80211_ap_sme_features - device-integrated AP features
    //  * Reserved for future use, no bits are defined in
    //  * NL80211_ATTR_DEVICE_AP_SME yet.
    // enum nl80211_ap_sme_features {
    // };
    //  */

    // /**
    //  * enum nl80211_feature_flags - device/driver features
    //  * @NL80211_FEATURE_SK_TX_STATUS: This driver supports reflecting back
    //  *  TX status to the socket error queue when requested with the
    //  *  socket option.
    //  * @NL80211_FEATURE_HT_IBSS: This driver supports IBSS with HT datarates.
    //  * @NL80211_FEATURE_INACTIVITY_TIMER: This driver takes care of freeing up
    //  *  the connected inactive stations in AP mode.
    //  * @NL80211_FEATURE_CELL_BASE_REG_HINTS: This driver has been tested
    //  *  to work properly to suppport receiving regulatory hints from
    //  *  cellular base stations.
    //  * @NL80211_FEATURE_P2P_DEVICE_NEEDS_CHANNEL: (no longer available, only
    //  *  here to reserve the value for API/ABI compatibility)
    //  * @NL80211_FEATURE_SAE: This driver supports simultaneous authentication of
    //  *  equals (SAE) with user space SME (NL80211_CMD_AUTHENTICATE) in station
    //  *  mode
    //  * @NL80211_FEATURE_LOW_PRIORITY_SCAN: This driver supports low priority scan
    //  * @NL80211_FEATURE_SCAN_FLUSH: Scan flush is supported
    //  * @NL80211_FEATURE_AP_SCAN: Support scanning using an AP vif
    //  * @NL80211_FEATURE_VIF_TXPOWER: The driver supports per-vif TX power setting
    //  * @NL80211_FEATURE_NEED_OBSS_SCAN: The driver expects userspace to perform
    //  *  OBSS scans and generate 20/40 BSS coex reports. This flag is used only
    //  *  for drivers implementing the CONNECT API, for AUTH/ASSOC it is implied.
    //  * @NL80211_FEATURE_P2P_GO_CTWIN: P2P GO implementation supports CT Window
    //  *  setting
    //  * @NL80211_FEATURE_P2P_GO_OPPPS: P2P GO implementation supports opportunistic
    //  *  powersave
    //  * @NL80211_FEATURE_FULL_AP_CLIENT_STATE: The driver supports full state
    //  *  transitions for AP clients. Without this flag (and if the driver
    //  *  doesn't have the AP SME in the device) the driver supports adding
    //  *  stations only when they're associated and adds them in associated
    //  *  state (to later be transitioned into authorized), with this flag
    //  *  they should be added before even sending the authentication reply
    //  *  and then transitioned into authenticated, associated and authorized
    //  *  states using station flags.
    //  *  Note that even for drivers that support this, the default is to add
    //  *  stations in authenticated/associated state, so to add unauthenticated
    //  *  stations the authenticated/associated bits have to be set in the mask.
    //  * @NL80211_FEATURE_ADVERTISE_CHAN_LIMITS: cfg80211 advertises channel limits
    //  *  (HT40, VHT 80/160 MHz) if this flag is set
    //  * @NL80211_FEATURE_USERSPACE_MPM: This driver supports a userspace Mesh
    //  *  Peering Management entity which may be implemented by registering for
    //  *  beacons or NL80211_CMD_NEW_PEER_CANDIDATE events. The mesh beacon is
    //  *  still generated by the driver.
    //  * @NL80211_FEATURE_ACTIVE_MONITOR: This driver supports an active monitor
    //  *  interface. An active monitor interface behaves like a normal monitor
    //  *  interface, but gets added to the driver. It ensures that incoming
    //  *  unicast packets directed at the configured interface address get ACKed.
    //  * @NL80211_FEATURE_AP_MODE_CHAN_WIDTH_CHANGE: This driver supports dynamic
    //  *  channel bandwidth change (e.g., HT 20 <-> 40 MHz channel) during the
    //  *  lifetime of a BSS.
    //  * @NL80211_FEATURE_DS_PARAM_SET_IE_IN_PROBES: This device adds a DS Parameter
    //  *  Set IE to probe requests.
    //  * @NL80211_FEATURE_WFA_TPC_IE_IN_PROBES: This device adds a WFA TPC Report IE
    //  *  to probe requests.
    //  * @NL80211_FEATURE_QUIET: This device, in client mode, supports Quiet Period
    //  *  requests sent to it by an AP.
    //  * @NL80211_FEATURE_TX_POWER_INSERTION: This device is capable of inserting the
    //  *  current tx power value into the TPC Report IE in the spectrum
    //  *  management TPC Report action frame, and in the Radio Measurement Link
    //  *  Measurement Report action frame.
    //  * @NL80211_FEATURE_ACKTO_ESTIMATION: This driver supports dynamic ACK timeout
    //  *  estimation (dynack). %NL80211_ATTR_WIPHY_DYN_ACK flag attribute is used
    //  *  to enable dynack.
    //  * @NL80211_FEATURE_STATIC_SMPS: Device supports static spatial
    //  *  multiplexing powersave, ie. can turn off all but one chain
    //  *  even on HT connections that should be using more chains.
    //  * @NL80211_FEATURE_DYNAMIC_SMPS: Device supports dynamic spatial
    //  *  multiplexing powersave, ie. can turn off all but one chain
    //  *  and then wake the rest up as required after, for example,
    //  *  rts/cts handshake.
    //  * @NL80211_FEATURE_SUPPORTS_WMM_ADMISSION: the device supports setting up WMM
    //  *  TSPEC sessions (TID aka TSID 0-7) with the %NL80211_CMD_ADD_TX_TS
    //  *  command. Standard IEEE 802.11 TSPEC setup is not yet supported, it
    //  *  needs to be able to handle Block-Ack agreements and other things.
    //  * @NL80211_FEATURE_MAC_ON_CREATE: Device supports configuring
    //  *  the vif's MAC address upon creation.
    //  *  See 'macaddr' field in the vif_params (cfg80211.h).
    //  * @NL80211_FEATURE_TDLS_CHANNEL_SWITCH: Driver supports channel switching when
    //  *  operating as a TDLS peer.
    //  * @NL80211_FEATURE_SCAN_RANDOM_MAC_ADDR: This device/driver supports using a
    //  *  random MAC address during scan (if the device is unassociated); the
    //  *  %NL80211_SCAN_FLAG_RANDOM_ADDR flag may be set for scans and the MAC
    //  *  address mask/value will be used.
    //  * @NL80211_FEATURE_SCHED_SCAN_RANDOM_MAC_ADDR: This device/driver supports
    //  *  using a random MAC address for every scan iteration during scheduled
    //  *  scan (while not associated), the %NL80211_SCAN_FLAG_RANDOM_ADDR may
    //  *  be set for scheduled scan and the MAC address mask/value will be used.
    //  * @NL80211_FEATURE_ND_RANDOM_MAC_ADDR: This device/driver supports using a
    //  *  random MAC address for every scan iteration during "net detect", i.e.
    //  *  scan in unassociated WoWLAN, the %NL80211_SCAN_FLAG_RANDOM_ADDR may
    //  *  be set for scheduled scan and the MAC address mask/value will be used.
    //  */
    // enum nl80211_feature_flags {
    //     NL80211_FEATURE_SK_TX_STATUS            = 1 << 0,
    //     NL80211_FEATURE_HT_IBSS             = 1 << 1,
    //     NL80211_FEATURE_INACTIVITY_TIMER        = 1 << 2,
    //     NL80211_FEATURE_CELL_BASE_REG_HINTS     = 1 << 3,
    //     NL80211_FEATURE_P2P_DEVICE_NEEDS_CHANNEL    = 1 << 4,
    //     NL80211_FEATURE_SAE             = 1 << 5,
    //     NL80211_FEATURE_LOW_PRIORITY_SCAN       = 1 << 6,
    //     NL80211_FEATURE_SCAN_FLUSH          = 1 << 7,
    //     NL80211_FEATURE_AP_SCAN             = 1 << 8,
    //     NL80211_FEATURE_VIF_TXPOWER         = 1 << 9,
    //     NL80211_FEATURE_NEED_OBSS_SCAN          = 1 << 10,
    //     NL80211_FEATURE_P2P_GO_CTWIN            = 1 << 11,
    //     NL80211_FEATURE_P2P_GO_OPPPS            = 1 << 12,
    //     /* bit 13 is reserved */
    //     NL80211_FEATURE_ADVERTISE_CHAN_LIMITS       = 1 << 14,
    //     NL80211_FEATURE_FULL_AP_CLIENT_STATE        = 1 << 15,
    //     NL80211_FEATURE_USERSPACE_MPM           = 1 << 16,
    //     NL80211_FEATURE_ACTIVE_MONITOR          = 1 << 17,
    //     NL80211_FEATURE_AP_MODE_CHAN_WIDTH_CHANGE   = 1 << 18,
    //     NL80211_FEATURE_DS_PARAM_SET_IE_IN_PROBES   = 1 << 19,
    //     NL80211_FEATURE_WFA_TPC_IE_IN_PROBES        = 1 << 20,
    //     NL80211_FEATURE_QUIET               = 1 << 21,
    //     NL80211_FEATURE_TX_POWER_INSERTION      = 1 << 22,
    //     NL80211_FEATURE_ACKTO_ESTIMATION        = 1 << 23,
    //     NL80211_FEATURE_STATIC_SMPS         = 1 << 24,
    //     NL80211_FEATURE_DYNAMIC_SMPS            = 1 << 25,
    //     NL80211_FEATURE_SUPPORTS_WMM_ADMISSION      = 1 << 26,
    //     NL80211_FEATURE_MAC_ON_CREATE           = 1 << 27,
    //     NL80211_FEATURE_TDLS_CHANNEL_SWITCH     = 1 << 28,
    //     NL80211_FEATURE_SCAN_RANDOM_MAC_ADDR        = 1 << 29,
    //     NL80211_FEATURE_SCHED_SCAN_RANDOM_MAC_ADDR  = 1 << 30,
    //     NL80211_FEATURE_ND_RANDOM_MAC_ADDR      = 1 << 31,
    // };

    // /**
    //  * enum nl80211_ext_feature_index - bit index of extended features.
    //  * @NL80211_EXT_FEATURE_VHT_IBSS: This driver supports IBSS with VHT datarates.
    //  *
    //  * @NUM_NL80211_EXT_FEATURES: number of extended features.
    //  * @MAX_NL80211_EXT_FEATURES: highest extended feature index.
    //  */
    // enum nl80211_ext_feature_index {
    //     NL80211_EXT_FEATURE_VHT_IBSS,

    //     /* add new features before the definition below */
    //     NUM_NL80211_EXT_FEATURES,
    //     MAX_NL80211_EXT_FEATURES = NUM_NL80211_EXT_FEATURES - 1
    // };

    // /**
    //  * enum nl80211_probe_resp_offload_support_attr - optional supported
    //  *  protocols for probe-response offloading by the driver/FW.
    //  *  To be used with the %NL80211_ATTR_PROBE_RESP_OFFLOAD attribute.
    //  *  Each enum value represents a bit in the bitmap of supported
    //  *  protocols. Typically a subset of probe-requests belonging to a
    //  *  supported protocol will be excluded from offload and uploaded
    //  *  to the host.
    //  *
    //  * @NL80211_PROBE_RESP_OFFLOAD_SUPPORT_WPS: Support for WPS ver. 1
    //  * @NL80211_PROBE_RESP_OFFLOAD_SUPPORT_WPS2: Support for WPS ver. 2
    //  * @NL80211_PROBE_RESP_OFFLOAD_SUPPORT_P2P: Support for P2P
    //  * @NL80211_PROBE_RESP_OFFLOAD_SUPPORT_80211U: Support for 802.11u
    //  */
    // enum nl80211_probe_resp_offload_support_attr {
    //     NL80211_PROBE_RESP_OFFLOAD_SUPPORT_WPS =    1<<0,
    //     NL80211_PROBE_RESP_OFFLOAD_SUPPORT_WPS2 =   1<<1,
    //     NL80211_PROBE_RESP_OFFLOAD_SUPPORT_P2P =    1<<2,
    //     NL80211_PROBE_RESP_OFFLOAD_SUPPORT_80211U = 1<<3,
    // };

    // /**
    //  * enum nl80211_connect_failed_reason - connection request failed reasons
    //  * @NL80211_CONN_FAIL_MAX_CLIENTS: Maximum number of clients that can be
    //  *  handled by the AP is reached.
    //  * @NL80211_CONN_FAIL_BLOCKED_CLIENT: Connection request is rejected due to ACL.
    //  */
    // enum nl80211_connect_failed_reason {
    //     NL80211_CONN_FAIL_MAX_CLIENTS,
    //     NL80211_CONN_FAIL_BLOCKED_CLIENT,
    // };

    // /**
    //  * enum nl80211_scan_flags -  scan request control flags
    //  *
    //  * Scan request control flags are used to control the handling
    //  * of NL80211_CMD_TRIGGER_SCAN and NL80211_CMD_START_SCHED_SCAN
    //  * requests.
    //  *
    //  * @NL80211_SCAN_FLAG_LOW_PRIORITY: scan request has low priority
    //  * @NL80211_SCAN_FLAG_FLUSH: flush cache before scanning
    //  * @NL80211_SCAN_FLAG_AP: force a scan even if the interface is configured
    //  *  as AP and the beaconing has already been configured. This attribute is
    //  *  dangerous because will destroy stations performance as a lot of frames
    //  *  will be lost while scanning off-channel, therefore it must be used only
    //  *  when really needed
    //  * @NL80211_SCAN_FLAG_RANDOM_ADDR: use a random MAC address for this scan (or
    //  *  for scheduled scan: a different one for every scan iteration). When the
    //  *  flag is set, depending on device capabilities the @NL80211_ATTR_MAC and
    //  *  @NL80211_ATTR_MAC_MASK attributes may also be given in which case only
    //  *  the masked bits will be preserved from the MAC address and the remainder
    //  *  randomised. If the attributes are not given full randomisation (46 bits,
    //  *  locally administered 1, multicast 0) is assumed.
    //  *  This flag must not be requested when the feature isn't supported, check
    //  *  the nl80211 feature flags for the device.
    //  */
    // enum nl80211_scan_flags {
    //     NL80211_SCAN_FLAG_LOW_PRIORITY          = 1<<0,
    //     NL80211_SCAN_FLAG_FLUSH             = 1<<1,
    //     NL80211_SCAN_FLAG_AP                = 1<<2,
    //     NL80211_SCAN_FLAG_RANDOM_ADDR           = 1<<3,
    // };

    // /**
    //  * enum nl80211_acl_policy - access control policy
    //  *
    //  * Access control policy is applied on a MAC list set by
    //  * %NL80211_CMD_START_AP and %NL80211_CMD_SET_MAC_ACL, to
    //  * be used with %NL80211_ATTR_ACL_POLICY.
    //  *
    //  * @NL80211_ACL_POLICY_ACCEPT_UNLESS_LISTED: Deny stations which are
    //  *  listed in ACL, i.e. allow all the stations which are not listed
    //  *  in ACL to authenticate.
    //  * @NL80211_ACL_POLICY_DENY_UNLESS_LISTED: Allow the stations which are listed
    //  *  in ACL, i.e. deny all the stations which are not listed in ACL.
    //  */
    // enum nl80211_acl_policy {
    //     NL80211_ACL_POLICY_ACCEPT_UNLESS_LISTED,
    //     NL80211_ACL_POLICY_DENY_UNLESS_LISTED,
    // };

    // /**
    //  * enum nl80211_smps_mode - SMPS mode
    //  *
    //  * Requested SMPS mode (for AP mode)
    //  *
    //  * @NL80211_SMPS_OFF: SMPS off (use all antennas).
    //  * @NL80211_SMPS_STATIC: static SMPS (use a single antenna)
    //  * @NL80211_SMPS_DYNAMIC: dynamic smps (start with a single antenna and
    //  *  turn on other antennas after CTS/RTS).
    //  */
    // enum nl80211_smps_mode {
    //     NL80211_SMPS_OFF,
    //     NL80211_SMPS_STATIC,
    //     NL80211_SMPS_DYNAMIC,

    //     __NL80211_SMPS_AFTER_LAST,
    //     NL80211_SMPS_MAX = __NL80211_SMPS_AFTER_LAST - 1
    // };

    // /**
    //  * enum nl80211_radar_event - type of radar event for DFS operation
    //  *
    //  * Type of event to be used with NL80211_ATTR_RADAR_EVENT to inform userspace
    //  * about detected radars or success of the channel available check (CAC)
    //  *
    //  * @NL80211_RADAR_DETECTED: A radar pattern has been detected. The channel is
    //  *  now unusable.
    //  * @NL80211_RADAR_CAC_FINISHED: Channel Availability Check has been finished,
    //  *  the channel is now available.
    //  * @NL80211_RADAR_CAC_ABORTED: Channel Availability Check has been aborted, no
    //  *  change to the channel status.
    //  * @NL80211_RADAR_NOP_FINISHED: The Non-Occupancy Period for this channel is
    //  *  over, channel becomes usable.
    //  */
    // enum nl80211_radar_event {
    //     NL80211_RADAR_DETECTED,
    //     NL80211_RADAR_CAC_FINISHED,
    //     NL80211_RADAR_CAC_ABORTED,
    //     NL80211_RADAR_NOP_FINISHED,
    // };

    // /**
    //  * enum nl80211_dfs_state - DFS states for channels
    //  *
    //  * Channel states used by the DFS code.
    //  *
    //  * @NL80211_DFS_USABLE: The channel can be used, but channel availability
    //  *  check (CAC) must be performed before using it for AP or IBSS.
    //  * @NL80211_DFS_UNAVAILABLE: A radar has been detected on this channel, it
    //  *  is therefore marked as not available.
    //  * @NL80211_DFS_AVAILABLE: The channel has been CAC checked and is available.
    //  */
    // enum nl80211_dfs_state {
    //     NL80211_DFS_USABLE,
    //     NL80211_DFS_UNAVAILABLE,
    //     NL80211_DFS_AVAILABLE,
    // };

    // /**
    //  * enum enum nl80211_protocol_features - nl80211 protocol features
    //  * @NL80211_PROTOCOL_FEATURE_SPLIT_WIPHY_DUMP: nl80211 supports splitting
    //  *  wiphy dumps (if requested by the application with the attribute
    //  *  %NL80211_ATTR_SPLIT_WIPHY_DUMP. Also supported is filtering the
    //  *  wiphy dump by %NL80211_ATTR_WIPHY, %NL80211_ATTR_IFINDEX or
    //  *  %NL80211_ATTR_WDEV.
    //  */
    // enum nl80211_protocol_features {
    //     NL80211_PROTOCOL_FEATURE_SPLIT_WIPHY_DUMP = 1 << 0,
    // };

    // /**
    //  * enum nl80211_crit_proto_id - nl80211 critical protocol identifiers
    //  *
    //  * @NL80211_CRIT_PROTO_UNSPEC: protocol unspecified.
    //  * @NL80211_CRIT_PROTO_DHCP: BOOTP or DHCPv6 protocol.
    //  * @NL80211_CRIT_PROTO_EAPOL: EAPOL protocol.
    //  * @NL80211_CRIT_PROTO_APIPA: APIPA protocol.
    //  * @NUM_NL80211_CRIT_PROTO: must be kept last.
    //  */
    // enum nl80211_crit_proto_id {
    //     NL80211_CRIT_PROTO_UNSPEC,
    //     NL80211_CRIT_PROTO_DHCP,
    //     NL80211_CRIT_PROTO_EAPOL,
    //     NL80211_CRIT_PROTO_APIPA,
    //     /* add other protocols before this one */
    //     NUM_NL80211_CRIT_PROTO
    // };

    // /* maximum duration for critical protocol measures */
    // #define NL80211_CRIT_PROTO_MAX_DURATION     5000 /* msec */

    // /**
    //  * enum nl80211_rxmgmt_flags - flags for received management frame.
    //  *
    //  * Used by cfg80211_rx_mgmt()
    //  *
    //  * @NL80211_RXMGMT_FLAG_ANSWERED: frame was answered by device/driver.
    //  */
    // enum nl80211_rxmgmt_flags {
    //     NL80211_RXMGMT_FLAG_ANSWERED = 1 << 0,
    // };

    // /*
    //  * If this flag is unset, the lower 24 bits are an OUI, if set
    //  * a Linux nl80211 vendor ID is used (no such IDs are allocated
    //  * yet, so that's not valid so far)
    //  */
    // #define NL80211_VENDOR_ID_IS_LINUX  0x80000000

    // /**
    //  * struct nl80211_vendor_cmd_info - vendor command data
    //  * @vendor_id: If the %NL80211_VENDOR_ID_IS_LINUX flag is clear, then the
    //  *  value is a 24-bit OUI; if it is set then a separately allocated ID
    //  *  may be used, but no such IDs are allocated yet. New IDs should be
    //  *  added to this file when needed.
    //  * @subcmd: sub-command ID for the command
    //  */
    // struct nl80211_vendor_cmd_info {
    //     __u32 vendor_id;
    //     __u32 subcmd;
    // };

    // /**
    //  * enum nl80211_tdls_peer_capability - TDLS peer flags.
    //  *
    //  * Used by tdls_mgmt() to determine which conditional elements need
    //  * to be added to TDLS Setup frames.
    //  *
    //  * @NL80211_TDLS_PEER_HT: TDLS peer is HT capable.
    //  * @NL80211_TDLS_PEER_VHT: TDLS peer is VHT capable.
    //  * @NL80211_TDLS_PEER_WMM: TDLS peer is WMM capable.
    //  */
    // enum nl80211_tdls_peer_capability {
    //     NL80211_TDLS_PEER_HT = 1<<0,
    //     NL80211_TDLS_PEER_VHT = 1<<1,
    //     NL80211_TDLS_PEER_WMM = 1<<2,
    // };

    // /**
    //  * enum nl80211_sched_scan_plan - scanning plan for scheduled scan
    //  * @__NL80211_SCHED_SCAN_PLAN_INVALID: attribute number 0 is reserved
    //  * @NL80211_SCHED_SCAN_PLAN_INTERVAL: interval between scan iterations. In
    //  *  seconds (u32).
    //  * @NL80211_SCHED_SCAN_PLAN_ITERATIONS: number of scan iterations in this
    //  *  scan plan (u32). The last scan plan must not specify this attribute
    //  *  because it will run infinitely. A value of zero is invalid as it will
    //  *  make the scan plan meaningless.
    //  * @NL80211_SCHED_SCAN_PLAN_MAX: highest scheduled scan plan attribute number
    //  *  currently defined
    //  * @__NL80211_SCHED_SCAN_PLAN_AFTER_LAST: internal use
    //  */
    // enum nl80211_sched_scan_plan {
    //     __NL80211_SCHED_SCAN_PLAN_INVALID,
    //     NL80211_SCHED_SCAN_PLAN_INTERVAL,
    //     NL80211_SCHED_SCAN_PLAN_ITERATIONS,

    //     /* keep last */
    //     __NL80211_SCHED_SCAN_PLAN_AFTER_LAST,
    //     NL80211_SCHED_SCAN_PLAN_MAX =
    //         __NL80211_SCHED_SCAN_PLAN_AFTER_LAST - 1
    // };

};

module.exports = iwtypes;