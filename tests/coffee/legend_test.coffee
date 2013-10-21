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
  fill_color: 'blue'
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
  fill_color: 'green'
  x: 'x'
  y: 'y'
}

linspace = (start, end, points) ->
  diff = end - start
  step = diff/(points + 0.0)
  (x for x in _.range(start, end, step))



xs = linspace(0, 4 * Math.PI, 100)
ys = xs.map(Math.sin)
ys2 = ys.map(((y) -> y*2))
ys3 = ys.map(((y) -> y*3))

trig_datasource = Collections('ColumnDataSource').create(
  data:
    x: xs,
    y1: ys,
    y2: ys2,
    y3: ys3)

xdr = Collections('DataRange1d').create(
  sources: [{ref: trig_datasource.ref(), columns: ['x']}])

ydr = Collections('DataRange1d').create(
  sources: [{ref: trig_datasource.ref(), columns: ['y1']}])

line1 = {x: 'x', y: 'y1',  type: 'line', height:5, width:5}

test('legend_test_overlap', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(trig_datasource, defaults, line1, xdr, ydr, {})

  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "top_right"
      legends:
        'asdf fakelabel' : [glyph_renderer.ref()]
        fakelabel2 : [glyph_renderer.ref()]
        fakelabel3 : [glyph_renderer.ref()]
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
