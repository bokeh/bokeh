HasProperties = require('../base').HasProperties


class ViewState extends HasProperties

  initialize: (attrs, options)->
    super(attrs, options)

    @register_property('canvas_aspect',
       () -> @get('canvas_height') / @get('canvas_width')
      , false)
    @add_dependencies('canvas_aspect', this, ['canvas_height', 'canvas_width'])

    @register_property('outer_aspect',
       () -> @get('outer_height') / @get('outer_width')
      , false)
    @add_dependencies('outer_aspect', this, ['outer_height', 'outer_width'])

    @register_property('inner_width',
        () -> @get('outer_width') - @get('border_left') - @get('border_right')
      , false)
    @add_dependencies('inner_width', this, ['outer_width', 'border_left', 'border_right'])

    @register_property('inner_height',
       () -> @get('outer_height') - @get('border_top') - @get('border_bottom')
      , false)
    @add_dependencies('inner_height', this, ['outer_height', 'border_top', 'border_bottom'])

    @register_property('inner_aspect',
       () -> @get('inner_height') / @get('inner_width')
      , false)
    @add_dependencies('inner_aspect', this, ['inner_height', 'inner_width'])

  # transform our coordinate space to the underlying device (svg)
  sx_to_device: (x) ->
    return x
  sy_to_device: (y) ->
    return @get('canvas_height') - y

  # vectorized versions of xpos/ypos, these are mutating, in-place operations
  v_sx_to_device: (xx) ->
    return xx
  v_sy_to_device: (yy) ->
    canvas_height = @get('canvas_height')
    res = new Array(yy.length)
    for y, idx in yy
      yy[idx] = canvas_height - y
    return yy

  # transform underlying device (svg) to our coordinate space
  device_to_sx: (x) ->
    return x
  device_to_sy: (y) ->
    return @get('canvas_height') - y

  # vectorized versions of rxpos/rypos, these are mutating, in-place operations
  v_device_to_sx: (xx) ->
    return xx
  v_device_to_sy: (yy) ->
    canvas_height = @get('canvas_height')
    for y, idx in yy
      yy[idx] = canvas_height - y
    return yy


exports.ViewState = ViewState
