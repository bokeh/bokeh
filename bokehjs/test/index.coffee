# XXX: Patch jsdom/utils before importing main jsdom. Otherwise
#      HTMLCanvasElement will detect no canvas and make tests
#      fail with "unable to obtain 2D rendering context".
utils = require('jsdom/lib/jsdom/utils')
if not utils.Canvas?
  class Canvas
    constructor: (@width, @height) ->

    getContext: (contextType) ->
      return {
        beginPath:   () -> return null
        clearRect:   () -> return null
        clip:        () -> return null
        drawImage:   () -> return null
        fillRect:    () -> return null
        fillText:    () -> return null
        lineTo:      () -> return null
        measureText: () -> return {width: 1, ascent: 1}
        moveTo:      () -> return null
        rect:        () -> return null
        restore:     () -> return null
        rotate:      () -> return null
        save:        () -> return null
        scale:       () -> return null
        stroke:      () -> return null
        strokeRect:  () -> return null
        translate:   () -> return null
      }

  utils.Canvas = Canvas

jsdom = require('jsdom').jsdom

global.document = jsdom()
global.window = document.defaultView

blacklist = Object.keys(global)
blacklist.push('constructor')

for own key, val of global.window
  if blacklist.indexOf(key) == -1
    global[key] = val

global.HTMLElement = global.window.HTMLElement
global.Event = global.window.Event
global.Image = global.window.Image
global.atob = require "atob"
global.btoa = require "btoa"
