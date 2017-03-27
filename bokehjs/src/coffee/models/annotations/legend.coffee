import {Annotation, AnnotationView} from "./annotation"
import * as p from "core/properties"
import {get_text_height} from "core/util/text"
import {BBox} from "core/util/bbox"
import {max, all} from "core/util/array"
import {values} from "core/util/object"
import {isString, isArray} from "core/util/types"

export class LegendView extends AnnotationView
  initialize: (options) ->
    super(options)

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:visible', @plot_view.request_render)

  compute_legend_bbox: () ->
    legend_names = @model.get_legend_names()

    glyph_height = @model.glyph_height
    glyph_width = @model.glyph_width

    label_height = @model.label_height
    label_width = @model.label_width

    @max_label_height = max(
      [get_text_height(@visuals.label_text.font_value()).height, label_height, glyph_height]
    )

    # this is to measure text properties
    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @visuals.label_text.set_value(ctx)
    @text_widths = {}
    for name in legend_names
      @text_widths[name] = max([ctx.measureText(name).width, label_width])
    ctx.restore()

    max_label_width = max(values(@text_widths))

    legend_margin = @model.margin
    legend_padding = @model.padding
    legend_spacing = @model.spacing
    label_standoff =  @model.label_standoff

    if @model.orientation == "vertical"
      legend_height = legend_names.length * @max_label_height + (legend_names.length - 1) * legend_spacing + 2 * legend_padding
      legend_width = max_label_width + glyph_width + label_standoff + 2 * legend_padding
    else
      legend_width = 2 * legend_padding + (legend_names.length - 1) * legend_spacing
      for name, width of @text_widths
        legend_width += max([width, label_width]) + glyph_width + label_standoff
      legend_height = @max_label_height + 2 * legend_padding

    panel = @model.panel ? @plot_view.frame
    h_range = {start: panel.left, end: panel.right}
    v_range = {start: panel.bottom, end: panel.top}

    location = @model.location
    if isString(location)
      switch location
        when 'top_left'
          x = h_range.start + legend_margin
          y = v_range.end - legend_margin
        when 'top_center'
          x = (h_range.end + h_range.start)/2 - legend_width/2
          y = v_range.end - legend_margin
        when 'top_right'
          x = h_range.end - legend_margin - legend_width
          y = v_range.end - legend_margin
        when 'center_right'
          x = h_range.end - legend_margin - legend_width
          y = (v_range.end + v_range.start)/2 + legend_height/2
        when 'bottom_right'
          x = h_range.end - legend_margin - legend_width
          y = v_range.start + legend_margin + legend_height
        when 'bottom_center'
          x = (h_range.end + h_range.start)/2 - legend_width/2
          y = v_range.start + legend_margin + legend_height
        when 'bottom_left'
          x = h_range.start + legend_margin
          y = v_range.start + legend_margin + legend_height
        when 'center_left'
          x = h_range.start + legend_margin
          y = (v_range.end + v_range.start)/2 + legend_height/2
        when 'center'
          x = (h_range.end + h_range.start)/2 - legend_width/2
          y = (v_range.end + v_range.start)/2 + legend_height/2
    else if isArray(location) and location.length == 2
      [x, y] = location   # left, bottom wrt panel
      x += h_range.start
      y += v_range.start + legend_height

    x = @plot_view.canvas.vx_to_sx(x)
    y = @plot_view.canvas.vy_to_sy(y)

    return {x: x, y: y, width: legend_width, height: legend_height}

  bbox: () ->
    {x, y, width, height} = @compute_legend_bbox()
    return new BBox({x0: x, y0: y, x1: x+width, y1: y+height})

  on_hit: (sx, sy) ->
    glyph_height = @model.glyph_height
    glyph_width = @model.glyph_width
    legend_spacing = @model.spacing
    label_standoff = @model.label_standoff
    xoffset = yoffset = @model.padding

    legend_bbox = @compute_legend_bbox()
    vertical = @model.orientation == "vertical"

    for item in @model.items
      labels = item.get_labels_list_from_label_prop()
      field = item.get_field_from_label_prop()

      for label in labels
        x1 = legend_bbox.x + xoffset
        y1 = legend_bbox.y + yoffset
        x2 = x1 + glyph_width
        y2 = y1 + glyph_height

        if vertical
           [w, h] = [legend_bbox.width-2*@model.padding, @max_label_height]
        else
           [w, h] = [@text_widths[label] + glyph_width + label_standoff, @max_label_height]

        bbox = new BBox({x0: x1, y0: y1, x1: x1+w, y1: y1+h})

        if bbox.contains(sx, sy)
          switch @model.click_policy
            when "hide"
              for r in item.renderers
                r.visible = not r.visible
            when "mute"
              for r in item.renderers
                r.muted = not r.muted
          return true

        if vertical
          yoffset += @max_label_height + legend_spacing
        else
          xoffset += @text_widths[label] + glyph_width + label_standoff + legend_spacing

    return false

  render: () ->
    if not @model.visible
      return

    if @model.items.length == 0
      return

    ctx = @plot_view.canvas_view.ctx
    bbox = @compute_legend_bbox()

    ctx.save()
    @_draw_legend_box(ctx, bbox)
    @_draw_legend_items(ctx, bbox)
    ctx.restore()

  _draw_legend_box: (ctx, bbox) ->
    ctx.beginPath()
    ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height)
    @visuals.background_fill.set_value(ctx)
    ctx.fill()
    if @visuals.border_line.doit
      @visuals.border_line.set_value(ctx)
      ctx.stroke()

  _draw_legend_items: (ctx, bbox) ->
    glyph_height = @model.glyph_height
    glyph_width = @model.glyph_width
    legend_spacing = @model.spacing
    label_standoff = @model.label_standoff
    xoffset = yoffset = @model.padding
    vertical = @model.orientation == "vertical"

    for item in @model.items
      labels = item.get_labels_list_from_label_prop()
      field = item.get_field_from_label_prop()

      if labels.length == 0
        continue

      active = switch @model.click_policy
        when "none" then true
        when "hide" then all(item.renderers, (r) -> r.visible)
        when "mute" then all(item.renderers, (r) -> not r.muted)

      for label in labels
        x1 = bbox.x + xoffset
        y1 = bbox.y + yoffset
        x2 = x1 + glyph_width
        y2 = y1 + glyph_height
        if vertical
          yoffset += @max_label_height + legend_spacing
        else
          xoffset += @text_widths[label] + glyph_width + label_standoff + legend_spacing

        @visuals.label_text.set_value(ctx)
        ctx.fillText(label, x2 + label_standoff, y1 + @max_label_height / 2.0)
        for r in item.renderers
          view = @plot_view.renderer_views[r.id]
          view.draw_legend(ctx, x1, x2, y1, y2, field, label)

        if not active
          if vertical
             [w, h] = [bbox.width-2*@model.padding, @max_label_height]
          else
             [w, h] = [@text_widths[label] + glyph_width + label_standoff, @max_label_height]
          ctx.beginPath()
          ctx.rect(x1, y1, w, h)
          @visuals.inactive_fill.set_value(ctx)
          ctx.fill()

    return null

  _get_size: () ->
    bbox = @compute_legend_bbox()
    side = @model.panel.side
    if side == 'above' or side == 'below'
      return bbox.height
    if side == 'left' or side == 'right'
      return bbox.width

export class Legend extends Annotation
  default_view: LegendView

  type: 'Legend'

  cursor: () -> if @click_policy == "none" then null else "pointer"

  get_legend_names: () ->
    legend_names = []
    for item in @items
      labels = item.get_labels_list_from_label_prop()
      legend_names = legend_names.concat(labels)
    return legend_names

  @mixins ['text:label_', 'fill:inactive_', 'line:border_', 'fill:background_']

  @define {
      orientation:      [ p.Orientation,    'vertical'  ]
      location:         [ p.Any,            'top_right' ] # TODO (bev)
      label_standoff:   [ p.Number,         5           ]
      glyph_height:     [ p.Number,         20          ]
      glyph_width:      [ p.Number,         20          ]
      label_height:     [ p.Number,         20          ]
      label_width:      [ p.Number,         20          ]
      margin:           [ p.Number,         10          ]
      padding:          [ p.Number,         10          ]
      spacing:          [ p.Number,         3           ]
      items:            [ p.Array,          []          ]
      click_policy:     [ p.Any,            "none"      ]
  }

  @override {
    border_line_color: "#e5e5e5"
    border_line_alpha: 0.5
    border_line_width: 1
    background_fill_color: "#ffffff"
    background_fill_alpha: 0.95
    inactive_fill_color: "white"
    inactive_fill_alpha: 0.9
    label_text_font_size: "10pt"
    label_text_baseline: "middle"
  }
