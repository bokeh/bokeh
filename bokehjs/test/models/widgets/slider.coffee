{expect} = require "chai"

{Slider} = require("models/widgets/slider")
{Document} = require("document")

describe "SliderView", ->

  it "_calc_from should return integer if start/end/step all integers", ->
    s = new Slider({start:0, end:10, step:1})
    s.attach_document(new Document())
    sv = new s.default_view({model: s, parent: null})

    r = sv._calc_from([5.0])
    expect(r).to.be.equal 5
    expect(Number.isInteger(r)).to.be.true
