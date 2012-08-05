
class DataTable extends Continuum.Component
  type : 'DataTable'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    data_source : null
    columns : []
  default_view : Continuum.ui.DataTableView
  load : (offset) ->
    @loaddeferred = $.Deferred()
    data_source = @get_ref('data_source')
    $.when(data_source.loaddeferred).then(() =>
      console.log('setting columns', data_source.get('columns'))
      @set('columns', data_source.get('columns'))
      @loaddeferred.resolve()
    )
    return @loaddeferred

class DataTables extends Backbone.Collection
  model : DataTable

Continuum.register_collection('DataTable', new DataTables())
Continuum.ui.DataTable = DataTable
Continuum.ui.DataTables = DataTables