// Configure the bridge's Go runtime before Volar loads its compiler API.
require("typescript-native-bridge/lib/tnb-godebug.js")
// Select the TS7 bridge explicitly without replacing other tools' TypeScript.
require("vue-tsc").run(require.resolve("typescript-native-bridge/lib/tsc"))
