_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
base = utils.require "common/base"
DynamicImageRenderer = utils.require "renderer/tile/dynamic_image_renderer"
ImageSource = utils.require "renderer/tile/image_source"

describe "dynamic image renderer", ->

  describe "image source", ->

    it "should handle case-insensitive url parameters (template url)", ->
      image_options =
        url : 'http://test/{height}/{width}/{xmin}/{ymin}/{xmax}/{ymax}.png'

      expect_url = 'http://test/5/6/1/2/3/4.png'
      image_source = new ImageSource.Model(image_options)
      expect(image_source.get_image_url(1,2,3,4,5,6)).to.be.equal(expect_url)
   
    it "should successfully set extra_url_vars property", ->

      test_extra_url_vars =
        test_key : 'test_value'
        test_key2 : 'test_value2'

      image_options =
        url : 'http://{test_key}/{test_key2}/{XMIN}/{YMIN}/{XMAX}/{YMAX}.png'
        extra_url_vars : test_extra_url_vars

      image_source = new ImageSource.Model(image_options)
      expect_url = 'http://test_value/test_value2/0/0/0/0.png'
      expect(image_source.get('extra_url_vars')).to.have.any.keys('test_key')
      expect(image_source.get('extra_url_vars')).to.have.any.keys('test_key2')
      formatted_url = image_source.get_image_url(0,0,0,0,0,0)
      expect(formatted_url).to.be.equal(expect_url)

