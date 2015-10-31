/*
 * network-common.cc
 *
 *  Created on: Sep 3, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */


#include <string.h>
#include <stdlib.h>

#include "network-common.h"

namespace _net {

	const int max_error_buf = 255;

	char *get_error_str(int _errno) {
		char *buf = (char *) malloc(max_error_buf);
		char* ret = strerror_r(_errno,buf,max_error_buf); // glibc thread safe version
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
	        v8::Local<v8::Object> retobj = Nan::New<v8::Object>();

		if(_errno) {
			char *temp = NULL;
			if(_errno < _ERRCMD_CUSTOM_ERROR_CUTOFF) {
				char *errstr = get_error_str(_errno);
				if(errstr) {
					if(prefix) {
						int len = strlen(prefix)+strlen(errstr)+2;
						temp = (char *) malloc(len);
						memset(temp,0,len);
						strcpy(temp, prefix);
						strcat(temp, errstr);
					} else {
						temp = errstr;
					}
					retobj->Set(Nan::New("message").ToLocalChecked(), Nan::New(temp).ToLocalChecked());
					free_error_str(errstr);
				}
			}
			retobj->Set(Nan::New("errno").ToLocalChecked(), Nan::New<v8::Integer>(_errno));
		}
		return retobj;
	}

	v8::Handle<v8::Value> err_ev_to_JS(err_ev &e, const char *prefix) {
//		v8::Local<v8::Object> retobj = v8::Object::New();
		v8::Local<v8::Value> retobj = Nan::Undefined();

		if(e.hasErr()) {
			char *temp = NULL;
			if(prefix && e.errstr) {
				int len = strlen(prefix)+strlen(e.errstr)+2;
				temp = (char *) malloc(len);
				memset(temp,0,len);
				strcpy(temp, prefix);
				strcat(temp, e.errstr);
//				retobj->Set(v8::String::New("message"), v8::String::New(temp));
				retobj = v8::Exception::Error(Nan::New(temp).ToLocalChecked());
				free(temp);
			}
			else retobj = v8::Exception::Error(Nan::New("Error").ToLocalChecked());
			retobj->ToObject()->Set(Nan::New("errno").ToLocalChecked(), Nan::New<v8::Integer>(e._errno));
		}
		return (retobj);
	}



}




