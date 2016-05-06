'use strict';

var util = require('util');
var cmn = require('../libs/common.js');
//var types = require('./qcs_types.js');

var transform = (function(){

    return {
        get_station: function(opt) {
            // opt.station.connectedtime = opt.station.connectedtime + " seconds";
            // opt.station.inactivetime = opt.station.inactivetime + " millseconds";
            // delete opt.station.bitrate32;
            // opt.station.bitrate = opt.station.bitrate / 10 + " MBits/s";
            return opt;
        },

    };
})();

module.exports  = transform;