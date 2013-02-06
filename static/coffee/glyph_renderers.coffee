#Setup Bokeh Module
base = require("./base")
schema_renderers = require("./schema_renderers")
XYRendererView = schema_renderers.XYRendererView
HasParent = base.HasParent
safebind = base.safebind

# MAIN BOKEH CLASSES

# backbone assumes that valid attrs are any non-null, or non-defined value
# thats dumb, we only check for undefined, because null is perfectly valid

class MetaGlyph
  constructor: (@styleprovider, @glyphspec, @attrnames) ->
    # * attrnames: a list of attribute names. They can have an optional type
    #     suffix, separated by a colon, where the type string can be
    #     `'number'`, `'string'`, or `'array'`. The default is `'number'`.
    #     These types determine how to interpret values in the glyphspec.
    #     For `number` and `array` fields, if a string is provided, then it is
    #     treated as a field name specifier. For `string` fields, a string is
    #     treated as a default value. For `array` fields, any non-array literal
    #     value is wrapped into a single-element array.
    # * glyphspec: the glyph specification object, usually defined in the
    #     `glyphs` field of a GlyphRenderer
    # * styleprovider: something with an `.mget()` method that can produce
    #     a concrete value (or fieldname) for each of the attributes

  make_glyph: (datapoint) ->
    # Returns an object that has properties corresponding all of the named
    # attributes in `attrnames`, as well as $NAME_units. (The latter is a
    # string, usually `'data'` or `'screen'`, but in some cases can be actual
    # mathematical units like deg/rad.)
    glyph = {}
    for attrname in @attrnames
      if attrname.indexOf(":") > -1
        [attrname, attrtype] = attrname.split(":")
      else
        attrtype = "number"
      unitsname = attrname + "_units"

      if not (attrname of @glyphspec)
        # The field is absent from the glyph specification.
        # Use the default field name and check for its existence on the
        # datapoint. If it doesn't exist, then read the defaults from the
        # styleprovider. The default value of `units` is always `'data'`.
        if attrname of datapoint
          glyph[attrname] = datapoint[attrname]
        else
          glyph[attrname] = @styleprovider.mget(attrname)

        units = @styleprovider.mget(unitsname)
        glyph[unitsname] = units ? 'data'
        continue

      else if _.isNumber(@glyphspec[attrname])
        # The glyph specification provided a number. This is always a
        # default value.
        glyph[attrname] = if attrname of datapoint then datapoint[attrname] else @glyphspec[attrname]
        units = @styleprovider.mget(unitsname)
        glyph[unitsname] = units ? 'data'
        continue

      else
        if _.isString(@glyphspec[attrname])
          # The glyph specification provided a string for this field; how we
          # interpret it depends on the type of the field.
          # For string fields, this becomes the field value.  For all others,
          # treat this as customizing the name of the field.
          if attrtype == 'string'
            default_value = @glyphspec[attrname]
            fieldname = attrname
          else
            default_value = @styleprovider.mget(attrname)
            fieldname = @glyphspec[attrname]
          # In either case, use the default units
          units = @styleprovider.mget(unitsname)
          glyph[unitsname] = units ? 'data'

        else if _.isObject(@glyphspec[attrname])
          obj = @glyphspec[attrname]
          fieldname = if obj.field? then obj.field else attrname
          default_value = if obj.default? then obj.default else @styleprovider.mget(attrname)
          if obj.units?
            glyph[unitsname] = obj.units
          else
            units = @styleprovider.mget(unitsname)
            glyph[unitsname] = units ? 'data'

        else
          # This is an error down here...
          console.log("Unknown glyph specification value type.")
          continue

        # Both string and object glyphspecs share this logic
        if fieldname of datapoint
          glyph[attrname] = datapoint[fieldname]
        else
          glyph[attrname] = default_value

    return glyph

# ###class : GlyphRendererView
class GlyphRendererView extends XYRendererView
  addSquare: (x, y, size, color) ->
    if isNaN(x) or isNaN(y)
      reqturn null
    @plot_view.ctx.fillStyle = color
    @plot_view.ctx.strokeStyle = color
    @plot_view.ctx.fillRect(x - size / 2, y - size / 2, size, size)

  addCircle: (x, y, size, color, outline_color, alpha) ->
    ctx = @plot_view.ctx
    if isNaN(x) or isNaN(y)
      return null
    if not (outline_color?)
      outline_color = color
    if alpha? and (alpha != ctx.globalAlpha)
      old_alpha = ctx.globalAlpha
      ctx.globalAlpha  = alpha
    ctx.fillStyle = color
    ctx.strokeStyle = outline_color
    ctx.beginPath()
    ctx.arc(x, y, size/2, 0, Math.PI*2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    if alpha?
      ctx.globalAlpha = old_alpha

  addRect : (glyph, plot_view, left, right, bottom, top) ->
    # Internal method for actually drawing a rectangle
    # **glyph** contains some visual attributes, and **plot_view**
    # is typically @plot_view.

    # TODO: We need to manually flip the Y axis coordinates
    bottom = plot_view.viewstate.ypos(bottom)
    top = plot_view.viewstate.ypos(top)

    # At this point, we have the box boundaries (left, right, bottom, top)
    # in screen space coordinates, and should be ready to draw.

    # In the following, we need to grab the first element of the returned
    # valued b/c getter functions always return (val, units) and we don't
    # care about units for color.
    ctx = plot_view.ctx
    old_alpha = ctx.globalAlpha
    old_linewidth = ctx.lineWidth
    ctx.globalAlpha = glyph.alpha
    ctx.lineWidth = glyph.outline_width
    if glyph.angle != 0
      # TODO: Fix angle handling. We need to translate, then rotate, then
      # reset the ctm. Probably best to do this with save() and restore()
      # b/c there doesn't seem to be a way to read out the current ctm.
      if glyph.angle_units == 'deg'
        angle = glyph.angle * Math.PI / 180
      else
        angle = glyph.angle
      ctx.rotate(angle)

    if glyph.color? and glyph.color != "none"
      ctx.fillStyle = glyph.color
      ctx.fillRect(left, bottom, right-left, top-bottom)
    if glyph.outline_color? and glyph.outline_color != "none"
      ctx.strokeStyle = glyph.outline_color
      ctx.strokeRect(left, bottom, right-left, top-bottom)

    if angle?
      ctx.rotate(-angle)
    ctx.globalAlpha = old_alpha
    ctx.lineWidth = old_linewidth


  # ### method : GlyphRendererView::calc_screen
  calc_screen : (glyph, direction, datapoint, mapper) ->
    # #### Parameters
    # * glyph : one glyph such as  @mget('glyphs')[0]
    # * direction : 'x' or 'y'
    # * datapoint : one record from the data source, as a dictionary
    # * mapper : the mapper which pertains to dim
    # #### Returns
    # * screen coordinate

    # get dim, first from the glyph, otherwise from the glyph
    # renderer model. dims can either be strings to specify the field name
    # `"x"`, or `"stockprice"`, or they can be an array
    # `["stockprice", 0.10, 0.20]`  If the dim is an array, the
    # first element is the field name, and the 2 floats are
    # data space offset and screen space offset for the glyph

    dim = if glyph[direction] then glyph[direction] else @mget(direction)
    if _.isArray(dim)
      data = datapoint[dim[0]]
      data = if dim[1] then dim[1] + data else data
      screenoffset = if dim[2] then dim[2] else 0
    else
      data = datapoint[dim]
      screenoffset = 0
    if dim == 'x'
      screenoffset = screenoffset * @plot_view.viewstate.get('width')
    else
      screenoffset = screenoffset * @plot_view.viewstate.get('height')
    screen = mapper.map_screen(data) + screenoffset
    return screen

  render_scatter : (glyph, data) ->
    datapoint = data[glyph.index]
    screenx = @calc_screen(glyph, 'x', datapoint, @xmapper)
    screeny = @calc_screen(glyph, 'y', datapoint, @ymapper)
    size = if glyph.size then glyph.size else @mget('scatter_size')
    color = if glyph.color then glyph.color else @mget('color')
    if glyph.type == 'circle'
      @addCircle(screenx, screeny, size, color)
    if glyph.type == 'square'
      @addSquare(screenx, screeny, size, color)

  render : ->
    screen_glpyhs = []
    source = @mget_obj('data_source')
    if source.type == "ObjectArrayDataSource"
      data = source.get('data')
    else if source.type == "ColumnDataSource"
      data = source.datapoints()
    for glyph in @mget('glyphs')
      if glyph.type == 'circle' or glyph.type == 'square'
        @render_scatter(glyph, data)
      else if glyph.type == 'circles'
        @render_circles(glyph, data)
      else if glyph.type == 'rects'
        @render_rects(glyph, data)
      else if glyph.type == 'rectregions'
        @render_rectregions(glyph, data)
      else if glyph.type == 'line'
        @render_line(glyph, data)
      else if glyph.type == 'lines'
        @render_lines(glyph, data)
      else if glyph.type == 'area'
        @render_area(glyph, data)
      else if glyph.type == 'areas'
        @render_areas(glyph, data)
      else if glyph.type == 'stacked_lines'
        @render_stacked_lines(glyph, data)
      else if glyph.type == 'stacked_rects'
        @render_stacked_rects(glyph, data)
      else if glyph.type == 'boxplots'
        @render_boxplots(glyph, data)


  render_line : (glyphspec, data) ->
    # ### Fields of the `line` glyph:
    # * x, y
    # * line_width
    # * line_color
    # * alpha
    #
    # Note that unlike other glyphs, the aesthetic parameters canont be
    # changed on a per-datapoint basis.
    metaglyph = new MetaGlyph(this, glyphspec, ['x','y','line_width:string', 'line_color:string', 'alpha'])

    ctx = @plot_view.ctx
    ctx.save()

    # Since we do not allow override of any of the aesthetic parameters
    # from point to point, we just take the values off of the first_glyph.
    first_glyph = metaglyph.make_glyph(data[0])
    ctx.lineWidth = first_glyph.line_width
    ctx.strokeStyle = first_glyph.line_color
    ctx.globalAlpha = first_glyph.alpha

    for idx in [0..data.length-1]
      glyph = metaglyph.make_glyph(data[idx])
      if not (glyph.x? and glyph.y?)
        continue
      if glyph.x_units == 'data'
        sx = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x))
      else
        sx = glyph.x
      if glyph.y_units == 'data'
        sy = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.y))
      else
        sy = glyph.y

      if idx == 0
        # First glyph, start the path
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        continue
      else if isNaN(sx) or isNaN(sy)
        ctx.stroke()
        ctx.beginPath()
        continue
      else
        ctx.lineTo(sx, sy)
    ctx.stroke()
    ctx.restore()

  render_lines : (glyphspec, data) ->
    # ### Fields of the `line` glyph:
    # * xs, ys
    # * line_width
    # * line_color
    # * alpha
    #
    metaglyph = new MetaGlyph(this, glyphspec, ['xs','ys','line_width:string', 'line_color:string', 'line_dash', 'alpha'])

    ctx = @plot_view.ctx
    ctx.save()

    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      ctx.lineWidth = glyph.line_width
      ctx.strokeStyle = glyph.line_color
      ctx.globalAlpha = glyph.alpha
      ctx.setLineDash(glyph.line_dash)

      if not (glyph.xs? and glyph.ys?)
          continue
      if glyph.xs.length != glyph.ys.length
        continue
      for idx in [0..glyph.xs.length-1]
        if glyph.xs_units == 'data'
          sx = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.xs[idx]))
        else
          sx = glyph.xs[idx]
        if glyph.ys_units == 'data'
          sy = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.ys[idx]))
        else
          sy = glyph.ys[idx]

        if idx == 0
          # First glyph, start the path
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          continue
        else if isNaN(sx) or isNaN(sy)
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx, sy)
      ctx.stroke()
    ctx.restore()

  render_stacked_lines : (glyphspec, data) ->
    # ### Fields of the `line` glyph:

    ctx = @plot_view.ctx
    ctx.save()

    accum = []
    for pt in data
      accum.push(0)

    for yidx in [0..(glyphspec.y.length-1)]
      # render the area
      ctx.lineWidth = 0
      ctx.fillStyle = glyphspec.fills[glyphspec.y[yidx]].fill_color
      ctx.globalAlpha = glyphspec.fills[glyphspec.y[yidx]].fill_alpha
      for idx in [0..data.length-1]
        sx = @plot_view.viewstate.xpos(@xmapper.map_screen(data[idx].x))
        sy = @plot_view.viewstate.ypos(@ymapper.map_screen(accum[idx]))
        if idx == 0
          ctx.beginPath()
          ctx.moveTo(sx, sy)
        else
          ctx.lineTo(sx, sy)
      for idx in [(data.length-1)..0]
        y = accum[idx] + data[idx][glyphspec.y[yidx]]
        sx = @plot_view.viewstate.xpos(@xmapper.map_screen(data[idx].x))
        sy = @plot_view.viewstate.ypos(@ymapper.map_screen(y))
        accum[idx] = y
        ctx.lineTo(sx, sy)
      ctx.closePath()
      ctx.fill()

      # render the line
      ctx.lineWidth = glyphspec.lines[glyphspec.y[yidx]].line_width
      ctx.strokeStyle = glyphspec.lines[glyphspec.y[yidx]].line_color
      ctx.globalAlpha = glyphspec.lines[glyphspec.y[yidx]].line_alpha
      for idx in [0..data.length-1]
        sx = @plot_view.viewstate.xpos(@xmapper.map_screen(data[idx].x))
        sy = @plot_view.viewstate.ypos(@ymapper.map_screen(accum[idx]))
        if idx == 0
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          continue
        else
          ctx.lineTo(sx, sy)
      ctx.stroke()

    ctx.restore()

  render_stacked_rects : (glyphspec, data) ->
    # ### Fields of the `line` glyph:

    rectdata = []

    glyph = {
      type: 'rects'
      x: 'x'
      color:
        field: 'color'
    }

    accum = []
    for pt in data
      accum.push(0)

    width = 0.2 # TODO

    for yidx in [0..(glyphspec.y.length-1)]
      color = glyphspec.fills[glyphspec.y[yidx]].fill_color
      for idx in [0..data.length-1]
        x = data[idx].x
        height = data[idx][glyphspec.y[yidx]]
        y = accum[idx] + height/2
        accum[idx] = accum[idx] + height
        pt = {}
        pt['x'] = x
        pt['y'] = y
        pt['width'] = width
        pt['height'] = height
        pt['color'] = color
        rectdata.push(pt)

    @render_rects(glyph, rectdata)

  render_circles : (glyphspec, data) ->
    # ### Fields of the `circles` glyph:
    # * x, y: the center of the glyph
    # * radius: radius in data or screen coords
    # * color
    # * outline_color
    # * outline_width
    # * alpha

    metaglyph = new MetaGlyph(this, glyphspec, ["x", "y", "radius", "color:string", "outline_color:string", "outline_width", "alpha"])

    @plot_view.ctx.save()
    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      # Instead of calling @calc_screen and supporting offsets, we just bake
      # that logic into the loop here.
      sx = @plot_view.viewstate.xpos(if glyph.x_units == 'screen' then glyph.x else @xmapper.map_screen(glyph.x))
      sy = @plot_view.viewstate.ypos(if glyph.y_units == 'screen' then glyph.y else @ymapper.map_screen(glyph.y))

      if glyph.radius_units == 'data'
        # Use of span2bounds is a tiny bit hackish, because it assumes the
        # span is specified as (center,width). In our case, we don't care
        # about center.
        [left, right, units] = @_span2bounds(glyph.x, glyph.x_units, glyph.radius, glyph.radius_units)
        if units == 'data'
          left = @xmapper.map_screen(left)
          right = @xmapper.map_screen(right)
        size = right - left
      else
        size = glyph.radius

      ctx = @plot_view.ctx
      old_linewidth = ctx.lineWidth
      ctx.lineWidth = glyph.outline_width
      @addCircle(sx, sy, size, glyph.color, glyph.outline_color, glyph.alpha)
      ctx.lineWidth = old_linewidth

    @plot_view.ctx.restore()

  render_area : (glyphspec, data) ->
    metaglyph = new MetaGlyph(this, glyphspec, ['x','y','color:string', 'outline_width:string', 'outline_color:string', 'alpha'])

    ctx = @plot_view.ctx
    ctx.save()

    # Since we do not allow override of any of the aesthetic parameters
    # from point to point, we just take the values off of the first_glyph.
    first_glyph = metaglyph.make_glyph(data[0])
    ctx.fillStyle = first_glyph.color
    ctx.lineWidth = first_glyph.outline_width
    ctx.strokeStyle = first_glyph.outline_color
    ctx.globalAlpha = first_glyph.alpha

    for idx in [0..data.length-1]
      glyph = metaglyph.make_glyph(data[idx])
      if not (glyph.x? and glyph.y?)
        continue
      if glyph.x_units == 'data'
        sx = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x))
      else
        sx = glyph.x
      if glyph.y_units == 'data'
        sy = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.y))
      else
        sy = glyph.y

      if idx == 0
        # First glyph, start the path
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        continue

      ctx.lineTo(sx, sy)

    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

  render_areas : (glyphspec, data) ->
    metaglyph = new MetaGlyph(this, glyphspec, ['xs','ys','color:string', 'outline_width:string', 'outline_color:string', 'outline_dash', 'alpha'])

    ctx = @plot_view.ctx
    ctx.save()

    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      ctx.fillStyle = glyph.color
      ctx.lineWidth = glyph.outline_width
      ctx.strokeStyle = glyph.outline_color
      ctx.globalAlpha = glyph.alpha
      ctx.setLineDash(glyph.outline_dash)

      if not (glyph.xs? and glyph.ys?)
          continue
      if glyph.xs.length != glyph.ys.length
        continue
      for idx in [0..glyph.xs.length-1]
        if glyph.xs_units == 'data'
          sx = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.xs[idx]))
        else
          sx = glyph.xs[idx]
        if glyph.ys_units == 'data'
          sy = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.ys[idx]))
        else
          sy = glyph.ys[idx]

        if idx == 0
          # First glyph, start the path
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          continue

        ctx.lineTo(sx, sy)

      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    ctx.restore()

  render_rects : (glyphspec, data) ->
    # A rectangle, specified by a center and width & height.
    #
    # ## Spatial parameters
    # * x, y, width, height
    # * angle
    #
    # For each of these spatial parameters, the full specification in the
    # glyph is an embedded object with the following properties:
    # * field: the name of the field in each data point; this defaults to
    #     the name of the spatial parameter itself (e.g. 'height', 'bottom', 'x')
    # * default: a numerical default value to use if the field does not exist
    #     on a datapoint.  Each spatial parameter also has a global default
    #     value (defined in GlyphRenderer::display_defaults)
    # * units: For all parameters except 'angle', this specifies the coordinate
    #     space in which to interpret data values, either 'data' (default) or
    #     'screen'. For the 'angle' parameter, this property is either 'deg' or
    #     'rad'.
    #
    # Example:
    #   type: 'rects'
    #   x:
    #     field: 'var1'
    #     units: 'data'
    #   y:
    #     field: 'var2'
    #     default: 10
    #     units: screen
    #
    # However, a shorthand can be used if only the field name needs to be
    # specified, or a constant default numerical value is to be used.
    #
    # Example:
    #   type: 'rects'
    #   width: 'var3' # shorthand for field:'var3'
    #   height: 8     # shorthand for default:8, units:'data'
    #
    # If a numerical default value is specified, it can still be overridden on
    # a per-datapoint basis since the GlyphRenderer::display_defaults specify
    # default field names for each of these properties.  In the example above,
    # if a datapoint had an additional field named 'height', which is the default
    # field name for the height parameter, then it would override the constant
    # value of 8.
    #
    # For colors and other properties which can accept string values, there is
    # potential ambiguity in the shorthand form:
    #   type: 'rects'
    #   color: 'red'
    #
    # Does this mean that the default value of `color` should be `'red'`, or
    # that the field named `'red'` should be used to determine the color of
    # each datapoint?  To resolve this, for colors, the shorthand is
    # interpreted to mean the former, because this is such a common case.  To
    # specify the fieldname for color-related properties, use the long form:
    #
    #   type: 'rects'
    #   color:
    #     field: 'colorfieldname'
    #
    # ## Other parameters
    # * color: fill color
    # * outline_color: outline/stroke color
    # * outline_width: outline thickness in screen pixels
    # * alpha: alpha value (0..1) for entire glyph.


    # TODO: This checking for the 'x' or 'left' parameter of the Glyph spec
    # is brittle and behaves poorly; perhaps the user omits these fields
    # altogether?  Need a better way to specify this, perhaps an explicit
    # parameter.
    params = ['x','y','width','height']

    params.push.apply(params, ["angle", "color:string", "outline_color:string","alpha", "outline_width"])
    metaglyph = new MetaGlyph(this, glyphspec, params)

    @plot_view.ctx.save()
    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      [left,right,h_units] = @_span2bounds(glyph.x, glyph.x_units, glyph.width, glyph.width_units, @xmapper)
      if h_units == 'data'
        left = @xmapper.map_screen(left)
        right = @xmapper.map_screen(right)
      [bottom,top,v_units] = @_span2bounds(glyph.y, glyph.y_units, glyph.height, glyph.height_units, @ymapper)
      if v_units == 'data'
        bottom = @ymapper.map_screen(bottom)
        top = @ymapper.map_screen(top)

      @addRect(glyph, @plot_view, left, right, bottom, top)
      # End per-datapoint loop

    # Done with all drawing, restore the graphics state
    @plot_view.ctx.restore()
    return      # render_rects()

  render_rectregions : (glyphspec, data) ->
    # Rectangles, specified by their edges (left, right, bottom, top).
    #
    # ## Spatial parameters
    # * left, right, bottom, top
    # * angle
    #
    # The treatment of these parameters is the same as in render_rects,
    # that is, there is a full object specification in the glyph, with a
    # shorthand if only the field name or a constant numerical value needs
    # to be used.
    #
    # Example:
    #   type: 'rectregions'
    #   left: 'left'
    #   bottom:
    #     field: "foo"
    #     default: 1.8
    #     units: "data"
    #
    # ## Other parameters
    # These are identical to the parameters of the "rects" glyph.
    params = ['left', 'right', 'bottom', 'top']

    params.push.apply(params, ["angle", "color:string", "outline_color:string","alpha", "outline_width"])
    metaglyph = new MetaGlyph(this, glyphspec, params)

    @plot_view.ctx.save()
    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      if glyph.left_units == 'data'
        left = @xmapper.map_screen(glyph.left)
      if glyph.right_units == 'data'
        right = @xmapper.map_screen(glyph.right)
      if glyph.bottom_units == 'data'
        bottom = @ymapper.map_screen(glyph.bottom)
      if glyph.top_units == 'data'
        top = @ymapper.map_screen(glyph.top)
      @addRect(glyph, @plot_view, left, right, bottom, top)
    # Done with all drawing, restore the graphics state
    @plot_view.ctx.restore()
    return      # render_rect_regions()

  render_boxplots : (glyphspec, data) ->
    metaglyph = new MetaGlyph(this, glyphspec, ['x', 'median', 'size', 'q1', 'q3'])

    ctx = @plot_view.ctx
    ctx.save()

    ctx.fillStyle = 'lightblue'
    ctx.lineWidth = 1.0
    ctx.strokeStyle = 'orange'
    ctx.globalAlpha = 1.0

    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)

      iqr = glyph.q3 - glyph.q1

      x = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x))
      ym = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.median))
      yq1 = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.q1))
      yq3 = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.q3))
      yl = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.q1 - 1.5*iqr))
      yu = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.q3 + 1.5*iqr))

      half_size = glyph.size/2.0
      whisker_half_size = half_size*0.8
      if glyph.size_units == 'data'
        x0 = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x-half_size))
        x1 = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x+half_size))
        xw0 = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x-whisker_half_size))
        xw1 = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.x+whisker_half_size))
      else
        x0 = x - half_size
        x1 = x + half_size
        xw0 = x - whisker_half_size
        xw1 = x + whisker_half_size

      # upper box
      ctx.moveTo(x0, yq3)
      ctx.lineTo(x1, yq3)
      ctx.lineTo(x1, ym)
      ctx.lineTo(x0, ym)
      ctx.closePath()
      ctx.stroke()

      # lower box
      ctx.moveTo(x0, yq1)
      ctx.lineTo(x1, yq1)
      ctx.lineTo(x1, ym)
      ctx.lineTo(x0, ym)
      ctx.closePath()
      ctx.stroke()

      # centerline
      ctx.moveTo(x0, ym)
      ctx.lineTo(x1, ym)
      ctx.stroke()

      # upper line
      ctx.moveTo(x, yq3)
      ctx.lineTo(x, yu)
      ctx.stroke()

      # lower line
      ctx.moveTo(x, yq1)
      ctx.lineTo(x, yl)
      ctx.stroke()

      # upper whisker
      ctx.moveTo(xw0, yu)
      ctx.lineTo(xw1, yu)
      ctx.stroke()

      # lower whisker
      ctx.moveTo(xw0, yl)
      ctx.lineTo(xw1, yl)
      ctx.stroke()

    ctx.restore()

  _span2bounds : (center, center_units, span, span_units, mapper) ->
    # Given a center value and a span value of potentially different
    # spaces, returns an tuple (min, max, units) normalizing them
    # into the space space ('data' or 'screen'), via the given mapper.
    # NB: The mapper must be able to map from screen to data space.
    # TODO: This function should probably be moved onto the Mappers.
    halfspan = span / 2
    if center_units == 'data' and span_units == 'data'
      return [center-halfspan, center+halfspan, 'data']
    else if center_units == 'data' and span_units == 'screen'
      center_s = mapper.map_screen(center)
      return [center_s-halfspan, center_s+halfspan, 'screen']
    else if center_units == 'screen' and span_units == 'data'
      center_d = mapper.map_data(center)
      return [center_d-halfspan, centerd+halfspan, 'data']
    else if center_units == 'screen' and span_units == 'screen'
      return [center-halfspan, center+halfspan, 'screen']


# ### class : GlyphRenderer
class GlyphRenderer extends HasParent
  # Example definition
  #
  #     data_source : data_source.ref()
  #     xdata_range : xdr.ref()
  #     ydata_range : ydr.ref()
  #     scatter_size : 10
  #     color : 'black'
  #     x : 'x'
  #     y : 'y'
  #     glyphs : [
  #         type : 'circle'
  #         index : 0
  #       ,
  #         type : 'square'
  #         index : 1
  #       ,
  #         type : 'square'
  #         index : 2
  #         color : 'red'
  #       ,
  #         type : 'square'
  #         index : 2
  #         color : 'green'
  #         x : ['x', 0, 0.1]
  #       ,
  #         type : 'square'
  #         index : 2
  #         color : 'green'
  #         x : ['x', 0, -0.1]
  #     ]

  type : 'GlyphRenderer'
  default_view : GlyphRendererView

GlyphRenderer::defaults = _.clone(GlyphRenderer::defaults)
_.extend(GlyphRenderer::defaults,
  data_source : null
  scatter_size : 3
  color : 'black'
)

GlyphRenderer::display_defaults = _.clone(GlyphRenderer::display_defaults)
_.extend(GlyphRenderer::display_defaults, {
  radius : 5
  radius_units: 'screen'
  color : 'gray'
  outline_color: 'none'
  outline_width: 1

  angle_units: 'deg'

  # Rects glyph
  height: 1
  width: 1
  top: 1
  bottom: 0
  left: 0
  right: 1

})

class GlyphRenderers extends Backbone.Collection
  model : GlyphRenderer

exports.glyphrenderers = new GlyphRenderers
exports.GlyphRendererView = GlyphRendererView
exports.GlyphRenderer = GlyphRenderer