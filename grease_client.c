/*
 * grease_log.c
 *
 *  Created on: Apr 2, 2015
 *      Author: ed
 * (c) 2015, WigWag Inc.
 */
#include <stdio.h>
#include <stdint.h>
#include <stdarg.h>

#include "grease_client.h"

#ifdef __cplusplus
extern "C" {
#endif



//static uint32_t grease_PREAMBLE = SINK_LOG_PREAMBLE;
const logMeta __noMetaData = {
		.tag = 0,
		.level = 0,
		.origin = 0,
		.target = 0 };


const logMeta __meta_info = {
		.tag = 0,
		.level = GREASE_LEVEL_INFO,
		.origin = 0,
		.target = 0 };

const logMeta __meta_error = {
		.tag = 0,
		.level = GREASE_LEVEL_ERROR,
		.origin = 0,
		.target = 0 };

const logMeta __meta_warn = {
		.tag = 0,
		.level = GREASE_LEVEL_WARN,
		.origin = 0,
		.target = 0 };

const logMeta __meta_debug = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG,
		.origin = 0,
		.target = 0 };

const logMeta __meta_debug2 = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG2,
		.origin = 0,
		.target = 0 };

const logMeta __meta_debug3 = {
		.tag = 0,
		.level = GREASE_LEVEL_DEBUG3,
		.origin = 0,
		.target = 0 };

const logMeta __meta_user1 = {
		.tag = 0,
		.level = GREASE_LEVEL_USER1,
		.origin = 0,
		.target = 0 };

const logMeta __meta_user2 = {
		.tag = 0,
		.level = GREASE_LEVEL_USER2,
		.origin = 0,
		.target = 0 };

const uint32_t __grease_preamble = SINK_LOG_PREAMBLE;

static int found_module;

//__attribute__((visibility ("hidden"))) - note: gcc automatically does not export static vars
static void *local_log;

// the grease_log pointer is used to point to the logging method this client code uses:
// 1) If the greaseLog.node module is loaded into the executable, then it will use the local_log pointer
// which points to grease_logLocal() which is defined in logger.cc - and is not in the client code
// 2) otherwise, if this module is not loaded by the executable, then it will use grease_logToSink()
// ...so this pointer below - we don't want to export it. It's only for use in the local code in grease_client.c
__attribute__((visibility ("hidden"))) int (*grease_log)(const logMeta *f, const char *s, RawLogLen len) = NULL;


static __thread char _grease_logstr_buffer[GREASE_C_MACRO_MAX_MESSAGE];

#ifdef __cplusplus
}
#endif

int grease_printf(const logMeta *m, const char *format, ... ) {
	va_list args;
	va_start (args, format);
	RawLogLen len = (RawLogLen) vsnprintf (_grease_logstr_buffer,GREASE_C_MACRO_MAX_MESSAGE,format, args);
	va_end (args);
	if(grease_log != NULL)
		return grease_log(m,_grease_logstr_buffer, len);
	else {
		vfprintf(stderr, _grease_logstr_buffer, args );
		return GREASE_OK;
	}
}



/**
 * create a log entry for use across the network to Grease.
 * Memory layout: [PREAMBLE][Length (type RawLogLen)][logMeta][logdata - string - no null termination]
 * @param f a pointer to a meta data for logging. If NULL, it will be empty meta data
 * @param s string to log
 * @param len length of the passed in string
 * @param tobuf A raw buffer to store the log output ready for processing
 * @param len A pointer to an int. This will be read to know the existing length of the buffer, and then set
 * the size of the buffer that should be sent
 * @return returns GREASE_OK if successful, or GREASE_NO_BUFFER if the buffer is too small. If parameters are
 * invalid returns GREASE_INVALID_PARAMS
 */
int _grease_logToRaw(const logMeta *f, const char *s, RawLogLen len, char *tobuf, RawLogLen *buflen) {
	if(!tobuf || *buflen < (GREASE_RAWBUF_MIN_SIZE + len))  // sanity check
		return GREASE_NO_BUFFER;
	int w = 0;

	memcpy(tobuf,&__grease_preamble,SIZEOF_SINK_LOG_PREAMBLE);
	w += SIZEOF_SINK_LOG_PREAMBLE;
	int __len = len+sizeof(RawLogLen)+SIZEOF_SINK_LOG_PREAMBLE;
	memcpy(tobuf+w,&__len,sizeof(RawLogLen));
	w += sizeof(RawLogLen);
	if(f)
		memcpy(tobuf+w,f,sizeof(logMeta));
	else
		memcpy(tobuf+w,&__noMetaData,sizeof(logMeta));
	w += sizeof(logMeta);
	if(s && len > 0) {
		memcpy(tobuf+w,s,len);
	}
	*buflen = len;
	return GREASE_OK;
}

#define _GNU_SOURCE
#define __USE_GNU
#include <elf.h>
#include <dlfcn.h>
#include <link.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>



//      static int
//      callback(struct dl_phdr_info *info, size_t size, void *data)
//      {
//          int j;
//
//
//
//          printf("name=%s (%d segments)\n", info->dlpi_name,
//              info->dlpi_phnum);
//
//          for (j = 0; j < info->dlpi_phnum; j++)
//               printf("\t\t header %2d: address=%10p\n", j,
//                   (void *) (info->dlpi_addr + info->dlpi_phdr[j].p_vaddr));
//          return 0;
//      }
//
//
//
//void iterate_plhdr() {
//	found_module = 0;
//	dl_iterate_phdr(callback, NULL);
//}


int grease_logToSink(const logMeta *f, const char *s, RawLogLen len) {
	return GREASE_OK;
}




static int
grease_plhdr_callback(struct dl_phdr_info *info, size_t size, void *data)
{
    char *found = NULL;
    found = strstr(info->dlpi_name,GREASE_LOG_SO_NAME);
//    printf("so: %s\n", info->dlpi_name);
    if(found) {
    	printf("Found greaseLog.node in running process\n");
    	// we know the path of the grease node module .so file, so
    	// open it for our own use...
    	void *lib = dlopen(info->dlpi_name, RTLD_LAZY);
    	if(lib) {
        	void *r = dlsym(lib,"grease_logLocal");
            if(r) {
            	printf("Found symbol for grease_logLocal\n");
            	local_log = r;
            	found_module = 1;
            } else {
            	local_log = NULL;
            }
    	}
    }

//    printf("name=%s (%d segments)\n", info->dlpi_name,
//        info->dlpi_phnum);
//
//    for (j = 0; j < info->dlpi_phnum; j++)
//         printf("\t\t header %2d: address=%10p\n", j,
//             (void *) (info->dlpi_addr + info->dlpi_phdr[j].p_vaddr));
    return 0;
}



int check_grease_symbols() {
	found_module = 0;
	dl_iterate_phdr(grease_plhdr_callback, NULL);
	return found_module;
}


int grease_initLogger() {
	if(check_grease_symbols()) {
		printf("------- Found symbols.\n");
		grease_log = local_log;
		return GREASE_OK;
	} else {
		// TODO setup Sink connection
		grease_log = grease_logToSink;
	}
	return GREASE_OK;
}


