_ = require "underscore"

{logger} = require "../../core/logging"
p = require "../../core/properties"
Model = require "../../model"

class ImageSource extends Model
  type: 'ImageSource'

  @define {
      url:            [ p.String, '' ]
      extra_url_vars: [ p.Any,    {} ]
    }

  constructor: (options={}) ->
    super
    @images = {}
    @normalize_case()

  normalize_case:() ->
    '''Note: should probably be refactored into subclasses.'''
    url = @get('url')
    url = url.replace('{xmin}','{XMIN}')
    url = url.replace('{ymin}','{YMIN}')
    url = url.replace('{xmax}','{XMAX}')
    url = url.replace('{ymax}','{YMAX}')
    url = url.replace('{height}','{HEIGHT}')
    url = url.replace('{width}','{WIDTH}')
    @set('url', url)

  string_lookup_replace: (str, lookup) ->
    result_str = str
    for key, value of lookup
      result_str = result_str.replace('{'+key+'}', value.toString())
    return result_str

  add_image: (image_obj) ->
    @images[image_obj.cache_key] = image_obj

  remove_image: (image_obj) ->
    delete @images[image_obj.cache_key]

  get_image_url: (xmin, ymin, xmax, ymax, height, width) ->
    image_url = @string_lookup_replace(@get('url'), @get('extra_url_vars'))
    return image_url.replace("{XMIN}", xmin).replace("{YMIN}", ymin).replace("{XMAX}", xmax).replace("{YMAX}", ymax).replace("{WIDTH}", width).replace("{HEIGHT}", height)

module.exports =
  Model : ImageSource
