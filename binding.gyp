# This is a generated file, modify: generate/templates/binding.gyp.ejs.
{
  "targets": [
    {
      "target_name": "network",

#      "dependencies": [
#        "<(module_root_dir)/vendor/libgit2.gyp:libgit2"
#      ],

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
        "-std=c++11"
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
