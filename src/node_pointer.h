/*
 * node_pointer.h
 *

EXTERNAL_LICENSE Pulled from https://github.com/TooTallNate/node-lame

Copyright (c) 2011 Nathan Rajlich

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

 */

#ifndef NODE_POINTER_H_
#define NODE_POINTER_H_

/*
 * Helper functions for treating node Buffer instances as C "pointers".
 */

#include "v8.h"
#include "node_buffer.h"
#include "nan.h"

/*
 * Called when the "pointer" is garbage collected.
 */

inline static void wrap_pointer_cb(char *data, void *hint) {
  //fprintf(stderr, "wrap_pointer_cb\n");
}

/*
 * Wraps "ptr" into a new SlowBuffer instance with size "length".
 */

inline static v8::Handle<v8::Value> WrapPointer(void *ptr, size_t length) {
  void *user_data = NULL;
  Nan::MaybeLocal<v8::Object> Mbuf = Nan::NewBuffer((char *)ptr, length, wrap_pointer_cb, user_data);
  return Mbuf.ToLocalChecked();
}

/*
 * Wraps "ptr" into a new SlowBuffer instance with length 0.
 */

inline static v8::Handle<v8::Value> WrapPointer(void *ptr) {
  return WrapPointer((char *)ptr, 0);
}

/*
 * Unwraps Buffer instance "buffer" to a C `char *` with the offset specified.
 */

inline static char * UnwrapPointer(v8::Handle<v8::Value> buffer, int64_t offset) {
  return node::Buffer::Data(buffer.As<v8::Object>()) + offset;
}

/*
 * Unwraps Buffer instance "buffer" to a C `char *` (no offset applied).
 */


inline static char * UnwrapPointer(v8::Handle<v8::Value> buffer) {
  return node::Buffer::Data(buffer.As<v8::Object>());
}



#endif /* NODE_POINTER_H_ */
