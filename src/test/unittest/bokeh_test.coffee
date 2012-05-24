asyncTest('test_datarange1d', ->
  # Bokeh.Collections['ObjectArrayDataSource'].on('create', () ->
  #   console.log('create'))

  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : -2},
    	{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -6}]
  });
  datarange = Bokeh.Collections['DataRange1d'].create({
      'sources' : [{'ref' : data_source.ref(), 'columns' : ['x', 'y']}]
      'rangepadding' : 0.0
  })
  _.defer(() ->
    ok(datarange.get('start') == -6)
    ok(datarange.get('end') == 5)
    data_source.set('data', [{x : 1, y : -2},
      	{x : 2, y : -3},
    		{x : 3, y : -4},
    		{x : 4, y : -5},
    		{x : 5, y : -100}])
    ok(datarange.get('start') == -100)
    ok(datarange.get('end') == 5)
    start()
  )
)

asyncTest('test_datarange1d_multiple_sources', ->
  # Bokeh.Collections['ObjectArrayDataSource'].on('create', () ->
  #   console.log('create'))

  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : -2},
    	{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -6}]
  });
  data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{xx : 10, yy : -20},
    	{xx : 20, yy : -30},
  		{xx : 30, yy : -40},
  		{xx : 40, yy : -50},
  		{xx : 50, yy : -60}]
  });
  datarange = Bokeh.Collections['DataRange1d'].create({
      'sources' : [
        {'ref' : data_source.ref(), 'columns' : ['x', 'y']},
        {'ref' : data_source2.ref(), 'columns' : ['yy']},
      ],
      'rangepadding' : 0.0
  })
  _.defer(() ->
    ok(datarange.get('start') == -60)
    ok(datarange.get('end') == 5)
    data_source.set('data', [{x : 1, y : -2},
      	{x : 2, y : -3},
    		{x : 3, y : -4},
    		{x : 4, y : -5},
    		{x : -100, y : 0}])
    data_source2.set('data', [{x : 1, yy : 1000}])
    ok(datarange.get('start') == -100)
    ok(datarange.get('end') == 1000)
    start()
  )
)


