_ = require "underscore"

{logger} = require "../../core/logging"
p = require "../../core/properties"
ImageSource = require "./image_source"

class WMSImageSource extends ImageSource.Model
  type: 'WMSImageSource'

  props: ->
    return _.extend {}, super(), {
      request:        [ p.String, 'GetMap']
      version:        [ p.String, '1.1.1']
      layers:         [ p.String, '']
      styles:         [ p.String, '']
      f:              [ p.String, 'image/jpeg']
      transparent:    [ p.Bool, true]
      crs:            [ p.String, null]
      attribution:    [ p.String, '']
    }

  get_image_url: (xmin, ymin, xmax, ymax, height, width) ->
    image_url = @string_lookup_replace(@get('url'), @get('extra_url_vars'))
    bbox = [xmin, ymin, xmax, ymax].join(',')

    service_url = image_url + '?bbox={BBOX}'
    service_url +=  '&width={WIDTH}'
    service_url +=  '&height={HEIGHT}'
    service_url +=  '&request={REQUEST}'
    service_url +=  '&version={VERSION}'
    service_url +=  '&layers={LAYERS}'
    service_url +=  '&styles={STYLES}'
    service_url +=  '&format={FORMAT}'
    service_url +=  '&transparent={TRANSPARENT}'
    service_url +=  '&crs={CRS}'

    return service_url.replace("{BBOX}", bbox)
		      .replace("{WIDTH}", width)
		      .replace("{HEIGHT}", height)
		      .replace("{REQUEST}", @get('request'))
		      .replace("{VERSION}", @get('version'))
		      .replace("{LAYERS}", @get('layers'))
		      .replace("{STYLES}", @get('styles'))
		      .replace("{FORMAT}", @get('f'))
		      .replace("{TRANSPARENT}", @get('transparent').toString())
		      .replace("{CRS}", @get('crs'))

module.exports =
  Model : WMSImageSource
