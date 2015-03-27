_ = require "underscore"
$ = require "jquery"

waitForElement = (el, fn) ->
  handler = () =>
    if $.contains(document.documentElement, el)
      clearInterval(interval)
      fn()
  interval = setInterval(handler, 50)

modules.exports =
  waitForElement: waitForElement