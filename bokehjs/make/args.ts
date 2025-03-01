import yargs from "yargs"

export const argv = yargs(process.argv.slice(2)).help(false).options({
  // paths
  "build-dir": {type: "string"},
  // lint
  fix: {type: "boolean", default: false},
  // scripts, compiler
  cache: {type: "boolean", default: true},
  // scripts, compiler, test
  rebuild: {type: "boolean", default: false},
  // scripts
  detectCycles: {type: "boolean", default: true},
  // server, test
  host: {type: "string", default: "127.0.0.1"},
  // server
  port: {type: "number", default: 5877},
  inspect: {type: "boolean", default: false},
  // test
  executable: {type: "string", alias: "e"},
  debug: {type: "boolean", default: false},
  keyword: {type: "string", array: true, alias: "k"},
  grep: {type: "string", array: true},
  ref: {type: "string"},
  "baselines-root": {type: "string"},
  randomize: {type: "boolean"},
  seed: {type: "number"},
  pedantic: {type: "boolean"},
  screenshot: {type: "string", choices: ["test", "save", "skip"] as const, default: "test"},
}).parseSync()
