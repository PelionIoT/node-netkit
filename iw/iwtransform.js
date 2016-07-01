'use strict';

var util = require('util');
var cmn = require('../libs/common.js');
//var types = require('./qcs_types.js');

var transform = (function(){

    return {
        get_station: function(opt) {
            //console.log(util.inspect(opt,{depth:null}));
            var ret;
            ret  = opt.payload.params.stainfo;

            ret.ifname = cmn.nativelib.ifIndexToName(opt.payload.params.ifindex);
            ret.mac_addr = opt.payload.params.mac;

            ret.tx_bytes = ret.txbytes || ret.txbytes64;
            ret.rx_bytes = ret.rxbytes || ret.rxbytes64;
            delete ret.txbytes;
            delete ret.rxbytes;
            delete ret.txbytes64;
            delete ret.rxbytes64;

            ret.rx_packets = ret.rxpackets;
            ret.tx_packets = ret.txpackets;
            delete ret.txpackets;
            delete ret.rxpackets;

            ret.tx_retries = ret.txretries;
            ret.tx_failed = ret.txfailed;
            delete ret.txretries;
            delete ret.txfailed;

            delete ret.txbitrate;
            delete ret.rxbitrate;
            delete ret.signalavg;

            delete ret.connectedtime;
            delete ret.inactivetime;
            delete ret.beaconloss;
            delete ret.rxdropmisc;
            delete ret.tx_retries;


            return ret;
        },

        get_interface: function(opt) {
            opt = opt.payload.interface;
            if(typeof opt.ifindex === 'undefined' ) {
                return null;
            }
            return opt;
        }
    };
})();

module.exports  = transform;