// WigWag LLC
// (c) 2011
// tw_time.cpp
// Author: ed
// Mar 22, 2011/*
// Mar 22, 2011 * tw_time.cpp
// Mar 22, 2011 *
// Mar 22, 2011 *  Created on: Mar 22, 2011
// Mar 22, 2011 *      Author: ed
// Mar 22, 2011 */


#include <TW/tw_utils.h>
#include <TW/tw_sema.h>
#include <stdio.h>
#include <string>
#include <sstream>
#include <iostream>

struct timeval* TWlib::usec_to_timeval( int64_t usec, struct timeval* tv ) {
	tv->tv_sec = usec / 1000000 ;
	tv->tv_usec = usec % 1000000 ;
	return tv ;
}

struct timeval* TWlib::add_usec_to_timeval( int64_t usec, struct timeval* tv ) {
    tv->tv_sec += usec / 1000000 ;
    tv->tv_usec += usec % 1000000 ;

//    tv.tv_sec = tv1.tv_sec + tv2.tv_sec ;  // add seconds
 //   tv.usec = tv1.tv_usec + tv2.tv_usec ; // add microseconds
//    tv->tv_sec += tv.tv_usec / 1000000 ;  // add microsecond overflow to seconds
//   tv->tv_usec %= 1000000 ; // subtract the overflow from microseconds
    return tv;
}

struct timespec *TWlib::timeval_to_timespec(struct timeval *tv, struct timespec *ts) {
	ts->tv_sec = tv->tv_sec;
	ts->tv_nsec = tv->tv_usec * 1000;
	ts->tv_sec += ts->tv_nsec / 1000000000L;
	ts->tv_nsec %= 1000000000L;
	return ts;
}

char *TWlib::convInt( char *s, int v, size_t max ) {
	snprintf(s,max,"%d",v);
	return s;
}

char *TWlib::convIntHex( char *s, unsigned int v, size_t max ) {
	snprintf(s,max,"%x",v);
	return s;
}

long TWlib::getLWP() {
	return _TW_getLWPnum();
}

using namespace std;

/**
 * Does a dump to a stirng of a specified memory range, as a list of bytes shown as hex numbers.
 * @param head
 * @param size
 * @param out Pass it an empty C++ string
 */
string &TWlib::hexDumpToString(char *head, int size, string &out) {
	ostringstream outs;
	out.clear();
	outs.str(out);
	outs << "DUMP(" << size;
	outs.setf(ios_base::hex,ios_base::basefield);
	char *walkp = head;
	char *endptr = head + size;
	outs << ")[";
	bool first = true;
	while(walkp < endptr) {
		if (!first) outs << ",";
		outs << ((int)*walkp);
		first = false;
		walkp++;
	}
	outs << "]";

	out = outs.str();
	return out;
}

namespace TWlib {
	TWlib::TW_Mutex string_conf_mutex;
	char string_conv_buf[MAX_STRING_CNV_BUF];
}

string &TWlib::string_printf(string &fillme, const char *fmt, ... ) {
//	   memset(textString, '\0', sizeof(textString));
		fillme.clear();
	    va_list args;
	    string_conf_mutex.acquire();  // make the buffer protected for multiple threads
	    va_start ( args, fmt );
	    vsnprintf ( TWlib::string_conv_buf, MAX_STRING_CNV_BUF, fmt, args );
	    va_end ( args );
//	    std::string retStr = textString;
	    fillme.append(TWlib::string_conv_buf);
	    string_conf_mutex.release();
	    return fillme;
}

/*
 * This code from
 * http://www.azillionmonkeys.com/qed/hash.html
 * This function (data_hash_, and this function only are licensed under LGPL. See web page for details.
 */
//#include "pstdint.h" /* Replace with <stdint.h> if appropriate */
//#undef get16bits
//#if (defined(__GNUC__) && defined(__i386__)) || defined(__WATCOMC__) \
//  || defined(_MSC_VER) || defined (__BORLANDC__) || defined (__TURBOC__)
#define get16bits(d) (*((const uint16_t *) (d)))
//#endif

//#if !defined (get16bits)
//#define get16bits(d) ((((uint32_t)(((const uint8_t *)(d))[1])) << 8)\
 //                      +(uint32_t)(((const uint8_t *)(d))[0]) )
//#endif

uint32_t TWlib::data_hash_Hsieh (const char * data, int len) {
uint32_t hash = len, tmp;
int rem;

    if (len <= 0 || data == NULL) return 0;

    rem = len & 3;
    len >>= 2;

    /* Main loop */
    for (;len > 0; len--) {
        hash  += get16bits (data);
        tmp    = (get16bits (data+2) << 11) ^ hash;
        hash   = (hash << 16) ^ tmp;
        data  += 2*sizeof (uint16_t);
        hash  += hash >> 11;
    }

    /* Handle end cases */
    switch (rem) {
        case 3: hash += get16bits (data);
                hash ^= hash << 16;
                hash ^= data[sizeof (uint16_t)] << 18;
                hash += hash >> 11;
                break;
        case 2: hash += get16bits (data);
                hash ^= hash << 11;
                hash += hash >> 17;
                break;
        case 1: hash += *data;
                hash ^= hash << 10;
                hash += hash >> 1;
    }

    /* Force "avalanching" of final 127 bits */
    hash ^= hash << 3;
    hash += hash >> 5;
    hash ^= hash << 4;
    hash += hash >> 17;
    hash ^= hash << 25;
    hash += hash >> 6;

    return hash;
}

