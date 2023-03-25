import os = require("os")

export const platform = (() => {
  const platform = os.platform()
  switch (platform) {
    case "linux": return "linux"
    case "darwin": return "macos"
    case "win32": return "windows"
    default:
      console.warn(`unsupported platform '${platform}', assuming 'linux'`)
      return "linux"
  }
})()
