
// via http://bitsup.blogspot.com/2008/04/monitoring-ip-changes-with-netlink.html?m=0

/* Copyright mcmanus@ducksong.com 2009, Under terms of GPLv2 */

#include <stdio.h>
#include <string.h>
#include <netinet/in.h>
#include <linux/netlink.h>
#include <linux/rtnetlik.h>
#include <net/if.h>


int main()
{
 struct sockaddr_nl addr;
 int nls,len,rtl;
 char buffer[4096];
 struct nlmsghdr *nlh;
 struct ifaddrmsg *ifa;
 struct rtattr *rth;

 if ((nls = socket(PF_NETLINK, SOCK_RAW, NETLINK_ROUTE)) == -1)   perror ("socket failure\n");

 memset (&addr,0,sizeof(addr));
 addr.nl_family = AF_NETLINK;
 addr.nl_groups = RTMGRP_IPV4_IFADDR;

 if (bind(nls, (struct sockaddr *)&addr, sizeof(addr)) == -1)    perror ("bind failure\n");

 nlh = (struct nlmsghdr *)buffer;
 while ((len = recv (nls,nlh,4096,0)) > 0)
 {
     for (;(NLMSG_OK (nlh, len)) && (nlh->nlmsg_type != NLMSG_DONE); nlh = NLMSG_NEXT(nlh, len))
     {
         if (nlh->nlmsg_type != RTM_NEWADDR) continue; /* some other kind of announcement */

         ifa = (struct ifaddrmsg *) NLMSG_DATA (nlh);

         rth = IFA_RTA (ifa);
         rtl = IFA_PAYLOAD (nlh);
         for (;rtl && RTA_OK (rth, rtl); rth = RTA_NEXT (rth,rtl))
         {
             char name[IFNAMSIZ];
             uint32_t ipaddr;

             if (rth->rta_type != IFA_LOCAL) continue;

             ipaddr = * ((uint32_t *)RTA_DATA(rth));
             ipaddr = htonl(ipaddr);

             fprintf (stdout,"%s is now %X\n",if_indextoname(ifa->ifa_index,name),ipaddr);
         }
     }
 }
}


