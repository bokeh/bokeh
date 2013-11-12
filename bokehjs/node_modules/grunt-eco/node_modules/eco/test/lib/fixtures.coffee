fs = require "fs"

exports.fixture = (filename) ->
  fs.readFileSync __dirname + "/../fixtures/" + filename, "utf-8"
