_ = require "underscore"
$ = require "jquery"

BokehView = require "core/bokeh_view"
p = require "core/properties"
LayoutDOM = require "models/layouts/layout_dom"

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
    @_graph = new vis.Graph3d(@$el[0], @get_data(), @mget('options'))
    @listenTo(@mget('data_source'), 'change', () =>
        @_graph.setData(@get_data())
    )

  get_data: () ->
    data = new vis.DataSet()
    source = @mget('data_source')
    for i in [0...source.get_length()]
      data.add({
        x:     source.get_column(@model.x)[i]
        y:     source.get_column(@model.y)[i]
        z:     source.get_column(@model.z)[i]
        style: source.get_column(@model.color)[i]
      })
    return data

class Surface3d extends LayoutDOM.Model
  default_view: Surface3dView
  type: "Surface3d"

  @define {
    x:           [ p.String       ]
    y:           [ p.String       ]
    z:           [ p.String       ]
    color:       [ p.String       ]
    data_source: [ p.Instance     ]
    options :    [ p.Any, OPTIONS ]
  }

module.exports =
  Model: Surface3d
  View: Surface3dView
