const {TSError} = require("ts-node")
const chalk = require("chalk")

function prettyTSError(error) {
  const title = `${chalk.red('⨯')} Unable to compile TypeScript:`
  return `${chalk.bold(title)}\n${error.diagnostics.map((line) => line.message).join('\n')}`
}

module.constructor.prototype.require = function(modulePath) {
  try {
    return this.constructor._load(modulePath, this)
  } catch (err) {
    if (err instanceof TSError) {
      console.error(prettyTSError(err))
      process.exit(1)
    } else
      throw err
  }
}

require("ts-node").register({project: "./gulp/tsconfig.json"});
require("./gulp");
