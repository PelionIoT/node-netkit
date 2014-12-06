/**
 * (c) 2014 WigWag Inc.
 *
 * Author: ed
 */

#include "tuninterface.h"

#include <v8.h>
#include <node.h>

#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>
#include <stddef.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <linux/if.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/sockios.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#if __GLIBC__ >=2 && __GLIBC_MINOR >= 1
#include <netpacket/packet.h>
#include <net/ethernet.h>
#else
#include <asm/types.h>
#include <linux/if_ether.h>
#endif

#ifdef __GLIBC__
#include <net/route.h>
#else
#include <netinet6/ipv6_route.h>	/* glibc does not have this */
#endif

#include "network-common.h"

using namespace node;
using namespace v8;

//extern "C" void init(Handle<v8::Object> target) {
//  NanScope();
//
//  Wrapper::Initialize(target);
//
//
//}


Handle<Value> NewTunInterface(const Arguments& args) {
	HandleScope scope;

//	if(args.Length() < 2) {
//		return ThrowException(Exception::TypeError(String::New("Not enough arguments.")));
//	}

	return scope.Close(TunInterface::NewInstance(args));

//	Local<Value> instance;
//	Persistent<Value> instance;
//	static bool instanceExists = false;


//	if(!instanceExists) {
//		instanceExists = true;
//	Handle<Value> newClonedPack = ClonedPackage::NewInstance(args);
//	instance = Local<Value>::New(newClonedPack);
//	}

//	return scope.Close(instance);
}

// this is not a standard module thing, called internally
void ShutdownModule() {
//	TunInterface::Shutdown();
}


#define IFNAME "eth0"
#define HOST "fec2::22"
#define ifreq_offsetof(x)  offsetof(struct ifreq, x)

// internal use functions
namespace _net { // private namespace

// this is some struct needed to set an IPv6 address
// read more here, or look at the ifconfig source.
// --> http://stackoverflow.com/questions/8240724/assign-ipv6-address-using-ioctl
struct in6_ifreq {
    struct in6_addr ifr6_addr;
    __u32 ifr6_prefixlen;
    unsigned int ifr6_ifindex;
};

void jsToIfName(char *dest, char *src, int len) {
	int _len = len;
	if(_len >= IFNAMSIZ) {
		_len = IFNAMSIZ-1;
	}
	memset(dest,0,IFNAMSIZ);
	memcpy(dest,src,_len);
}

// these FDs to sockets are used to manipulate interfaces
// via ioctl() calls.
int generic_ipv6_socket = -1;
int generic_ipv4_socket = -1;
int generic_dgram_socket = -1;

int get_generic_ipv6_sock(_net::err_ev &_err) {
	if(generic_ipv6_socket < 0) {
		generic_ipv6_socket = socket(AF_INET6, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
		if (generic_ipv6_socket < 0) {
			_err.setError(errno);
			ERROR_OUT("Could not create generic IPv6 socket.\n");
		}
	}
	return generic_ipv6_socket;
}

int get_generic_ipv4_sock(_net::err_ev &_err) {
	if(generic_ipv4_socket < 0) {
		generic_ipv4_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
		if (generic_ipv4_socket < 0) {
			_err.setError(errno);
			ERROR_OUT("Could not create generic IPv4 socket.\n");
		} else
			_err = 0;
	}
	return generic_ipv4_socket;
}

int get_generic_dgram_sock(_net::err_ev &_err) {
	if(generic_dgram_socket < 0) {
		generic_dgram_socket = socket(AF_PACKET, SOCK_DGRAM, 0);  // open a generic socket (anything with a Layer 2 protocol)
		if (generic_dgram_socket < 0) {
			_err.setError(errno);
			ERROR_OUT("Could not create generic AF_PACKET socket.\n");
		}
	}
	return generic_dgram_socket;
}

bool get_index_if_generic(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_dgram_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
		ERROR_OUT("IP addr assignment problem.");
		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return _err.hasErr();
}


bool get_index_if4(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_ipv4_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
		ERROR_OUT("IP addr assignment problem.");
		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return _err.hasErr();
}

bool get_index_if6(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_ipv6_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
		ERROR_OUT("IP addr assignment problem.");
		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return _err.hasErr();
}

// quickly takes a NULL terminated string like: "fe80::1/64" and turns it into "fe80::1/0" and mask = 64
// if the IP contains no mask, then the mask = 64
bool quickParseIPv6Mask( char *str, int &mask ) {
	char *look = str;
	char *intstr = NULL;
	bool ret = false;
	while(*look != 0) {
		if(*look == '/') {
			*look = 0;
			intstr = look + 1;
		}
		look++;
	}

	if(intstr && *intstr) {
		ret = true;
		mask = atoi(intstr);
	} else
		mask = 64;

	return ret;
}


bool add_inet6addr(char *ip, struct ifreq &ifr, int bitmask, _net::err_ev &_err) {
	struct sockaddr_in6 sai;
	struct _net::in6_ifreq ifr6;

	int sockfd = get_generic_ipv6_sock(_err);
	bool error = false;

	if(sockfd > 0) {
		memset(&sai, 0, sizeof(struct sockaddr));
		sai.sin6_family = AF_INET6;
		sai.sin6_port = 0;
		sai.sin6_scope_id = 0;

//		v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());

		if(inet_pton(AF_INET6, ip, (void *)&sai.sin6_addr) <= 0) {
			ERROR_OUT("Bad address passed in?\n");
			error = true;
		}

		if(!error) {
			memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					sizeof(struct in6_addr));

			ifr6.ifr6_ifindex = ifr.ifr_ifindex;
			ifr6.ifr6_prefixlen = bitmask;
			if (ioctl(sockfd, SIOCSIFADDR, &ifr6) < 0) {
				_err.setError(errno);
				ERROR_OUT("IP addr assignment problem.");
				perror("SIOCSIFADDR");
				error = true;
			}
		}
	} else
		error = true;
	return !error;
}

bool remove_inet6addr(char *ip, struct ifreq &ifr, int bitmask, _net::err_ev &_err) {
	struct sockaddr_in6 sai;
	struct _net::in6_ifreq ifr6;

	int sockfd = get_generic_ipv6_sock(_err);
	bool error = false;

	if(sockfd > 0) {
		memset(&sai, 0, sizeof(struct sockaddr));
		sai.sin6_family = AF_INET6;
		sai.sin6_port = 0;
		sai.sin6_scope_id = 0;

//		v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());

		if(inet_pton(AF_INET6, ip, (void *)&sai.sin6_addr) <= 0) {
			ERROR_OUT("Bad address passed in?\n");
			error = true;
		}

		if(!error) {
			memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					sizeof(struct in6_addr));

			ifr6.ifr6_ifindex = ifr.ifr_ifindex;
			ifr6.ifr6_prefixlen = bitmask;
			if (ioctl(sockfd, SIOCDIFADDR, &ifr6) < 0) {
				_err.setError(errno);
				ERROR_OUT("IP addr removal problem.");
				perror("SIOCDIFADDR");
				error = true;
			}
		}
	} else
		error = true;
	return !error;
}

#define RTACTION_IN6_ADD 1
#define RTACTION_IN6_DEL 2
#define RTACTION_IN6_MESSAGE 3


bool set_inet6route(char *route, char *devname, char *hostnet, uint32_t metric, uint32_t flags, _net::err_ev &_err, int action) {
//	struct sockaddr_in6 sai;
//	struct _net::in6_ifreq ifr6;

    struct in6_rtmsg rt;
    struct ifreq ifr;
    struct sockaddr_in6 sa6;

	memset(&sa6, 0, sizeof(struct sockaddr));
	sa6.sin6_family = AF_INET6;
	sa6.sin6_port = 0;
	sa6.sin6_scope_id = 0;

	/* Clean out the RTREQ structure. */
    memset((char *) &rt, 0, sizeof(struct in6_rtmsg));

	int sockfd = get_generic_ipv6_sock(_err);
	bool error = false;

//    rt.rtmsg_flags = RTF_UP;
    rt.rtmsg_flags = flags;
    rt.rtmsg_metric = 1;        // NOTE: 1 becomes '50' when viewed with 'ip route' - still looking into why this is
    char *workingroute = NULL;
    char *viart = NULL;
	int mask = 0;

    if(route) {
    	workingroute = strdup(route);
	    if(!_net::quickParseIPv6Mask(workingroute, mask))
	    	mask = 128; // if no mask is given then use 128

	    if(mask < 0 || mask > 128) {
			ERROR_OUT("IP set route issue: mask out of range.");
			_err.setError(1,"IP set route issue: mask out of range.");
			error = true;
	    }

	    if(inet_pton(AF_INET6, workingroute, (void *)&sa6.sin6_addr) <= 0) {
			ERROR_OUT("Bad address passed in?\n");
			_err.setError(1,"Bad address passed in?");
			error = true;
		} else {
			// copy address in...
			memcpy(&rt.rtmsg_dst, sa6.sin6_addr.s6_addr, sizeof(struct in6_addr));
		}
    } else {
		_err.setError(1,"No route passed in.");
    	return false;
    }


//		v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());
	if(hostnet) {
	    struct sockaddr_in6 sa6_via;
	    viart = strdup(hostnet);
	    int mask = 0;

	    if(!_net::quickParseIPv6Mask(hostnet, mask))
	    	mask = 128; // doesn't matter - if it's a gw it should be a host

	    memset(&sa6_via,0,sizeof(sockaddr_in6));
	    // convert addr to bytes...

	    if(inet_pton(AF_INET6, viart, (void *)&sa6_via.sin6_addr) <= 0) {
			ERROR_OUT("Bad via address passed in?\n");
			_err.setError(1,"Bad via address passed in?");
			error = true;
		} else {
			// copy address in...
			memcpy(&rt.rtmsg_gateway, sa6_via.sin6_addr.s6_addr, sizeof(struct in6_addr));
		}
	}


	if(!error && sockfd > 0) {
		if(devname) {
			strncpy(ifr.ifr_name, devname, IFNAMSIZ);
			if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
				ERROR_OUT("IP set route issue: unknown interface.");
				perror("SIOGIFINDEX");
				_err.setError(errno);
				error = true;
			}
			rt.rtmsg_ifindex = ifr.ifr_ifindex;
		} else
			rt.rtmsg_ifindex = 0;


		rt.rtmsg_metric = metric;

	    rt.rtmsg_flags = flags; // | RTF_UP;
	    if (mask == 128)
	    	rt.rtmsg_flags |= RTF_HOST;
	    rt.rtmsg_dst_len = (uint16_t) mask;


		if(!error) {
			if(action == RTACTION_IN6_ADD) {
				if (ioctl(sockfd, SIOCADDRT, &rt) < 0) {
					ERROR_OUT("IP set route issue > error on add route > ");
					_err.setError(errno);
					perror("SIOCADDRT");
					error = true;
				}
			} else if (action == RTACTION_IN6_DEL){
				if (ioctl(sockfd, SIOCDELRT, &rt) < 0) {
					ERROR_OUT("IP del route issue > error on delete route > ");
					_err.setError(errno);
					perror("SIOCDELRT");
					error = true;
				}
			} else if (action == RTACTION_IN6_MESSAGE) {
				if (ioctl(sockfd, SIOCRTMSG, &rt) < 0) {
					ERROR_OUT("IP msg route issue > error on messaging route > ");
					_err.setError(errno);
					perror("SIOCRTMSG");
					error = true;
				}
			}

//			if(error) {
//				_err.setError(errno);
//			}
		}
	} else
		error = true;

	if(viart) free(viart);
	if(workingroute) free(workingroute);

	return !error;
}




// TODO - shutdown sockets...

} // end private namespace




/**
 * Assign an IP address.
 * Behavior: the passed in object can have two main fields for IP families: inet4 and/or inet6
 * If one of the fields is not passed in, nothing will be done to that address family.
 * To remove an address, set the field to 'null'
 * @param obj
 * var obj = {
 *   ifname : "tun0"  // or "eth1" or whatever. The call will fail without this.
 *   rename: "tun33"  // new name... (not implemented)
 *   mac: "FF:00:33:06:07:08",
 *   mtu: 128,
 *   inet4 : {
 *     addr: "192.168.0.1",   // fields may be left out. If they are no assignment will take place.
 *     mask: "255.255.255.0"  // this allows you to modify a netmask, etc.
 *   },
 *   inet6 : {
 *     addr: "fec2::22",
 *     mask: "ffff::ff00"
 *   },
 *   inet6 : {                               // alternate way, add multiple addresses
 *     addr_add: [ "fe80::1", "aaaa::1" ],  // add addresses to the interface
 *     addr_remove: [ "fc22::22" ]           // ...or remove addresses
 *     mask: "ffff::ff00"
 *   }
 * }
 */
Handle<Value> AssignAddress(const Arguments& args) {
	HandleScope scope;

	char _ifname[IFNAMSIZ]; // IFNAMSIZ is defined in net/if.h

	if(args.Length() < 1 || !args[0]->IsObject()) {
		return scope.Close(Boolean::New(false));
	}

	Handle<Object> params = args[0]->ToObject();

	Handle<Value> js_ifname = params->Get(String::New("ifname"));
	if(!js_ifname->IsString()) {
		ERROR_OUT("No ifname provided. Doing nothing.\n");
		return scope.Close(Boolean::New(false));
	}


	v8::String::Utf8Value v8ifname(js_ifname->ToString());
	_net::jsToIfName(_ifname,v8ifname.operator *(),v8ifname.length());
	//	obj->setIfName(v8str.operator *(),v8ifname.length());

	bool error = false;

	_net::err_ev errev;

	struct ifreq ifr;

	// the ifr struct will be used to get the ifname and map it to an 'ifindex' used by the kernel
	strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);
	// but we need a socket (really an fd to an interface) to do this - so we will defer until we open one..
	bool have_index = false;

	// ok... now let's see what we need to set


	// ****************** MTU assignment **********************
	Handle<Value> js_mtu = params->Get(String::New("mtu"));
	if(js_mtu->IsUint32()) {
		int sockfd = _net::get_generic_ipv6_sock(errev);
		if(!have_index) have_index = _net::get_index_if6(ifr, errev);
	    ifr.ifr_mtu = (int) js_mtu->Uint32Value();
	    if (ioctl(sockfd, SIOCSIFMTU, &ifr) < 0) {
			ERROR_OUT("Could not set MTU.\n");
			// TODO assign error info to object
			error = true;
	    }
	}
	have_index = false; // reset this - for some reason the MTU call messes up the ifr struct

	// ****************** IPv6 address **********************
	Handle<Value> js_inet6val = params->Get(String::New("inet6"));
	if(js_inet6val->IsObject()) { // IPv6 assignment!
		int sockfd = _net::get_generic_ipv6_sock(errev);

//		sockfd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
		if (sockfd == -1) {
			ERROR_OUT("Could not create socket for IP addr assignment.\n");
			// TODO assign error info to object
			error = true;
		}

		Handle<Object> js_inet6 = js_inet6val->ToObject();

		// ------------------ inet6.addr ---------------------------------------------
		// do we have an IP to assign?
		Handle<Value> js_inet6addr = js_inet6->Get(String::New("addr"));

		if(!error && js_inet6addr->IsString() && js_inet6addr->ToString()->Length() > 4) {


			struct sockaddr_in6 sai;
			struct _net::in6_ifreq ifr6;

			if(!error) {

				memset(&sai, 0, sizeof(struct sockaddr));
				sai.sin6_family = AF_INET6;
				sai.sin6_port = 0;
				sai.sin6_scope_id = 0;
				int mask = 64;

				v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());
				_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);

				if(!error) {
					memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					   sizeof(struct in6_addr));

					if(!have_index) have_index = _net::get_index_if6(ifr,errev);

					if(have_index) {
						_net::add_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
					}
				}
			}
		} // end 'addr'

		// ------------------ inet6.remove_addr ---------------------------------------------

		Handle<Value> js_inet6rm = js_inet6->Get(String::New("remove_addr"));

		if(!error && (js_inet6rm->IsArray() || js_inet6rm->IsString())) {

			struct sockaddr_in6 sai;
			struct _net::in6_ifreq ifr6;
			memset(&sai, 0, sizeof(struct sockaddr));
			sai.sin6_family = AF_INET6;
			sai.sin6_port = 0;
			sai.sin6_scope_id = 0;
			int mask = 64;

			if(js_inet6rm->IsString()) {

				v8::String::Utf8Value v8ip6hostaddr(js_inet6rm->ToString());

				if(!error) {
					_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);
					memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
							sizeof(struct in6_addr));

					if(!have_index) have_index = _net::get_index_if6(ifr, errev);

					if(have_index) {
						_net::remove_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
					}
				}
			} else { // it's an Array
				if(!error) {

					Handle<Object> arrayAddr = js_inet6rm->ToObject();

					uint32_t len = arrayAddr->Get(v8::String::New("length"))->ToObject()->Uint32Value();
					for(uint32_t n=0;n<len;n++) {
						Handle<Value> el = arrayAddr->Get(n);

						if(el->IsString()) {
							v8::String::Utf8Value v8ip6hostaddr(el->ToString());
							_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);
							memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
									sizeof(struct in6_addr));

							if(!have_index) have_index = _net::get_index_if6(ifr, errev);

							if(have_index) {
								_net::remove_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
							}
						}
					}
				}

			}

		} // end 'addr'

		// ------------------ inet6.add_addr ---------------------------------------------

		Handle<Value> js_inet6add = js_inet6->Get(String::New("add_addr"));

		if(!error && (js_inet6add->IsArray() || js_inet6add->IsString())) {

			struct sockaddr_in6 sai;
			struct _net::in6_ifreq ifr6;
			memset(&sai, 0, sizeof(struct sockaddr));
			sai.sin6_family = AF_INET6;
			sai.sin6_port = 0;
			sai.sin6_scope_id = 0;
			int mask = 64;

			if(js_inet6add->IsString()) {

				v8::String::Utf8Value v8ip6hostaddr(js_inet6add->ToString());
				if(!error) {
					_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);
					memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
							sizeof(struct in6_addr));

					if(!have_index) have_index = _net::get_index_if6(ifr,errev);

					if(have_index) {
						_net::add_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
					}
				}
			} else { // it's an Array
				if(!error) {

					Handle<Object> arrayAddr = js_inet6add->ToObject();

					uint32_t len = arrayAddr->Get(v8::String::New("length"))->ToObject()->Uint32Value();
					for(uint32_t n=0;n<len;n++) {
						Handle<Value> el = arrayAddr->Get(n);

						if(el->IsString()) {
							v8::String::Utf8Value v8ip6hostaddr(el->ToString());
							_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);

							memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
									sizeof(struct in6_addr));

							if(!have_index) have_index = _net::get_index_if6(ifr, errev);

							if(have_index) {
								_net::add_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
							}
						}

					}
				}

			}

		} // end 'addr'
		// ------------------ inet6.mask ---------------------------------------------

		// NOTE: setting any mask for ipv6 does not work. IPv6 is not really supposed to have masks
		// on the unicast IP. Still figuring this out for multicast...
		// http://serverfault.com/questions/182881/why-add-an-ipv6-address-as-64

		Handle<Value> js_inet6mask = js_inet6->Get(String::New("mask"));

		if(js_inet6mask->IsString() && js_inet6mask->ToString()->Length() > 4) {

//			struct ifreq ifr;
			struct sockaddr_in6 sai;
			struct _net::in6_ifreq ifr6;

//			sockfd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
//			if (sockfd == -1) {
//				ERROR_OUT("Could not create socket for IP addr assignment.\n");
//				// TODO assign error info to object
//				error = true;
//			}

			if(!error) {
				/* get interface name */
				strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);

				memset(&sai, 0, sizeof(struct sockaddr));
				sai.sin6_family = AF_INET6;
				sai.sin6_port = 0;

				v8::String::Utf8Value v8ip6hostmask(js_inet6mask->ToString());

				if(inet_pton(AF_INET6, v8ip6hostmask.operator *(), (void *)&sai.sin6_addr) <= 0) {
					ERROR_OUT("Bad address passed in?\n");
					error = true;
				}

				if(!error) {
					memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					   sizeof(struct in6_addr));

					if(!have_index) {
						if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
							ERROR_OUT("IP mask assignment problem.");
							perror("SIOGIFINDEX");
							error = true;
						} else
							have_index = true;
					}

					if(have_index) {
						ifr6.ifr6_ifindex = ifr.ifr_ifindex;
						ifr6.ifr6_prefixlen = 64;
						if (ioctl(sockfd, SIOCSIFNETMASK, &ifr6) < 0) {
							ERROR_OUT("IP mask assignment problem.");
							perror("SIOCSIFNETMASK");
							error = true;
						}
					}

				}

			}
		}

	} // end assign IPv6 address




	return scope.Close(Boolean::New(!error)); // return false if error
}

void process_route(Handle<Object> obj, _net::err_ev &err, int action) {
	Handle<Value> js_dest = obj->Get(String::New("dest"));
	if(js_dest->IsString()) {
		uint32_t metric = 1;
		uint32_t flags = 0;
		if(action == RTACTION_IN6_ADD) {
			flags |= RTF_UP;  // automatically add in the RTF_UP flag if the route is being added
		}
		char *_if=NULL;
		char _ifname[IFNAMSIZ]; // IFNAMSIZ is defined in net/if.h
		char *_net=NULL; // or host
		char _netname[INET6_ADDRSTRLEN*2];

		v8::String::Utf8Value v8_dest(js_dest->ToString());
		Handle<Value> js_via_if = obj->Get(String::New("via_if"));
		if(!js_via_if->IsUndefined() && js_via_if->IsString()) {
			v8::String::Utf8Value v8_if(js_via_if->ToString());
			strncpy(_ifname, v8_if.operator *(), IFNAMSIZ);
			_if = _ifname;
		}

		Handle<Value> js_via_net = obj->Get(String::New("via_network"));
		if(!js_via_net->IsUndefined() && js_via_net->IsString()) {
			v8::String::Utf8Value v8_netname(js_via_net->ToString());
			strncpy(_netname, v8_netname.operator *(), INET6_ADDRSTRLEN*2);
			_net = _netname;
		}

		Handle<Value> js_metric = obj->Get(String::New("metric"));
		if(!js_metric->IsUndefined()) {
			if(!js_metric->IsUint32()) {
				ERROR_OUT("route entry has invalid 'metric' key. Needs UInt32. Skipping route entry.\n");
				return;
			} else {
				metric = js_metric->Uint32Value();
			}
		}
		Handle<Value> js_flags = obj->Get(String::New("flags"));
		if(action != RTACTION_IN6_DEL && !js_flags->IsUndefined()) { // skip flags if removing route
			if(!js_flags->IsUint32()) {
				ERROR_OUT("route entry has invalid 'metric' key. Needs UInt32. Skipping route entry.\n");
				return;
			} else {
				flags |= js_flags->Uint32Value();
			}
		}
		if(_if)
			_net::set_inet6route(v8_dest.operator *(),_if,NULL,metric,flags,err,action);
		else if(_net)
			_net::set_inet6route(v8_dest.operator *(),NULL,_net,metric,flags,err,action);
		else
			ERROR_OUT("route entry has no valid destination. skipping.\n");

	} else {
		ERROR_OUT("route entry has no 'dest' key. Invalid. Skipping.\n");
	}
}

Handle<Value> AssignRoute(const Arguments& args) {
	HandleScope scope;

	// TODO need IPv4 support

//	char _ifname[IFNAMSIZ]; // IFNAMSIZ is defined in net/if.h

	if(args.Length() < 1 || !args[0]->IsObject()) {
		return scope.Close(Boolean::New(false));
	}

	Handle<Object> params = args[0]->ToObject();

//	Handle<Value> js_ifname = params->Get(String::New("ifname"));
//	if(!js_ifname->IsString()) {
//		ERROR_OUT("No ifname provided. Doing nothing.\n");
//		return scope.Close(Boolean::New(false));
//	}
//
//	v8::String::Utf8Value v8ifname(js_ifname->ToString());
//	_net::jsToIfName(_ifname,v8ifname.operator *(),v8ifname.length());

	bool error = false;

	_net::err_ev err;
	Local<Value> v8err;
//	struct ifreq ifr;
	// the ifr struct will be used to get the ifname and map it to an 'ifindex' used by the kernel
//	strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);
	// but we need a socket (really an fd to an interface) to do this - so we will defer until we open one..
//	bool have_index = false;

	// ok... now let's see what we need to set

	Handle<Value> js_addroute = params->Get(String::New("add_route6"));
	if(js_addroute->IsObject() || js_addroute->IsArray()) {

		if(js_addroute->IsArray()) {
			Handle<Object> arrayAddr = js_addroute->ToObject();

			uint32_t len = arrayAddr->Get(v8::String::New("length"))->ToObject()->Uint32Value();
			for(uint32_t n=0;n<len;n++) {
				Handle<Value> el = arrayAddr->Get(n)->ToObject();
				if(el->IsObject()) {
					process_route(el->ToObject(),err, RTACTION_IN6_ADD);
					if(err.hasErr())
						error = true;
				} else {
					ERROR_OUT("Array in add_route6 has a non-object! Invalid. Skipping.\n");
					error = true;
				}
			}
		} else {  // object
			process_route(js_addroute->ToObject(),err, RTACTION_IN6_ADD);
		}
	}
	Handle<Value> js_delroute = params->Get(String::New("del_route6"));
	if(js_delroute->IsObject() || js_delroute->IsArray()) {

		if(js_delroute->IsArray()) {
			Handle<Object> arrayAddr = js_delroute->ToObject();

			uint32_t len = arrayAddr->Get(v8::String::New("length"))->ToObject()->Uint32Value();
			for(uint32_t n=0;n<len;n++) {
				Handle<Value> el = arrayAddr->Get(n)->ToObject();
				if(el->IsObject()) {
					process_route(el->ToObject(),err, RTACTION_IN6_DEL);
				} else {
					ERROR_OUT("Array in del_route6 has a non-object! Invalid. Skipping.\n");
					error = true;
				}
			}
		} else {  // object
			process_route(js_delroute->ToObject(),err, RTACTION_IN6_DEL);
		}
	}
	Handle<Value> js_msgroute = params->Get(String::New("msg_route6"));
	if(js_msgroute->IsObject() || js_msgroute->IsArray()) {

		if(js_delroute->IsArray()) {
			Handle<Object> arrayAddr = js_msgroute->ToObject();

			uint32_t len = arrayAddr->Get(v8::String::New("length"))->ToObject()->Uint32Value();
			for(uint32_t n=0;n<len;n++) {
				Handle<Value> el = arrayAddr->Get(n)->ToObject();
				if(el->IsObject()) {
					process_route(el->ToObject(),err, RTACTION_IN6_MESSAGE);
				} else {
					ERROR_OUT("Array in msg_route6 has a non-object! Invalid. Skipping.\n");
				}
			}
		} else {  // object
			process_route(js_msgroute->ToObject(),err, RTACTION_IN6_MESSAGE);
		}
	}

	if(err.hasErr()) {
		v8err = _net::err_ev_to_JS(err, "assignRoute: ");
	}


	if(args.Length() > 1 && args[1]->IsFunction()) {
		const unsigned outargc = 1;
		Local<Value> outargv[outargc];
		Local<Function> cb = Local<Function>::Cast(args[1]);
		if(!v8err.IsEmpty()) {
			outargv[0] = v8err;
			cb->Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
		} else {
			cb->Call(Context::GetCurrent()->Global(),0,NULL);
		}
	}

	scope.Close(Undefined());
}





/**
 * ifUp = function(string,flags) {}
 * @param ifname {string} Interface name as a string
 */
Handle<Value> SetIfFlags(const Arguments& args) {
	HandleScope scope;
	struct ifreq ifr;

	if((args.Length() > 1) && args[0]->IsString() && args[1]->Int32Value()) {
		v8::String::Utf8Value v8ifname(args[0]->ToString());

		int len = v8ifname.length() + 1;
		if(v8ifname.length() > IFNAMSIZ) {
			len = IFNAMSIZ;
		}

		short int flags = args[1]->Int32Value();

		strncpy(ifr.ifr_name, v8ifname.operator *(), IFNAMSIZ);
		_net::err_ev err;
		int fd = _net::get_generic_dgram_sock(err);

		if(fd > 0 && _net::get_index_if_generic(ifr,err)) {
			ifr.ifr_flags |=  flags;
		    if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
		    	perror("SIOCSIFFLAGS");
				return ThrowException(Exception::TypeError(String::New("Error: Could not set interface flags." )));
		    }
		} else {
			return ThrowException(Exception::TypeError(String::New("Error: Could not index interface." )));
		}
		return scope.Close(Undefined());
	} else {
		return ThrowException(Exception::TypeError(String::New("Bad arguments. Proper call is setIfFlags(string,flags)")));
	}
}


/**
 * ifUp = function(string,flags) {}
 * @param ifname {string} Interface name as a string
 */
Handle<Value> UnsetIfFlags(const Arguments& args) {
	HandleScope scope;
	struct ifreq ifr;

	if((args.Length() > 1) && args[0]->IsString() && args[1]->Int32Value()) {
		v8::String::Utf8Value v8ifname(args[0]->ToString());

//		int len = v8ifname.length() + 1;
//		if(v8ifname.length() > IFNAMSIZ) {
//			len = IFNAMSIZ;
//		}

		short int flags = args[1]->Int32Value();

		strncpy(ifr.ifr_name, v8ifname.operator *(), IFNAMSIZ);
		_net::err_ev err;
		int fd = _net::get_generic_dgram_sock(err);

		if(fd > 0 && _net::get_index_if_generic(ifr,err)) {
			ifr.ifr_flags &= !flags;
		    if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
		    	perror("SIOCSIFFLAGS");
				return ThrowException(Exception::TypeError(String::New("Error: Could not unset interface flags." )));
		    }
		} else {
			return ThrowException(Exception::TypeError(String::New("Error: Could not index interface." )));
		}
		return scope.Close(Undefined());
	} else {
		return ThrowException(Exception::TypeError(String::New("Bad arguments. Proper call is unsetIfFlags(string,flags)")));
	}
}







void InitAll(Handle<Object> exports, Handle<Object> module) {
//	NodeTransactionWrapper::Init();
//	NodeClientWrapper::Init();
//	exports->Set(String::NewSymbol("cloneRepo"), FunctionTemplate::New(CreateClient)->GetFunction());


//	TunInterface::Init();
	exports->Set(String::NewSymbol("InitNativeTun"), FunctionTemplate::New(TunInterface::Init)->GetFunction());
	exports->Set(String::NewSymbol("newTunInterface"), FunctionTemplate::New(NewTunInterface)->GetFunction());
	exports->Set(String::NewSymbol("assignAddress"), FunctionTemplate::New(AssignAddress)->GetFunction());
	exports->Set(String::NewSymbol("assignRoute"), FunctionTemplate::New(AssignRoute)->GetFunction());
	exports->Set(String::NewSymbol("setIfFlags"), FunctionTemplate::New(SetIfFlags)->GetFunction());
	exports->Set(String::NewSymbol("unsetIfFlags"), FunctionTemplate::New(UnsetIfFlags)->GetFunction());

//	exports->Set(String::NewSymbol("_TunInterface_cstor"), TunInterface::constructor);

	//	exports->Set(String::NewSymbol("_TunInterface_proto"), TunInterface::prototype);

//	exports->Set(String::NewSymbol("shutdownTunInteface"), FunctionTemplate::New(ShutdownTunInterface)->GetFunction());

}

NODE_MODULE(netkit, InitAll)
