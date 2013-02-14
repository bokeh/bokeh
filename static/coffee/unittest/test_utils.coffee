base = require("../../base")
Collections = base.Collections

class Rand
  # if created without a seed, uses current time as seed
  constructor: (@seed) ->
    # Knuth and Lewis' improvements to Park and Miller's LCPRNG
    @multiplier = 1664525
    @modulo = 4294967296 # 2**32-1;
    @offset = 1013904223
    unless @seed? && 0 <= seed < @modulo
      @seed = (new Date().valueOf() * new Date().getMilliseconds()) % @modulo

  # sets new seed value
  seed: (seed) ->
    @seed = seed

  # return a random integer 0 <= n < @modulo
  randn: ->
    # new_seed = (a * seed + c) % m
    @seed = (@multiplier*@seed + @offset) % @modulo

 # return a random float 0 <= f < 1.0
  randf: ->
    this.randn() / @modulo

  # return a random int 0 <= f < n
  rand: (n) ->
    Math.floor(this.randf() * n)

  # return a random int min <= f < max
  rand2: (min, max) ->
    min + this.rand(max-min)



make_glyph_test = (test_name, data_source, defaults, glyph, xrange, yrange, tools=false, dims=[200, 200]) ->
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
    glyph_renderer = Collections('RayRenderer').create({
      data_source : data_source.ref()
      xdata_range : xrange.ref()
      ydata_range : yrange.ref()
      glyphspec : glyph
    })
    glyph_renderer.set(defaults)
    glyph_renderer.set("glyphs", [glyph])
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
exports.Rand = Rand
