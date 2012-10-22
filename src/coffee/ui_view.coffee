# module setup stuff
if this.Continuum
  Continuum = this.Continuum
else
  Continuum = {}
  this.Continuum = Continuum
if not Continuum.ui
  Continuum.ui = {}

class DataTableView extends Continuum.ContinuumView
  initialize : (options) ->
    super(options)
    Continuum.safebind(this, @model, 'destroy', @remove)
    Continuum.safebind(this, @model, 'change', @render)
    Continuum.safebind(this, @mget_ref('data_source'), 'change', @render)
    @render()

  className: 'div'

  render : () ->
    data_source = @mget_ref('data_source')
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
    rawdata = @mget_ref('data_source').get('data')
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
    @$el.height(300)
    @$el.width(300)
    @$el.addClass("bokehtable")

Continuum.ui.DataTableView = DataTableView