{expect} = require "chai"
utils = require "../utils"
jsdom = require 'mocha-jsdom'
cheerio = require 'cheerio'

ui_events = utils.require "common/ui_events"

describe "ui_events", ->
  describe "_trigger", ->
    jsdom()

    html = '<body><canvas></canvas></body>'
    $ = cheerio.load html

    it "stops propagation of wheel event if scroll gesture is active", ->

      e = new Event "wheel",
        deltaY: 100
        deltaX: 100

      ui_event = new ui_events({
        hit_area: $('canvas')
        tool_manager: gestures: scroll: active: true
      }, testing: true)

      expect(ui_event._trigger('scroll', e)._stopPropagation).to.equal true

    it "propogates wheel event if scroll gesture is nonactive", ->

      e = new Event "wheel",
        deltaY: 100
        deltaX: 100

      ui_event = new ui_events({
        hit_area: $('canvas')
        tool_manager: gestures: scroll: {}
      }, testing: true)

      expect(ui_event._trigger('scroll', e)._stopPropagation).to.equal false
