/*
 * network-common.cc
 *
 *  Created on: Sep 3, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc.
 */



#ifdef _POSIX_C_SOURCE
#undex _POSIX_C_SOURCE
#endif
#define _POSIX_C_SOURCE 200112L

#ifdef _GNU_SOURCE
#undef _GNU_SOURCE
#endif

// ensure we get the XSI compliant strerror_r():
// see: http://man7.org/linux/man-pages/man3/strerror.3.html

#include <string.h>
#include <stdlib.h>

#include <v8.h>

namespace _net {

	const int max_error_buf = 255;

	char *get_error_str(int _errno) {
		char *ret = (char *) malloc(max_error_buf);
		strerror_r(_errno,ret,max_error_buf);
		return ret;
	}

	void free_error_str(char *b) {
		free(b);
	}

	v8::Local<v8::Object> errno_to_JS(int _errno, char *prefix) {
	//	HandleScope scope;
		v8::Local<v8::Object> retobj = v8::Object::New();

		if(_errno) {
			char *temp = NULL;
			char *errstr = get_error_str(_errno);
			if(prefix) {
				temp = (char *) malloc(strlen(prefix)+strlen(errstr));
				strcpy(temp, prefix);
				strcat(temp, errstr);
			} else {
				temp = errstr;
			}
			retobj->Set(v8::String::New("message"), v8::String::New(temp));
			retobj->Set(v8::String::New("errno"), v8::Integer::New(_errno));
			free_error_str(errstr);
		}
		return retobj;
	}

}


