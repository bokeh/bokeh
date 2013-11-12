eco       = require "eco"
{fixture} = require "fixtures"

module.exports =
  "requiring eco templates as modules": (test) ->
    require.paths.unshift __dirname + "/fixtures"

    hello = require "hello.eco"
    test.ok typeof hello is "function"
    test.same fixture("hello.out.1"), hello name: "Sam"

    test.done()

