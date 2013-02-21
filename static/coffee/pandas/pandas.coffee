base = require("../base")
ContinuumView = base.ContinuumView
safebind = base.safebind
HasParent = base.HasParent
pandas_template = require("./pandaspivot")

# cut and paste from table.coffee for now... we'll probably eliminate
# have to refactor later

class PandasPivotView extends ContinuumView
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    @render()

  render : () ->
    template_data =
      columns : @mget('columns')
      data : @mget('data')
    @$el.empty()
    html = pandas_template(template_data)
    @$el.html(html)
    @$el.height(@mget('height'))
    @$el.width(@mget('width'))
    @$el.addClass("bokehtable")

class PandasPivot extends HasParent
  type : 'PandasPivot'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    path : ''
    sort : []
    groups : []
    agg : 'sum'
    offset : 0
    length : 100
    data : null
    columns : []
  default_view : PandasPivotView

class PandasPivots extends Backbone.Collection
  model : PandasPivot

pandaspivots = new PandasPivots
exports.pandaspivots = pandaspivots
exports.PandasPivot = PandasPivot
exports.PandasPivotView = PandasPivotView
