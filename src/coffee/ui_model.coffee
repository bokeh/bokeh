
class DataTable extends Continuum.Component
  type : 'DataTable'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    data_source : null
    columns : []
  default_view : Continuum.ui.DataTableView
  load : (offset) ->
    data_source = @get_ref('data_source')
    deferred = data_source.load(offset)
    $.when(deferred).then(() =>
      @set('columns', data_source.get('columns'))
    )
    return null

class DataTables extends Backbone.Collection
  model : DataTable

Continuum.register_collection('DataTable', new DataTables())
Continuum.ui.DataTable = DataTable
Continuum.ui.DataTables = DataTables