{expect} = require "chai"
utils = require "../../utils"

OpenURL = utils.require("models/callbacks/open_url").Model

describe "openurl module", ->

  describe "default creation", ->
    r = new OpenURL()

    it "should have default url", ->
      expect(r.get('url')).to.be.deep.equal 'http://'

  describe "execute method", ->

    it "should execute get the url for the selected 1d indice"
