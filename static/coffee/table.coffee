base = require("./base")
ContinuumView = base.ContinuumView
safebind = base.safebind
HasParent = base.HasParent

class DataTableView extends ContinuumView
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    safebind(this, @mget_obj('data_source'), 'change', @render)
    @render()

  className: 'div'

  render : () ->
    data_source = @mget_obj('data_source')
    table_template = """
		<table class='table table-striped table-bordered table-condensed' id='tableid_na'></table>
    """
    header_template = """
    <thead></thead>
    """
    header_column = """
      <th><%= column_name %></th>
    """
    row_template = """
      <tr></tr>
    """
    datacell_template = """
      <td><%= data %></td>
    """
    table = $(table_template)
    header = $(header_template)
    for colname in @mget('columns')
      html = _.template(header_column, {'column_name' : colname})
      header.append($(html))
    table.append(header)
    rawdata = @mget_obj('data_source').get('data')
    if not data_source.get('selecting')
      toiter = _.range(rawdata.length)
    else
      toiter = data_source.get('selected')
    for idx in toiter
      rowdata = rawdata[idx]
      row = $(row_template)
      for colname in @mget('columns')
        datacell = $(_.template(datacell_template, {'data' : rowdata[colname]}))
        row.append(datacell)
      table.append(row)
    @$el.empty()
    @$el.html(table)
    @$el.height(@mget('height'))
    @$el.width(@mget('width'))
    @$el.addClass("bokehtable")

class DataTable extends HasParent
  type : 'DataTable'
  initialize : (attrs, options)->
    super(attrs, options)
  defaults :
    data_source : null
    columns : []
  default_view : DataTableView

class DataTables extends Backbone.Collection
  model : DataTable

exports.datatables = new DataTables()
exports.DataTable = DataTable
exports.DataTableView = DataTableView
