Collections = Bokeh.Collections
Bokeh.scatter_plot = (parent, data_source, xfield, yfield, color_field, mark, colormapper, local) ->
  if _.isUndefined(local)
    local = true
  options = {'local' : local}
  if _.isUndefined(mark)
    mark = 'circle'
  if _.isUndefined(color_field)
    color_field = null
  if _.isUndefined(color_mapper) and color_field
    color_mapper = Collections['DiscreteColorMapper'].create({
      data_range : Collections['DataFactorRange'].create({
        data_source : data_source.ref()
        columns : ['x']
      }, options)
    }, options)

  source_name = data_source.get('name')
  plot_model = Collections['Plot'].create(
    data_sources :
      source_name : data_source.ref()
    parent : parent
    , options
  )
  xdr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [xfield]}]
  }, options)
  ydr = Collections['DataRange1d'].create({
    'sources' : [{'ref' : data_source.ref(), 'columns' : [yfield]}]
  }, options)
  scatter_plot = Collections["ScatterRenderer"].create(
    data_source: data_source.ref()
    xdata_range : xdr.ref()
    ydata_range : ydr.ref()
    xfield: xfield
    yfield: yfield
    color_field: color_field
    color_mapper : color_mapper
    mark: mark
    parent : plot_model.ref()
    , options
  )
  xaxis = Collections['LinearAxis'].create({
    'orientation' : 'bottom',
    'parent' : plot_model.ref()
    'data_range' : xdr.ref()

  }, options)
  yaxis = Collections['LinearAxis'].create({
    'orientation' : 'left',
    'parent' : plot_model.ref()
    'data_range' : ydr.ref()
  }, options)
  plot_model.set({
    'renderers' : [scatter_plot.ref()],
    'axes' : [xaxis.ref(), yaxis.ref()]
  }, options)
  plot_model
test_f =  ->

    data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
      }, {'local' : true})
    plotmodel = Bokeh.scatter_plot(null, data_source, 'x', 'y', null, 'circle');

    legend = Collections['Legend'].create(
      legends: [{name: "widgets", color:"#888", source_field:"x"},
                {name: "quxbits", color:"#00F", source_field:"Y"}],
      position: "top_right",
      parent : plotmodel.ref())
    old_renderers = plotmodel.get('renderers')
    old_renderers.push(legend.ref())
    plotmodel.set('renderers', old_renderers)



    window.plot = plotmodel
    div = $('<div/>')
    $('body').append(div)
    myrender  =  ->
      view = new Bokeh.PlotView('model' : plotmodel, 'render_loop' : true)
      div.append(view.$el)
      view.render()
    console.log('test_simple_plot')
    _.defer(myrender)
    expect(0)

test('legend_test', test_f)
