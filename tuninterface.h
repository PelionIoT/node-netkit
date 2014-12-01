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
	char *_err_str;
	int _if_fd;
	int _if_flags;
	int _if_error;

	int read_chunk_size;

	v8::Persistent<Function> onDataCB;

	struct readReq {
		uv_work_t work;
		int _errno; // the errno that happened on read if an error ocurred.
		v8::Persistent<Function> completeCB;
		v8::Persistent<Object> buffer;
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
		v8::Persistent<Function> onSendSuccessCB;
		v8::Persistent<Function> onSendFailureCB;
		v8::Persistent<Object> buffer; // Buffer object passed in
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
	static Handle<Value> Init(const Arguments& args);
	static void ExtendFrom(const Arguments& args);
    static void Shutdown();

    static Persistent<Function> constructor_template;
    static Handle<Value> New(const Arguments& args);
    static Handle<Value> NewInstance(const Arguments& args);

    static Handle<Value> IsCreated(const Arguments& args);

    static Handle<Value> GetIfName(Local<String> property, const AccessorInfo &info);
    static void SetIfName(Local<String> property, Local<Value> val, const AccessorInfo &info);
    static Handle<Value> GetIfFD(Local<String> property, const AccessorInfo &info);
    static void SetIfFD(Local<String> property, Local<Value> val, const AccessorInfo &info);
    static Handle<Value> GetIfFlags(Local<String> property, const AccessorInfo &info);
    static void SetIfFlags(Local<String> property, Local<Value> val, const AccessorInfo &info);
    static Handle<Value> GetLastError(Local<String> property, const AccessorInfo &info);
    static void SetLastError(Local<String> property, Local<Value> val, const AccessorInfo &info);
    static Handle<Value> GetLastErrorStr(Local<String> property, const AccessorInfo &info);
    static void SetLastErrorStr(Local<String> property, Local<Value> val, const AccessorInfo &info);
    static Handle<Value> GetReadChunkSize(Local<String> property, const AccessorInfo &info);
    static void SetReadChunkSize(Local<String> property, Local<Value> val, const AccessorInfo &info);


    static Handle<Value> GetData(const Arguments& args);
    static Handle<Value> SendData(const Arguments& args);

    static Handle<Value> Create(const Arguments& args);
    static Handle<Value> Open(const Arguments& args);
    static Handle<Value> Close(const Arguments& args);


    static Persistent<Function> constructor;
    static Persistent<ObjectTemplate> prototype;

    TunInterface(char *repoUrl = NULL) :
    	_err_str(NULL), _if_fd(0), _if_flags(IFF_TUN | IFF_NO_PI), _if_error(0),
    	read_chunk_size(TUN_IF_READ_DEFAULT_CHUNK_SIZE), onDataCB()
    	{
    		memset(_if_name,0,MAX_IF_NAME_LEN+1);
    	}

    ~TunInterface() {
    	if(_err_str) free(_err_str);
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

	void setErrStr(char *zSprefix, char *zStr) {
		if(_err_str) free(_err_str);
		_err_str = NULL;
		if(zStr) {
			if(zSprefix) {
				int total = strlen(zStr) + strlen(zSprefix) + 1;
				_err_str = (char *) malloc(total);
				strcpy(_err_str, zSprefix);
				strcat(_err_str, zStr);
			} else
				_err_str = strdup(zStr);
		}
	}



//    static uint32_t genNewWorkId();
//    static uint32_t nextWorkId;
//    static uv_mutex_t workIdMutex;
//    static TWlib::TW_KHash_32<uint32_t, workJob*, TW_Mutex, uint32_eqFunc, TWlib::Allocator<Alloc_Std> > workTable;

};



#endif /* TUNINTERFACE_H_ */
