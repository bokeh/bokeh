class ImagePool

  constructor: () ->
    @images = []

  pop: () ->
    img = @images.pop()
    if img?
      return img
    else
      return new Image()

  push: (img) ->

    if @images.length > 50
      return

    if img.constructor == Array
      Array::push.apply(@images, img)
    else
      @images.push(img)

module.exports = ImagePool
