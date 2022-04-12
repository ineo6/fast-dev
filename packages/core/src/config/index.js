const path = require("path");

function getUserBasePath() {
  const userHome = process.env["USERPROFILE"] || process.env["HOME"] || "/";
  return path.resolve(userHome, "./.fast-dev");
}

function getRootCaCertPath() {
  return path.join(getUserBasePath(), "/fast-dev.crt");
}

function getRootCaKeyPath() {
  return path.join(getUserBasePath(), "/fast-dev.pem");
}

export default {
  app: {
    mode: "default",
    autoStart: {
      enabled: false
    },
    remoteConfig: {
      enabled: true,
      url:
        "https://gitee.com/ineo6/fast-dev/raw/master/packages/core/src/config/remote_config.json"
    },
    dock: {
      hideWhenWinClose: false
    }
  },
  server: {
    enabled: true,
    port: 1181,
    setting: {
      NODE_TLS_REJECT_UNAUTHORIZED: true,
      verifySsl: true,
      userBasePath: getUserBasePath(),
      rootCaFile: {
        certPath: getRootCaCertPath(),
        keyPath: getRootCaKeyPath()
      }
    },
    // 拦截
    intercept: {
      enabled: true
    },
    forward: {
      enabled: false,
      host: "127.0.0.1",
      port: 12888
    },
    // 默认拦截规则
    intercepts: {
      "github.com": {
        "/.*": {
          proxy: "github.com",
          sni: "baidu.com"
        }
      },
      "github-releases.githubusercontent.com": {
        ".*": {
          proxy: "github-releases.githubusercontent.com",
          sni: "baidu.com"
        }
      },
      "raw.githubusercontent.com": {
        ".*": {
          proxy: "raw.githubusercontent.com",
          sni: "baidu.com"
        }
      },
      "user-images.githubusercontent.com": {
        ".*": {
          proxy: "user-images.githubusercontent.com",
          sni: "baidu.com"
        }
      },
      "avatars.githubusercontent.com": {
        ".*": {
          proxy: "avatars.githubusercontent.com",
          sni: "baidu.com"
        }
      },
      // google cdn
      "www.google.com": {
        "/recaptcha/.*": { proxy: "www.recaptcha.net" }
      },
      "ajax.googleapis.com": {
        ".*": {
          proxy: "ajax.lug.ustc.edu.cn",
          backup: ["cdn.bootcdn.net"],
          test: "ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"
        }
      },
      "fonts.googleapis.com": {
        ".*": {
          proxy: "fonts.geekzu.org",
          backup: ["fonts.loli.net"],
          test: "https://fonts.googleapis.com/css?family=Oswald"
        }
      },
      "themes.googleapis.com": {
        ".*": {
          proxy: "themes.loli.net",
          backup: ["themes.proxy.ustclug.org"]
        }
      },
      "themes.googleusercontent.com": {
        ".*": { proxy: "google-themes.proxy.ustclug.org" }
      },
      "clients*.google.com": { ".*": { abort: false } },
      "www.googleapis.com": { ".*": { abort: false } },
      "lh*.googleusercontent.com": { ".*": { abort: false } }
    },
    whiteList: {
      "apple.com": true,
      "*.apple.com": true,
      "microsoft.com": true,
      "*.microsoft.com": true
    },
    dns: {
      providers: {
        aliyun: {
          type: "https",
          server: "https://dns.alidns.com/dns-query",
          cacheSize: 1000
        },
        usa: {
          type: "https",
          server: "https://1.1.1.1/dns-query",
          cacheSize: 1000
        },
        quad9: {
          type: "https",
          server: "https://9.9.9.9/dns-query",
          cacheSize: 1000
        },
        rubyfish: {
          type: "https",
          server: "https://rubyfish.cn/dns-query",
          cacheSize: 1000
        }
      },
      mapping: {
        "*githubusercontent.com": "quad9",
        "*cloudfront.net": "quad9",
        "*cloudflare.com": "quad9",
        "*github.io": "quad9",
        "img.shields.io": "quad9",
        "*.githubusercontent.com": "quad9",
        "*.githubassets.com": "quad9",
        "github.com": "quad9",
        "*github.com": "quad9",
        "*v2ex.com": "quad9"
      },
      // 测速
      speedTest: {
        enabled: true,
        interval: 60000,
        hostnameList: ["github.com"],
        dnsProviders: ["usa", "quad9", "rubyfish"]
      }
    }
  },
  proxy: {},
  plugin: {}
};
