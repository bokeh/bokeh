const {register} = require("ts-node")
const {argv} = require("yargs")

process.on('uncaughtException', function(err) {
  console.error(err)
  process.exit(1)
})

register({project: "./test/devtools/tsconfig.json", cache: false, logError: true})

if (require.main != null) {
  if (argv._[0] == "server")
    require("./server")
  else
    require("./devtools")
}
