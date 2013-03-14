base = require("../base")
ContinuumView = base.ContinuumView
safebind = base.safebind
HasParent = base.HasParent
pandas_template = require("./pandaspivot")

ENTER = 13

# cut and paste from table.coffee for now... we'll probably eliminate
# have to refactor later
class PandasPivotView extends ContinuumView
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    @controls_hide = true
    @render()

  events :
    "keyup .pandasgroup" : 'pandasgroup'
    "keyup .pandasoffset" : 'pandasoffset'
    "keyup .pandassize" : 'pandassize'
    "change .pandasagg" : 'pandasagg'
    "click .pandasbeginning" : 'pandasbeginning'
    "click .pandasback" : 'pandasback'
    "click .pandasnext" : 'pandasnext'
    "click .pandasend" : 'pandasend'
    "click .controlsmore" : 'toggle_more_controls'
    "click .pandascolumn" : 'sort'

  sort : (e) =>
    colname = $(e.currentTarget).text()
    @model.toggle_column_sort(colname)

  toggle_more_controls : () =>
    if @controls_hide
      @controls_hide = false
    else
      @controls_hide = true
    @render()

  pandasbeginning : () =>
    @model.go_beginning()

  pandasback : () =>
    @model.go_back()

  pandasnext : () =>
    @model.go_forward()

  pandasend : () =>
    @model.go_end()

  pandasoffset : (e) ->
    if e.keyCode == ENTER
      offset = @$el.find('.pandasoffset').val()
      offset = Number(offset)
      if _.isNaN(offset)
        offset = @model.defaults.offset
      @model.save('offset', offset, {wait : true})

  pandassize : (e) ->
    if e.keyCode == ENTER
      sizetxt = @$el.find('.pandassize').val()
      size = Number(sizetxt)
      if _.isNaN(size) or sizetxt == ""
        size = @model.defaults.length
      if size + @mget('offset') > @mget('maxlength')
        size = @mget('maxlength') - @mget('offset')
      @model.save('length', size, {wait:true})

  pandasagg : () ->
    @model.save('agg', @$el.find('.pandasagg').val(), {'wait':true})

  fromcsv : (str) ->
    #string of csvs, to list of those values
    if not str
      return []
    return _.map(str.split(","), (x) -> return x.trim())

  pandasgroup : (e) ->
    if e.keyCode == ENTER
     @model.save('groups', @fromcsv(@$el.find(".pandasgroup").val()),
      {'wait':true})

  colors : () =>
    if @mget('counts') and @mget('selected')
      return _.map(_.zip(@mget('counts'), @mget('selected')), (temp) ->
        [count, selected] = temp
        alpha = selected / count
        return "rgba(0,0,255,#{alpha})"
      )
    else
      return null

  render : () ->
    groups = @mget('groups')
    if _.isArray(groups)
      groups = groups.join(",")
    sort = @mget('sort')
    if _.isArray(sort)
      sort = sort.join(",")
    colors = @colors()
    sort_ascendings = {}
    for obj in  @mget('sort')
      sort_ascendings[obj['column']] = obj['ascending']

    template_data =
      columns : @mget('columns')
      data : @mget('data')
      groups : groups
      sort_ascendings : sort_ascendings
      height : @mget('height')
      width : @mget('width')
      offset : @mget('offset')
      length : @mget('length')
      maxlength : @mget('maxlength')
      counts : @mget('counts')
      selected : @mget('selected')
      controls_hide : @controls_hide
      colors : colors
      index : @mget('index')
    @$el.empty()
    html = pandas_template(template_data)
    @$el.html(html)
    @$el.find("option[value=\"#{@mget('agg')}\"]").attr('selected', 'selected')
    @$el.addClass("bokehtable")

datasource = require("../datasource")

class PandasPlotSource extends datasource.ObjectArrayDataSource
  type : 'PandasPlotSource'
  initialize : (attrs, options) ->
    super(attrs, options)
    @select_serverside = _.throttle(@_select_serverside, 500)
    safebind(this, this, 'change:selected', @select_serverside)

  _select_serverside : () ->
    pandassource = @get_obj('pandassource')
    console.log('selecting', @get('selected'), pandassource)
    pandassource.save({selected : @get('selected')}, {wait : true})
    return null

class PandasPlotSources extends Backbone.Collection
  model : PandasPlotSource


class PandasPivot extends HasParent
  type : 'PandasPivot'
  initialize : (attrs, options)->
    super(attrs, options)
    @throttled_fetch = _.throttle((() => @fetch()), 500)

  dinitialize : (attrs, options) =>
    super(attrs, options)
    safebind(this, @get_obj('pandassource'), 'change', @throttled_fetch)

  fetch : (options) ->
    super(options)

  toggle_column_sort : (colname) =>
    sorting = @get('sort')
    @unset('sort', {'silent' : true})
    sort = _.filter(sorting, (x) -> return x['column'] == colname)
    if sort.length > 0
      sort = sort[0]
    else
      sorting = _.clone(sorting)
      sorting.push(column : colname, ascending : true)
      @save('sort', sorting, {'wait':true})
      return
    if sort['ascending']
      sort['ascending'] = false
      @save('sort', sorting, {'wait':true})
      return
    else
      sorting = _.filter(sorting, (x) -> return x['column'] != colname)
      @save('sort', sorting, {'wait':true})
      return

  go_beginning : () ->
    @set('offset', 0)
    @save()

  go_back : () ->
    offset = @get('offset')
    offset = offset - @get('length')
    if offset < 0
      offset = 0
    @set('offset', offset)
    @save()

  go_forward : () ->
    offset = @get('offset')
    offset = offset + @get('length')
    maxoffset = @get('maxlength') - @get('length')
    if offset > maxoffset
      offset = maxoffset
    @set('offset', offset)
    @save()

  go_end : () ->
    maxoffset = @get('maxlength') - @get('length')
    @set('offset', maxoffset)
    @save()

  defaults :
    path : ''
    sort : []
    groups : []
    agg : 'sum'
    offset : 0
    length : 100
    maxlength : 1000
    data : null
    columns : []
    width : 400
  default_view : PandasPivotView

class PandasPivots extends Backbone.Collection
  model : PandasPivot

class PandasDataSource extends HasParent
  type : 'PandasDataSource'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    selected : [] #pandas index of selected values
  save : (key, val, options) ->
    # Handle both `"key", value` and `{key: value}` -style arguments.
    if key == null or _.isObject(key)
      attrs = key
      options = val
    else
      attrs = {}
      attrs[key] = val
    #must patch for this model
    if not options
      options = {}
    options.patch = true
    super(attrs, options)

class PandasDataSources extends Backbone.Collection
  model : PandasDataSource

pandaspivots = new PandasPivots
exports.pandaspivots = pandaspivots
exports.PandasPivot = PandasPivot
exports.PandasPivotView = PandasPivotView

exports.PandasDataSource = PandasDataSource
exports.pandasdatasources = new PandasDataSources

exports.PandasPlotSource = PandasPlotSource
exports.pandasplotsources = new PandasPlotSources