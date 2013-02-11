base = require("../../base")
Collections = base.Collections


make_glyph_test = (test_name, data_source, defaults, glyphs, xrange, yrange, tools=false, dims=[200, 200]) ->
  return () ->
    expect(0)
    plot_tools = []
    if tools
      pantool = Collections('PanTool').create(
        dataranges : [xrange.ref(), yrange.ref()]
        dimensions : ['width', 'height']
      )
      zoomtool = Collections('ZoomTool').create(
        dataranges : [xrange.ref(), yrange.ref()]
        dimensions : ['width', 'height']
      )
      plot_tools = [pantool, zoomtool]
    glyph_renderer = Collections('GlyphRenderer').create(
      data_source : data_source.ref()
      xdata_range : xrange.ref()
      ydata_range : yrange.ref()
    )
    glyph_renderer.set(defaults)
    glyph_renderer.set("glyphs", glyphs)
    plot_model = Collections('Plot').create()
    xaxis = Collections('LinearAxis').create(
      orientation : 'bottom'
      parent : plot_model.ref()
      data_range : xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation : 'left',
      parent : plot_model.ref()
      data_range : yrange.ref()
    )
    plot_model.set(
      renderers : [glyph_renderer.ref()],
      axes : [xaxis.ref(), yaxis.ref()]
      tools : plot_tools
      width : dims[0]
      height : dims[1]
    )
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  ->
      view = new plot_model.default_view(model : plot_model)
      div.append(view.$el)
      view.render()
      console.log('Test ' + test_name)
    _.defer(myrender)


exports.make_glyph_test = make_glyph_test
