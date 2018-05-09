{expect} = require "chai"

{OpenURL} = require("models/callbacks/open_url")

describe "OpenURL", ->

  describe "default creation", ->
    r = new OpenURL()

    it "should have default url", ->
      expect(r.url).to.be.deep.equal 'http://'

  describe "execute method", ->

    it "should execute get the url for the selected 1d indice"
