_ = require "underscore"
$ = require "jquery"

BokehView = require "core/bokeh_view"
p = require "core/properties"
Component = require "models/component"

OPTIONS =
  width:  '600px'
  height: '600px'
  style: 'surface'
  showPerspective: true
  showGrid: true
  keepAspectRatio: true
  verticalRatio: 1.0
  legendLabel: 'stuff'
  cameraPosition:
    horizontal: -0.35
    vertical: 0.22
    distance: 1.8

class Surface3dView extends BokehView

  initialize: (options) ->
    super(options)
    data = @set_data()
    @container = $(@mget('selector'));
    debugger
    @graph = new vis.Graph3d(@container[0], data, @model.options)
    @bind_bokeh_events()

  set_data: () ->
    data = new vis.DataSet()
    source = @mget('data_source')
    for i in [0...source.get_length()]
      data.add({
        x:     source.get_column(@mget('x'))[i]
        y:     source.get_column(@mget('y'))[i]
        z:     source.get_column(@mget('z'))[i]
        style: source.get_column(@mget('color'))[i]
      })
    return data

  bind_bokeh_events: () ->
    @listenTo(@mget('data_source'), 'change', () =>
        @graph.setData(@set_data())
    )

class Surface3d extends Component.Model
  default_view: Surface3dView
  type: "Surface3d"

  props: ->
    return _.extend {}, super(), {
      x:           [ p.String       ]
      y:           [ p.String       ]
      z:           [ p.String       ]
      color:       [ p.String       ]
      data_source: [ p.Instance     ]
      selector:    [ p.String       ]
      options :    [ p.Any, OPTIONS ]
    }

module.exports =
  Model: Surface3d
  View: Surface3dView
