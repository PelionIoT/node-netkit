{
  "targets": [
    {
      "target_name": "netkit",


      "conditions": [
        [
          "OS=='mac'", {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "WARNING_CFLAGS": [
                "-Wno-unused-variable",
              ],
            }
          }
        ],

        [
          "OS=='linux'", {
      "sources": [
        "src/tuninterface.cc",
        "src/network.cc",
        "src/network-common.cc",
        "src/netlinksocket.cc",
        "src/interface_funcs.cc",
        "src/error-common.cc"
      ],

    'configurations': {
      'Debug': {
        'defines': [ 'ERRCMN_DEBUG_BUILD' ],
        "cflags": [
          "-Wall",
          "-std=c++11",
          "-D_POSIX_C_SOURCE=200809L",
          "-DERRCMN_DEBUG_BUILD=1"
          ],
##        'conditions': [
##          ['target_arch=="x64"', {
##            'msvs_configuration_platform': 'x64',
##          }],
##        ]
        "include_dirs": [
           "deps/twlib/include",
           "<!(node -e \"require('nan')\")"
        ],

      },
      'Release': {
        "cflags": [
          "-Wall",
          "-std=c++11",
          "-D_POSIX_C_SOURCE=200809L",
          "-DNO_ERROR_CMN_OUTPUT=1",
          ],
        "include_dirs": [
           "deps/twlib/include",
           "node_modules/nan"
        ],

      }

    },



          }
        ],  # end Linux




      ]
    },
  ],
}
