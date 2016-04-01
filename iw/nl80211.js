
/**
 * DOC: Station handling
 *
 * Stations are added per interface, but a special case exists with VLAN
 * interfaces. When a station is bound to an AP interface, it may be moved
 * into a VLAN identified by a VLAN interface index (%NL80211_ATTR_STA_VLAN).
 * The station is still assumed to belong to the AP interface it was added
 * to.
 *
 * Station handling varies per interface type and depending on the driver's
 * capabilities.
 *
 * For drivers supporting TDLS with external setup (WIPHY_FLAG_SUPPORTS_TDLS
 * and WIPHY_FLAG_TDLS_EXTERNAL_SETUP), the station lifetime is as follows:
 *  - a setup station entry is added, not yet authorized, without any rate
 *    or capability information, this just exists to avoid race conditions
 *  - when the TDLS setup is done, a single NL80211_CMD_SET_STATION is valid
 *    to add rate and capability information to the station and at the same
 *    time mark it authorized.
 *  - %NL80211_TDLS_ENABLE_LINK is then used
 *  - after this, the only valid operation is to remove it by tearing down
 *    the TDLS link (%NL80211_TDLS_DISABLE_LINK)
 *
 * TODO: need more info for other interface types
 */

/**
 * DOC: Frame transmission/registration support
 *
 * Frame transmission and registration support exists to allow userspace
 * management entities such as wpa_supplicant react to management frames
 * that are not being handled by the kernel. This includes, for example,
 * certain classes of action frames that cannot be handled in the kernel
 * for various reasons.
 *
 * Frame registration is done on a per-interface basis and registrations
 * cannot be removed other than by closing the socket. It is possible to
 * specify a registration filter to register, for example, only for a
 * certain type of action frame. In particular with action frames, those
 * that userspace registers for will not be returned as unhandled by the
 * driver, so that the registered application has to take responsibility
 * for doing that.
 *
 * The type of frame that can be registered for is also dependent on the
 * driver and interface type. The frame types are advertised in wiphy
 * attributes so applications know what to expect.
 *
 * NOTE: When an interface changes type while registrations are active,
 *       these registrations are ignored until the interface type is
 *       changed again. This means that changing the interface type can
 *       lead to a situation that couldn't otherwise be produced, but
 *       any such registrations will be dormant in the sense that they
 *       will not be serviced, i.e. they will not receive any frames.
 *
 * Frame transmission allows userspace to send for example the required
 * responses to action frames. It is subject to some sanity checking,
 * but many frames can be transmitted. When a frame was transmitted, its
 * status is indicated to the sending socket.
 *
 * For more technical details, see the corresponding command descriptions
 * below.
 */

/**
 * DOC: Virtual interface / concurrency capabilities
 *
 * Some devices are able to operate with virtual MACs, they can have
 * more than one virtual interface. The capability handling for this
 * is a bit complex though, as there may be a number of restrictions
 * on the types of concurrency that are supported.
 *
 * To start with, each device supports the interface types listed in
 * the %NL80211_ATTR_SUPPORTED_IFTYPES attribute, but by listing the
 * types there no concurrency is implied.
 *
 * Once concurrency is desired, more attributes must be observed:
 * To start with, since some interface types are purely managed in
 * software, like the AP-VLAN type in mac80211 for example, there's
 * an additional list of these, they can be added at any time and
 * are only restricted by some semantic restrictions (e.g. AP-VLAN
 * cannot be added without a corresponding AP interface). This list
 * is exported in the %NL80211_ATTR_SOFTWARE_IFTYPES attribute.
 *
 * Further, the list of supported combinations is exported. This is
 * in the %NL80211_ATTR_INTERFACE_COMBINATIONS attribute. Basically,
 * it exports a list of "groups", and at any point in time the
 * interfaces that are currently active must fall into any one of
 * the advertised groups. Within each group, there are restrictions
 * on the number of interfaces of different types that are supported
 * and also the number of different channels, along with potentially
 * some other restrictions. See &enum nl80211_if_combination_attrs.
 *
 * All together, these attributes define the concurrency of virtual
 * interfaces that a given device supports.
 */

/**
 * DOC: packet coalesce support
 *
 * In most cases, host that receives IPv4 and IPv6 multicast/broadcast
 * packets does not do anything with these packets. Therefore the
 * reception of these unwanted packets causes unnecessary processing
 * and power consumption.
 *
 * Packet coalesce feature helps to reduce number of received interrupts
 * to host by buffering these packets in firmware/hardware for some
 * predefined time. Received interrupt will be generated when one of the
 * following events occur.
 * a) Expiration of hardware timer whose expiration time is set to maximum
 * coalescing delay of matching coalesce rule.
 * b) Coalescing buffer in hardware reaches it's limit.
 * c) Packet doesn't match any of the configured coalesce rules.
 *
 * User needs to configure following parameters for creating a coalesce
 * rule.
 * a) Maximum coalescing delay
 * b) List of packet patterns which needs to be matched
 * c) Condition for coalescence. pattern 'match' or 'no match'
 * Multiple such rules can be created.
 */

/**
 * enum nl80211_commands - supported nl80211 commands
 *
 * @NL80211_CMD_UNSPEC: unspecified command to catch errors
 *
 * @NL80211_CMD_GET_WIPHY: request information about a wiphy or dump request
 *  to get a list of all present wiphys.
 * @NL80211_CMD_SET_WIPHY: set wiphy parameters, needs %NL80211_ATTR_WIPHY or
 *  %NL80211_ATTR_IFINDEX; can be used to set %NL80211_ATTR_WIPHY_NAME,
 *  %NL80211_ATTR_WIPHY_TXQ_PARAMS, %NL80211_ATTR_WIPHY_FREQ (and the
 *  attributes determining the channel width; this is used for setting
 *  monitor mode channel),  %NL80211_ATTR_WIPHY_RETRY_SHORT,
 *  %NL80211_ATTR_WIPHY_RETRY_LONG, %NL80211_ATTR_WIPHY_FRAG_THRESHOLD,
 *  and/or %NL80211_ATTR_WIPHY_RTS_THRESHOLD.
 *  However, for setting the channel, see %NL80211_CMD_SET_CHANNEL
 *  instead, the support here is for backward compatibility only.
 * @NL80211_CMD_NEW_WIPHY: Newly created wiphy, response to get request
 *  or rename notification. Has attributes %NL80211_ATTR_WIPHY and
 *  %NL80211_ATTR_WIPHY_NAME.
 * @NL80211_CMD_DEL_WIPHY: Wiphy deleted. Has attributes
 *  %NL80211_ATTR_WIPHY and %NL80211_ATTR_WIPHY_NAME.
 *
 * @NL80211_CMD_GET_INTERFACE: Request an interface's configuration;
 *  either a dump request for all interfaces or a specific get with a
 *  single %NL80211_ATTR_IFINDEX is supported.
 * @NL80211_CMD_SET_INTERFACE: Set type of a virtual interface, requires
 *  %NL80211_ATTR_IFINDEX and %NL80211_ATTR_IFTYPE.
 * @NL80211_CMD_NEW_INTERFACE: Newly created virtual interface or response
 *  to %NL80211_CMD_GET_INTERFACE. Has %NL80211_ATTR_IFINDEX,
 *  %NL80211_ATTR_WIPHY and %NL80211_ATTR_IFTYPE attributes. Can also
 *  be sent from userspace to request creation of a new virtual interface,
 *  then requires attributes %NL80211_ATTR_WIPHY, %NL80211_ATTR_IFTYPE and
 *  %NL80211_ATTR_IFNAME.
 * @NL80211_CMD_DEL_INTERFACE: Virtual interface was deleted, has attributes
 *  %NL80211_ATTR_IFINDEX and %NL80211_ATTR_WIPHY. Can also be sent from
 *  userspace to request deletion of a virtual interface, then requires
 *  attribute %NL80211_ATTR_IFINDEX.
 *
 * @NL80211_CMD_GET_KEY: Get sequence counter information for a key specified
 *  by %NL80211_ATTR_KEY_IDX and/or %NL80211_ATTR_MAC.
 * @NL80211_CMD_SET_KEY: Set key attributes %NL80211_ATTR_KEY_DEFAULT,
 *  %NL80211_ATTR_KEY_DEFAULT_MGMT, or %NL80211_ATTR_KEY_THRESHOLD.
 * @NL80211_CMD_NEW_KEY: add a key with given %NL80211_ATTR_KEY_DATA,
 *  %NL80211_ATTR_KEY_IDX, %NL80211_ATTR_MAC, %NL80211_ATTR_KEY_CIPHER,
 *  and %NL80211_ATTR_KEY_SEQ attributes.
 * @NL80211_CMD_DEL_KEY: delete a key identified by %NL80211_ATTR_KEY_IDX
 *  or %NL80211_ATTR_MAC.
 *
 * @NL80211_CMD_GET_BEACON: (not used)
 * @NL80211_CMD_SET_BEACON: change the beacon on an access point interface
 *  using the %NL80211_ATTR_BEACON_HEAD and %NL80211_ATTR_BEACON_TAIL
 *  attributes. For drivers that generate the beacon and probe responses
 *  internally, the following attributes must be provided: %NL80211_ATTR_IE,
 *  %NL80211_ATTR_IE_PROBE_RESP and %NL80211_ATTR_IE_ASSOC_RESP.
 * @NL80211_CMD_START_AP: Start AP operation on an AP interface, parameters
 *  are like for %NL80211_CMD_SET_BEACON, and additionally parameters that
 *  do not change are used, these include %NL80211_ATTR_BEACON_INTERVAL,
 *  %NL80211_ATTR_DTIM_PERIOD, %NL80211_ATTR_SSID,
 *  %NL80211_ATTR_HIDDEN_SSID, %NL80211_ATTR_CIPHERS_PAIRWISE,
 *  %NL80211_ATTR_CIPHER_GROUP, %NL80211_ATTR_WPA_VERSIONS,
 *  %NL80211_ATTR_AKM_SUITES, %NL80211_ATTR_PRIVACY,
 *  %NL80211_ATTR_AUTH_TYPE, %NL80211_ATTR_INACTIVITY_TIMEOUT,
 *  %NL80211_ATTR_ACL_POLICY and %NL80211_ATTR_MAC_ADDRS.
 *  The channel to use can be set on the interface or be given using the
 *  %NL80211_ATTR_WIPHY_FREQ and the attributes determining channel width.
 * @NL80211_CMD_NEW_BEACON: old alias for %NL80211_CMD_START_AP
 * @NL80211_CMD_STOP_AP: Stop AP operation on the given interface
 * @NL80211_CMD_DEL_BEACON: old alias for %NL80211_CMD_STOP_AP
 *
 * @NL80211_CMD_GET_STATION: Get station attributes for station identified by
 *  %NL80211_ATTR_MAC on the interface identified by %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_SET_STATION: Set station attributes for station identified by
 *  %NL80211_ATTR_MAC on the interface identified by %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_NEW_STATION: Add a station with given attributes to the
 *  the interface identified by %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_DEL_STATION: Remove a station identified by %NL80211_ATTR_MAC
 *  or, if no MAC address given, all stations, on the interface identified
 *  by %NL80211_ATTR_IFINDEX. %NL80211_ATTR_MGMT_SUBTYPE and
 *  %NL80211_ATTR_REASON_CODE can optionally be used to specify which type
 *  of disconnection indication should be sent to the station
 *  (Deauthentication or Disassociation frame and reason code for that
 *  frame).
 *
 * @NL80211_CMD_GET_MPATH: Get mesh path attributes for mesh path to
 *  destination %NL80211_ATTR_MAC on the interface identified by
 *  %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_SET_MPATH:  Set mesh path attributes for mesh path to
 *  destination %NL80211_ATTR_MAC on the interface identified by
 *  %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_NEW_MPATH: Create a new mesh path for the destination given by
 *  %NL80211_ATTR_MAC via %NL80211_ATTR_MPATH_NEXT_HOP.
 * @NL80211_CMD_DEL_MPATH: Delete a mesh path to the destination given by
 *  %NL80211_ATTR_MAC.
 * @NL80211_CMD_NEW_PATH: Add a mesh path with given attributes to the
 *  the interface identified by %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_DEL_PATH: Remove a mesh path identified by %NL80211_ATTR_MAC
 *  or, if no MAC address given, all mesh paths, on the interface identified
 *  by %NL80211_ATTR_IFINDEX.
 * @NL80211_CMD_SET_BSS: Set BSS attributes for BSS identified by
 *  %NL80211_ATTR_IFINDEX.
 *
 * @NL80211_CMD_GET_REG: ask the wireless core to send us its currently set
 *  regulatory domain. If %NL80211_ATTR_WIPHY is specified and the device
 *  has a private regulatory domain, it will be returned. Otherwise, the
 *  global regdomain will be returned.
 *  A device will have a private regulatory domain if it uses the
 *  regulatory_hint() API. Even when a private regdomain is used the channel
 *  information will still be mended according to further hints from
 *  the regulatory core to help with compliance. A dump version of this API
 *  is now available which will returns the global regdomain as well as
 *  all private regdomains of present wiphys (for those that have it).
 *  If a wiphy is self-managed (%NL80211_ATTR_WIPHY_SELF_MANAGED_REG), then
 *  its private regdomain is the only valid one for it. The regulatory
 *  core is not used to help with compliance in this case.
 * @NL80211_CMD_SET_REG: Set current regulatory domain. CRDA sends this command
 *  after being queried by the kernel. CRDA replies by sending a regulatory
 *  domain structure which consists of %NL80211_ATTR_REG_ALPHA set to our
 *  current alpha2 if it found a match. It also provides
 *  NL80211_ATTR_REG_RULE_FLAGS, and a set of regulatory rules. Each
 *  regulatory rule is a nested set of attributes  given by
 *  %NL80211_ATTR_REG_RULE_FREQ_[START|END] and
 *  %NL80211_ATTR_FREQ_RANGE_MAX_BW with an attached power rule given by
 *  %NL80211_ATTR_REG_RULE_POWER_MAX_ANT_GAIN and
 *  %NL80211_ATTR_REG_RULE_POWER_MAX_EIRP.
 * @NL80211_CMD_REQ_SET_REG: ask the wireless core to set the regulatory domain
 *  to the specified ISO/IEC 3166-1 alpha2 country code. The core will
 *  store this as a valid request and then query userspace for it.
 *
 * @NL80211_CMD_GET_MESH_CONFIG: Get mesh networking properties for the
 *  interface identified by %NL80211_ATTR_IFINDEX
 *
 * @NL80211_CMD_SET_MESH_CONFIG: Set mesh networking properties for the
 *      interface identified by %NL80211_ATTR_IFINDEX
 *
 * @NL80211_CMD_SET_MGMT_EXTRA_IE: Set extra IEs for management frames. The
 *  interface is identified with %NL80211_ATTR_IFINDEX and the management
 *  frame subtype with %NL80211_ATTR_MGMT_SUBTYPE. The extra IE data to be
 *  added to the end of the specified management frame is specified with
 *  %NL80211_ATTR_IE. If the command succeeds, the requested data will be
 *  added to all specified management frames generated by
 *  kernel/firmware/driver.
 *  Note: This command has been removed and it is only reserved at this
 *  point to avoid re-using existing command number. The functionality this
 *  command was planned for has been provided with cleaner design with the
 *  option to specify additional IEs in NL80211_CMD_TRIGGER_SCAN,
 *  NL80211_CMD_AUTHENTICATE, NL80211_CMD_ASSOCIATE,
 *  NL80211_CMD_DEAUTHENTICATE, and NL80211_CMD_DISASSOCIATE.
 *
 * @NL80211_CMD_GET_SCAN: get scan results
 * @NL80211_CMD_TRIGGER_SCAN: trigger a new scan with the given parameters
 *  %NL80211_ATTR_TX_NO_CCK_RATE is used to decide whether to send the
 *  probe requests at CCK rate or not.
 * @NL80211_CMD_NEW_SCAN_RESULTS: scan notification (as a reply to
 *  NL80211_CMD_GET_SCAN and on the "scan" multicast group)
 * @NL80211_CMD_SCAN_ABORTED: scan was aborted, for unspecified reasons,
 *  partial scan results may be available
 *
 * @NL80211_CMD_START_SCHED_SCAN: start a scheduled scan at certain
 *  intervals and certain number of cycles, as specified by
 *  %NL80211_ATTR_SCHED_SCAN_PLANS. If %NL80211_ATTR_SCHED_SCAN_PLANS is
 *  not specified and only %NL80211_ATTR_SCHED_SCAN_INTERVAL is specified,
 *  scheduled scan will run in an infinite loop with the specified interval.
 *  These attributes are mutually exculsive,
 *  i.e. NL80211_ATTR_SCHED_SCAN_INTERVAL must not be passed if
 *  NL80211_ATTR_SCHED_SCAN_PLANS is defined.
 *  If for some reason scheduled scan is aborted by the driver, all scan
 *  plans are canceled (including scan plans that did not start yet).
 *  Like with normal scans, if SSIDs (%NL80211_ATTR_SCAN_SSIDS)
 *  are passed, they are used in the probe requests.  For
 *  broadcast, a broadcast SSID must be passed (ie. an empty
 *  string).  If no SSID is passed, no probe requests are sent and
 *  a passive scan is performed.  %NL80211_ATTR_SCAN_FREQUENCIES,
 *  if passed, define which channels should be scanned; if not
 *  passed, all channels allowed for the current regulatory domain
 *  are used.  Extra IEs can also be passed from the userspace by
 *  using the %NL80211_ATTR_IE attribute.  The first cycle of the
 *  scheduled scan can be delayed by %NL80211_ATTR_SCHED_SCAN_DELAY
 *  is supplied.
 * @NL80211_CMD_STOP_SCHED_SCAN: stop a scheduled scan. Returns -ENOENT if
 *  scheduled scan is not running. The caller may assume that as soon
 *  as the call returns, it is safe to start a new scheduled scan again.
 * @NL80211_CMD_SCHED_SCAN_RESULTS: indicates that there are scheduled scan
 *  results available.
 * @NL80211_CMD_SCHED_SCAN_STOPPED: indicates that the scheduled scan has
 *  stopped.  The driver may issue this event at any time during a
 *  scheduled scan.  One reason for stopping the scan is if the hardware
 *  does not support starting an association or a normal scan while running
 *  a scheduled scan.  This event is also sent when the
 *  %NL80211_CMD_STOP_SCHED_SCAN command is received or when the interface
 *  is brought down while a scheduled scan was running.
 *
 * @NL80211_CMD_GET_SURVEY: get survey resuls, e.g. channel occupation
 *      or noise level
 * @NL80211_CMD_NEW_SURVEY_RESULTS: survey data notification (as a reply to
 *  NL80211_CMD_GET_SURVEY and on the "scan" multicast group)
 *
 * @NL80211_CMD_SET_PMKSA: Add a PMKSA cache entry, using %NL80211_ATTR_MAC
 *  (for the BSSID) and %NL80211_ATTR_PMKID.
 * @NL80211_CMD_DEL_PMKSA: Delete a PMKSA cache entry, using %NL80211_ATTR_MAC
 *  (for the BSSID) and %NL80211_ATTR_PMKID.
 * @NL80211_CMD_FLUSH_PMKSA: Flush all PMKSA cache entries.
 *
 * @NL80211_CMD_REG_CHANGE: indicates to userspace the regulatory domain
 *  has been changed and provides details of the request information
 *  that caused the change such as who initiated the regulatory request
 *  (%NL80211_ATTR_REG_INITIATOR), the wiphy_idx
 *  (%NL80211_ATTR_REG_ALPHA2) on which the request was made from if
 *  the initiator was %NL80211_REGDOM_SET_BY_COUNTRY_IE or
 *  %NL80211_REGDOM_SET_BY_DRIVER, the type of regulatory domain
 *  set (%NL80211_ATTR_REG_TYPE), if the type of regulatory domain is
 *  %NL80211_REG_TYPE_COUNTRY the alpha2 to which we have moved on
 *  to (%NL80211_ATTR_REG_ALPHA2).
 * @NL80211_CMD_REG_BEACON_HINT: indicates to userspace that an AP beacon
 *  has been found while world roaming thus enabling active scan or
 *  any mode of operation that initiates TX (beacons) on a channel
 *  where we would not have been able to do either before. As an example
 *  if you are world roaming (regulatory domain set to world or if your
 *  driver is using a custom world roaming regulatory domain) and while
 *  doing a passive scan on the 5 GHz band you find an AP there (if not
 *  on a DFS channel) you will now be able to actively scan for that AP
 *  or use AP mode on your card on that same channel. Note that this will
 *  never be used for channels 1-11 on the 2 GHz band as they are always
 *  enabled world wide. This beacon hint is only sent if your device had
 *  either disabled active scanning or beaconing on a channel. We send to
 *  userspace the wiphy on which we removed a restriction from
 *  (%NL80211_ATTR_WIPHY) and the channel on which this occurred
 *  before (%NL80211_ATTR_FREQ_BEFORE) and after (%NL80211_ATTR_FREQ_AFTER)
 *  the beacon hint was processed.
 *
 * @NL80211_CMD_AUTHENTICATE: authentication request and notification.
 *  This command is used both as a command (request to authenticate) and
 *  as an event on the "mlme" multicast group indicating completion of the
 *  authentication process.
 *  When used as a command, %NL80211_ATTR_IFINDEX is used to identify the
 *  interface. %NL80211_ATTR_MAC is used to specify PeerSTAAddress (and
 *  BSSID in case of station mode). %NL80211_ATTR_SSID is used to specify
 *  the SSID (mainly for association, but is included in authentication
 *  request, too, to help BSS selection. %NL80211_ATTR_WIPHY_FREQ is used
 *  to specify the frequence of the channel in MHz. %NL80211_ATTR_AUTH_TYPE
 *  is used to specify the authentication type. %NL80211_ATTR_IE is used to
 *  define IEs (VendorSpecificInfo, but also including RSN IE and FT IEs)
 *  to be added to the frame.
 *  When used as an event, this reports reception of an Authentication
 *  frame in station and IBSS modes when the local MLME processed the
 *  frame, i.e., it was for the local STA and was received in correct
 *  state. This is similar to MLME-AUTHENTICATE.confirm primitive in the
 *  MLME SAP interface (kernel providing MLME, userspace SME). The
 *  included %NL80211_ATTR_FRAME attribute contains the management frame
 *  (including both the header and frame body, but not FCS). This event is
 *  also used to indicate if the authentication attempt timed out. In that
 *  case the %NL80211_ATTR_FRAME attribute is replaced with a
 *  %NL80211_ATTR_TIMED_OUT flag (and %NL80211_ATTR_MAC to indicate which
 *  pending authentication timed out).
 * @NL80211_CMD_ASSOCIATE: association request and notification; like
 *  NL80211_CMD_AUTHENTICATE but for Association and Reassociation
 *  (similar to MLME-ASSOCIATE.request, MLME-REASSOCIATE.request,
 *  MLME-ASSOCIATE.confirm or MLME-REASSOCIATE.confirm primitives).
 * @NL80211_CMD_DEAUTHENTICATE: deauthentication request and notification; like
 *  NL80211_CMD_AUTHENTICATE but for Deauthentication frames (similar to
 *  MLME-DEAUTHENTICATION.request and MLME-DEAUTHENTICATE.indication
 *  primitives).
 * @NL80211_CMD_DISASSOCIATE: disassociation request and notification; like
 *  NL80211_CMD_AUTHENTICATE but for Disassociation frames (similar to
 *  MLME-DISASSOCIATE.request and MLME-DISASSOCIATE.indication primitives).
 *
 * @NL80211_CMD_MICHAEL_MIC_FAILURE: notification of a locally detected Michael
 *  MIC (part of TKIP) failure; sent on the "mlme" multicast group; the
 *  event includes %NL80211_ATTR_MAC to describe the source MAC address of
 *  the frame with invalid MIC, %NL80211_ATTR_KEY_TYPE to show the key
 *  type, %NL80211_ATTR_KEY_IDX to indicate the key identifier, and
 *  %NL80211_ATTR_KEY_SEQ to indicate the TSC value of the frame; this
 *  event matches with MLME-MICHAELMICFAILURE.indication() primitive
 *
 * @NL80211_CMD_JOIN_IBSS: Join a new IBSS -- given at least an SSID and a
 *  FREQ attribute (for the initial frequency if no peer can be found)
 *  and optionally a MAC (as BSSID) and FREQ_FIXED attribute if those
 *  should be fixed rather than automatically determined. Can only be
 *  executed on a network interface that is UP, and fixed BSSID/FREQ
 *  may be rejected. Another optional parameter is the beacon interval,
 *  given in the %NL80211_ATTR_BEACON_INTERVAL attribute, which if not
 *  given defaults to 100 TU (102.4ms).
 * @NL80211_CMD_LEAVE_IBSS: Leave the IBSS -- no special arguments, the IBSS is
 *  determined by the network interface.
 *
 * @NL80211_CMD_TESTMODE: testmode command, takes a wiphy (or ifindex) attribute
 *  to identify the device, and the TESTDATA blob attribute to pass through
 *  to the driver.
 *
 * @NL80211_CMD_CONNECT: connection request and notification; this command
 *  requests to connect to a specified network but without separating
 *  auth and assoc steps. For this, you need to specify the SSID in a
 *  %NL80211_ATTR_SSID attribute, and can optionally specify the association
 *  IEs in %NL80211_ATTR_IE, %NL80211_ATTR_AUTH_TYPE, %NL80211_ATTR_USE_MFP,
 *  %NL80211_ATTR_MAC, %NL80211_ATTR_WIPHY_FREQ, %NL80211_ATTR_CONTROL_PORT,
 *  %NL80211_ATTR_CONTROL_PORT_ETHERTYPE,
 *  %NL80211_ATTR_CONTROL_PORT_NO_ENCRYPT, %NL80211_ATTR_MAC_HINT, and
 *  %NL80211_ATTR_WIPHY_FREQ_HINT.
 *  If included, %NL80211_ATTR_MAC and %NL80211_ATTR_WIPHY_FREQ are
 *  restrictions on BSS selection, i.e., they effectively prevent roaming
 *  within the ESS. %NL80211_ATTR_MAC_HINT and %NL80211_ATTR_WIPHY_FREQ_HINT
 *  can be included to provide a recommendation of the initial BSS while
 *  allowing the driver to roam to other BSSes within the ESS and also to
 *  ignore this recommendation if the indicated BSS is not ideal. Only one
 *  set of BSSID,frequency parameters is used (i.e., either the enforcing
 *  %NL80211_ATTR_MAC,%NL80211_ATTR_WIPHY_FREQ or the less strict
 *  %NL80211_ATTR_MAC_HINT and %NL80211_ATTR_WIPHY_FREQ_HINT).
 *  Background scan period can optionally be
 *  specified in %NL80211_ATTR_BG_SCAN_PERIOD,
 *  if not specified default background scan configuration
 *  in driver is used and if period value is 0, bg scan will be disabled.
 *  This attribute is ignored if driver does not support roam scan.
 *  It is also sent as an event, with the BSSID and response IEs when the
 *  connection is established or failed to be established. This can be
 *  determined by the STATUS_CODE attribute.
 * @NL80211_CMD_ROAM: request that the card roam (currently not implemented),
 *  sent as an event when the card/driver roamed by itself.
 * @NL80211_CMD_DISCONNECT: drop a given connection; also used to notify
 *  userspace that a connection was dropped by the AP or due to other
 *  reasons, for this the %NL80211_ATTR_DISCONNECTED_BY_AP and
 *  %NL80211_ATTR_REASON_CODE attributes are used.
 *
 * @NL80211_CMD_SET_WIPHY_NETNS: Set a wiphy's netns. Note that all devices
 *  associated with this wiphy must be down and will follow.
 *
 * @NL80211_CMD_REMAIN_ON_CHANNEL: Request to remain awake on the specified
 *  channel for the specified amount of time. This can be used to do
 *  off-channel operations like transmit a Public Action frame and wait for
 *  a response while being associated to an AP on another channel.
 *  %NL80211_ATTR_IFINDEX is used to specify which interface (and thus
 *  radio) is used. %NL80211_ATTR_WIPHY_FREQ is used to specify the
 *  frequency for the operation.
 *  %NL80211_ATTR_DURATION is used to specify the duration in milliseconds
 *  to remain on the channel. This command is also used as an event to
 *  notify when the requested duration starts (it may take a while for the
 *  driver to schedule this time due to other concurrent needs for the
 *  radio).
 *  When called, this operation returns a cookie (%NL80211_ATTR_COOKIE)
 *  that will be included with any events pertaining to this request;
 *  the cookie is also used to cancel the request.
 * @NL80211_CMD_CANCEL_REMAIN_ON_CHANNEL: This command can be used to cancel a
 *  pending remain-on-channel duration if the desired operation has been
 *  completed prior to expiration of the originally requested duration.
 *  %NL80211_ATTR_WIPHY or %NL80211_ATTR_IFINDEX is used to specify the
 *  radio. The %NL80211_ATTR_COOKIE attribute must be given as well to
 *  uniquely identify the request.
 *  This command is also used as an event to notify when a requested
 *  remain-on-channel duration has expired.
 *
 * @NL80211_CMD_SET_TX_BITRATE_MASK: Set the mask of rates to be used in TX
 *  rate selection. %NL80211_ATTR_IFINDEX is used to specify the interface
 *  and @NL80211_ATTR_TX_RATES the set of allowed rates.
 *
 * @NL80211_CMD_REGISTER_FRAME: Register for receiving certain mgmt frames
 *  (via @NL80211_CMD_FRAME) for processing in userspace. This command
 *  requires an interface index, a frame type attribute (optional for
 *  backward compatibility reasons, if not given assumes action frames)
 *  and a match attribute containing the first few bytes of the frame
 *  that should match, e.g. a single byte for only a category match or
 *  four bytes for vendor frames including the OUI. The registration
 *  cannot be dropped, but is removed automatically when the netlink
 *  socket is closed. Multiple registrations can be made.
 * @NL80211_CMD_REGISTER_ACTION: Alias for @NL80211_CMD_REGISTER_FRAME for
 *  backward compatibility
 * @NL80211_CMD_FRAME: Management frame TX request and RX notification. This
 *  command is used both as a request to transmit a management frame and
 *  as an event indicating reception of a frame that was not processed in
 *  kernel code, but is for us (i.e., which may need to be processed in a
 *  user space application). %NL80211_ATTR_FRAME is used to specify the
 *  frame contents (including header). %NL80211_ATTR_WIPHY_FREQ is used
 *  to indicate on which channel the frame is to be transmitted or was
 *  received. If this channel is not the current channel (remain-on-channel
 *  or the operational channel) the device will switch to the given channel
 *  and transmit the frame, optionally waiting for a response for the time
 *  specified using %NL80211_ATTR_DURATION. When called, this operation
 *  returns a cookie (%NL80211_ATTR_COOKIE) that will be included with the
 *  TX status event pertaining to the TX request.
 *  %NL80211_ATTR_TX_NO_CCK_RATE is used to decide whether to send the
 *  management frames at CCK rate or not in 2GHz band.
 *  %NL80211_ATTR_CSA_C_OFFSETS_TX is an array of offsets to CSA
 *  counters which will be updated to the current value. This attribute
 *  is used during CSA period.
 * @NL80211_CMD_FRAME_WAIT_CANCEL: When an off-channel TX was requested, this
 *  command may be used with the corresponding cookie to cancel the wait
 *  time if it is known that it is no longer necessary.
 * @NL80211_CMD_ACTION: Alias for @NL80211_CMD_FRAME for backward compatibility.
 * @NL80211_CMD_FRAME_TX_STATUS: Report TX status of a management frame
 *  transmitted with %NL80211_CMD_FRAME. %NL80211_ATTR_COOKIE identifies
 *  the TX command and %NL80211_ATTR_FRAME includes the contents of the
 *  frame. %NL80211_ATTR_ACK flag is included if the recipient acknowledged
 *  the frame.
 * @NL80211_CMD_ACTION_TX_STATUS: Alias for @NL80211_CMD_FRAME_TX_STATUS for
 *  backward compatibility.
 *
 * @NL80211_CMD_SET_POWER_SAVE: Set powersave, using %NL80211_ATTR_PS_STATE
 * @NL80211_CMD_GET_POWER_SAVE: Get powersave status in %NL80211_ATTR_PS_STATE
 *
 * @NL80211_CMD_SET_CQM: Connection quality monitor configuration. This command
 *  is used to configure connection quality monitoring notification trigger
 *  levels.
 * @NL80211_CMD_NOTIFY_CQM: Connection quality monitor notification. This
 *  command is used as an event to indicate the that a trigger level was
 *  reached.
 * @NL80211_CMD_SET_CHANNEL: Set the channel (using %NL80211_ATTR_WIPHY_FREQ
 *  and the attributes determining channel width) the given interface
 *  (identifed by %NL80211_ATTR_IFINDEX) shall operate on.
 *  In case multiple channels are supported by the device, the mechanism
 *  with which it switches channels is implementation-defined.
 *  When a monitor interface is given, it can only switch channel while
 *  no other interfaces are operating to avoid disturbing the operation
 *  of any other interfaces, and other interfaces will again take
 *  precedence when they are used.
 *
 * @NL80211_CMD_SET_WDS_PEER: Set the MAC address of the peer on a WDS interface.
 *
 * @NL80211_CMD_JOIN_MESH: Join a mesh. The mesh ID must be given, and initial
 *  mesh config parameters may be given.
 * @NL80211_CMD_LEAVE_MESH: Leave the mesh network -- no special arguments, the
 *  network is determined by the network interface.
 *
 * @NL80211_CMD_UNPROT_DEAUTHENTICATE: Unprotected deauthentication frame
 *  notification. This event is used to indicate that an unprotected
 *  deauthentication frame was dropped when MFP is in use.
 * @NL80211_CMD_UNPROT_DISASSOCIATE: Unprotected disassociation frame
 *  notification. This event is used to indicate that an unprotected
 *  disassociation frame was dropped when MFP is in use.
 *
 * @NL80211_CMD_NEW_PEER_CANDIDATE: Notification on the reception of a
 *      beacon or probe response from a compatible mesh peer.  This is only
 *      sent while no station information (sta_info) exists for the new peer
 *      candidate and when @NL80211_MESH_SETUP_USERSPACE_AUTH,
 *      @NL80211_MESH_SETUP_USERSPACE_AMPE, or
 *      @NL80211_MESH_SETUP_USERSPACE_MPM is set.  On reception of this
 *      notification, userspace may decide to create a new station
 *      (@NL80211_CMD_NEW_STATION).  To stop this notification from
 *      reoccurring, the userspace authentication daemon may want to create the
 *      new station with the AUTHENTICATED flag unset and maybe change it later
 *      depending on the authentication result.
 *
 * @NL80211_CMD_GET_WOWLAN: get Wake-on-Wireless-LAN (WoWLAN) settings.
 * @NL80211_CMD_SET_WOWLAN: set Wake-on-Wireless-LAN (WoWLAN) settings.
 *  Since wireless is more complex than wired ethernet, it supports
 *  various triggers. These triggers can be configured through this
 *  command with the %NL80211_ATTR_WOWLAN_TRIGGERS attribute. For
 *  more background information, see
 *  http://wireless.kernel.org/en/users/Documentation/WoWLAN.
 *  The @NL80211_CMD_SET_WOWLAN command can also be used as a notification
 *  from the driver reporting the wakeup reason. In this case, the
 *  @NL80211_ATTR_WOWLAN_TRIGGERS attribute will contain the reason
 *  for the wakeup, if it was caused by wireless. If it is not present
 *  in the wakeup notification, the wireless device didn't cause the
 *  wakeup but reports that it was woken up.
 *
 * @NL80211_CMD_SET_REKEY_OFFLOAD: This command is used give the driver
 *  the necessary information for supporting GTK rekey offload. This
 *  feature is typically used during WoWLAN. The configuration data
 *  is contained in %NL80211_ATTR_REKEY_DATA (which is nested and
 *  contains the data in sub-attributes). After rekeying happened,
 *  this command may also be sent by the driver as an MLME event to
 *  inform userspace of the new replay counter.
 *
 * @NL80211_CMD_PMKSA_CANDIDATE: This is used as an event to inform userspace
 *  of PMKSA caching dandidates.
 *
 * @NL80211_CMD_TDLS_OPER: Perform a high-level TDLS command (e.g. link setup).
 *  In addition, this can be used as an event to request userspace to take
 *  actions on TDLS links (set up a new link or tear down an existing one).
 *  In such events, %NL80211_ATTR_TDLS_OPERATION indicates the requested
 *  operation, %NL80211_ATTR_MAC contains the peer MAC address, and
 *  %NL80211_ATTR_REASON_CODE the reason code to be used (only with
 *  %NL80211_TDLS_TEARDOWN).
 * @NL80211_CMD_TDLS_MGMT: Send a TDLS management frame. The
 *  %NL80211_ATTR_TDLS_ACTION attribute determines the type of frame to be
 *  sent. Public Action codes (802.11-2012 8.1.5.1) will be sent as
 *  802.11 management frames, while TDLS action codes (802.11-2012
 *  8.5.13.1) will be encapsulated and sent as data frames. The currently
 *  supported Public Action code is %WLAN_PUB_ACTION_TDLS_DISCOVER_RES
 *  and the currently supported TDLS actions codes are given in
 *  &enum ieee80211_tdls_actioncode.
 *
 * @NL80211_CMD_UNEXPECTED_FRAME: Used by an application controlling an AP
 *  (or GO) interface (i.e. hostapd) to ask for unexpected frames to
 *  implement sending deauth to stations that send unexpected class 3
 *  frames. Also used as the event sent by the kernel when such a frame
 *  is received.
 *  For the event, the %NL80211_ATTR_MAC attribute carries the TA and
 *  other attributes like the interface index are present.
 *  If used as the command it must have an interface index and you can
 *  only unsubscribe from the event by closing the socket. Subscription
 *  is also for %NL80211_CMD_UNEXPECTED_4ADDR_FRAME events.
 *
 * @NL80211_CMD_UNEXPECTED_4ADDR_FRAME: Sent as an event indicating that the
 *  associated station identified by %NL80211_ATTR_MAC sent a 4addr frame
 *  and wasn't already in a 4-addr VLAN. The event will be sent similarly
 *  to the %NL80211_CMD_UNEXPECTED_FRAME event, to the same listener.
 *
 * @NL80211_CMD_PROBE_CLIENT: Probe an associated station on an AP interface
 *  by sending a null data frame to it and reporting when the frame is
 *  acknowleged. This is used to allow timing out inactive clients. Uses
 *  %NL80211_ATTR_IFINDEX and %NL80211_ATTR_MAC. The command returns a
 *  direct reply with an %NL80211_ATTR_COOKIE that is later used to match
 *  up the event with the request. The event includes the same data and
 *  has %NL80211_ATTR_ACK set if the frame was ACKed.
 *
 * @NL80211_CMD_REGISTER_BEACONS: Register this socket to receive beacons from
 *  other BSSes when any interfaces are in AP mode. This helps implement
 *  OLBC handling in hostapd. Beacons are reported in %NL80211_CMD_FRAME
 *  messages. Note that per PHY only one application may register.
 *
 * @NL80211_CMD_SET_NOACK_MAP: sets a bitmap for the individual TIDs whether
 *      No Acknowledgement Policy should be applied.
 *
 * @NL80211_CMD_CH_SWITCH_NOTIFY: An AP or GO may decide to switch channels
 *  independently of the userspace SME, send this event indicating
 *  %NL80211_ATTR_IFINDEX is now on %NL80211_ATTR_WIPHY_FREQ and the
 *  attributes determining channel width.  This indication may also be
 *  sent when a remotely-initiated switch (e.g., when a STA receives a CSA
 *  from the remote AP) is completed;
 *
 * @NL80211_CMD_CH_SWITCH_STARTED_NOTIFY: Notify that a channel switch
 *  has been started on an interface, regardless of the initiator
 *  (ie. whether it was requested from a remote device or
 *  initiated on our own).  It indicates that
 *  %NL80211_ATTR_IFINDEX will be on %NL80211_ATTR_WIPHY_FREQ
 *  after %NL80211_ATTR_CH_SWITCH_COUNT TBTT's.  The userspace may
 *  decide to react to this indication by requesting other
 *  interfaces to change channel as well.
 *
 * @NL80211_CMD_START_P2P_DEVICE: Start the given P2P Device, identified by
 *  its %NL80211_ATTR_WDEV identifier. It must have been created with
 *  %NL80211_CMD_NEW_INTERFACE previously. After it has been started, the
 *  P2P Device can be used for P2P operations, e.g. remain-on-channel and
 *  public action frame TX.
 * @NL80211_CMD_STOP_P2P_DEVICE: Stop the given P2P Device, identified by
 *  its %NL80211_ATTR_WDEV identifier.
 *
 * @NL80211_CMD_CONN_FAILED: connection request to an AP failed; used to
 *  notify userspace that AP has rejected the connection request from a
 *  station, due to particular reason. %NL80211_ATTR_CONN_FAILED_REASON
 *  is used for this.
 *
 * @NL80211_CMD_SET_MCAST_RATE: Change the rate used to send multicast frames
 *  for IBSS or MESH vif.
 *
 * @NL80211_CMD_SET_MAC_ACL: sets ACL for MAC address based access control.
 *  This is to be used with the drivers advertising the support of MAC
 *  address based access control. List of MAC addresses is passed in
 *  %NL80211_ATTR_MAC_ADDRS and ACL policy is passed in
 *  %NL80211_ATTR_ACL_POLICY. Driver will enable ACL with this list, if it
 *  is not already done. The new list will replace any existing list. Driver
 *  will clear its ACL when the list of MAC addresses passed is empty. This
 *  command is used in AP/P2P GO mode. Driver has to make sure to clear its
 *  ACL list during %NL80211_CMD_STOP_AP.
 *
 * @NL80211_CMD_RADAR_DETECT: Start a Channel availability check (CAC). Once
 *  a radar is detected or the channel availability scan (CAC) has finished
 *  or was aborted, or a radar was detected, usermode will be notified with
 *  this event. This command is also used to notify userspace about radars
 *  while operating on this channel.
 *  %NL80211_ATTR_RADAR_EVENT is used to inform about the type of the
 *  event.
 *
 * @NL80211_CMD_GET_PROTOCOL_FEATURES: Get global nl80211 protocol features,
 *  i.e. features for the nl80211 protocol rather than device features.
 *  Returns the features in the %NL80211_ATTR_PROTOCOL_FEATURES bitmap.
 *
 * @NL80211_CMD_UPDATE_FT_IES: Pass down the most up-to-date Fast Transition
 *  Information Element to the WLAN driver
 *
 * @NL80211_CMD_FT_EVENT: Send a Fast transition event from the WLAN driver
 *  to the supplicant. This will carry the target AP's MAC address along
 *  with the relevant Information Elements. This event is used to report
 *  received FT IEs (MDIE, FTIE, RSN IE, TIE, RICIE).
 *
 * @NL80211_CMD_CRIT_PROTOCOL_START: Indicates user-space will start running
 *  a critical protocol that needs more reliability in the connection to
 *  complete.
 *
 * @NL80211_CMD_CRIT_PROTOCOL_STOP: Indicates the connection reliability can
 *  return back to normal.
 *
 * @NL80211_CMD_GET_COALESCE: Get currently supported coalesce rules.
 * @NL80211_CMD_SET_COALESCE: Configure coalesce rules or clear existing rules.
 *
 * @NL80211_CMD_CHANNEL_SWITCH: Perform a channel switch by announcing the
 *  the new channel information (Channel Switch Announcement - CSA)
 *  in the beacon for some time (as defined in the
 *  %NL80211_ATTR_CH_SWITCH_COUNT parameter) and then change to the
 *  new channel. Userspace provides the new channel information (using
 *  %NL80211_ATTR_WIPHY_FREQ and the attributes determining channel
 *  width). %NL80211_ATTR_CH_SWITCH_BLOCK_TX may be supplied to inform
 *  other station that transmission must be blocked until the channel
 *  switch is complete.
 *
 * @NL80211_CMD_VENDOR: Vendor-specified command/event. The command is specified
 *  by the %NL80211_ATTR_VENDOR_ID attribute and a sub-command in
 *  %NL80211_ATTR_VENDOR_SUBCMD. Parameter(s) can be transported in
 *  %NL80211_ATTR_VENDOR_DATA.
 *  For feature advertisement, the %NL80211_ATTR_VENDOR_DATA attribute is
 *  used in the wiphy data as a nested attribute containing descriptions
 *  (&struct nl80211_vendor_cmd_info) of the supported vendor commands.
 *  This may also be sent as an event with the same attributes.
 *
 * @NL80211_CMD_SET_QOS_MAP: Set Interworking QoS mapping for IP DSCP values.
 *  The QoS mapping information is included in %NL80211_ATTR_QOS_MAP. If
 *  that attribute is not included, QoS mapping is disabled. Since this
 *  QoS mapping is relevant for IP packets, it is only valid during an
 *  association. This is cleared on disassociation and AP restart.
 *
 * @NL80211_CMD_ADD_TX_TS: Ask the kernel to add a traffic stream for the given
 *  %NL80211_ATTR_TSID and %NL80211_ATTR_MAC with %NL80211_ATTR_USER_PRIO
 *  and %NL80211_ATTR_ADMITTED_TIME parameters.
 *  Note that the action frame handshake with the AP shall be handled by
 *  userspace via the normal management RX/TX framework, this only sets
 *  up the TX TS in the driver/device.
 *  If the admitted time attribute is not added then the request just checks
 *  if a subsequent setup could be successful, the intent is to use this to
 *  avoid setting up a session with the AP when local restrictions would
 *  make that impossible. However, the subsequent "real" setup may still
 *  fail even if the check was successful.
 * @NL80211_CMD_DEL_TX_TS: Remove an existing TS with the %NL80211_ATTR_TSID
 *  and %NL80211_ATTR_MAC parameters. It isn't necessary to call this
 *  before removing a station entry entirely, or before disassociating
 *  or similar, cleanup will happen in the driver/device in this case.
 *
 * @NL80211_CMD_GET_MPP: Get mesh path attributes for mesh proxy path to
 *  destination %NL80211_ATTR_MAC on the interface identified by
 *  %NL80211_ATTR_IFINDEX.
 *
 * @NL80211_CMD_JOIN_OCB: Join the OCB network. The center frequency and
 *  bandwidth of a channel must be given.
 * @NL80211_CMD_LEAVE_OCB: Leave the OCB network -- no special arguments, the
 *  network is determined by the network interface.
 *
 * @NL80211_CMD_TDLS_CHANNEL_SWITCH: Start channel-switching with a TDLS peer,
 *  identified by the %NL80211_ATTR_MAC parameter. A target channel is
 *  provided via %NL80211_ATTR_WIPHY_FREQ and other attributes determining
 *  channel width/type. The target operating class is given via
 *  %NL80211_ATTR_OPER_CLASS.
 *  The driver is responsible for continually initiating channel-switching
 *  operations and returning to the base channel for communication with the
 *  AP.
 * @NL80211_CMD_TDLS_CANCEL_CHANNEL_SWITCH: Stop channel-switching with a TDLS
 *  peer given by %NL80211_ATTR_MAC. Both peers must be on the base channel
 *  when this command completes.
 *
 * @NL80211_CMD_WIPHY_REG_CHANGE: Similar to %NL80211_CMD_REG_CHANGE, but used
 *  as an event to indicate changes for devices with wiphy-specific regdom
 *  management.
 *
 * @NL80211_CMD_ABORT_SCAN: Stop an ongoing scan. Returns -ENOENT if a scan is
 *  not running. The driver indicates the status of the scan through
 *  cfg80211_scan_done().
 *
 * @NL80211_CMD_MAX: highest used command number
 * @__NL80211_CMD_AFTER_LAST: internal use
 */
var nl80211 = {

    CTRL_VERSION:        0x0001,


    commands: {
    /* don't change the order or add anything between, this is ABI! */
        NL80211_CMD_UNSPEC:             0,

        NL80211_CMD_GET_WIPHY:          1,      /* can dump */
        NL80211_CMD_SET_WIPHY:          2,
        NL80211_CMD_NEW_WIPHY:          3,
        NL80211_CMD_DEL_WIPHY:          4,

        NL80211_CMD_GET_INTERFACE:      5,  /* can dump */
        NL80211_CMD_SET_INTERFACE:      6,
        NL80211_CMD_NEW_INTERFACE:      7,
        NL80211_CMD_DEL_INTERFACE:      8,

        NL80211_CMD_GET_KEY:            9,
        NL80211_CMD_SET_KEY:            10,
        NL80211_CMD_NEW_KEY:            11,
        NL80211_CMD_DEL_KEY:            12,

        NL80211_CMD_GET_BEACON:         13,
        NL80211_CMD_SET_BEACON:         14,
        NL80211_CMD_START_AP:           15,
        NL80211_CMD_NEW_BEACON:         15,
        NL80211_CMD_STOP_AP:            16,
        NL80211_CMD_DEL_BEACON:         16,

        NL80211_CMD_GET_STATION:        17,
        NL80211_CMD_SET_STATION:        18,
        NL80211_CMD_NEW_STATION:        19,
        NL80211_CMD_DEL_STATION:        20,

        NL80211_CMD_GET_MPATH:          21,
        NL80211_CMD_SET_MPATH:          22,
        NL80211_CMD_NEW_MPATH:          23,
        NL80211_CMD_DEL_MPATH:          24,

        NL80211_CMD_SET_BSS:            25,

        NL80211_CMD_SET_REG:            26,
        NL80211_CMD_REQ_SET_REG:        27,

        NL80211_CMD_GET_MESH_CONFIG:    28,
        NL80211_CMD_SET_MESH_CONFIG:    29,

        NL80211_CMD_SET_MGMT_EXTRA_IE:  30 /* reserved; not used */,

        NL80211_CMD_GET_REG:            31,

        NL80211_CMD_GET_SCAN:           32,
        NL80211_CMD_TRIGGER_SCAN:       33,
        NL80211_CMD_NEW_SCAN_RESULTS:   34,
        NL80211_CMD_SCAN_ABORTED:       35,

        NL80211_CMD_REG_CHANGE:         36,

        NL80211_CMD_AUTHENTICATE:       37,
        NL80211_CMD_ASSOCIATE:          38,
        NL80211_CMD_DEAUTHENTICATE:     39,
        NL80211_CMD_DISASSOCIATE:       40,

        NL80211_CMD_MICHAEL_MIC_FAILURE:41,

        NL80211_CMD_REG_BEACON_HINT:    42,

        NL80211_CMD_JOIN_IBSS:          43,
        NL80211_CMD_LEAVE_IBSS:         44,

        NL80211_CMD_TESTMODE:           45,

        NL80211_CMD_CONNECT:            46,
        NL80211_CMD_ROAM:               47,
        NL80211_CMD_DISCONNECT:         48,

        NL80211_CMD_SET_WIPHY_NETNS:    49,

        NL80211_CMD_GET_SURVEY:         50,
        NL80211_CMD_NEW_SURVEY_RESULTS: 51,

        NL80211_CMD_SET_PMKSA:          52,
        NL80211_CMD_DEL_PMKSA:          53,
        NL80211_CMD_FLUSH_PMKSA:        54,

        NL80211_CMD_REMAIN_ON_CHANNEL:  55,
        NL80211_CMD_CANCEL_REMAIN_ON_CHANNEL:   56,

        NL80211_CMD_SET_TX_BITRATE_MASK:57,

        NL80211_CMD_REGISTER_FRAME:     58,
        NL80211_CMD_REGISTER_ACTION:    58,
        NL80211_CMD_FRAME:              59,
        NL80211_CMD_ACTION:             59,
        NL80211_CMD_FRAME_TX_STATUS:    60,
        NL80211_CMD_ACTION_TX_STATUS:   60,

        NL80211_CMD_SET_POWER_SAVE:     61,
        NL80211_CMD_GET_POWER_SAVE:     62,

        NL80211_CMD_SET_CQM:            63,
        NL80211_CMD_NOTIFY_CQM:         64,

        NL80211_CMD_SET_CHANNEL:        65,
        NL80211_CMD_SET_WDS_PEER:       66,

        NL80211_CMD_FRAME_WAIT_CANCEL:  67,

        NL80211_CMD_JOIN_MESH:          68,
        NL80211_CMD_LEAVE_MESH:         69,

        NL80211_CMD_UNPROT_DEAUTHENTICATE:  70,
        NL80211_CMD_UNPROT_DISASSOCIATE:    71,

        NL80211_CMD_NEW_PEER_CANDIDATE:     72,

        NL80211_CMD_GET_WOWLAN:         73,
        NL80211_CMD_SET_WOWLAN:         74,

        NL80211_CMD_START_SCHED_SCAN:   75,
        NL80211_CMD_STOP_SCHED_SCAN:    76,
        NL80211_CMD_SCHED_SCAN_RESULTS: 77,
        NL80211_CMD_SCHED_SCAN_STOPPED: 78,

        NL80211_CMD_SET_REKEY_OFFLOAD:  79,

        NL80211_CMD_PMKSA_CANDIDATE:    80,

        NL80211_CMD_TDLS_OPER:          81,
        NL80211_CMD_TDLS_MGMT:          82,

        NL80211_CMD_UNEXPECTED_FRAME:   84,

        NL80211_CMD_PROBE_CLIENT:       85,

        NL80211_CMD_REGISTER_BEACONS:   86,

        NL80211_CMD_UNEXPECTED_4ADDR_FRAME:     87,

        NL80211_CMD_SET_NOACK_MAP:      88,

        NL80211_CMD_CH_SWITCH_NOTIFY:   89,

        NL80211_CMD_START_P2P_DEVICE:   90,
        NL80211_CMD_STOP_P2P_DEVICE:    91,

        NL80211_CMD_CONN_FAILED:        92,

        NL80211_CMD_SET_MCAST_RATE:     93,

        NL80211_CMD_SET_MAC_ACL:        94,

        NL80211_CMD_RADAR_DETECT:       95,

        NL80211_CMD_GET_PROTOCOL_FEATURES:  96,

        NL80211_CMD_UPDATE_FT_IES:      97,
        NL80211_CMD_FT_EVENT:           99,

        NL80211_CMD_CRIT_PROTOCOL_START:100,
        NL80211_CMD_CRIT_PROTOCOL_STOP: 101,

        NL80211_CMD_GET_COALESCE:       102,
        NL80211_CMD_SET_COALESCE:       103,

        NL80211_CMD_CHANNEL_SWITCH:     104,

        NL80211_CMD_VENDOR:             105,

        NL80211_CMD_SET_QOS_MAP:        106,

        NL80211_CMD_ADD_TX_TS:          107,
        NL80211_CMD_DEL_TX_TS:          108,

        NL80211_CMD_GET_MPP:            109,

        NL80211_CMD_JOIN_OCB:           110,
        NL80211_CMD_LEAVE_OCB:          111,

        NL80211_CMD_CH_SWITCH_STARTED_NOTIFY:   112,

        NL80211_CMD_TDLS_CHANNEL_SWITCH:        113,
        NL80211_CMD_TDLS_CANCEL_CHANNEL_SWITCH: 114,

        NL80211_CMD_WIPHY_REG_CHANGE:   115,

        NL80211_CMD_ABORT_SCAN:         116
    },

    type_name_map: [
        "unspec",
        "get_wiphy",
        "set_wiphy",
        "new_wiphy",
        "del_wiphy",
        "get_interface",
        "set_interface",
        "new_interface",
        "del_interface",
        "get_key",
        "set_key",
        "new_key",
        "del_key",
        "get_beacon",
        "set_beacon",
        "start_ap",
        "new_beacon",
        "stop_ap",
        "del_beacon",
        "get_station",
        "set_station",
        "new_station",
        "del_station",
        "get_mpath",
        "set_mpath",
        "new_mpath",
        "del_mpath",
        "set_bss",
        "set_reg",
        "req_set_reg",
        "get_mesh_config",
        "set_mesh_config",
        "set_mgmt_extra_ie",
        "get_reg",
        "get_scan",
        "trigger_scan",
        "new_scan_results",
        "scan_aborted",
        "reg_change",
        "authenticate",
        "associate",
        "deauthenticate",
        "disassociate",
        "michael_mic_failur",
        "reg_beacon_hint",
        "join_ibss",
        "leave_ibss",
        "testmode",
        "connect",
        "roam",
        "disconnect",
        "set_wiphy_netns",
        "get_survey",
        "new_survey_results",
        "set_pmksa",
        "del_pmksa",
        "flush_pmksa",
        "remain_on_channel",
        "cancel_remain_on_channel",
        "set_tx_bitrate_mas",
        "register_frame",
        "register_action",
        "frame",
        "action",
        "frame_tx_status",
        "action_tx_status",
        "set_power_save",
        "get_power_save",
        "set_cqm",
        "notify_cqm",
        "set_channel",
        "set_wds_peer",
        "frame_wait_cancel",
        "join_mesh",
        "leave_mesh",
        "unprot_deauthenticate",
        "unprot_disassociate",
        "new_peer_candidate",
        "get_wowlan",
        "set_wowlan",
        "start_sched_scan",
        "stop_sched_scan",
        "sched_scan_results",
        "sched_scan_stopped",
        "set_rekey_offload",
        "pmksa_candidate",
        "tdls_oper",
        "tdls_mgmt",
        "unexpected_frame",
        "probe_client",
        "register_beacons",
        "unexpected_4addr_frame",
        "set_noack_map",
        "ch_switch_notify",
        "start_p2p_device",
        "stop_p2p_device",
        "conn_failed",
        "set_mcast_rate",
        "set_mac_acl",
        "radar_detect",
        "get_protocol_features",
        "update_ft_ies",
        "ft_event",
        "crit_protocol_start",
        "crit_protocol_stop",
        "get_coalesce",
        "set_coalesce",
        "channel_switch",
        "vendor",
        "set_qos_map",
        "add_tx_ts",
        "del_tx_ts",
        "get_mpp",
        "join_ocb",
        "leave_ocb",
        "ch_switch_started_notify",
        "tdls_channel_switch",
        "tdls_cancel_channel_switch",
        "wiphy_reg_change",
        "abort_sca",
    ],

    controller: {
        CTRL_CMD_UNSPEC:        0,
        CTRL_CMD_NEWFAMILY:     1,
        CTRL_CMD_DELFAMILY:     2,
        CTRL_CMD_GETFAMILY:     3,
        CTRL_CMD_NEWOPS:        4,
        CTRL_CMD_DELOPS:        5,
        CTRL_CMD_GETOPS:        6,
        CTRL_CMD_NEWMCAST_GRP:  7,
        CTRL_CMD_DELMCAST_GRP:  8,
        CTRL_CMD_GETMCAST_GRP:  9 /* unused */

    },

};


module.exports = nl80211;
