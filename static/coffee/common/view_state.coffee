base = require('../base')
Range1d = require('../common/ranges').Range1d

Collections   = base.Collections
HasProperties = base.HasProperties


# ViewState objects encapsulate all the information needed to translate to and from
# raw device coordinates and screen coordinates for a plot subregion with (0,0) in
# the lower left hand corner.
#
# The location of the data origin is controlled upstream by ranges and mappers that
# translate from data coordinates to screen coordinates.
#
# The border values control the padding around the main plot region. This space can
# be used to draw axes, titles, or other guides.
#
# x_offset and y_offset can be used if there are multiple plot-like objects embedded
# on a single canvas. The common case of one plot-like object with a border will have
# x_offset and y_offset both zero.
#
#
#                                      .---------------------------- inner_width
#                                      .
#                                      .
#                                      .     .---------------------- outer_width
#                                      .     .
#                                      .     .
#                                      .     .       .-------------- canvas_width
#                                      .     .       .
#                                      .     .       V
#              ==================================================
#              |                       .     .                  |
#              |                       .     .                  |
#              |                       .     V                  |
#              |       ===================================      |
#              |       |        *      .                 |      |
# border_top --|-------|------->*      .              .--|------|--- border right
#              |       |        *      V              .  |      |
#              |       |     -----------------------  .  |      |
#              |       |     |                     |  V  |      |
#              |       |     |                     |* * *|      |<-- canvas_height
#              |       |     |                     |     |      |
#              |       |     |     inner           |     |      |
# border_left -|-------|--.  |     clip            |     |<-----|--- inner_height
#              |       |  .  |                     |     |      |
#              |       |  V  |                     |     |      |
#              |       |* * *|                     |     |      |
#              |       |     |                     |<----|------|--- outer_height
#              |       |     |                     |     |      |
#              |       |     -----------------------     |      |
#              |       |                      *          |      |
# x_offset ----|---.   |          outer       *<---------|------|---- border_bottom
#              |   .   |          clip        *          |      |
#              |   V   |(0,0)                 *          |      |
#              | * * * ===================================      |
#              |       *                                        |
# y_offset ----|------>*          canvas                        |
#              |       *                                        |
#              ==================================================
#
#

class ViewState extends HasProperties

  initialize: (attrs, options)->
    super(attrs, options)

    @register_property('border_top',
        () -> Math.max(@get('min_border_top'), @get('requested_border_top'))
      , false)
    @add_dependencies('border_top', this, ['min_border_top', 'requested_border_top'])

    @register_property('border_bottom',
        () -> Math.max(@get('min_border_bottom'), @get('requested_border_bottom'))
      , false)
    @add_dependencies('border_bottom', this, ['min_border_bottom', 'requested_border_bottom'])

    @register_property('border_left',
        () -> Math.max(@get('min_border_left'), @get('requested_border_left'))
      , false)
    @add_dependencies('border_left', this, ['min_border_left', 'requested_border_left'])

    @register_property('border_right',
        () -> Math.max(@get('min_border_right'), @get('requested_border_right'))
      , false)
    @add_dependencies('border_right', this, ['min_border_right', 'requested_border_right'])

    @register_property('canvas_aspect',
        () -> @get('canvas_height') / @get('canvas_width')
      , true)
    @add_dependencies('canvas_aspect', this, ['canvas_height', 'canvas_width'])

    @register_property('outer_aspect',
        () -> @get('outer_height') / @get('outer_width')
      , true)
    @add_dependencies('outer_aspect', this, ['outer_height', 'outer_width'])

    @register_property('inner_width',
        () -> @get('outer_width') - @get('border_left') - @get('border_right')
      , true)
    @add_dependencies('inner_width', this, ['outer_width', 'border_left', 'border_right'])

    @register_property('inner_height',
        () -> @get('outer_height') - @get('border_top') - @get('border_bottom')
      , true)
    @add_dependencies('inner_height', this, ['outer_height', 'border_top', 'border_bottom'])

    @register_property('inner_aspect',
        () -> @get('inner_height') / @get('inner_width')
      , true)
    @add_dependencies('inner_aspect', this, ['inner_height', 'inner_width'])

    _inner_range_horizontal = new Range1d({
      start: @get('border_left'),
      end:   @get('border_left') + @get('inner_width')
    })
    @register_property('inner_range_horizontal',
        () ->
          _inner_range_horizontal.set('start', @get('border_left'))
          _inner_range_horizontal.set('end', @get('border_left') + @get('inner_width'))
          return _inner_range_horizontal
      , true)
    @add_dependencies('inner_range_horizontal', this, ['border_left', 'inner_width'])

    _inner_range_vertical = new Range1d({
      start: @get('border_bottom'),
      end:   @get('border_bottom') + @get('inner_height')
    })
    @register_property('inner_range_vertical',
        () ->
          _inner_range_vertical.set('start', @get('border_bottom'))
          _inner_range_vertical.set('end', @get('border_bottom') + @get('inner_height'))
          return _inner_range_vertical
      , true)
    @add_dependencies('inner_range_vertical', this, ['border_bottom', 'inner_height'])

  # transform screen coordinates to underlying device coordinates
  sx_to_device: (x) ->
    return x
  sy_to_device: (y) ->
    return @get('canvas_height') - y

  # vectorized versions of xpos/ypos, these are mutating, in-place operations
  v_sx_to_device: (xx) ->
    for x, idx in xx
      xx[idx] = x
    return xx
  v_sy_to_device: (yy) ->
    canvas_height = @get('canvas_height')
    for y, idx in yy
      yy[idx] = canvas_height - y
    return yy

  # transform underlying device coordinates to screen coordinates
  device_to_sx: (x) ->
    return x
  device_to_sy: (y) ->
    return @get('canvas_height') - y

  # vectorized versions of rxpos/rypos, these are mutating, in-place operations
  v_device_to_sx: (xx) ->
    for x, idx in xx
      xx[idx] = x
    return xx
  v_device_to_sy: (yy) ->
    canvas_height = @get('canvas_height')
    for y, idx in yy
      yy[idx] = y - canvas_height
    return yy


exports.ViewState = ViewState
