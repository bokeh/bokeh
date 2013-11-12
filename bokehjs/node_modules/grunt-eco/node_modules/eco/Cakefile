require.paths.unshift "#{__dirname}/lib"

task "build", "Build lib/eco/ from src/eco/", ->
  require('child_process').exec 'coffee -co lib src'

task "test", "Run tests", ->
  require.paths.unshift "#{__dirname}/test/lib"
  process.chdir __dirname
  {reporters} = require 'nodeunit'
  reporters.default.run ['test']

task "fixtures", "Generate .coffee fixtures from .eco fixtures", ->
  fs   = require "fs"
  path = require "path"
  dir  = "#{__dirname}/test/fixtures"

  for filename in fs.readdirSync dir
    if path.extname(filename) is ".eco"
      eco          = require "./lib/eco"
      {preprocess} = require "./lib/eco/preprocessor"
      basename     = path.basename filename, ".eco"
      source       = fs.readFileSync "#{dir}/#{filename}", "utf-8"
      fs.writeFileSync "#{dir}/#{basename}.coffee", preprocess source
