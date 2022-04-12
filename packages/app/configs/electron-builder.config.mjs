/* eslint-disable no-template-curly-in-string */

const TARGET_PLATFORMS_configs = {
  mac: {
    mac: ['dmg:x64', 'dmg:arm64'],
  },
  win: {
    win: ['nsis:ia32', 'nsis:x64'],
  },
  all: {
    mac: ['dmg:x64', 'dmg:arm64'],
    // linux: ['AppImage:x64', 'deb:x64'],
    win: ['nsis:ia32', 'nsis:x64'],
  },
}

let targets = TARGET_PLATFORMS_configs.all

if (process.env.MAKE_FOR === 'mac') {
  targets = TARGET_PLATFORMS_configs.mac
} else if (process.env.MAKE_FOR === 'win') {
  targets = TARGET_PLATFORMS_configs.win
}

/**
 * @type {import('electron-builder').Configuration}
 */
const config = {
  appId: "com.avalon.fastDev",
  asar: true,
  directories: {
    output: "../../release",
    app: 'dist',
    buildResources: 'public',
  },
  mac: {
    icon: 'assets/icons/icon.icns',
    identity: null,
    target: [
      "dmg"
    ]
  },
  dmg: {
    artifactName: '${productName}_mac_${arch}_${version}.${ext}'
  },
  win: {
    icon: 'assets/icons/icon.ico'
  },
  portable: undefined,
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    artifactName: '${productName}_installer_${arch}_${version}.${ext}'
  }
}

export { config, targets }
