import {sprintf} from "sprintf-js"
import * as models from "./models"
import * as palettes from "./palettes"
import {zip, unzip, sum, cumsum, copy} from "../core/util/array"
import {isArray} from "../core/util/types"

num2hexcolor = (num) -> sprintf("#%06x", num)
hexcolor2rgb = (color) ->
  r = parseInt(color.substr(1, 2), 16)
  g = parseInt(color.substr(3, 2), 16)
  b = parseInt(color.substr(5, 2), 16)
  return [r, g, b]

is_dark = ([r, g, b]) ->
  l = 1 - (0.299*r + 0.587*g + 0.114*b)/255
  return l >= 0.6

export pie = (data, opts={}) ->
  labels = []
  values = []

  for i in [0...Math.min(data.labels.length, data.values.length)]
    if data.values[i] > 0
      labels.push(data.labels[i])
      values.push(data.values[i])

  start_angle = opts.start_angle ? 0
  end_angle = opts.end_angle ? (start_angle + 2*Math.PI)

  angle_span = Math.abs(end_angle - start_angle)
  to_radians = (x) -> angle_span*x

  total_value = sum(values)
  normalized_values = values.map((v) -> v/total_value)
  cumulative_values = cumsum(normalized_values)

  end_angles = cumulative_values.map((v) -> start_angle + to_radians(v))
  start_angles = [start_angle].concat(end_angles.slice(0, -1))
  half_angles = zip(start_angles, end_angles).map(([start, end]) => (start + end)/2)

  if not opts.center?
    cx = 0
    cy = 0
  else if isArray(opts.center)
    cx = opts.center[0]
    cy = opts.center[1]
  else
    cx = opts.center.x
    cy = opts.center.y

  inner_radius = opts.inner_radius ? 0
  outer_radius = opts.outer_radius ? 1

  if isArray(opts.palette)
    palette = opts.palette
  else
    palette = palettes[opts.palette ? "Spectral11"].map(num2hexcolor)

  colors = ( palette[i % palette.length] for i in [0...normalized_values.length] )
  text_colors = colors.map((c) -> if is_dark(hexcolor2rgb(c)) then "white" else "black")

  to_cartesian = (r, alpha) -> [r*Math.cos(alpha), r*Math.sin(alpha)]

  half_radius = (inner_radius+outer_radius)/2
  [text_cx, text_cy] = unzip(half_angles.map((half_angle) => to_cartesian(half_radius, half_angle)))
  text_cx = text_cx.map((x) -> x + cx)
  text_cy = text_cy.map((y) -> y + cy)

  text_angles = half_angles.map (a) ->
    if a >= Math.PI/2 and a <= 3*Math.PI/2
      a + Math.PI
    else
      a

  source = new Bokeh.ColumnDataSource({
    data: {
      labels: labels,
      values: values,
      percentages: normalized_values.map((v) => sprintf("%.2f%%", v*100)),
      start_angles: start_angles,
      end_angles: end_angles,
      text_angles: text_angles,
      colors: colors,
      text_colors: text_colors,
      text_cx: text_cx,
      text_cy: text_cy,
    }
  })

  g1 = new models.AnnularWedge({
    x: cx, y: cy,
    inner_radius: inner_radius, outer_radius: outer_radius,
    start_angle: {field: "start_angles"}, end_angle: {field: "end_angles"},
    line_color: null, line_width: 1, fill_color: {field: "colors"},
  })
  h1 = new models.AnnularWedge({
    x: cx, y: cy,
    inner_radius: inner_radius, outer_radius: outer_radius,
    start_angle: {field: "start_angles"}, end_angle: {field: "end_angles"},
    line_color: null, line_width: 1, fill_color: {field: "colors"}, fill_alpha: 0.8,
  })
  r1 = new models.GlyphRenderer({
    data_source: source,
    glyph: g1,
    hover_glyph: h1,
  })

  g2 = new models.Text({
    x: {field: "text_cx"}, y: {field: "text_cy"},
    text: {field: opts.slice_labels ? "labels"},
    angle: {field: "text_angles"},
    text_align: "center", text_baseline: "middle",
    text_color: {field: "text_colors"}, text_font_size: "9pt",
  })
  r2 = new models.GlyphRenderer({
    data_source: source,
    glyph: g2,
  })

  xdr = new models.DataRange1d({renderers: [r1], range_padding: 0.2})
  ydr = new models.DataRange1d({renderers: [r1], range_padding: 0.2})
  plot = new models.Plot({x_range: xdr, y_range: ydr})

  if opts.width? then plot.plot_width = opts.width
  if opts.height? then plot.plot_height = opts.height

  plot.add_renderers(r1, r2)

  tooltip = "<div>@labels</div><div><b>@values</b> (@percentages)</div>"
  hover = new models.HoverTool({renderers: [r1], tooltips: tooltip})
  plot.add_tools(hover)

  return plot

export bar = (data, opts={}) ->
  column_names = data[0]
  rows = data.slice(1)

  columns = ([] for name in column_names)
  for row in rows
    for v, i in row
      columns[i].push(v)

  labels = columns[0].map((v) -> v.toString())
  columns = columns.slice(1)

  yaxis = new models.CategoricalAxis()
  ydr = new models.FactorRange({factors: labels})
  yscale = new models.CategoricalScale()

  if opts.axis_number_format?
    xformatter = new models.NumeralTickFormatter({format: opts.axis_number_format})
  else
    xformatter = new models.BasicTickFormatter()
  xaxis = new models.LinearAxis({formatter: xformatter})
  xdr = new models.DataRange1d({start: 0})
  xscale = new models.LinearScale()

  if isArray(opts.palette)
    palette = opts.palette
  else
    palette = palettes[opts.palette ? "Spectral11"].map(num2hexcolor)

  stacked = opts.stacked ? false
  orientation = opts.orientation ? "horizontal"

  renderers = []

  if stacked
    left = []
    right = []

    for i in [0...columns.length]
      bottom = []
      top = []
      for label, j in labels
        if i == 0
          left.push(0)
          right.push(columns[i][j])
        else
          left[j] += columns[i-1][j]
          right[j] += columns[i][j]
        bottom.push([label,-0.5])
        top.push([label, 0.5])

      source = new Bokeh.ColumnDataSource({
        data: {
          left: copy(left)
          right: copy(right)
          top: top
          bottom: bottom
          labels: labels
          values: columns[i]
          columns: ( column_names[i+1] for v in columns[i] )
        }
      })

      g1 = new models.Quad({
        left: {field: "left"}, bottom: {field: "bottom"},
        right: {field: "right"}, top: {field: "top"},
        line_color: null, fill_color: palette[i % palette.length],
      })
      r1 = new models.GlyphRenderer({ data_source: source, glyph: g1 })
      renderers.push(r1)
  else
    dy = 1/columns.length

    for i in [0...columns.length]
      left = []
      right = []
      bottom = []
      top = []
      for label, j in labels
        left.push(0)
        right.push(columns[i][j])
        bottom.push([label, i*dy-0.5])
        top.push([label, (i+1)*dy-0.5])

      source = new Bokeh.ColumnDataSource({
        data: {
          left: left
          right: right
          top: top
          bottom: bottom
          labels: labels
          values: columns[i]
          columns: ( column_names[i+1] for v in columns[i] )
        }
      })

      g1 = new models.Quad({
        left: {field: "left"}, bottom: {field: "bottom"},
        right: {field: "right"}, top: {field: "top"},
        line_color: null, fill_color: palette[i % palette.length],
      })
      r1 = new models.GlyphRenderer({ data_source: source, glyph: g1 })
      renderers.push(r1)

  if orientation == "vertical"
    [xdr, ydr] = [ydr, xdr]
    [xaxis, yaxis] = [yaxis, xaxis]
    [xscale, yscale] = [yscale, xscale]

    for r in renderers
      data = r.data_source.data
      [data.left, data.bottom] = [data.bottom, data.left]
      [data.right, data.top] = [data.top, data.right]

  plot = new models.Plot({x_range: xdr, y_range: ydr, x_scale: xscale, y_scale: yscale})

  if opts.width? then plot.plot_width = opts.width
  if opts.height? then plot.plot_height = opts.height

  plot.add_renderers(renderers...)
  plot.add_layout(yaxis, "left")
  plot.add_layout(xaxis, "below")

  tooltip = "<div>@labels</div><div>@columns:&nbsp<b>@values</b></div>"
  if orientation == "horizontal"
    anchor = "center_right"
    attachment = "horizontal"
  else
    anchor = "top_center"
    attachment = "vertical"
  hover = new models.HoverTool({
    renderers: renderers,
    tooltips: tooltip,
    point_policy: "snap_to_data",
    anchor: anchor,
    attachment: attachment,
    show_arrow: opts.show_arrow
  })
  plot.add_tools(hover)

  return plot
