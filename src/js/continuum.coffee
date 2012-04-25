if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum
Collections = {}
Continuum.Collections = Collections
Continuum.register_collection = (key, value) ->
  Collections[key] = value
  value.bokeh_key = key

class ContinuumView extends Backbone.View
  initialize : (options) ->
    if not _.has(options, 'id')
      this.id = _.uniqueId('ContinuumView')

  remove : ->
    @model.off(null, null, this)
    super()

  tag_selector : (tag, id) ->
    return "#" + @tag_id(tag, id)

  tag_id : (tag, id) ->
    if not id
      id = this.id
    tag + "-" + id
  tag_el : (tag, id) ->
    @$el.find("#" + this.tag_id(tag, id))
  tag_d3 : (tag, id) ->
    val = d3.select(this.el).select("#" + this.tag_id(tag, id))
    if val[0][0] == null
      return null
    else
      return val
  mget : (fld)->
    return @model.get(fld)
  mget_ref : (fld) ->
    return @model.get_ref(fld)

class TableView extends ContinuumView
  delegateEvents: ->
    @model.on('destroy', @remove)
    @model.on('change', @render)

  render : ->
    @$el.empty()
    @$el.append("<table></table>")
    @$el.find('table').append("<tr></tr>")
    headerrow = $(@$el.find('table').find('tr')[0])
    for column, idx in @mget('columns')
      elem = $(_.template('<th class="tableelem tableheader">{{ name }}</th>', {'name' : column}))
      headerrow.append(elem)
    for row, idx in @mget('data')
      row_elem = $("<tr class='tablerow'></tr>")
      for data in row
        elem = $(_.template("<td class='tableelem'>{{val}}</td>", {'val':data}))
        row_elem.append(elem)
      @$el.find('table').append(row_elem)
    if !@$el.is(":visible")
      @$el.dialog(
        close :  () =>
          @remove()
      )

class Table extends Backbone.Model
  defaults :
    columns : []
    data : [[]]
  default_view : TableView

class Tables extends Backbone.Collection
  model : Table
  url : "/"

Continuum.register_collection('Table', new Tables())