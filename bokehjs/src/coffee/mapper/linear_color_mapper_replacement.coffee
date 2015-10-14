_ = require "underscore"
HasProperties = require "../common/has_properties"
SegmentedColorMapper = require "./segmented_color_mapper"

class LinearColorMapperReplacement extends SegmentedColorMapper['Model']

  initialize: (attrs, options) ->
    super(attrs, options)
    @reserve_color = @get('reserve_color')

    console.log('-----')
    console.log(@reserve_color)

    if @reserve_color != null
    	console.log('Got a color')
	    @reserve_color = parseInt(@reserve_color.slice(1), 16)
    	@reserve_val = @get('reserve_val')

  v_map_screen: (data) ->
  	result = super(data)

  	if @reserve_color != null
  		console.log('yes')
  		color = new Uint32Array(result)

  		red = (@reserve_color & 0xff0000) >> 16
  		green = (@reserve_color & 0xff00) >> 8
  		blue = (@reserve_color & 0xff)
  		alpha = 255

  		res_color = 0
  		if @little_endian
  			res_color = (alpha << 24) | (blue << 16) | (green << 8) | (red)
  		else
  			res_color = (blue << 24) | (green << 16) | (red << 8) | (alpha)

  		for i in [0...data.length]
  			d = data[i]
  			if d == @reserve_val
  				color[i] = res_color

  	return result



module.exports =
  Model: LinearColorMapperReplacement