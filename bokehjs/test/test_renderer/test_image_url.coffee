{expect} = require "chai"
utils = require "../utils"
jsdom = require 'mocha-jsdom'
sinon = require 'sinon'

base = utils.require "common/base"
{Collections} = base

describe "image_url module", ->
  describe "default creation", ->
    i = Collections('ImageURL').create()

    it "should have global_alpha=1.0", ->
      expect(r.get('global_alpha')).to.be.equal 1.0
