{expect} = require "chai"
utils = require "../utils"
sinon = require 'sinon'

base = utils.require "common/base"
{Collections} = base

describe "image_url renderer", ->
  describe "default creation", ->
    r = Collections('ImageURL').create()

    it "should have global_alpha=1.0", ->
      expect(r.get('global_alpha')).to.be.equal 1.0

    it "should have retry_attempts=0", ->
      expect(r.get('retry_attempts')).to.be.equal 0

    it "should have retry_timeout=0", ->
      expect(r.get('retry_timeout')).to.be.equal 0
