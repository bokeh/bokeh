{expect} = require "chai"
utils = require "../utils"
jsdom = require 'mocha-jsdom'
cheerio = require 'cheerio'
sinon = require 'sinon'

ui_events = utils.require "common/ui_events"


describe "ui_events", ->
  jsdom()
  
  html = '<body><canvas></canvas></body>'
  $ = cheerio.load html

  beforeEach ->
    e = new Event "wheel",

    deltaY: 100
    deltaX: 100
    e.bokeh = {}
    
    @preventDefault = sinon.spy(e, "preventDefault")
    @stopPropagation = sinon.spy(e, "stopPropagation")
    @e = e

    @ui_event = new ui_events({
      hit_area: $('canvas')
      tool_manager: gestures: scroll: active: true
    }, testing: true)

  describe "_trigger_scroll", ->

    it "should stopPropagation & preventDefault of event if scroll gesture is active", ->

      @ui_event._trigger 'scroll', @e
      expect(@stopPropagation.callCount).to.equal 1
      expect(@preventDefault.callCount).to.equal 1

    it "should not stopPropagation & preventDefault of event if scroll gesture is not active", ->

      ui_event = new ui_events({
        hit_area: $('canvas')
        tool_manager: gestures: scroll: {}
      }, testing: true)

      ui_event._trigger 'scroll', @e
      expect(@stopPropagation.callCount).to.equal 0
      expect(@preventDefault.callCount).to.equal 0

  describe "_mouse_wheel", ->

    it "should not stop propagation or prevent default of event", ->
      # This is handled by _trigger function depending on tool state

      sinon.stub(@ui_event, "_bokify_jq")  # Stub out _bokify_jq as not testing it
      sinon.stub(@ui_event, "_trigger")  # Stub out _trigger as not testing it

      @ui_event._mouse_wheel @e, {}
      expect(@stopPropagation.callCount).to.equal 0
      expect(@preventDefault.callCount).to.equal 0
