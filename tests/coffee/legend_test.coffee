base = require("../base")
Collections = base.Collections
testutils = require("../testutils")

range = Collections('Range1d').create({start: 0, end: 10})
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
test('legend_test', () ->
  expect(0)
  plot_model = testutils.make_glyph_plot(data_source,
    defaults, glyph, range,range)
  glyph_renderer = (x for x in plot_model.get_obj('renderers') \
    when x.type == 'GlyphRenderer')[0]
  legend = Collections("AnnotationRenderer").create(
    plot : plot_model.ref()
    annotationspec:
      type : "legend"
      orientation : "top_right"
      padding : 10;
      label_height : 20;
      glyph_height : 20;
      glyph_width : 20;
      label_width : 20;
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
