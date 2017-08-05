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
