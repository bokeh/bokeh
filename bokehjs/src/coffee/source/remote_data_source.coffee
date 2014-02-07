
define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->

  class RemoteDataSource extends HasProperties
    # Datasource where the data is defined column-wise, i.e. each key in the
    # the data attribute is a column name, and its value is an array of scalars.
    # Each column should be the same length.
    type: 'RemoteDataSource'

    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}

    stoplistening_for_line1d_updates : (column_data_source) ->
      if @callbacks[column_data_source.get('id')]
        for entry in @callbacks[column_data_source.get('id')]
          @stopListening.apply(this, entry)

    listen_for_line1d_updates : (column_data_source, domain_range, screen_range
                                  primary_column, domain_name, columns) ->
      #ensure we only have one set of events bound
      @stoplistening_for_line1d_updates(column_data_source)
      @line1d_update(column_data_source, domain_range, screen_range
          primary_column, domain_name, columns
        )
      callback = () => @line1d_update(column_data_source, domain_range, screen_range
          primary_column, domain_name, columns
        )
      @listenTo(screen_range, 'change', callback)
      @listenTo(domain_range, 'change', callback)
      @callbacks[column_data_source.get('id')] = [
        [screen_range, 'change', callback],
        [domain_range, 'change', callback]
      ]

    line1d_update : (column_data_source, domain_range, screen_range,
                     primary_column, domain_name, columns) ->
      data_url = @get('data_url')
      owner_username = @get('owner_username')
      prefix = @base().Config.prefix
      url = "#{prefix}/bokeh/data2/#{owner_username}#{data_url}"
      domain_resolution = (screen_range.get('end') - screen_range.get('start')) / 2
      domain_resolution = Math.floor(domain_resolution)
      domain_limit = [domain_range.get('start'), domain_range.get('end')]
      if _.any(_.map(domain_limit, (x) -> _.isNaN(x)))
        domain_limit = 'auto'
      params = [primary_column, domain_name, columns,
          domain_limit
        , domain_resolution]
      params = JSON.stringify(params)
      $.ajax(
        dataType: 'json'
        url : url
        xhrField :
          withCredentials : true
        success : (data) ->
          if domain_limit == 'auto'
            domain_range.set(
              start : data.domain_limit[0],
              end : data.domain_limit[1]
            )
            console.log('setting range', data.domain_limit)
          column_data_source.set('data', data.data)
          console.log('setting data', _.values(data.data)[0].length)
        data :
          downsample_function : 'line1d'
          downsample_parameters : params
      )

  class RemoteDataSources extends Backbone.Collection
    model: RemoteDataSource
  return {
    "Model": RemoteDataSource,
    "Collection": new RemoteDataSources()
  }
