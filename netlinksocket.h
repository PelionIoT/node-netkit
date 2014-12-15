/*
 * netlinksocket.h
 *
 *  Created on: Dec 11, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */
#ifndef NODE_NETLINKSOCKET_H_
#define NODE_NETLINKSOCKET_H_

#include <v8.h>
#include <node.h>
#include <uv.h>
#include <node_buffer.h>
#include "node_pointer.h"
#include "network-common.h"

#include <sys/types.h>
#include <sys/socket.h>
#include <linux/if.h>
#include <linux/sockios.h>
#include <linux/netlink.h>  // netlink communication
#include <linux/rtnetlink.h>  // RT_NETLINK class procedures for netlink. See: http://inai.de/documents/Netlink_Protocol.pdf
#include <linux/neighbour.h>  // for capability to do commands like "ip neighbor"

using namespace node;
using namespace v8;




class NetlinkSocket : public node::ObjectWrap {
protected:
	int fd;
	struct nlmsghdr	hdr;
	struct ndmsg msg;

	v8::Persistent<Function> onDataCB;

	struct writeReq {
		uv_work_t work;
		_net::err_ev err; // the errno that happened on read if an error occurred.
		v8::Persistent<Function> onSendSuccessCB;
		v8::Persistent<Function> onSendFailureCB;
		v8::Persistent<Object> buffer; // Buffer object passed in
		char *_backing; // backing of the passed in Buffer
		int len;
		NetlinkSocket *self;
		// need Buffer
		writeReq(NetlinkSocket *i) : err(), onSendSuccessCB(), onSendFailureCB(), buffer(), _backing(NULL), len(0), self(i) {
			work.data = this;
		}
		writeReq() = delete;
	};

public:
	NetlinkSocket() : fd(0), onDataCB() {}

	static Handle<Value> Init(const Arguments& args);
	static void ExtendFrom(const Arguments& args);
    static Persistent<Function> constructor;

    static Handle<Value> New(const Arguments& args);
    static Handle<Value> NewInstance(const Arguments& args);

    static Handle<Value> Bind(const Arguments& args);

    static Handle<Value> Sendmsg(const Arguments& args);
    static Handle<Value> OnRecv(const Arguments& args);
    static Handle<Value> OnError(const Arguments& args);

    static Handle<Value> Close(const Arguments& args);
};




#endif /* NODE_NETLINKSOCKET_H_ */
