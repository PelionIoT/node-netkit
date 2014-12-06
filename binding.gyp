# This is a generated file, modify: generate/templates/binding.gyp.ejs.
{
  "targets": [
    {
      "target_name": "netkit",

      "sources": [
        "tuninterface.cc",
        "network.cc",
        "network-common.cc"
      ],

#      "include_dirs": [
#
#      ],

      "cflags": [
        "-Wall",
        "-std=c++11",
        "-D_POSIX_C_SOURCE=200809L"  
      ],

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
        ]
      ]
    },
  ]
}
