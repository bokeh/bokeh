
class DataTable extends Continuum.Component
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
  default_view : Continuum.ui.DataTableView
  convert_raw_data : (arraydata) ->
    #converts raw data from blaze into object array data source data,
    # raw : {'data' : [[1,2,3],[2,3,4]] #2d array, 'colnames' : ['a', 'b', 'c']}
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
    $.get("/data" + @get('url'), {data_slice : JSON.stringify(slice)},
      (data) =>
        arraydata = JSON.parse(data)
        transformed = @convert_raw_data(arraydata)
        @set(
          data_slice : slice
          columns : arraydata['colnames']
          total_rows: arraydata['shape'][0]
        )
        @get_ref('data_source').set('data', transformed)
        return null
    )
class DataTables extends Backbone.Collection
  model : DataTable

Continuum.register_collection('DataTable', new DataTables())
Continuum.ui.DataTable = DataTable
Continuum.ui.DataTables = DataTables