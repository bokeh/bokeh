
class DataTable extends Component
  type : 'DataTable'
  initialize : (attrs, options)->
    super(attrs, options)
    @register_property('offset', ['data_slice'],
      (() -> return @get('data_slice')[0]), false
    )
    @register_property('chunksize', ['data_slice'],
      (() -> return @get('data_slice')[1] - @get('data_slice')[0]),
      false
    )
  defaults :
    data_source : null
    columns : []
    data_slice : [0, 100]
    total_rows : 0
  default_view : DataTableView
  load : (offset) ->
    $.get("/data" + @get('url'),
      data_slice : JSON.stringify(@get('data_slice')) ,
      (data) =>
          @set('data_slice',
            [offset, offset + @get('chunksize')],
            {silent:true})
          @set({'data' : JSON.parse(data)['data']})
    )

class DataTables extends Backbone.Collection
  model : DataTable


class Table extends Component
  type : 'Table'
  dinitialize : (attrs, options)->
    super(attrs, options)
    @register_property('offset', ['data_slice'],
      (() -> return @get('data_slice')[0]), false
    )
    @register_property('chunksize', ['data_slice'],
      (() -> return @get('data_slice')[1] - @get('data_slice')[0]),
      false
    )

  defaults :
    url : ""
    columns : []
    data : [[]]
    data_slice : [0, 100]
    total_rows : 0
  default_view : TableView
  load : (offset) ->
    $.get(@get('url'),
        data_slice : JSON.stringify(@get('data_slice'))
      ,
        (data) =>
          @set('data_slice',
            [offset, offset + @get('chunksize')],
            {silent:true})
          @set({'data' : JSON.parse(data)['data']})
    )

class Tables extends Backbone.Collection
  model : Table
  url : "/bb"

    
class CDXPlotContext extends Component
  type : 'CDXPlotContext',
  default_view : CDXPlotContextView
  defaults :
    children : []
    render_loop : true
    
class CDXPlotContexts extends Backbone.Collection
  model : CDXPlotContext


class InteractiveContext extends Component
  type : 'InteractiveContext',
  default_view : InteractiveContextView
  defaults :
    children : []
    width : $(window).width()
    height : $(window).height()
    render_loop : true
class InteractiveContexts extends Backbone.Collection
  model : InteractiveContext

Continuum.register_collection('Table', new Tables())
Continuum.register_collection('InteractiveContext', new InteractiveContexts())
Continuum.register_collection('DataTable', new DataTables())
Continuum.register_collection('CDXPlotContext', new CDXPlotContexts())

