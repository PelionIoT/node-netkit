/*
 * network-common.h
 *
 *  Created on: Sep 2, 2014
 *      Author: ed
 * (c) 2014, WigWag Inc
 */
#ifndef NETWORK_COMMON_H_
#define NETWORK_COMMON_H_



#include "node.h"
#include "node_buffer.h"
#include "node_version.h"
#include "v8.h"

#include <stdlib.h>
#include <string.h>

/**
 * LICENSE_IMPORT_BEGIN 9/7/14
 *
 * Macros below pulled from this project:
 *
 * https://github.com/bnoordhuis/node-buffertools/blob/master/buffertools.cc
 *
 * and include additions by WigWag.
 *
 * original license:

Copyright (c) 2010, Ben Noordhuis <info@bnoordhuis.nl>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#if NODE_MAJOR_VERSION > 0 || NODE_MINOR_VERSION > 10
# define UNI_BOOLEAN_NEW(value)                                               \
    v8::Boolean::New(args.GetIsolate(), value)
# define UNI_BUFFER_NEW(size)                                                 \
    node::Buffer::New(args.GetIsolate(), size)
# define UNI_CONST_ARGUMENTS(name)                                            \
    const v8::FunctionCallbackInfo<v8::Value>& name
# define UNI_ESCAPE(value)                                                    \
    return handle_scope.Escape(value)
# define UNI_ESCAPABLE_HANDLESCOPE()                                          \
    v8::EscapableHandleScope handle_scope(args.GetIsolate())
# define UNI_FUNCTION_CALLBACK(name)                                          \
    void name(const v8::FunctionCallbackInfo<v8::Value>& args)
# define UNI_HANDLESCOPE()                                                    \
    v8::HandleScope handle_scope(args.GetIsolate())
# define UNI_INTEGER_NEW(value)                                               \
    v8::Integer::New(args.GetIsolate(), value)
# define UNI_RETURN(value)                                                    \
    args.GetReturnValue().Set(value)
# define UNI_STRING_EMPTY()                                                   \
    v8::String::Empty(args.GetIsolate())
# define UNI_STRING_NEW(string, size)                                         \
    v8::String::NewFromUtf8(args.GetIsolate(),                                \
                            string,                                           \
                            v8::String::kNormalString,                        \
                            size)
# define UNI_THROW_AND_RETURN(type, message)                                  \
    do {                                                                      \
      args.GetIsolate()->ThrowException(                                      \
          type(v8::String::NewFromUtf8(args.GetIsolate(), message)));         \
      return;                                                                 \
    } while (0)
# define UNI_THROW_EXCEPTION(type, message)                                   \
    args.GetIsolate()->ThrowException(                                        \
        type(v8::String::NewFromUtf8(args.GetIsolate(), message)));
#else  // NODE_MAJOR_VERSION > 0 || NODE_MINOR_VERSION > 10
# define UNI_BOOLEAN_NEW(value)                                               \
    v8::Local<v8::Boolean>::New(v8::Boolean::New(value))
# define UNI_BUFFER_NEW(size)                                                 \
    v8::Local<v8::Object>::New(node::Buffer::New(size)->handle_)
# define UNI_CONST_ARGUMENTS(name)                                            \
    const v8::Arguments& name
# define UNI_ESCAPE(value)                                                    \
    return handle_scope.Close(value)
# define UNI_ESCAPABLE_HANDLESCOPE()                                          \
    v8::HandleScope handle_scope
# define UNI_FUNCTION_CALLBACK(name)                                          \
    v8::Handle<v8::Value> name(const v8::Arguments& args)
# define UNI_HANDLESCOPE()                                                    \
    v8::HandleScope handle_scope
# define UNI_INTEGER_NEW(value)                                               \
    v8::Integer::New(value)
# define UNI_RETURN(value)                                                    \
    return handle_scope.Close(value)
# define UNI_STRING_EMPTY()                                                   \
    v8::String::Empty()
# define UNI_STRING_NEW(string, size)                                         \
    v8::String::New(string, size)
# define UNI_THROW_AND_RETURN(type, message)                                  \
    return v8::ThrowException(v8::String::New(message))
# define UNI_THROW_EXCEPTION(type, message)                                   \
    v8::ThrowException(v8::String::New(message))
#endif  // NODE_MAJOR_VERSION > 0 || NODE_MINOR_VERSION > 10

// LICENSE_IMPORT_END

namespace _net {
    /** NOTE: you should always pass in a string with this when using setError() */
	const int OTHER_ERROR = 0x1FFF;
	char *get_error_str(int _errno);
	void free_error_str(char *b);
	v8::Local<v8::Value> errno_to_JS(int _errno, const char *prefix);
	struct err_ev {
		char *errstr;
		int _errno;
		err_ev(void) : errstr(NULL), _errno(0) {};
		void setError(int e,const char *m=NULL);
		err_ev(int e) : err_ev() {
			setError(e);
		}
		err_ev(const err_ev &o) = delete;
		inline err_ev &operator=(const err_ev &o) = delete;
		inline err_ev &operator=(err_ev &&o) {
			this->errstr = o.errstr;  // transfer string to other guy...
			this->_errno = o._errno;
			o.errstr = NULL; o._errno = 0;
			return *this;
		}
		~err_ev() {
			if(errstr) ::free(errstr);
		}
		bool hasErr() { return (_errno != 0); }
	};
	v8::Local<v8::Value> err_ev_to_JS(err_ev &e, const char *prefix);
}


// confused? here: https://gcc.gnu.org/onlinedocs/cpp/Variadic-Macros.html
#define ERROR_OUT(s,...) fprintf(stderr, "**ERROR** " s, ##__VA_ARGS__ );
//#define ERROR_PERROR(s,...) fprintf(stderr, "*****ERROR***** " s, ##__VA_ARGS__ );
#define ERROR_PERROR(s,E,...) { char *__S=_net::get_error_str(E); fprintf(stderr, "**ERROR** [ %s ] " s, __S, ##__VA_ARGS__ ); _net::free_error_str(__S); }

#define DBG_OUT(s,...) fprintf(stderr, "**DEBUG** " s, ##__VA_ARGS__ );

#endif /* NETWORK_COMMON_H_ */
