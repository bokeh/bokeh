require("source-map-support").install()

// XXX: Patch jsdom/utils before importing main jsdom. Otherwise
//      HTMLCanvasElement will detect no canvas and make tests
//      fail with "unable to obtain 2D rendering context".
const utils = require('jsdom/lib/jsdom/utils')
if (utils.Canvas == null) {
  class Canvas {
    constructor(readonly width: number, readonly height: number) {}

    getContext(_contextType: string): any {
      return {
        beginPath()   { return null },
        clearRect()   { return null },
        clip()        { return null },
        drawImage()   { return null },
        fillRect()    { return null },
        fillText()    { return null },
        lineTo()      { return null },
        measureText() { return { width: 1, ascent: 1} },
        moveTo()      { return null },
        rect()        { return null },
        restore()     { return null },
        rotate()      { return null },
        save()        { return null },
        scale()       { return null },
        stroke()      { return null },
        strokeRect()  { return null },
        translate()   { return null },
      }
    }
  }

  utils.Canvas = Canvas
}

const jsdom = require('jsdom').jsdom

const _global: any = global

_global.document = jsdom()
_global.window = document.defaultView

const blacklist = Object.keys(_global)
blacklist.push('constructor')
blacklist.push('console')
blacklist.push('Console')

for (const key in _global.window) {
  if (_global.window.hasOwnProperty(key)) {
    if (blacklist.indexOf(key) == -1) {
      const val = _global.window[key]
      _global[key] = val
    }
  }
}

_global.HTMLElement = _global.window.HTMLElement
_global.Event = _global.window.Event
_global.Image = _global.window.Image
_global.atob = require("atob")
_global.btoa = require("btoa")
