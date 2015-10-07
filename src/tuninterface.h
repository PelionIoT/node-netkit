/*
 * tuninterface.h
 *
 *  Created on: Aug 27, 2014
 *      Author: ed
 * (c) 2014, Framez Inc
 */
#ifndef TUNINTERFACE_H_
#define TUNINTERFACE_H_

#include <v8.h>
#include <node.h>
#include <uv.h>
#include <node_buffer.h>
#include "node_pointer.h"
#include "network-common.h"
#include "error-common.h"
#include "nan.h"

using namespace node;
using namespace v8;

#include <sys/types.h>
#include <sys/socket.h>
#include <linux/if.h>
#include <linux/if_tun.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <linux/fs.h>
#include <endian.h>

#include <string.h>
#include <stdlib.h>
#include <uv.h>

// should be bigger than the normal MTU
#define TUN_IF_READ_DEFAULT_CHUNK_SIZE  2000


const int MAX_IF_NAME_LEN = 16;

class TunInterface : public node::ObjectWrap {
protected:

	int tun_create();

//	static void do_create(uv_work_t *req);
//	static void post_checkout(uv_work_t *req, int status);
//
//	static void do_clone(uv_work_t *req);
//	static void master_work(uv_work_t *req);
//
//	static void post_clone(uv_work_t *req, int status);
//	static void post_master(uv_work_t *req, int status);

	char _if_name[MAX_IF_NAME_LEN+1];
	_net::err_ev err;
	int _if_fd;
	int _if_flags;

	int read_chunk_size;

	v8::Persistent<Function> onDataCB;
	bool isTun;  // true if a TUN, false if a TAP

	struct readReq {
		uv_work_t work;
		int _errno; // the errno that happened on read if an error ocurred.
		Nan::Callback* completeCB;
		Nan::Persistent<v8::Object> buffer;
		char *_backing;                // the backing store of the buffer
		int len;
		TunInterface *self;
		// need Buffer
		readReq(TunInterface *i) : _errno(0), completeCB(), buffer(), _backing(NULL), len(0), self(i) {
			work.data = this;
		}
		readReq() = delete;
	};

	struct writeReq {
		uv_work_t work;
		int _errno; // the errno that happened on read if an error occurred.
		Nan::Callback* onSendSuccessCB;
		Nan::Callback* onSendFailureCB;
		Nan::Persistent<v8::Object> buffer; // Buffer object passed in
		char *_backing; // backing of the passed in Buffer
		int len;
		TunInterface *self;
		// need Buffer
		writeReq(TunInterface *i) : _errno(0), onSendSuccessCB(), onSendFailureCB(), buffer(), _backing(NULL), len(0), self(i) {
			work.data = this;
		}
		writeReq() = delete;
	};

	static void do_read(uv_work_t *req);
	static void post_read(uv_work_t *req, int status);

	static void do_write(uv_work_t *req);
	static void post_write(uv_work_t *req, int status);

public:
	static void Init(v8::Local<v8::Object> exports);
    static void Shutdown();

    static NAN_METHOD(New);
    static NAN_METHOD(IsCreated);

    static NAN_GETTER(GetIfName);
    static NAN_SETTER(SetIfName);
    static NAN_GETTER(GetIfFD);
    static NAN_SETTER(SetIfFD);
    static NAN_GETTER(GetIfFlags);
    static NAN_SETTER(SetIfFlags);
    static NAN_GETTER(GetLastError);
    static NAN_SETTER(SetLastError);
    static NAN_GETTER(GetReadChunkSize);
    static NAN_SETTER(SetReadChunkSize);


    static NAN_METHOD(GetData);
    static NAN_METHOD(SendData);
    static NAN_METHOD(Create);
    static NAN_METHOD(Open);
    static NAN_METHOD(Close);


    static Nan::Persistent<Function> constructor;
//    static Persistent<ObjectTemplate> prototype;

    // solid reference to TUN / TAP creation is: http://backreference.org/2010/03/26/tuntap-interface-tutorial/

    TunInterface(short flags = -1) :
    	err(), _if_fd(0), _if_flags(IFF_TUN | IFF_NO_PI),
    	read_chunk_size(TUN_IF_READ_DEFAULT_CHUNK_SIZE), onDataCB(), isTun(true)
    	{
    		if(flags != -1) _if_flags = flags; // optional flags override
    		memset(_if_name,0,MAX_IF_NAME_LEN+1);
    	}

    // named cstor...
    static TunInterface *createTapInterface() {
    	TunInterface *ret = new TunInterface(IFF_TAP | IFF_NO_PI); // use IFF_TAP instead
    	ret->isTun = false;
    	return ret;
    }

    ~TunInterface() {
    }

	void setIfName(char *p, int len) {
		if(p) {
			memset(_if_name,0,len+1);
			if(len > MAX_IF_NAME_LEN) {
				ERROR_OUT( "Warning: truncating ifname - string too big\n");
				len = MAX_IF_NAME_LEN;
			}
			memcpy(_if_name,p,len);
		}
	}


	void setErrno(int _errno, const char *m=NULL) {
		err.setError(_errno, m);
	}


//    static uint32_t genNewWorkId();
//    static uint32_t nextWorkId;
//    static uv_mutex_t workIdMutex;
//    static TWlib::TW_KHash_32<uint32_t, workJob*, TW_Mutex, uint32_eqFunc, TWlib::Allocator<Alloc_Std> > workTable;

};



#endif /* TUNINTERFACE_H_ */
