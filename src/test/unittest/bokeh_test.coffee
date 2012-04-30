test('test_datarange1d', ->
  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : -2},
    	{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -6}]
  });
  datarange = Bokeh.Collections['DataRange1d'].create({
      'data_source' : data_source.ref(),
      'columns': ['x', 'y']
  })

  ok(datarange.get('start') == -6)
  ok(datarange.get('end') == 5)
  data_source.set('data', [{x : 1, y : -2},
    	{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -100}])
  ok(datarange.get('start') == -100)
  ok(datarange.get('end') == 5)

)


