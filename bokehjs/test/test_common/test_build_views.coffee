{expect} = require "chai"
utils = require "../utils"

build_views = utils.require "common/build_views"

describe "build_views", ->
  describe "jQueryUIPrefixer", ->
    it "does nothing if no ui-* classes are detected", ->
      el =
        className: "foo bar"
      expect(build_views.jQueryUIPrefixer el).to.equal "foo bar"
    it "should replace all ui-* classes with bk-ui- prefix", ->
      el =
        className: "foo ui-bar"
      expect(build_views.jQueryUIPrefixer el).to.equal "foo bk-ui-bar"
    it "should only match ui-prefixes and ignore all other ui- values", ->
      el =
        className: "bar-ui-in-the-middle"
      expect(build_views.jQueryUIPrefixer el).to.equal "bar-ui-in-the-middle"
