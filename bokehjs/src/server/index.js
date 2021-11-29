const {register} = require("ts-node")

process.on('uncaughtException', function(err) {
  console.error(err)
  process.exit(1)
})

// XXX: assumes running from bokehjs/
register({project: "./src/server/tsconfig.json", cache: false, logError: true})

require("./server")
