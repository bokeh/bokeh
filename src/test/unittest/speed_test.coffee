window.rawtest = () ->
  maxval = 6000
  x = _.range(maxval)
  y = _.range(maxval)
  data = ({'x' : temp[0], 'y' : temp[1]} for temp in _.zip(x, y))
  scale1 = d3.scale.linear().domain([0, maxval]).range([0, 300])
  scale2 = d3.scale.linear().domain([0, maxval]).range([300, 0])
  $('body').append("<div><svg id='chart'></svg></div>")
  d3.select('#chart').attr('width', 300).attr('height', 300)
  a = new Date()
  for c in _.range(200)
    line = d3.svg.line().x((d) ->
      return scale1(d['x'])
    ).y((d) ->
      return scale2(d['y'])
    )
    path = d3.select('#chart').selectAll('path').data([data])
      .attr('d', line)
    path = d3.select('#chart').selectAll('path').data([data])
    path.attr('d', line)
    path.attr('stroke', '#000').attr('fill', 'none')

    path = path.enter().append('path')
    path.attr('d', line)
    path.attr('stroke', '#000').attr('fill', 'none')
  b = new Date()
  console.log(b - a)

#   container = Bokeh.Collections['InteractiveContext'].create(
#     {}, {'local' : true});
#   plot1 = Bokeh.line_plot(container, data_source, 'x', 'y')
#   container.set({'children' : [plot1.ref()]})
#   window.myrender = () ->
#     view = new container.default_view({'model' : container})
#     view.render()
#     window.view = view
#     plotview = view.views[plot1.id]
#     renderer = plot1.resolve_ref(plot1.get('renderers')[0])
#     scatterview = plotview.renderers[renderer.id]
#     a = new Date()
#     for c in _.range(100)
#       scatterview.render()
#     b = new Date()
#     console.log(b - a)
#   _.defer(window.myrender)
# )


window.basetest = () ->
  window.render = 0
  plotview = mainview.views[Continuum.Collections['Plot'].models[0].id]
  renderer = Continuum.Collections['LineRenderer'].models[0]
  rendererview = plotview.renderers[renderer.id]
  a = new Date()
  for c in _.range(200)
    rendererview.render()
  b = new Date()
  console.log(b - a)

window.basetest = () ->
  window.render = 0
  plotview = mainview.views[Continuum.Collections['Plot'].models[0].id]
  renderer = Continuum.Collections['LineRenderer'].models[0]
  rendererview = plotview.renderers[renderer.id]
  a = new Date()
  for c in _.range(400)
    rendererview.render()
    rendererview.render()
    for axisview in _.values(plotview.axes)
      axisview.render()
  b = new Date()
  console.log(b - a)

window.speedtest = () ->
  window.render = 0
  window.render_axis = 0
  plotview = mainview.views[Continuum.Collections['Plot'].models[0].id]
  pantoolview = plotview.tools[Continuum.Collections['PanTool'].models[0].id]
  a = new Date()
  #do 100, because we do 2 shifts per loop
  for c in _.range(100)
    pantoolview._drag(1, 1)
    pantoolview._drag(-1, -1)
  b = new Date()
  console.log(b - a)



