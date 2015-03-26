Collection = require "../common/collection"
Transform = require "./transform"

class Log extends Transform
  type: "Log"

class Logs extends Collection
  model: Log

module.exports =
  Model: Log
  Collection: new Logs()