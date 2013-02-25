base = require("../base")
ContinuumView = base.ContinuumView
safebind = base.safebind
HasParent = base.HasParent
pandas_template = require("./pandaspivot")

ENTER = 13

# cut and paste from table.coffee for now... we'll probably eliminate
# have to refactor later
class PandasPivotView extends ContinuumView
  events :
    "keyup .pandasgroup" : 'pandasgroup'
    "keyup .pandassort" : 'pandassort'
    "change .pandasagg" : 'pandasagg'

  pandasagg : () ->
    @mset('agg', @$el.find('.pandasagg').val())
    @model.save()

  fromcsv : (str) ->
    #string of csvs, to list of those values
    if not str
      return []
    return _.map(str.split(","), (x) -> return x.trim())

  pandasgroup : (e) ->
    if e.keyCode == ENTER
     @mset('groups', @fromcsv(@$el.find(".pandasgroup").val()))
     @model.save()

  pandassort : (e) ->
    if e.keyCode == ENTER
     @mset('sort', @fromcsv(@$el.find(".pandassort").val()))
     @model.save()

  initialize : (options) ->
    super(options)
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    @render()

  render : () ->
    groups = @mget('groups')
    if _.isArray(groups)
      groups = groups.join(",")
    sort = @mget('sort')
    if _.isArray(sort)
      sort = sort.join(",")

    template_data =
      columns : @mget('columns')
      data : @mget('data')
      groups : groups
      sort : sort
      height : @mget('height')
      width : @mget('width')

    @$el.empty()
    html = pandas_template(template_data)
    @$el.html(html)
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

class PandasDataSource extends HasParent
  type : 'PandasDataSource'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    selected : [] #pandas index of selected values

class PandasDataSources extends Backbone.Collection
  model : PandasDataSource

pandaspivots = new PandasPivots
exports.pandaspivots = pandaspivots
exports.PandasPivot = PandasPivot
exports.PandasPivotView = PandasPivotView

exports.PandasDataSource = PandasDataSource
exports.pandasdatasources = new PandasDataSources