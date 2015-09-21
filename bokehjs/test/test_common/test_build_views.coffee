{expect} = require "chai"
utils = require "../utils"
cheerio = require 'cheerio'

build_views = utils.require "common/build_views"

describe "build_views", ->
  describe "jQueryUIPrefixer", ->
    it "does nothing if no ui-* classes are detected", ->
      classList = "foo bar"
      expect(build_views.jQueryUIPrefixer classList).to.equal "foo bar"
    it "should replace all ui-* classes with bk-ui- prefix", ->
      classList = "foo ui-bar"
      expect(build_views.jQueryUIPrefixer classList).to.equal "foo bk-ui-bar"
    it "should only match ui-prefixes and ignore all other ui- values", ->
      classList = "bar-ui-in-the-middle"
      expect(build_views.jQueryUIPrefixer classList).to.equal "bar-ui-in-the-middle"

  describe "traverse_views", ->
    it "does nothing if no elements within the el have ui-* classes", ->
      html = '<body><div class="foo"><div class="bar"></div></div></body>'
      $ = cheerio.load html
      build_views.traverse_views($('body'), $)
      expect($.html()).to.equal html

    it "prepends bk- to ui-* classes within the el", ->
      html = '<body><div class="foo"><div class="bk-ui-bar"></div></div></body>'
      $ = cheerio.load '<body><div class="foo"><div class="ui-bar"></div></div></body>'
      build_views.traverse_views($('body'), $)
      expect($.html()).to.equal html
