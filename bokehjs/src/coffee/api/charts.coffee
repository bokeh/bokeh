_ = require("underscore")
$ = require("jquery")
sprintf = require("sprintf")
{Document} = require("../document")
embed = require("../embed")
models = require("./models")
palettes = require("../palettes/palettes")

sum = (array) ->
  return array.reduce(((a, b) => a + b), 0)

cumsum = (array) ->
  result = []
  array.reduce(((a, b, i) -> result[i] = a + b), 0)
  return result

num2hexcolor = (num) -> sprintf("#%06x", num)
hexcolor2rgb = (color) ->
  r = parseInt(color.substr(1, 2), 16)
  g = parseInt(color.substr(3, 2), 16)
  b = parseInt(color.substr(5, 2), 16)
  return [r, g, b]

is_dark = ([r, g, b]) ->
  l = 1 - (0.299*r + 0.587*g + 0.114*b)/255
  return l >= 0.6

pie = (data, opts) ->
  labels = _.clone(data.labels)
  values = _.clone(data.values)

  i = 0
  while i < values.length
    if values[i] <= 0
      labels.splice(i, 1)
      values.splice(i, 1)
    else
      i++

  start_angle = opts.start_angle ? 0
  end_angle = opts.end_angle ? (start_angle + 2*Math.PI)

  angle_span = Math.abs(end_angle - start_angle)
  to_radians = (x) -> angle_span*x

  total_value = sum(values)
  normalized_values = values.map((v) -> v/total_value)
  cumulative_values = cumsum(normalized_values)

  end_angles = cumulative_values.map((v) -> start_angle + to_radians(v))
  start_angles = [start_angle].concat(end_angles.slice(0, -1))
  half_angles = _.zip(start_angles, end_angles).map(([start, end]) => (start + end)/2)

  if not opts.center?
    cx = 0
    cy = 0
  else if _.isArray(opts.center)
    cx = opts.center[0]
    cy = opts.center[1]
  else
    cx = opts.center.x
    cy = opts.center.y

  inner_radius = opts.inner_radius ? 0
  outer_radius = opts.outer_radius ? 1

  if _.isArray(opts.palette)
    palette = opts.palette
  else
    palette = palettes[opts.palette ? "Spectral11"].map(num2hexcolor)

  colors = ( palette[i % palette.length] for i in [0...normalized_values.length] )
  text_colors = colors.map((c) -> if is_dark(hexcolor2rgb(c)) then "white" else "black")

  to_cartesian = (r, alpha) -> [r*Math.cos(alpha), r*Math.sin(alpha)]

  half_radius = (inner_radius+outer_radius)/2
  [text_cx, text_cy] = _.unzip(half_angles.map((half_angle) => to_cartesian(half_radius, half_angle)))
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
  plot = new models.Plot({
    x_range: xdr, y_range: ydr,
    plot_width: 300, plot_height: 300,
    min_border_top: 10, min_border_right: 10, min_border_bottom: 10, min_border_left: 10,
  })
  plot.add_renderers(r1, r2)

  tooltip = "<div>@labels</div><div><b>@values</b> (@percentages)</div>"
  hover = new models.HoverTool({plot: plot, renderers: [r1], tooltips: tooltip})
  plot.add_tools(hover)

  return plot

module.exports = {
  pie: pie
}
