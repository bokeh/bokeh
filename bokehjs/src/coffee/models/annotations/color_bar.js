import {Annotation, AnnotationView} from "./annotation"
import {BasicTicker} from "../tickers/basic_ticker"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Range1d} from "../ranges/range1d"

import * as p from "core/properties"
import * as text_util from "core/util/text"
import {min, max} from "core/util/array"
import {isEmpty} from "core/util/object"
import {isString, isArray} from "core/util/types"

SHORT_DIM = 25
LONG_DIM_MIN_SCALAR = 0.3
LONG_DIM_MAX_SCALAR = 0.8

export class ColorBarView extends AnnotationView
  initialize: (options) ->
    super(options)
    @_set_canvas_image()

  connect_signals: () ->
    super()
    @connect(@model.properties.visible.change, () => @plot_view.request_render())
    @connect(@model.ticker.change, () => @plot_view.request_render())
    @connect(@model.formatter.change, () => @plot_view.request_render())
    if @model.color_mapper?
      @connect @model.color_mapper.change, () ->
        @_set_canvas_image()
        @plot_view.request_render()

  _get_size: () ->
    if not @model.color_mapper?
      return 0

    bbox = @compute_legend_dimensions()
    side = @model.panel.side
    if side == 'above' or side == 'below'
      return bbox.height
    if side == 'left' or side == 'right'
      return bbox.width

  _set_canvas_image: () ->
    if not @model.color_mapper?
      return

    palette = @model.color_mapper.palette

    if @model.orientation == 'vertical'
      palette = palette.slice(0).reverse()

    switch @model.orientation
      when "vertical" then [w, h] = [1, palette.length]
      when "horizontal" then [w, h] = [palette.length, 1]

    canvas = document.createElement('canvas')
    [canvas.width, canvas.height] = [w, h]
    image_ctx = canvas.getContext('2d')
    image_data = image_ctx.getImageData(0, 0, w, h)

    # We always want to draw the entire palette linearly, so we create a new
    # LinearColorMapper instance and map a monotonic range of values with
    # length = palette.length to get each palette color in order.
    cmap = new LinearColorMapper({palette: palette})
    buf = cmap.v_map_screen([0...palette.length])
    buf8 = new Uint8Array(buf)
    image_data.data.set(buf8)
    image_ctx.putImageData(image_data, 0, 0)

    @image = canvas

  compute_legend_dimensions: () ->
    image_dimensions = @model._computed_image_dimensions()
    [image_height, image_width] = [image_dimensions.height, image_dimensions.width]

    label_extent = @_get_label_extent()
    title_extent = @model._title_extent()
    tick_extent = @model._tick_extent()
    padding = @model.padding

    switch @model.orientation
      when "vertical"
        legend_height = image_height + title_extent + padding * 2
        legend_width = image_width + tick_extent + label_extent + padding * 2
      when "horizontal"
        legend_height = image_height + title_extent + tick_extent + label_extent + padding * 2
        legend_width = image_width + padding * 2

    return {height: legend_height, width: legend_width}

  compute_legend_location: () ->
    legend_dimensions = @compute_legend_dimensions()
    [legend_height, legend_width] = [legend_dimensions.height, legend_dimensions.width]

    legend_margin = @model.margin

    panel = @model.panel ? @plot_view.frame
    [hr, vr] = panel.bbox.ranges

    location = @model.location
    if isString(location)
      switch location
        when 'top_left'
          sx = hr.start + legend_margin
          sy = vr.start + legend_margin
        when 'top_center'
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.start + legend_margin
        when 'top_right'
          sx = hr.end - legend_margin - legend_width
          sy = vr.start + legend_margin
        when 'bottom_right'
          sx = hr.end - legend_margin - legend_width
          sy = vr.end - legend_margin - legend_height
        when 'bottom_center'
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = vr.end - legend_margin - legend_height
        when 'bottom_left'
          sx = hr.start + legend_margin
          sy = vr.end - legend_margin - legend_height
        when 'center_left'
          sx = hr.start + legend_margin
          sy = (vr.end + vr.start)/2 - legend_height/2
        when 'center'
          sx = (hr.end + hr.start)/2 - legend_width/2
          sy = (vr.end + vr.start)/2 - legend_height/2
        when 'center_right'
          sx = hr.end - legend_margin - legend_width
          sy = (vr.end + vr.start)/2 - legend_height/2
    else if isArray(location) and location.length == 2
      [vx, vy] = location
      sx = panel.xview.compute(vx)
      sy = panel.yview.compute(vy) - legend_height

    return {sx: sx, sy: sy}

  render: () ->
    if not @model.visible or not @model.color_mapper?
      return

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    {sx, sy} = @compute_legend_location()
    ctx.translate(sx, sy)
    @_draw_bbox(ctx)

    image_offset = @_get_image_offset()
    ctx.translate(image_offset.x, image_offset.y)

    @_draw_image(ctx)

    if @model.color_mapper.low? and @model.color_mapper.high?
      tick_info = @model.tick_info()
      @_draw_major_ticks(ctx, tick_info)
      @_draw_minor_ticks(ctx, tick_info)
      @_draw_major_labels(ctx, tick_info)

    if @model.title
      @_draw_title(ctx)
    ctx.restore()

  _draw_bbox: (ctx) ->
    bbox = @compute_legend_dimensions()
    ctx.save()
    if @visuals.background_fill.doit
      @visuals.background_fill.set_value(ctx)
      ctx.fillRect(0, 0, bbox.width, bbox.height)
    if @visuals.border_line.doit
      @visuals.border_line.set_value(ctx)
      ctx.strokeRect(0, 0, bbox.width, bbox.height)
    ctx.restore()

  _draw_image: (ctx) ->
    image = @model._computed_image_dimensions()
    ctx.save()
    ctx.setImageSmoothingEnabled(false)
    ctx.globalAlpha = @model.scale_alpha
    ctx.drawImage(@image, 0, 0, image.width, image.height)
    if @visuals.bar_line.doit
        @visuals.bar_line.set_value(ctx)
        ctx.strokeRect(0, 0, image.width, image.height)
    ctx.restore()

  _draw_major_ticks: (ctx, tick_info) ->
    if not @visuals.major_tick_line.doit
      return

    [nx, ny] = @model._normals()
    image = @model._computed_image_dimensions()
    [x_offset, y_offset] = [image.width * nx, image.height * ny]

    [sx, sy] = tick_info.coords.major
    tin = @model.major_tick_in
    tout = @model.major_tick_out

    ctx.save()
    ctx.translate(x_offset, y_offset)
    @visuals.major_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout), Math.round(sy[i]+ny*tout))
      ctx.lineTo(Math.round(sx[i]-nx*tin), Math.round(sy[i]-ny*tin))
      ctx.stroke()
    ctx.restore()

  _draw_minor_ticks: (ctx, tick_info) ->
    if not @visuals.minor_tick_line.doit
      return

    [nx, ny] = @model._normals()
    image = @model._computed_image_dimensions()
    [x_offset, y_offset] = [image.width * nx, image.height * ny]

    [sx, sy] = tick_info.coords.minor
    tin = @model.minor_tick_in
    tout = @model.minor_tick_out

    ctx.save()
    ctx.translate(x_offset, y_offset)
    @visuals.minor_tick_line.set_value(ctx)
    for i in [0...sx.length]
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[i]+nx*tout), Math.round(sy[i]+ny*tout))
      ctx.lineTo(Math.round(sx[i]-nx*tin), Math.round(sy[i]-ny*tin))
      ctx.stroke()
    ctx.restore()

  _draw_major_labels: (ctx, tick_info) ->
    if not @visuals.major_label_text.doit
      return

    [nx, ny] = @model._normals()
    image = @model._computed_image_dimensions()
    [x_offset, y_offset] = [image.width * nx, image.height * ny]
    standoff = (@model.label_standoff + @model._tick_extent())
    [x_standoff, y_standoff] = [standoff*nx, standoff*ny]

    [sx, sy] = tick_info.coords.major

    formatted_labels = tick_info.labels.major

    @visuals.major_label_text.set_value(ctx)

    ctx.save()
    ctx.translate(x_offset + x_standoff, y_offset + y_standoff)
    for i in [0...sx.length]
      ctx.fillText(formatted_labels[i],
                   Math.round(sx[i]+nx*@model.label_standoff),
                   Math.round(sy[i]+ny*@model.label_standoff))
    ctx.restore()

  _draw_title: (ctx) ->
    if not @visuals.title_text.doit
      return

    ctx.save()
    @visuals.title_text.set_value(ctx)
    ctx.fillText(@model.title, 0, -@model.title_standoff)
    ctx.restore()

  _get_label_extent: () ->
    major_labels = @model.tick_info().labels.major
    if @model.color_mapper.low? and @model.color_mapper.high? and not isEmpty(major_labels)
      ctx = @plot_view.canvas_view.ctx
      ctx.save()
      @visuals.major_label_text.set_value(ctx)
      switch @model.orientation
        when "vertical"
          label_extent = max((ctx.measureText(label.toString()).width for label in major_labels))
        when "horizontal"
          label_extent = text_util.get_text_height(@visuals.major_label_text.font_value()).height

      label_extent += @model.label_standoff
      ctx.restore()
    else
      label_extent = 0
    return label_extent

  _get_image_offset: () ->
    # Returns image offset relative to legend bounding box
    x = @model.padding
    y = @model.padding + @model._title_extent()
    return {x: x, y: y}

export class ColorBar extends Annotation
  default_view: ColorBarView
  type: 'ColorBar'

  @mixins [
      'text:major_label_',
      'text:title_',
      'line:major_tick_',
      'line:minor_tick_',
      'line:border_',
      'line:bar_',
      'fill:background_',
  ]

  @define {
      location:                [ p.Any,            'top_right' ]
      orientation:             [ p.Orientation,    'vertical'  ]
      title:                   [ p.String,                     ]
      title_standoff:          [ p.Number,         2           ]
      height:                  [ p.Any,            'auto'      ]
      width:                   [ p.Any,            'auto'      ]
      scale_alpha:             [ p.Number,         1.0         ]
      ticker:                  [ p.Instance,    () -> new BasicTicker()         ]
      formatter:               [ p.Instance,    () -> new BasicTickFormatter()  ]
      major_label_overrides:   [ p.Any,      {}           ]
      color_mapper:            [ p.Instance                    ]
      label_standoff:          [ p.Number,         5           ]
      margin:                  [ p.Number,         30          ]
      padding:                 [ p.Number,         10          ]
      major_tick_in:           [ p.Number,         5           ]
      major_tick_out:          [ p.Number,         0           ]
      minor_tick_in:           [ p.Number,         0           ]
      minor_tick_out:          [ p.Number,         0           ]
  }

  @override {
      background_fill_color: "#ffffff"
      background_fill_alpha: 0.95
      bar_line_color: null
      border_line_color: null
      major_label_text_align: "center"
      major_label_text_baseline: "middle"
      major_label_text_font_size: "8pt"
      major_tick_line_color: "#ffffff"
      minor_tick_line_color: null
      title_text_font_size: "10pt"
      title_text_font_style: "italic"
  }

  initialize: (attrs, options) ->
    super(attrs, options)

  _normals: () ->
    if @orientation == 'vertical'
      [i, j] = [1, 0]
    else
      [i, j] = [0, 1]
    return [i, j]

  _title_extent: () ->
    font_value = @title_text_font + " " + @title_text_font_size + " " + @title_text_font_style
    title_extent = if @title then text_util.get_text_height(font_value).height + @title_standoff else 0
    return title_extent

  _tick_extent: () ->
    if @color_mapper.low? and @color_mapper.high?
      tick_extent = max([@major_tick_out, @minor_tick_out])
    else
      tick_extent = 0
    return tick_extent

  _computed_image_dimensions: () ->
    ###
    Heuristics to determine ColorBar image dimensions if set to "auto"

    Note: Returns the height/width values for the ColorBar's scale image, not
    the dimensions of the entire ColorBar.

    If the short dimension (the width of a vertical bar or height of a
    horizontal bar) is set to "auto", the resulting dimension will be set to
    25 px.

    For a ColorBar in a side panel with the long dimension (the height of a
    vertical bar or width of a horizontal bar) set to "auto", the
    resulting dimension will be as long as the adjacent frame edge, so that the
    bar "fits" to the plot.

    For a ColorBar in the plot frame with the long dimension set to "auto", the
    resulting dimension will be the greater of:
      * The length of the color palette * 25px
      * The parallel frame dimension * 0.30
        (i.e the frame height for a vertical ColorBar)
    But not greater than:
      * The parallel frame dimension * 0.80
    ###

    frame_height = @plot.plot_canvas.frame._height.value
    frame_width = @plot.plot_canvas.frame._width.value
    title_extent = @_title_extent()

    switch @orientation
      when "vertical"
        if @height == 'auto'
          if @panel?
            height = frame_height - 2 * @padding - title_extent
          else
            height = max([@color_mapper.palette.length * SHORT_DIM,
                          frame_height * LONG_DIM_MIN_SCALAR])
            height = min([height,
                          frame_height * LONG_DIM_MAX_SCALAR - 2 * @padding - title_extent])
        else
          height = @height

        width = if @width == 'auto' then SHORT_DIM else @width

      when "horizontal"
        height = if @height == 'auto' then SHORT_DIM else @height

        if @width == 'auto'
          if @panel?
            width = frame_width - 2 * @padding
          else
            width = max([@color_mapper.palette.length * SHORT_DIM,
                         frame_width * LONG_DIM_MIN_SCALAR])
            width = min([width,
                         frame_width * LONG_DIM_MAX_SCALAR - 2 * @padding])
        else
          width = @width

    return {"height": height, "width": width}

  _tick_coordinate_scale: (scale_length) ->
    ###
    Creates and returns a scale instance that maps the `color_mapper` range
    (low to high) to a screen space range equal to the length of the ColorBar's
    scale image. The scale is used to calculate the tick coordinates in screen
    coordinates for plotting purposes.

    Note: the type of color_mapper has to match the type of scale (i.e.
    a LinearColorMapper will require a corresponding LinearScale instance).
    ###

    ranges = {
      'source_range': new Range1d({
        start: @color_mapper.low
        end: @color_mapper.high
      })
      'target_range': new Range1d({
        start: 0
        end: scale_length})
    }

    switch @color_mapper.type
      when "LinearColorMapper" then scale = new LinearScale(ranges)
      when "LogColorMapper" then scale = new LogScale(ranges)

    return scale

  _format_major_labels: (initial_labels, major_ticks) ->

    labels = initial_labels

    # note: passing null as cross_loc probably means MercatorTickFormatters, etc
    # will not function properly in conjunction with colorbars
    formatted_labels = @formatter.doFormat(labels, null)

    for i in [0...major_ticks.length]
      if major_ticks[i] of @major_label_overrides
        formatted_labels[i] = @major_label_overrides[major_ticks[i]]

    return formatted_labels

  tick_info: () ->
    image_dimensions = @_computed_image_dimensions()
    switch @orientation
      when "vertical" then scale_length = image_dimensions.height
      when "horizontal" then scale_length = image_dimensions.width

    scale = @_tick_coordinate_scale(scale_length)

    [i, j] = @_normals()

    [start, end] = [@color_mapper.low, @color_mapper.high]

    # note: passing null as cross_loc probably means MercatorTickers, etc
    # will not function properly in conjunction with colorbars
    ticks = @ticker.get_ticks(start, end, null, null, @ticker.desired_num_ticks)

    coords =
      major: [[], []]
      minor: [[], []]

    majors = ticks.major
    minors = ticks.minor

    major_coords = coords.major
    minor_coords = coords.minor

    for ii in [0...majors.length]
      if majors[ii] < start or majors[ii] > end
        continue
      major_coords[i].push(majors[ii])
      major_coords[j].push(0)

    for ii in [0...minors.length]
      if minors[ii] < start or minors[ii] > end
        continue
      minor_coords[i].push(minors[ii])
      minor_coords[j].push(0)


    labels =
        major:@_format_major_labels(major_coords[i].slice(0), majors) # make deep copy

    major_coords[i] = scale.v_compute(major_coords[i])
    minor_coords[i] = scale.v_compute(minor_coords[i])

    # Because we want the scale to be reversed
    if @orientation == 'vertical'
      major_coords[i] = new Float64Array((scale_length - coord for coord in major_coords[i]))
      minor_coords[i] = new Float64Array((scale_length - coord for coord in minor_coords[i]))

    return {
      "ticks":ticks
      "coords":coords
      "labels":labels
    }
