const {join} = require("path")
const {register} = require("ts-node")
const tsconfig_paths = require("tsconfig-paths")

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

register({project: join(__dirname, "tsconfig.json"), cache: false, logError: true})

tsconfig_paths.register({
  baseUrl: __dirname,
  paths: {
    "core/*": ["../lib/core/*"],
  },
})

require("./server")
