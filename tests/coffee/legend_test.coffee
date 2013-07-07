base = require("../base")
Collections = base.Collections
testutils = require("../testutils")

xrange = Collections('Range1d').create({start: 0, end: 10})
yrange = Collections('Range1d').create({start: 0, end: 10})
defaults = {}
data_source = Collections('ObjectArrayDataSource').create(
  data: [
    {x: 1, y: 5, lwidth: 7},
    {x: 2, y: 4, lwidth: 4},
    {x: 3, y: 3},
    {x: 4, y: 2, lwidth: 2},
    {x: 5, y: 1},
  ]
)

glyph = {
  radius: 10
  line_width:
    field: 'lwidth'
    default: .5
  type: 'circle'
  fill: 'blue'
  x: 'x'
  y: 'y'
}

glyph2 = {
  width: 10
  width_units: 'screen'
  height : 10
  height_units: 'screen'
  line_width:
    field: 'lwidth'
    default: .5
  type: 'rect'
  fill: 'green'
  x: 'x'
  y: 'y'
}

test('legend_test', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "top_right"
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('legend_test', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "top_left"
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('legend_absolute', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "absolute"
      absolute_coords : [100,100]
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('legend_bottom_left', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "bottom_left"
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('legend_bottom_right', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "bottom_right"
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)

test('legend_rect_test', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source, defaults, glyph2, xrange, yrange, {})
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  glyph_renderer.set('reference_point', 3)
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "top_right"
      legends:
        fakelabel : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
    )
  plot_model.get('renderers').push(legend.ref())
  div = $('<div></div>')
  $('body').append(div)
  myrender  =  ->
    view = new plot_model.default_view(model: plot_model)
    div.append(view.$el)
  _.defer(myrender)
)
