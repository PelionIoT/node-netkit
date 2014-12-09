/*
 * network-common.cc
 *
 *  Created on: Sep 3, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */



#ifdef _POSIX_C_SOURCE
#undef _POSIX_C_SOURCE
#endif
#define _POSIX_C_SOURCE 200112L

#ifdef _GNU_SOURCE
#undef _GNU_SOURCE
#endif


// ensure we get the XSI compliant strerror_r():
// see: http://man7.org/linux/man-pages/man3/strerror.3.html

#include <string.h>
#include <stdlib.h>

// bc we are using the XSI compiant version via the above macros
// strdup must be declared manually.
extern "C" {
extern char *strdup (const char *__s)
     __THROW __attribute_malloc__ __nonnull ((1));
};


#include <v8.h>

#include "network-common.h"

namespace _net {

	const int max_error_buf = 255;


	char *get_error_str(int _errno) {
		char *ret = (char *) malloc(max_error_buf);
		memset(ret,0,max_error_buf);
		strerror_r(_errno,ret,max_error_buf);
		return ret;
	}

	void free_error_str(char *b) {
		free(b);
	}

	void err_ev::setError(int e,const char *m)
	{
		_errno = e;
		if(errstr) free(errstr);
		if(!m)
			errstr = get_error_str(e);
		else
			errstr = ::strdup(m);
	}

	v8::Local<v8::Value> errno_to_JS(int _errno, const char *prefix) {
	//	HandleScope scope;
//		v8::Local<v8::Object> retobj = v8::Object::New();
		v8::Local<v8::Value> retobj = v8::Local<v8::Primitive>::New(v8::Undefined());

		if(_errno) {
			char *temp = NULL;
			char *errstr = get_error_str(_errno);
			if(prefix) {
				temp = (char *) malloc(strlen(prefix)+strlen(errstr)+1);
				strcpy(temp, prefix);
				strcat(temp, errstr);
				retobj = v8::Exception::Error(v8::String::New(temp));
			} else {
				temp = errstr;
				retobj = v8::Exception::Error(v8::String::New(temp));
			}
			retobj->ToObject()->Set(v8::String::New("errno"), v8::Integer::New(_errno));
			free_error_str(errstr);
		}
		return retobj;
	}


	v8::Handle<v8::Value> err_ev_to_JS(err_ev &e, const char *prefix) {
		v8::HandleScope scope;
//		v8::Local<v8::Object> retobj = v8::Object::New();
		v8::Local<v8::Value> retobj = v8::Local<v8::Primitive>::New(v8::Undefined());

		if(e.hasErr()) {
			char *temp = NULL;
			if(prefix && e.errstr) {
				temp = (char *) malloc(strlen(prefix)+strlen(e.errstr)+1);
				strcpy(temp, prefix);
				strcat(temp, e.errstr);
//				retobj->Set(v8::String::New("message"), v8::String::New(temp));
				retobj = v8::Exception::Error(v8::String::New(temp));
				free(temp);
			}
			else retobj = v8::Exception::Error(v8::String::New("Error"));
			retobj->ToObject()->Set(v8::String::New("errno"), v8::Integer::New(e._errno));
		}
		return scope.Close(retobj);
	}

}




