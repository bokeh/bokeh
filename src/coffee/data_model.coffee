
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
    url : ''
  default_view : DataTableView
  convert_raw_data : (arraydata) ->
    #converts raw data from blaze into object array data source data,
    # raw : {'data' : [[1,2,3],[2,3,4]] #2d array, 'cols' : ['a', 'b', 'c']}
    # converted : [{'a': 1, 'b' : 2, 'c' :3}, {'a' : 2, 'b' : 3, 'c': 4}]
    transformed = []
    for row in arraydata['data']
      transformedrow = {}
      for temp in _.zip(row, arraydata['colnames'])
        [val, colname] = temp
        transformedrow[colname] = val
      transformed.push(transformedrow)
    return transformed

  load : (offset) ->
    slice = [offset, offset + @get('chunksize')]
    $.get("/data" + @get('url'),
        data_slice : JSON.stringify(slice)
      ,
        (data) =>
          @set(
            data_slice : slice
          )
          transformed = @convert_raw_data(JSON.parse(data))
          @get_ref('data_source').set('data', transformed)
          return null
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
