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
      <thead id ='header_id_na'></thead>
    """
    header_column = """
      <th><a href='#' onClick='cdxSortByColumn()' class='link'>{{column_name}}</a></th>
    """
    row_template = """
      <tr></tr>
    """
    datacell_template = """
      <td>{{data}}</td>
    """
    table = $(table_template)
    header = $(header_template)
    html = _.template(header_column, {'column_name' : '#'})
    header.append($(html))
    for colname in @mget('columns')
      html = _.template(header_column, {'column_name' : colname})
      header.append($(html))
    table.append(header)
    rowCount = data_source.get('offset')
    rawdata = @mget_ref('data_source').get('data')
    if not data_source.get('selecting')
      toiter = _.range(rawdata.length)
    else
      toiter = data_source.get('selected')
    for idx in toiter
      rowdata = rawdata[idx]
      row = $(row_template)
      datacell = $(_.template(datacell_template, {'data' : ++rowCount}))
      row.append(datacell)
      for colname in @mget('columns')
        datacell = $(_.template(datacell_template, {'data' : rowdata[colname]}))
        row.append(datacell)
      table.append(row)
    @$el.empty()
    @render_pagination()
    @$el.append(table)
    if @mget('usedialog') and not @$el.is(":visible")
      @add_dialog()

  render_pagination : ->
    data_source = @mget_ref('data_source')
    table_hdr_template = """
      <div>
        <div class="pull-left">
          <span>Total Rows: {{total_rows}}</span>
        </div>
        <div class="pull-right"></div>
      </div>
    """
    btn_group = $('<div class="btn-group"></div>')
    if data_source.get('offset') > 0
      node = $('<a class="btn" title="First Page" href="#"><i class="icon-fast-backward"></i></a>')
      btn_group.append(node)
      node.click(=>
        data_source.load(0)
        return false
      )
      node = $('<a class="btn" title="Previous Page" href="#"><i class="icon-step-backward"></i></a>')
      btn_group.append(node)
      node.click(=>
        data_source.load(_.max([data_source.get('offset') - data_source.get('chunksize'), 0]))
        return false
      )
    maxoffset = data_source.get('total_rows') - data_source.get('chunksize')
    if data_source.get('offset') < maxoffset
      node = $('<a class="btn" title="Next Page" href="#"><i class="icon-step-forward"></i></a>')
      btn_group.append(node)
      node.click(=>
        @model.load(_.min([
          data_source.get('offset') + data_source.get('chunksize'),
          maxoffset]))
        return false
      )
      node = $('<a class="btn" title="Last Page" href="#"><i class="icon-fast-forward"></i></a>')
      btn_group.append(node)
      node.click(=>
        @model.load(maxoffset)
        return false
      )

    table_hdr = $(_.template(table_hdr_template, {'total_rows' : data_source.get('total_rows')}))
    btn_group = $('<div class="pull-right"></div>').append(btn_group)
    @$el.append(btn_group)
    @$el.append(table_hdr)

Continuum.ui.DataTableView = DataTableView