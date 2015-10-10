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
#include <linux/if.h>    // ifr structs etc.

#include <net/if_arp.h>  // Ethernet definitions
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/sockios.h>
#include <linux/rtnetlink.h>  // RT_NETLINK class procedures for netlink. See: http://inai.de/documents/Netlink_Protocol.pdf
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
#include "netlinksocket.h"
#include "error-common.h"

#include "nan.h"

using namespace node;
using namespace v8;

//extern "C" void init(Handle<v8::Object> target) {
//  NanScope();
//
//  Wrapper::Initialize(target);
//
//
//}

extern NAN_METHOD(IfNameToIndex);
extern NAN_METHOD(IfIndexToName);


// BEGIN TESTS

#define TAIL_DATA(strct,p) ((char *)(&(p)) + sizeof(strct))

struct packTestDat {
	uint8_t first;
	char second;
	uint32_t third;
	uint8_t other[5];
	// TAIL_DATA follows
}
#ifdef __GNUC__
__attribute__ ((aligned (16)));  // ensure we are using 16-bit alignment on the structure
#else
;
#endif

static
char *toBytesString(uint8_t *d,int n) {
	const int s = n*3+4;
	char *ret = (char *) malloc(s);
	uint8_t *look = d;
	int q = 0;
	ret[0] = '[';
	while(q < n) {
		snprintf(ret+1+(q*3), s-3-(q*3),"%2x ",*(look + q));
		q++;
	}
	ret[q*3] = ']'; q++;
	ret[q*3] = '\0';
	return ret;
}

NAN_METHOD(PackTest) {
	GLOG_DEBUG("PackTest\n");

	if(info.Length() > 0 && info[0]->IsObject()) {
			char *backing = node::Buffer::Data(info[0]->ToObject());
			packTestDat *d = (packTestDat *) backing;
			GLOG_DEBUG("first: 0x%02x", d->first);
			GLOG_DEBUG("second: %d", d->second);
			GLOG_DEBUG("third: 0x%04x or %d", d->third, d->third); // to check endianess
			char *s = toBytesString(d->other,5);
			GLOG_DEBUG("other: %s", s);
			free(s);
			GLOG_DEBUG("something: %s", TAIL_DATA(packTestDat,*d));
	}

//	__u32		nlmsg_len;	/* Length of message including header */
//		__u16		nlmsg_type;	/* Message content */
//		__u16		nlmsg_flags;	/* Additional flags */
//		__u32		nlmsg_seq;	/* Sequence number */
//		__u32		nlmsg_pid;
	#ifdef DEBUG
	if(info.Length() > 1 && info[1]->IsObject()) {
			char *backing = node::Buffer::Data(info[1]->ToObject());
			nlmsghdr *d = (nlmsghdr *) backing;
			GLOG_DEBUG("a nlmsghdr:");
			GLOG_DEBUG("_len: 0x%08x", d->nlmsg_len);
			GLOG_DEBUG("_type: 0x%04x", d->nlmsg_type);
			GLOG_DEBUG("_flags: 0x%04x", d->nlmsg_flags);
			GLOG_DEBUG("_seq: 0x%08x", d->nlmsg_seq);
			GLOG_DEBUG("_pid: 0x%08x", d->nlmsg_pid);
	}
	#endif
}

void free_test_cb(char *m,void *hint) {
	GLOG_DEBUG("FREEING MEMORY.");
	free(m);
}

//void weak_cb(Persistent<Value> object, void* parameter) {
//	object.Dispose();
//}

NAN_METHOD(WrapMemBufferTest) {
	char *mem = (char *) ::malloc(100);
	memset(mem,'A',100);
	node::Buffer *buf = node::Buffer::New(mem,100,free_test_cb,0);
//	node::Buffer *buf = UNI_BUFFER_NEW_WRAP(mem,100,free_test_cb,NULL);
//	buf->handle_.MakeWeak(NULL, weak_cb);
	info.GetReturnValue().Set(Nan::New(buf->handle_));
}

/// END TESTS


NAN_METHOD(ErrorFromErrno) {

	if(info.Length() > 0 && info[0]->Int32Value()) {
		Local<Value> err = Nan::New(_net::errno_to_JS(info[0]->Int32Value(),"netkit: "));
		info.GetReturnValue().Set(err);
	}
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
int generic_afpacket_socket = -1;


// creates a new netlink NETLINK_ROUTE socket
//int create_netlink_route_socket(_net::err_ev &_err) {
//	int ret = socket(AF_NETLINK, SOCK_RAW | SOCK_CLOEXEC, NETLINK_ROUTE);
//	if (ret < 0) {
//		_err.setError(errno);
//		ERROR_OUT("Could not create NETLINK_ROUTE socket\n");
//	}
//	return ret;
//}

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
		}
	}
	return generic_ipv4_socket;
}

int get_generic_inet_sock(_net::err_ev &_err) {
	if(generic_dgram_socket < 0) {
		generic_dgram_socket = socket(AF_INET, SOCK_DGRAM, 0);  // open a generic AF_INET
		if (generic_dgram_socket < 0) {
			_err.setError(errno);
			ERROR_OUT("Could not create generic AF_INET socket.\n");
		}
	}
	return generic_dgram_socket;
}

int get_generic_packet_sock(_net::err_ev &_err) {
	if(generic_afpacket_socket < 0) {
		generic_afpacket_socket = socket(AF_PACKET, SOCK_DGRAM, 0);  // open a generic socket (anything with a Layer 2 protocol - ethernet and friends)
		if (generic_afpacket_socket < 0) {
			_err.setError(errno);
			ERROR_OUT("Could not create generic AF_PACKET socket.\n");
		}
	}
	return generic_afpacket_socket;
}

bool get_index_if_generic(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_packet_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
//		ERROR_OUT("IP addr assignment problem.");
//		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return !_err.hasErr();
}


bool get_index_if4(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_ipv4_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
//		ERROR_OUT("IP addr assignment problem.");
//		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return !_err.hasErr();
}

bool get_index_if6(	struct ifreq &ifr, _net::err_ev &_err) {
	int sockfd = get_generic_ipv6_sock(_err);
	if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
//		ERROR_OUT("IP addr assignment problem.");
//		perror("SIOGIFINDEX");
		_err.setError(errno);
	}
	return !_err.hasErr();
}

bool set_if_flags(int fd,struct ifreq &ifr, short flags, _net::err_ev &err) {
	ifr.ifr_flags = flags;
	if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
		//		    	perror("SIOCSIFFLAGS");
		err.setError(errno);
		return false;
	} else {
		return true;
	}
}

bool get_if_flags(int fd,struct ifreq &ifr, short &flags, _net::err_ev &err) {
	if (ioctl(fd, SIOCGIFFLAGS, &ifr) < 0) {
		//		    	perror("SIOCSIFFLAGS");
		err.setError(errno);
		return false;
	}
	flags = ifr.ifr_flags;
	return true;
}

bool unset_if_flags(int fd,struct ifreq &ifr, short flags, _net::err_ev &err) {
	if (ioctl(fd, SIOCGIFFLAGS, &ifr) < 0) {
		//		    	perror("SIOCSIFFLAGS");
		err.setError(errno);
		return false;
	}
	ifr.ifr_flags = ifr.ifr_flags & ~flags;
	if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
		//		    	perror("SIOCSIFFLAGS");
		err.setError(errno);
		return false;
	} else {
		return true;
	}
}

//bool add_neighbor_ipv6(int fd, char *addrstr, int flags) {
//	struct nlmsghdr	hdr;
//	struct ndmsg msg;
//	memset(&hdr,0,sizeof(nlmsghdr));
//	memset(&msg,0,sizeof(ndmsg));
//
//	hdr.nlmsg_len = NLMSG_LENGTH(sizeof(struct ndmsg));
//	hdr.nlmsg_flags = NLM_F_REQUEST|flags;
//	hdr.nlmsg_type = cmd;
//
//	msg.ndm_family = AF_INET6; // AF_INET or AF_INET6
//	msg.ndm_state = NUD_PERMANENT;
//
//
//}

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

	if(sockfd > 0) {
		memset(&sai, 0, sizeof(struct sockaddr));
		sai.sin6_family = AF_INET6;
		sai.sin6_port = 0;
		sai.sin6_scope_id = 0;

//		v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());
		int ret = 0;
		if((ret = inet_pton(AF_INET6, ip, (void *)&sai.sin6_addr)) <= 0) {
			if(ret == 0) {
				_err.setError(_net::OTHER_ERROR,"inet_pton: Bad address passed in?");
			} else {
				_err.setError(errno,"Error on inet_pton.");
			}
		}

		if(!_err.hasErr()) {
			memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					sizeof(struct in6_addr));

			ifr6.ifr6_ifindex = ifr.ifr_ifindex;
			ifr6.ifr6_prefixlen = bitmask;
			if (ioctl(sockfd, SIOCSIFADDR, &ifr6) < 0) {
				_err.setError(errno);
				ERROR_OUT("IP addr assignment problem.");
				perror("SIOCSIFADDR");
			}
		}
	} else {
		_err.setError(_net::OTHER_ERROR,"Bad file descriptor.");
	}

	return !_err.hasErr();
}

bool remove_inet6addr(char *ip, struct ifreq &ifr, int bitmask, _net::err_ev &_err) {
	struct sockaddr_in6 sai;
	struct _net::in6_ifreq ifr6;

	int sockfd = get_generic_ipv6_sock(_err);

	if(sockfd > 0) {
		memset(&sai, 0, sizeof(struct sockaddr));
		sai.sin6_family = AF_INET6;
		sai.sin6_port = 0;
		sai.sin6_scope_id = 0;

//		v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());
		int ret = 0;
		if((ret = inet_pton(AF_INET6, ip, (void *)&sai.sin6_addr)) <= 0) {
			if(ret == 0) {
				_err.setError(_net::OTHER_ERROR,"inet_pton: Bad address passed in?");
			} else {
				_err.setError(errno,"Error on inet_pton.");
			}
		}

		if(!_err.hasErr()) {
			memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
					sizeof(struct in6_addr));

			ifr6.ifr6_ifindex = ifr.ifr_ifindex;
			ifr6.ifr6_prefixlen = bitmask;
			if (ioctl(sockfd, SIOCDIFADDR, &ifr6) < 0) {
				_err.setError(errno);
				perror("SIOCDIFADDR");
			}
		}
	} else {
		_err.setError(_net::OTHER_ERROR,"Bad file descriptor.");
	}
	return !_err.hasErr();
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

//    rt.rtmsg_flags = RTF_UP;
    rt.rtmsg_flags = flags;
    rt.rtmsg_metric = 1;        // NOTE: 1 becomes '50' when viewed with 'ip route' - still looking into why this is
    char *workingroute = NULL;
    char *viart = NULL;
	int mask = 0;
	int ret = 0;

    if(route) {
    	workingroute = strdup(route);
	    if(!_net::quickParseIPv6Mask(workingroute, mask))
	    	mask = 128; // if no mask is given then use 128

	    if(mask < 0 || mask > 128) {
			ERROR_OUT("IP set route issue: mask out of range.");
			_err.setError(_net::OTHER_ERROR,"IP set route issue: mask out of range.");
	    }

	    if((ret = inet_pton(AF_INET6, workingroute, (void *)&sa6.sin6_addr)) <= 0) {
			if(ret == 0) {
				_err.setError(_net::OTHER_ERROR,"inet_pton: Bad address passed in?");
			} else {
				_err.setError(errno,"Error on inet_pton.");
			}
		} else {
			// copy address in...
			memcpy(&rt.rtmsg_dst, sa6.sin6_addr.s6_addr, sizeof(struct in6_addr));
		}
    } else {
		_err.setError(_net::OTHER_ERROR,"No route passed in.");
    	return false;
    }

	if(hostnet) {
	    struct sockaddr_in6 sa6_via;
	    viart = strdup(hostnet);
	    int mask = 0;
	    int ret = 0;

	    if(!_net::quickParseIPv6Mask(hostnet, mask))
	    	mask = 128; // doesn't matter - if it's a gw it should be a host

	    memset(&sa6_via,0,sizeof(sockaddr_in6));
	    // convert addr to bytes...

	    if((ret = inet_pton(AF_INET6, viart, (void *)&sa6_via.sin6_addr)) <= 0) {
			if(ret == 0) {
				_err.setError(_net::OTHER_ERROR,"inet_pton: Bad address passed in? (via route)");
			} else {
				_err.setError(errno,"Error on inet_pton. (via route)");
			}
		} else {
			// copy address in...
			memcpy(&rt.rtmsg_gateway, sa6_via.sin6_addr.s6_addr, sizeof(struct in6_addr));
		}
	}


	if(!_err.hasErr() && sockfd > 0) {
		if(devname) {
			strncpy(ifr.ifr_name, devname, IFNAMSIZ);
			if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
				ERROR_OUT("IP set route issue: unknown interface.");
				perror("SIOGIFINDEX");
				_err.setError(errno);
			}
			rt.rtmsg_ifindex = ifr.ifr_ifindex;
		} else
			rt.rtmsg_ifindex = 0;


		rt.rtmsg_metric = metric;

	    rt.rtmsg_flags = flags; // | RTF_UP;
	    if (mask == 128)
	    	rt.rtmsg_flags |= RTF_HOST;
	    rt.rtmsg_dst_len = (uint16_t) mask;


		if(!_err.hasErr()) {
			if(action == RTACTION_IN6_ADD) {
				if (ioctl(sockfd, SIOCADDRT, &rt) < 0) {
					ERROR_OUT("IP set route issue > error on add route > ");
					_err.setError(errno);
					perror("SIOCADDRT");
				}
			} else if (action == RTACTION_IN6_DEL){
				if (ioctl(sockfd, SIOCDELRT, &rt) < 0) {
					ERROR_OUT("IP del route issue > error on delete route > ");
					_err.setError(errno);
					perror("SIOCDELRT");
				}
			} else if (action == RTACTION_IN6_MESSAGE) {
				if (ioctl(sockfd, SIOCRTMSG, &rt) < 0) {
					ERROR_OUT("IP msg route issue > error on messaging route > ");
					_err.setError(errno);
					perror("SIOCRTMSG");
				}
			}

//			if(error) {
//				_err.setError(errno);
//			}
		}
	} else {
		if(!_err.hasErr()) {
			_err.setError(_net::OTHER_ERROR,"Bad file descriptor.");
		}
	}

	if(viart) free(viart);
	if(workingroute) free(workingroute);

	return !_err.hasErr();
}




// TODO - shutdown sockets...

} // end private namespace





/**
 * Returns an address from a string
 * @param {String} addr
 * @param {number} family  Only supported right now: netkit.AFINET6
 * @return {Object|Error} The object is of the format:<br>
 * </pre>
 * obj {
 *   bytes,  // a Buffer
 *   family  // a String stating the family
 * }
 */
NAN_METHOD(ToAddress) {
	Local<Object> ret;

	_net::err_ev err;

	if(info.Length() > 1 && info[0]->IsString() && info[1]->IsInt32()) {
		ret = Object::New();
		v8::String::Utf8Value addr(info[0]->ToString());

		int32_t family = info[1]->ToInt32()->Int32Value();
		if(family == AF_INET6) {
			int mask = -1;
			char *addrstr = addr.operator *();
			if(_net::quickParseIPv6Mask(addrstr,mask)) {
				ret->Set(Nan::New("mask").ToLocalChecked(), Int32::New(mask));
			}

			struct sockaddr_in6 sai;
			memset(&sai, 0, sizeof(struct sockaddr));

			int r = 0;
			if((r = inet_pton(AF_INET6, addrstr, (void *)&sai.sin6_addr)) <= 0) {
				if(r == 0) {
					ERR_EV_PRINTF_SETERROR(err,"inet_pton (AF_INET): Bad address passed in? \"%s\"",addrstr);
//					err.setError(_net::OTHER_ERROR,"inet_pton (AF_INET6): Bad address passed in?");
				} else {
					err.setError(errno,"Error on inet_pton.");
				}
			} else {
				Local<Object> buf = UNI_BUFFER_NEW(sizeof(struct in6_addr));
				char *area = node::Buffer::Data(buf);
				memcpy(area,&sai.sin6_addr,sizeof(struct in6_addr));
				ret->Set(Nan::New("bytes").ToLocalChecked(), buf);
				ret->Set(Nan::New("len").ToLocalChecked(), Int32::New(sizeof(struct in6_addr)));
			}
		} else
		if(family == AF_INET) {
			int mask = -1;
			char *addrstr = addr.operator *();
			if(_net::quickParseIPv6Mask(addrstr,mask)) {
				ret->Set(Nan::New("mask").ToLocalChecked(), Int32::New(mask));
			}

			struct sockaddr_in sai;
			memset(&sai, 0, sizeof(struct sockaddr));

			int r = 0;
			if((r = inet_pton(AF_INET, addrstr, (void *)&sai.sin_addr)) <= 0) {
				if(r == 0) {
					ERR_EV_PRINTF_SETERROR(err,"inet_pton (AF_INET): Bad address passed in? \"%s\"",addrstr);
//					err.setError(_net::OTHER_ERROR,);
				} else {
					err.setError(errno,"Error on inet_pton.");
				}
			} else {
				Local<Object> buf = UNI_BUFFER_NEW(sizeof(struct in_addr));
				char *area = node::Buffer::Data(buf);
				memcpy(area,&sai.sin_addr,sizeof(struct in_addr));
				ret->Set(Nan::New("bytes").ToLocalChecked(), buf);
				ret->Set(Nan::New("len").ToLocalChecked(), Int32::New(sizeof(struct in_addr)));
			}
		}
	} else {
		err.setError(_net::OTHER_ERROR,"Invalid parameters.");
	}

	if(err.hasErr())
		info.GetReturnValue().Set(Nan::New(_net::err_ev_to_JS(err,"toAddress: ")));
}

/**
 * Returns an string from an address
 * @param {Byte Array} addr
 * @param {number} family  netkit.AFINET6 | netkit.AFINET
 * @return {Object|Error} The object is of the format:<br>
 * </pre>
 * obj {
 *   address,  // a String stating the address
 *   family  // a String stating the family
 * }
 */
NAN_METHOD(FromAddress) {
	Local<Object> ret;

	_net::err_ev err;

	if(info.Length() > 1 && info[0]->IsArray() && info[1]->IsInt32()) {
		//GLOG_DEBUG3("is address");

		ret = Object::New();
		Local<Array> addr = Local<Array>::Cast(info[0]);
		int32_t family = info[1]->ToInt32()->Int32Value();

		if(family == AF_INET6) {
			unsigned char addr_a[sizeof(struct in6_addr)];

			for (size_t i = 0; i < addr->Length(); i++) {
				Local<Number> el = addr->Get(i)->ToUint32();
				addr_a[i] = static_cast<uint8_t>(el->Uint32Value());
			}

			char str[INET6_ADDRSTRLEN];
			memset(&str, 0, sizeof(INET6_ADDRSTRLEN));
			const char *r;
			if( (r = inet_ntop(AF_INET6, addr_a, str, INET6_ADDRSTRLEN)) == nullptr ) {
				if(r == nullptr) {
					err.setError(errno,"Error on inet_ntop.");
				}
			} else {
				ret->Set(Nan::New("address").ToLocalChecked(), v8::String::New(r) );
				ret->Set(Nan::New("family").ToLocalChecked(), Int32::New(AF_INET6));
			}
		} else
		if(family == AF_INET) {
			//GLOG_DEBUG3("is inet");
			unsigned char addr_a[sizeof(struct in_addr)];

			for (size_t i = 0; i < addr->Length(); i++) {
				Local<Number> el = addr->Get(i)->ToUint32();
				addr_a[i] = static_cast<uint8_t>(el->Uint32Value());
				//GLOG_DEBUG3("addr_a[i] = %d", addr_a[i]);
			}

			char str[INET6_ADDRSTRLEN];
			memset(&str, 0, sizeof(INET_ADDRSTRLEN));
			const char *r;
			if( (r = inet_ntop(AF_INET, addr_a, str, INET_ADDRSTRLEN)) == nullptr ) {
				if(r == nullptr) {
					GLOG_DEBUG3("inet_ntop failed");
					err.setError(errno,"Error on inet_ntop.");
				}
			} else {
				ret->Set(Nan::New("address").ToLocalChecked(), v8::String::New(r) );
				ret->Set(Nan::New("family").ToLocalChecked(), Int32::New(AF_INET));
			}
		}
	} else {
		err.setError(_net::OTHER_ERROR,"Invalid parameters.");
	}

	if(err.hasErr())
		info.GetReturnValue().Set(Nan::New(_net::err_ev_to_JS(err,"fromAddress: ")));
	else
		info.GetReturnValue().Set(Nan::New(ret));
}




static
void toBytesMACAddr(char *mac, uint8_t *bytes, _net::err_ev &err) {
	int values[6];
	int i;

	if( 6 == sscanf( mac, "%x:%x:%x:%x:%x:%x",
		&values[0], &values[1], &values[2],
		&values[3], &values[4], &values[5] ) )
	{
		/* convert to uint8_t */
		for( i = 0; i < 6; ++i )
			bytes[i] = (uint8_t) values[i];
	}

	else
	{
		err.setError(_net::OTHER_ERROR,"Invalid MAC address.");
	}
}

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
NAN_METHOD(AssignAddress) {

	char _ifname[IFNAMSIZ]; // IFNAMSIZ is defined in net/if.h

	_net::err_ev errev;
	Local<Value> v8err;

	Local<Object> params;
	Local<Value> js_ifname;
	Nan::MaybeLocal<Value> Mval;

	if(info.Length() < 1 || !info[0]->IsObject()) {
		errev.setError(_net::OTHER_ERROR,"Wrong params. No ifname provided. Doing nothing.\n");
	} else {
		params = info[0]->ToObject();
		Mval = Nan::Get(params, String::New("ifname"));
		Mval.ToLocal(&js_ifname);
	}


	if(Mval.IsEmpty() || (!errev.hasErr() && !js_ifname->IsString())) {
		errev.setError(_net::OTHER_ERROR,"No ifname provided in object. Doing nothing.\n");
		ERROR_OUT("No ifname provided. Doing nothing.\n");
	} else {

		v8::String::Utf8Value v8ifname(js_ifname->ToString());
		_net::jsToIfName(_ifname,v8ifname.operator *(),v8ifname.length());
		//	obj->setIfName(v8str.operator *(),v8ifname.length());

	//	bool error = false;


		struct ifreq ifr;
		memset(&ifr,0,sizeof(ifreq));

		// the ifr struct will be used to get the ifname and map it to an 'ifindex' used by the kernel
		strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);
		// but we need a socket (really an fd to an interface) to do this - so we will defer until we open one..
		bool have_index = false;

		// ok... now let's see what we need to set


		// ****************** MTU assignment **********************
		Local<Value> js_mtu; Mval = Nan::Get(params, Nan::New("mtu").ToLocalChecked());
		if(Mval.ToLocal(&js_mtu) && !errev.hasErr() && js_mtu->IsUint32()) {
			int sockfd = _net::get_generic_ipv6_sock(errev);
			if(!have_index) have_index = _net::get_index_if6(ifr, errev);
			if(!errev.hasErr()) {
				ifr.ifr_mtu = (int) js_mtu->Uint32Value();
				if (ioctl(sockfd, SIOCSIFMTU, &ifr) < 0) {
					errev.setError(errno);
					ERROR_OUT("Could not set MTU.\n");
					// TODO assign error info to object
				}
			}
		}
		have_index = false; // reset this - for some reason the MTU call messes up the ifr struct


		// ******************** MAC address *********************

		Local<Value> js_mac; Mval = Nan::Get(params, String::New("mac"));
		if(Mval.ToLocal(&js_mac) && !errev.hasErr() && js_mac->IsString()) {
			uint8_t mac[6];
			memset(mac,0,6);
			v8::String::Utf8Value v8mac(js_mac->ToString());
			toBytesMACAddr(v8mac.operator *(), mac, errev);

			if(!errev.hasErr()) {
				int sockfd = _net::get_generic_inet_sock(errev);
				short flags = 0;
				bool was_up = false;
	//			if(!errev.hasErr()) {
					memset(&ifr,0,sizeof(ifreq));
					strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);
	//				if(!have_index) have_index = _net::get_index_if6(ifr, errev);

					get_if_flags(sockfd,ifr, flags, errev);
					if(!errev.hasErr() && (flags & IFF_UP)) {
						set_if_flags(sockfd, ifr, flags & ~IFF_UP, errev);
						was_up = true;
					}
					if(!errev.hasErr()) {
						ifr.ifr_hwaddr.sa_family = ARPHRD_ETHER;
						memcpy(&ifr.ifr_hwaddr.sa_data,mac,sizeof(mac));
						// set MAC address
						if (ioctl(sockfd, SIOCSIFHWADDR, &ifr) < 0) {
							errev.setError(errno);
							ERROR_OUT("Could not set MAC addr: %x:%x:%x:%x:%x:%x\n", mac[0], mac[1],mac[2],mac[3],mac[4],mac[5]);
						} else {
							GLOG_DEBUG("Set MAC address\n");
						}
						if(was_up)
							set_if_flags(sockfd, ifr, flags | IFF_UP, errev);
					}
	//			}
			}
		}
		have_index = false; // reset this - for some reason the MTU call messes up the ifr struct
		memset(&ifr,0,sizeof(ifreq));
		strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);


		// ****************** IPv6 address **********************
		Local<Value> js_inet6val; Mval = Nan::Get(params, Nan::New("inet6").ToLocalChecked());
		if(Mval.ToLocal(&js_inet6val) && !errev.hasErr() && js_inet6val->IsObject()) { // IPv6 assignment!
			int sockfd = _net::get_generic_ipv6_sock(errev);

	//		sockfd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
			if (sockfd == -1) {
				ERROR_OUT("Could not create socket for IP addr assignment.\n");
				if(!errev.hasErr()) {
					errev.setError(_net::OTHER_ERROR,"Could not create socket for IP addr assignment.\n");
				}
			}

			Local<Object> js_inet6 = js_inet6val->ToObject();

			// ------------------ inet6.addr ---------------------------------------------
			// do we have an IP to assign?
			Local<Value> js_inet6addr; Mval = Nan::Get(js_inet6, Nan::New("addr").ToLocalChecked());

			if(Mval.ToLocal(&js_inet6addr) && !errev.hasErr()
				&& js_inet6addr->IsString() && js_inet6addr->ToString()->Length() > 4) {


				struct sockaddr_in6 sai;
				struct _net::in6_ifreq ifr6;

				if(!errev.hasErr()) {

					memset(&sai, 0, sizeof(struct sockaddr));
					sai.sin6_family = AF_INET6;
					sai.sin6_port = 0;
					sai.sin6_scope_id = 0;
					int mask = 64;

					v8::String::Utf8Value v8ip6hostaddr(js_inet6addr->ToString());
					_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);

					if(!errev.hasErr()) {

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

			Local<Value> js_inet6rm; Mval = Nan::Get(js_inet6, Nan::New("remove_addr").ToLocalChecked());

			if(Mval.ToLocal(&js_inet6rm) && !errev.hasErr() && (js_inet6rm->IsArray() || js_inet6rm->IsString())) {

				struct sockaddr_in6 sai;
				struct _net::in6_ifreq ifr6;
				memset(&sai, 0, sizeof(struct sockaddr));
				sai.sin6_family = AF_INET6;
				sai.sin6_port = 0;
				sai.sin6_scope_id = 0;
				int mask = 64;

				if(js_inet6rm->IsString()) {

					v8::String::Utf8Value v8ip6hostaddr(js_inet6rm->ToString());

					if(!errev.hasErr()) {
						_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);
						memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
								sizeof(struct in6_addr));

						if(!have_index) have_index = _net::get_index_if6(ifr, errev);

						if(have_index) {
							_net::remove_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
						}
					}
				} else { // it's an Array
					if(!errev.hasErr()) {

						Local<Array> arrayAddr = Local<Array>::Cast(js_inet6rm);

						for(uint32_t n=0;n<arrayAddr->Length();n++) {
							Local<Value> el = arrayAddr->Get(n);

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

			Local<Value> js_inet6add; Mval = Nan::Get(js_inet6, Nan::New("add_addr").ToLocalChecked());

			if(Mval.ToLocal(&js_inet6add) && !errev.hasErr() && (js_inet6add->IsArray() || js_inet6add->IsString())) {

				struct sockaddr_in6 sai;
				struct _net::in6_ifreq ifr6;
				memset(&sai, 0, sizeof(struct sockaddr));
				sai.sin6_family = AF_INET6;
				sai.sin6_port = 0;
				sai.sin6_scope_id = 0;
				int mask = 64;

				if(js_inet6add->IsString()) {

					v8::String::Utf8Value v8ip6hostaddr(js_inet6add->ToString());
					if(!errev.hasErr()) {
						_net::quickParseIPv6Mask(v8ip6hostaddr.operator *(), mask);
						memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
								sizeof(struct in6_addr));

						if(!have_index) have_index = _net::get_index_if6(ifr,errev);

						if(have_index) {
							_net::add_inet6addr(v8ip6hostaddr.operator *(),ifr,mask,errev);
						}
					}
				} else { // it's an Array
					if(!errev.hasErr()) {

						Local<Array> arrayAddr = Local<Array>::Cast(js_inet6add);

						for(uint32_t n=0;n<arrayAddr->Length();n++) {
							Local<Value> el = arrayAddr->Get(n);

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

			Local<Value> js_inet6mask; Mval = Nan::Get(js_inet6, Nan::New("mask").ToLocalChecked());

			if(Mval.ToLocal(&js_inet6mask) && js_inet6mask->IsString() && js_inet6mask->ToString()->Length() > 4) {

	//			struct ifreq ifr;
				struct sockaddr_in6 sai;
				struct _net::in6_ifreq ifr6;

	//			sockfd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_IP);  // open a generic IPv6 sock
	//			if (sockfd == -1) {
	//				ERROR_OUT("Could not create socket for IP addr assignment.\n");
	//				// TODO assign error info to object
	//				error = true;
	//			}

				if(!errev.hasErr()) {
					/* get interface name */
					strncpy(ifr.ifr_name, _ifname, IFNAMSIZ);

					memset(&sai, 0, sizeof(struct sockaddr));
					sai.sin6_family = AF_INET6;
					sai.sin6_port = 0;

					v8::String::Utf8Value v8ip6hostmask(js_inet6mask->ToString());

					int ret = 0;

					if((ret = inet_pton(AF_INET6, v8ip6hostmask.operator *(), (void *)&sai.sin6_addr)) <= 0) {
						if(ret == 0) {
							errev.setError(_net::OTHER_ERROR,"inet_pton: Bad address passed in?");
						} else {
							errev.setError(errno,"Error on inet_pton.");
						}
					}

					if(!errev.hasErr()) {
						memcpy((char *) &ifr6.ifr6_addr, (char *) &sai.sin6_addr,
						   sizeof(struct in6_addr));

						if(!have_index) {
							if (ioctl(sockfd, SIOGIFINDEX, &ifr) < 0) {
								errev.setError(errno);
								perror("SIOGIFINDEX");
							} else
								have_index = true;
						}

						if(have_index) {
							ifr6.ifr6_ifindex = ifr.ifr_ifindex;
							ifr6.ifr6_prefixlen = 64;
							if (ioctl(sockfd, SIOCSIFNETMASK, &ifr6) < 0) {
								errev.setError(errno);
								perror("SIOCSIFNETMASK");
							}
						}

					}

				}
			}

		} // end assign IPv6 address

	} // if has no error

	if(errev.hasErr()) {
		v8err = Nan::New(_net::err_ev_to_JS(errev, "assignAddress: "));
	}

	if(info.Length() > 1 && info[1]->IsFunction()) {
		const unsigned outargc = 1;
		Local<Value> outargv[outargc];
		Nan::Callback cb(Local<Function>::Cast(info[1]));
		if(!v8err.IsEmpty()) {
			outargv[0] = v8err->ToObject();
			cb.Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
		} else {
			cb.Call(Context::GetCurrent()->Global(),0,NULL);
		}
	}

	info.GetReturnValue().Set(!errev.hasErr()); // return false if error
}

void process_route(Local<Object> obj, _net::err_ev &err, int action) {
	Nan::MaybeLocal<Value> Mval;
	Local<Value> js_dest; Mval = obj->Get(Nan::New("dest").ToLocalChecked());

	if(Mval.ToLocal(&js_dest) && js_dest->IsString()) {
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
		Local<Value> js_via_if; Mval = Nan::Get(obj, Nan::New("via_if").ToLocalChecked());
		if(Mval.ToLocal(&js_via_if) && js_via_if->IsString()) {
			v8::String::Utf8Value v8_if(js_via_if->ToString());
			strncpy(_ifname, v8_if.operator *(), IFNAMSIZ);
			_if = _ifname;
		}

		Local<Value> js_via_net; Mval = Nan::Get(obj, Nan::New("via_network").ToLocalChecked());
		if(Mval.ToLocal(&js_via_net) && js_via_net->IsString()) {
			v8::String::Utf8Value v8_netname(js_via_net->ToString());
			strncpy(_netname, v8_netname.operator *(), INET6_ADDRSTRLEN*2);
			_net = _netname;
		}

		Local<Value> js_metric; Mval = Nan::Get(obj, Nan::New("metric").ToLocalChecked());
		if(Mval.ToLocal(&js_metric)) {
			if(!js_metric->IsUint32()) {
				ERROR_OUT("route entry has invalid 'metric' key. Needs UInt32. Skipping route entry.\n");
				return;
			} else {
				metric = js_metric->Uint32Value();
			}
		}
		Local<Value> js_flags; Mval = Nan::Get(obj, Nan::New("flags").ToLocalChecked());
		if(action != RTACTION_IN6_DEL && Mval.ToLocal(&js_flags)) { // skip flags if removing route
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

NAN_METHOD(AssignRoute) {

	// TODO need IPv4 support

	if(info.Length() < 1 || !info[0]->IsObject()) {
		return info.GetReturnValue().Set(Nan::New(false));
	}

	Local<Object> params = info[0]->ToObject();

	_net::err_ev err;
	Local<Value> v8err;

	Nan::MaybeLocal<v8::Value> Mval;
	Local<v8::Value> js_addroute; Mval = Nan::Get(params, Nan::New("add_route6").ToLocalChecked());
	if(Mval.ToLocal<v8::Value>(&js_addroute)){
		if(js_addroute->IsObject() || js_addroute->IsArray()) {

			if(js_addroute->IsArray()) {
				Local<Array> arrayAddr = Local<Array>::Cast(js_addroute);

				for(uint32_t n=0;n<arrayAddr->Length();n++) {
					Local<Object> el = arrayAddr->Get(n)->ToObject();
					if(el->IsObject()) {
						process_route(el->ToObject(),err, RTACTION_IN6_ADD);
					} else {
						ERROR_OUT("Array in add_route6 has a non-object! Invalid. Skipping.\n");
					}
				}
			} else {  // object
				process_route(js_addroute->ToObject(),err, RTACTION_IN6_ADD);
			}
		}

		Local<Value> js_delroute; Mval = Nan::Get(params, Nan::New("del_route6").ToLocalChecked());
		if(Mval.ToLocal<Value>(&js_delroute)) {
			if(js_delroute->IsObject() || js_delroute->IsArray()) {

				if(js_delroute->IsArray()) {
					Local<Array> arrayAddr = Local<Array>::Cast(js_delroute);

					for(uint32_t n=0;n<arrayAddr->Length();n++) {
						Local<Value> el = arrayAddr->Get(n)->ToObject();
						if(el->IsObject()) {
							process_route(el->ToObject(),err, RTACTION_IN6_DEL);
						} else {
							ERROR_OUT("Array in del_route6 has a non-object! Invalid. Skipping.\n");
						}
					}
				} else {  // object
					process_route(js_delroute->ToObject(),err, RTACTION_IN6_DEL);
				}
			}
		}

		Local<Value> js_msgroute; Mval = Nan::Get(params, Nan::New("msg_route6").ToLocalChecked());
		if(Mval.ToLocal<Value>(&js_msgroute)) {
			if(js_msgroute->IsObject() || js_msgroute->IsArray()) {
				if(js_delroute->IsArray()) {
					Local<Array> arrayAddr = Local<Array>::Cast(js_msgroute);

					for(uint32_t n=0;n<arrayAddr->Length();n++) {
						Local<Value> el = arrayAddr->Get(n)->ToObject();
						if(el->IsObject()) {
							process_route(el->ToObject(),err, RTACTION_IN6_MESSAGE);
						} else {
							ERROR_OUT("Array in msg_route6 has a non-object! Invalid. Skipping.\n");
						}
					}
				}
			}
		}
	}

	if(err.hasErr()) {
		v8err = Nan::New(_net::err_ev_to_JS(err, "assignRoute: "));
	}

	if(info.Length() > 1 && info[1]->IsFunction()) {
		const unsigned outargc = 1;
		Local<Value> outargv[outargc];
		Nan::Callback cb(Local<Function>::Cast(info[1]));
		if(!v8err.IsEmpty()) {
			outargv[0] = v8err->ToObject();
			cb.Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
		} else {
			cb.Call(Context::GetCurrent()->Global(),0,NULL);
		}
	}
}


/**
 * ifUp = function(string,flags,callback) {}
 * @param callback {Function} is of the form: cb(err) {}
 * @param ifname {string} Interface name as a string
 */
NAN_METHOD(InitIfFlags) {
	struct ifreq ifr;

	if((info.Length() > 1) && info[0]->IsString() && info[1]->Int32Value()) {
		v8::String::Utf8Value v8ifname(info[0]->ToString());

		short int flags = info[1]->Int32Value();

		strncpy(ifr.ifr_name, v8ifname.operator *(), IFNAMSIZ);
		_net::err_ev err;
		Local<Value> v8err;
		int fd = _net::get_generic_packet_sock(err);

		if(fd > 0 && _net::get_index_if_generic(ifr,err)) {
			ifr.ifr_flags = flags;
		    if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
//		    	perror("SIOCSIFFLAGS");
		    	err.setError(errno);
		    }
		}

		if(err.hasErr()) {
			v8err = Nan::New(_net::err_ev_to_JS(err, "initIfFlags: "));
		}

    	if(info.Length() > 2 && info[2]->IsFunction()) { // if callback was provided
    		const unsigned outargc = 1;
    		Local<Value> outargv[outargc];
    		Nan::Callback cb(Local<Function>::Cast(info[2]));
    		if(!v8err.IsEmpty()) {
    			outargv[0] = v8err->ToObject();
    			cb.Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
    		} else {
    			cb.Call(Context::GetCurrent()->Global(),0,NULL);
    		}
    	}

	} else {
		return Nan::ThrowTypeError("Bad arguments. Proper call is setIfFlags(string,flags,[callback])");
	}
}



/**
 * ifUp = function(string,flags,callback) {}
 * @param callback {Function} is of the form: cb(err) {}
 * @param ifname {string} Interface name as a string
 */
NAN_METHOD(SetIfFlags) {
	struct ifreq ifr;

	if((info.Length() > 1) && info[0]->IsString() && info[1]->Int32Value()) {
		v8::String::Utf8Value v8ifname(info[0]->ToString());

		short int flags = info[1]->Int32Value();

		GLOG_DEBUG3("ifname = %s flags = %d", *v8ifname, flags);

		strncpy(ifr.ifr_name, v8ifname.operator *(), IFNAMSIZ);
		_net::err_ev err;
		Local<Value> v8err;
		int fd = _net::get_generic_packet_sock(err);

		if(fd > 0 && _net::get_index_if_generic(ifr,err)) {
		    if (ioctl(fd, SIOCGIFFLAGS, &ifr) < 0) {
		    	err.setError(errno);
//		    	perror("SIOCSIFFLAGS");
		    }
		    if(!err.hasErr()) {
		    	ifr.ifr_flags |=  flags;
		    	if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
//		    	perror("SIOCSIFFLAGS");
		    		err.setError(errno);
		    	}
		    }
		}

		if(err.hasErr()) {
			v8err = Nan::New(_net::err_ev_to_JS(err, "setIfFlags: "));
		}

    	if(info.Length() > 2 && info[2]->IsFunction()) { // if callback was provided
    		const unsigned outargc = 1;
    		Local<Value> outargv[outargc];
    		Nan::Callback cb(Local<Function>::Cast(info[2]));
    		if(!v8err.IsEmpty()) {
    			outargv[0] = v8err->ToObject();
    			cb.Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
    		} else {
    			cb.Call(Context::GetCurrent()->Global(),0,NULL);
    		}
    	}

	} else {
		return Nan::ThrowTypeError("Bad arguments. Proper call is setIfFlags(string,flags,[callback])");
	}
}


/**
 * ifUp = function(string,flags) {}
 * @param ifname {string} Interface name as a string
 */
NAN_METHOD(UnsetIfFlags) {
	struct ifreq ifr;

	if((info.Length() > 1) && info[0]->IsString() && info[1]->Int32Value()) {
		v8::String::Utf8Value v8ifname(info[0]->ToString());

//		int len = v8ifname.length() + 1;
//		if(v8ifname.length() > IFNAMSIZ) {
//			len = IFNAMSIZ;
//		}
		_net::err_ev err;
		Local<Value> v8err;

		short int flags = (short int) info[1]->Int32Value();

		strncpy(ifr.ifr_name, v8ifname.operator *(), IFNAMSIZ);
		int fd = _net::get_generic_packet_sock(err);

		if(fd > 0 && _net::get_index_if_generic(ifr,err)) {
		    if (ioctl(fd, SIOCGIFFLAGS, &ifr) < 0) {
		    	err.setError(errno);
//		    	perror("SIOCSIFFLAGS");
		    }
		    if(!err.hasErr()) {
		    	GLOG_DEBUG("Have flags: %x\n", ifr.ifr_flags);
				ifr.ifr_flags = ifr.ifr_flags & ~flags;
		    	GLOG_DEBUG("Setting to flags: %x\n", ifr.ifr_flags);
				if (ioctl(fd, SIOCSIFFLAGS, &ifr) < 0) {
			    	err.setError(errno);
	//		    	perror("SIOCSIFFLAGS");
			    }
		    }
		}

		if(err.hasErr()) {
			v8err = Nan::New(_net::err_ev_to_JS(err, "unsetIfFlags: "));
		}

    	if(info.Length() > 2 && info[2]->IsFunction()) { // if callback was provided
    		const unsigned outargc = 1;
    		Local<Value> outargv[outargc];
    		Nan::Callback cb(Local<Function>::Cast(info[2]));
    		if(!v8err.IsEmpty()) {
    			outargv[0] = v8err->ToObject();
    			cb.Call(Context::GetCurrent()->Global(),1,outargv); // w/ error
    		} else {
    			cb.Call(Context::GetCurrent()->Global(),0,NULL);
    		}
    	}

	} else {
		return Nan::ThrowTypeError("Bad arguments. Proper call is unsetIfFlags(string,flags,[callback])");
	}
}


void InitAll(Handle<Object> exports, Handle<Object> module){
	INIT_GLOG;

	GLOG_DEBUG("InitAll");

	Nan::Set(exports, Nan::New("InitNativeTun").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(TunInterface::Init)).ToLocalChecked());
	Nan::Set(exports, Nan::New("InitNetlinkSocket").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(NetlinkSocket::Init)).ToLocalChecked());
	Nan::Set(exports, Nan::New("newTunInterface").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(TunInterface::New)).ToLocalChecked());
	Nan::Set(exports, Nan::New("newNetlinkSocket").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(NetlinkSocket::New)).ToLocalChecked());
	Nan::Set(exports, Nan::New("assignAddress").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(AssignAddress)).ToLocalChecked());
	Nan::Set(exports, Nan::New("assignRoute").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(AssignRoute)).ToLocalChecked());
	Nan::Set(exports, Nan::New("initIfFlags").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(InitIfFlags)).ToLocalChecked());
	Nan::Set(exports, Nan::New("setIfFlags").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(SetIfFlags)).ToLocalChecked());
	Nan::Set(exports, Nan::New("unsetIfFlags").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(UnsetIfFlags)).ToLocalChecked());
	Nan::Set(exports, Nan::New("ifNameToIndex").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(IfNameToIndex)).ToLocalChecked());
	Nan::Set(exports, Nan::New("ifIndexToName").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(IfIndexToName)).ToLocalChecked());
	Nan::Set(exports, Nan::New("toAddress").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(ToAddress)).ToLocalChecked());
	Nan::Set(exports, Nan::New("fromAddress").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(FromAddress)).ToLocalChecked());
	Nan::Set(exports, Nan::New("errorFromErrno").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(ErrorFromErrno)).ToLocalChecked());

	Nan::Set(exports, Nan::New("wrapMemBufferTest").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(WrapMemBufferTest)).ToLocalChecked());
	Nan::Set(exports, Nan::New("packTest").ToLocalChecked(),
		Nan::GetFunction(Nan::New<FunctionTemplate>(PackTest)).ToLocalChecked());

	// Handle<Object> errconsts; MaybeLocal<v8::Object> Merrs = Nan::New<v8::Object>();
	// _errcmn::DefineConstants(errconsts);
	// Nan::Set(exports, Nan::New("ERR"), errconsts);
}

NODE_MODULE(netkit, InitAll)
