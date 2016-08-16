{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

Image = utils.require("models/glyphs/image").Model
ImageView = utils.require("models/glyphs/image").View
{Blues} = utils.require("palettes/palettes")

describe "image module", ->

  describe "ImageView._events", ->

    it "Changing color_mapper attr should call `_update_image` method on view", ->
      spy = sinon.spy(ImageView.prototype, "_update_image")

      image = new Image()

      image_view = new image.default_view({
        model: image
        plot_model: null
        plot_view: null
      })

      image.color_mapper.palette = Blues.Blues9

      expect(spy.called).to.be.true
