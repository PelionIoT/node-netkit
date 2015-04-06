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
        "tuninterface.cc",
        "network.cc",
        "network-common.cc",
        "netlinksocket.cc",
        "interface_funcs.cc",
        "error-common.cc",
        "grease_client.c",
      ],

      "include_dirs": [
         "deps/twlib/include"
      ],


    'configurations': {
      'Debug': {
        'defines': [ 'ERRCMN_DEBUG_BUILD' ],
        "cflags": [
          "-Wall",
          "-std=c++11",
          "-D_POSIX_C_SOURCE=200809L",
          "-DERRCMN_DEBUG_BUILD=1",
          "-DGREASE_DISABLE"
          ],
##        'conditions': [
##          ['target_arch=="x64"', {
##            'msvs_configuration_platform': 'x64',
##          }],
##        ]
      },
      'Release': {
        "cflags": [
          "-Wall",
          "-std=c++11",
          "-D_POSIX_C_SOURCE=200809L",
          "-DNO_ERROR_CMN_OUTPUT=1",
          ],
      }

    },



          }
        ],  # end Linux




      ]
    },
  ],
}
