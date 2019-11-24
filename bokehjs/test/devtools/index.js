const {register} = require("ts-node")

process.on('uncaughtException', function(err) {
  console.error(err)
  process.exit(1)
})

register({project: "./test/devtools/tsconfig.json", cache: false, logError: true})

if (require.main != null)
  require("./devtools")
