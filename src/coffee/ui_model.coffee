
class DataTable extends Continuum.HasParent
  type : 'DataTable'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    data_source : null
    columns : []
  default_view : Continuum.ui.DataTableView

class DataTables extends Backbone.Collection
  model : DataTable

if not Continuum.Collections.DataTable
  Continuum.Collections.DataTable = new DataTables()

Continuum.ui.DataTable = DataTable
Continuum.ui.DataTables = DataTables