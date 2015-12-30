_ = require "underscore"
$ = require "jquery"

waitForElement = (el, fn) ->
  handler = () =>
    if $.contains(document.documentElement, el)
      clearInterval(interval)
      fn()
  interval = setInterval(handler, 50)

# Add css_classes to an element
add_css_classes = (el, css_classes) ->
  for css_class in css_classes
    el.addClass(css_class)

module.exports =
  waitForElement: waitForElement
  add_css_classes: add_css_classes
