base = require("../base")
Collections = base.Collections
testutils = require("../testutils")
line_plot = testutils.line_plot
scatter_plot = testutils.scatter_plot
glyph_plot = testutils.glyph_plot

test('legend_test', () ->
  data_source = Collections('ObjectArrayDataSource').create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
      }, {'local' : true})
  plotmodel = scatter_plot(null, data_source, 'x', 'y', null, 'circle');
  legend = Collections('Legend').create(
    legends: [{name: "widgets", color:"#888", source_field:"x"},
              {name: "quxbits", color:"#00F", source_field:"Y"}],
    position: "top_right",
    parent : plotmodel.ref()
  )
  old_renderers = plotmodel.get('renderers')
  old_renderers.push(legend.ref())
  plotmodel.set('renderers', old_renderers)
  window.plot = plotmodel
  div = $('<div/>')
  $('body').append(div)
  myrender  =  ->
    view = new plotmodel.default_view(model : plotmodel)
    div.append(view.$el)
    view.render()
  console.log('test_simple_plot')
  _.defer(myrender)
  expect(0)
)