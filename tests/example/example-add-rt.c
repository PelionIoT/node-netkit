// via: http://qos.ittc.ku.edu/netlink/html/node16.html


#include <stdio.h>
#include <asm/types.h>
#include <linux/netlink.h>
#include <linux/rtnetlink.h>

struct rtnl_handle
{
	int fd;
	struct sockaddr_nl  local;
	struct sockaddr_nl  peer;
	 __u32 seq;
	__u32  dump;
};


// This code may not be complete in all respects, it just shows the flow of
// control, for more detailed information refer to the code of iproute2 and
// zebra packages.

// This function is to open the netlink socket as the name suggests.
int netlink_open(struct rtnl_handle* rth)
{
    int addr_len;
    memset(rth, 0, sizeof(rth));

    // Creating the netlink socket of family NETLINK_ROUTE

    rth->fd = socket(AF_NETLINK, SOCK_RAW, NETLINK_ROUTE);
    if (rth->fd < 0) {
        perror("cannot open netlink socket");
        return -1;
    }

    memset(&rth->local, 0, sizeof(rth->local));
    rth->local.nl_family = AF_NETLINK;
    rth->local.nl_groups = 0;

    // Binding the netlink socket
    if (bind(rth->fd, (struct sockaddr*)&rth->local, sizeof(rth->local)) < 0)
    {
        perror("cannot bind netlink socket");
        return -1;
    }
    addr_len = sizeof(rth->local);

    if (getsockname(rth->fd, (struct sockaddr*)&rth->local, &addr_len) < 0)
    {
        perror("cannot getsockname");
        return -1;
    }

    if (addr_len != sizeof(rth->local)) {
        fprintf(stderr, "wrong address lenght %d\n", addr_len);
        return -1;
    }

    if (rth->local.nl_family != AF_NETLINK) {
        fprintf(stderr, "wrong address family %d\n", rth->local.nl_family);
        return -1;
    }
    rth->seq = time(NULL);
    return 0;
}

// This function does the actual reading and writing to the netlink socket
int rtnl_talk(struct rtnl_handle *rtnl, struct nlmsghdr *n, pid_t peer,
        unsigned groups, struct nlmsghdr *answer)
{
    int status;
    struct nlmsghdr *h;
    struct sockaddr_nl nladdr;

    // Forming the iovector with the netlink packet.
    struct iovec iov = { (void*)n, n->nlmsg_len };
    char   buf[8192];

    // Forming the message to be sent.
    struct msghdr msg = {
        (void*)&nladdr, sizeof(nladdr),
        &iov,   1,
        NULL,   0,
        0
    };

    // Filling up the details of the netlink socket to be contacted in the
    // kernel.
    memset(&nladdr, 0, sizeof(nladdr));
    nladdr.nl_family = AF_NETLINK;
    nladdr.nl_pid = peer;
    nladdr.nl_groups = groups;

    n->nlmsg_seq = ++rtnl->seq;
    if (answer == NULL)
        n->nlmsg_flags |= NLM_F_ACK;

    // Actual sending of the message, status contains success/failure
    status = sendmsg(rtnl->fd, &msg, 0);

    if (status < 0)
        return -1;
}

// This function forms the netlink packet to add a route to the kernel routing
// table
route_add(__u32* destination, __u32* gateway)
{
    struct rtnl_handle rth;

    // structure of the netlink packet.
    struct {
        struct nlmsghdr     n;
        struct rtmsg        r;
        char            buf[1024];
    } req;

    char  mxbuf[256];
    struct rtattr * mxrta = (void*)mxbuf;
    unsigned mxlock = 0;

    memset(&req, 0, sizeof(req));

    // Initialisation of a few parameters
    req.n.nlmsg_len = NLMSG_LENGTH(sizeof(struct rtmsg));
    req.n.nlmsg_flags = NLM_F_REQUEST|NLM_F_CREATE;
    req.n.nlmsg_type = RTM_NEWROUTE;
    req.r.rtm_family = AF_INET;
    req.r.rtm_table = RT_TABLE_MAIN;

    req.r.rtm_protocol = RTPROT_BOOT;
    req.r.rtm_scope = RT_SCOPE_UNIVERSE;
    req.r.rtm_type = RTN_UNICAST;

    mxrta->rta_type = RTA_METRICS;
    mxrta->rta_len = RTA_LENGTH(0);

    // RTA_DST and RTA_GW are the two esential parameters for adding a route,
    // there are other parameters too which are not discussed here. For ipv4,
    // the length of the address is 4 bytes.
    addattr_l(&req.n, sizeof(req), RTA_DST, destination, 4);
    addattr_l(&req.n, sizeof(req), RTA_GATEWAY, gateway, 4);

    // opening the netlink socket to communicate with the kernel
    if (rtnl_open(&rth) < 0)
    {
        fprintf(stderr, "cannot open rtnetlink\n");
        exit(1);
    }

    // sending the packet to the kernel.
    if (rtnl_talk(&rth, &req.n, 0, 0, NULL) < 0)
        exit(2);

    return 0;
}

// This is the utility function for adding the parameters to the packet.
int addattr_l(struct nlmsghdr *n, int maxlen, int type, void *data, int alen)
{
    int len = RTA_LENGTH(alen);
    struct rtattr *rta;

    if (NLMSG_ALIGN(n->nlmsg_len) + len > maxlen)
        return -1;
    rta = (struct rtattr*)(((char*)n) + NLMSG_ALIGN(n->nlmsg_len));
    rta->rta_type = type;
    rta->rta_len = len;
    memcpy(RTA_DATA(rta), data, alen);
    n->nlmsg_len = NLMSG_ALIGN(n->nlmsg_len) + len;
    return 0;
}

