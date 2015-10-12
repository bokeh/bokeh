fill_defaults =
  fill_color: 'gray'
  fill_alpha: 1.0

line_defaults =
  line_color: 'black'
  line_width: 1
  line_alpha: 1.0
  line_join: 'miter'
  line_cap: 'butt'
  line_dash: []
  line_dash_offset: 0

text_defaults =
  text_font: "helvetica"
  text_font_size: "12pt"
  text_font_style: "normal"
  text_color: "#444444"
  text_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

attrs =
  Axis:
    axis_line_color: 'black'
    axis_line_width: 1
    axis_line_alpha: 1.0
    axis_line_join: 'miter'
    axis_line_cap: 'butt'
    axis_line_dash: []
    axis_line_dash_offset: 0

    major_tick_in: 2
    major_tick_out: 6
    major_tick_line_color: 'black'
    major_tick_line_width: 1
    major_tick_line_alpha: 1.0
    major_tick_line_join: 'miter'
    major_tick_line_cap: 'butt'
    major_tick_line_dash: []
    major_tick_line_dash_offset: 0

    minor_tick_in: 0
    minor_tick_out: 4
    minor_tick_line_color: 'black'
    minor_tick_line_width: 1
    minor_tick_line_alpha: 1.0
    minor_tick_line_join: 'miter'
    minor_tick_line_cap: 'butt'
    minor_tick_line_dash: []
    minor_tick_line_dash_offset: 0

    major_label_standoff: 5
    major_label_orientation: "horizontal"
    major_label_text_font: "helvetica"
    major_label_text_font_size: "10pt"
    major_label_text_font_style: "normal"
    major_label_text_color: "#444444"
    major_label_text_alpha: 1.0
    major_label_text_align: "center"
    major_label_text_baseline: "alphabetic"

    axis_label: ""
    axis_label_standoff: 5
    axis_label_text_font: "helvetica"
    axis_label_text_font_size: "16pt"
    axis_label_text_font_style: "normal"
    axis_label_text_color: "#444444"
    axis_label_text_alpha: 1.0
    axis_label_text_align: "center"
    axis_label_text_baseline: "alphabetic"

  BoxAnnotation:
    fill_color: '#fff9ba'
    fill_alpha: 0.4
    line_color: '#cccccc'
    line_width: 1
    line_alpha: 0.3
    line_join: 'miter'
    line_cap: 'butt'
    line_dash: []
    line_dash_offset: 0

  Circle:
    size: 4 # XXX: Circle should be a marker, then this wouldn't be necessary.

  GMapPlot:
    border_fill: "#fff"

  Grid:
    band_fill_color: null
    band_fill_alpha: 0
    grid_line_color: '#cccccc'
    grid_line_width: 1
    grid_line_alpha: 1.0
    grid_line_join: 'miter'
    grid_line_cap: 'butt'
    grid_line_dash: []
    grid_line_dash_offset: 0
    minor_grid_line_color: null
    minor_grid_line_width: 1
    minor_grid_line_alpha: 1.0
    minor_grid_line_join: 'miter'
    minor_grid_line_cap: 'butt'
    minor_grid_line_dash: []
    minor_grid_line_dash_offset: 0

  Image:
    dilate: false

  ImageURL:
    angle: 0
    global_alpha: 1.0

  Legend:
    background_fill_color: '#fff'
    background_fill_alpha: 1.0

    border_line_color: 'black'
    border_line_width: 1
    border_line_alpha: 1.0
    border_line_join: 'miter'
    border_line_cap: 'butt'
    border_line_dash: []
    border_line_dash_offset: 0

    label_height: 20
    label_width: 50
    label_standoff: 15
    label_text_font: "helvetica"
    label_text_font_size: "10pt"
    label_text_font_style: "normal"
    label_text_color: "#444444"
    label_text_alpha: 1.0
    label_text_align: "left"
    label_text_baseline: "middle"

    glyph_height: 20
    glyph_width: 20

    legend_padding: 10
    legend_spacing: 3

    orientation: "top_right"

  Marker:
    size: 4
    angle: 0

  PolySelection:
    fill_color: null
    fill_alpha: 0.2
    line_color: 'grey'
    line_width: 3
    line_alpha: 0.8
    line_join: 'miter'
    line_cap: 'butt'
    line_dash: [4]
    line_dash_offset: 0

  Oval:
    angle: 0.0

  Plot:
    background_fill: "#fff",
    border_fill: "#fff",
    min_border: 40,
    title_standoff: 8,
    title_text_font: "helvetica",
    title_text_font_size: "20pt",
    title_text_font_style: "normal",
    title_text_color: "#444444",
    title_text_alpha: 1.0,
    title_text_align: "center",
    title_text_baseline: "alphabetic"

    outline_line_color: '#aaaaaa'
    outline_line_width: 1
    outline_line_alpha: 1.0
    outline_line_join: 'miter'
    outline_line_cap: 'butt'
    outline_line_dash: []
    outline_line_dash_offset: 0

  Rect:
    angle: 0.0
    dilate: false

  Span:
    color: "black"

  Wedge:
    direction: 'anticlock'

module.exports =
  attrs: attrs
  fill_defaults: fill_defaults
  line_defaults: line_defaults
  text_defaults: text_defaults