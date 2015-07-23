{expect} = require "chai"
utils = require "../utils"

DevelopShell = utils.require "develop/developshell"

describe "DevelopShell", ->
  it "should be creatable and have default properties", ->
    ds = new DevelopShell.Model()
    expect(ds.get "error_panel").to.exist
    expect(ds.get "reloading").to.exist
    expect(ds.get("error_panel").get "visible").to.equal false
    expect(ds.get("error_panel").get "error").to.equal ""
    expect(ds.get("reloading").get "visible").to.equal false
