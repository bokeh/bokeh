require(['main'], (Bokeh) ->
  xs = ((x/50) for x in _.range(630))
  source = Bokeh.Collections('RemoteDataSource').create(
    api_endpoint: "http://localhost:5000/"
    data:
      x: xs
      y1: (Math.sin(x) for x in xs))

  xdr = Bokeh.Collections('DataRange1d').create(sources: [{ref: source.ref(), columns: ['x']}])
  ydr = Bokeh.Collections('DataRange1d').create(sources: [{ref: source.ref(), columns: ['y1']}])

  options = {
    title: "plot 1",
    dims: [600, 600]
    xrange: xdr
    yrange: ydr
    xaxes: "datetime"
    yaxes: "min", legend:true}


  plot1 = Bokeh.Plotting.make_plot([], source, options)

  column_tree = {
    trader1____Agriculture: [
     "trader1____largeTradeSizeWithTrendingNetExposureAgriculture.similarity",
     "trader1____AgricultureAvgTradeSizeAnomalySeverity",
     "trader1____AgricultureMaxQtyAnomalySeverity",
     "trader1____AgricultureRunningNetAnomalySeverity"],

    trader1____Energy: [
     "trader1____largeTradeSizeWithTrendingNetExposureEnergy.similarity",
     "trader1____EnergyAvgTradeSizeAnomalySeverity",
     "trader1____EnergyMaxQtyAnomalySeverity",
     "trader1____EnergyRunningNetAnomalySeverity"],

    trader1____Equities: [
     "trader1____largeTradeSizeWithTrendingNetExposureEquities.similarity",
     "trader1____EquitiesAvgTradeSizeAnomalySeverity",
     "trader1____EquitiesMaxQtyAnomalySeverity",
     "trader1____EquitiesRunningNetAnomalySeverity"],

    trader1____FX:[
     "trader1____largeTradeSizeWithTrendingNetExposureFX.similarity",
     "trader1____FXAvgTradeSizeAnomalySeverity",
     "trader1____FXMaxQtyAnomalySeverity",
     "trader1____FXRunningNetAnomalySeverity"],
    
    trader1____InterestRates:[
     "trader1____largeTradeSizeWithTrendingNetExposureInterestRates.similarity",
     "trader1____InterestRatesAvgTradeSizeAnomalySeverity",
     "trader1____InterestRatesMaxQtyAnomalySeverity",
     "trader1____InterestRatesRunningNetAnomalySeverity"],

    trader1____Metals:[
     "trader1____largeTradeSizeWithTrendingNetExposureMetals.similarity",
     "trader1____MetalsAvgTradeSizeAnomalySeverity",
     "trader1____MetalsMaxQtyAnomalySeverity",
     "trader1____MetalsRunningNetAnomalySeverity"],

    trader2____Agriculture: [
     "trader2____largeTradeSizeWithTrendingNetExposureAgriculture.similarity",
     "trader2____AgricultureAvgTradeSizeAnomalySeverity",
     "trader2____AgricultureMaxQtyAnomalySeverity",
     "trader2____AgricultureRunningNetAnomalySeverity"],

    trader2____Energy: [
     "trader2____largeTradeSizeWithTrendingNetExposureEnergy.similarity",
     "trader2____EnergyAvgTradeSizeAnomalySeverity",
     "trader2____EnergyMaxQtyAnomalySeverity",
     "trader2____EnergyRunningNetAnomalySeverity"],

    trader2____Equities: [
     "trader2____largeTradeSizeWithTrendingNetExposureEquities.similarity",
     "trader2____EquitiesAvgTradeSizeAnomalySeverity",
     "trader2____EquitiesMaxQtyAnomalySeverity",
     "trader2____EquitiesRunningNetAnomalySeverity"],

    trader2____FX:[
     "trader2____largeTradeSizeWithTrendingNetExposureFX.similarity",
     "trader2____FXAvgTradeSizeAnomalySeverity",
     "trader2____FXMaxQtyAnomalySeverity",
     "trader2____FXRunningNetAnomalySeverity"],
    
    trader2____InterestRates:[
     "trader2____largeTradeSizeWithTrendingNetExposureInterestRates.similarity",
     "trader2____InterestRatesAvgTradeSizeAnomalySeverity",
     "trader2____InterestRatesMaxQtyAnomalySeverity",
     "trader2____InterestRatesRunningNetAnomalySeverity"],

    trader2____Metals:[
     "trader2____largeTradeSizeWithTrendingNetExposureMetals.similarity",
     "trader2____MetalsAvgTradeSizeAnomalySeverity",
     "trader2____MetalsMaxQtyAnomalySeverity",
     "trader2____MetalsRunningNetAnomalySeverity"]}

  make_color = (cname) ->
    return {fill_color: cname, line_color: cname}

  glyph_tree = {
    base: {
      type:'line', radius:2.5, radius_units:'screen',
      fill_color: 'blue', line_color: 'blue', width_units:'screen', height:5,
      fill_alpha:0, line_alpha:.3, stroke_alpha:.3,
      width:5, height_units:'screen', size_units:'screen', size:5},
    levels: [
      [ make_color('blue'),
        make_color('red'),
        make_color('orange'),
        make_color('green'),
        make_color('pink'),
        make_color('blue'),
        make_color('red'),
        make_color('orange'),
        make_color('green'),
        make_color('pink'),
        make_color('blue'),
        make_color('red'),
        make_color('orange'),
        make_color('green'),
        make_color('pink'),
        make_color('blue'),
        make_color('red'),
        make_color('orange'),
        make_color('green'),
        make_color('pink')],
      [ {type:'circle'},
        {type:'triangle'},
        {type:'x'},
        {type:'cross'}]]}
        
  column_ordering = [ 'trader1____Agriculture', 'trader1____Energy', 'trader1____Equities', 'trader1____FX',
    'trader1____InterestRates', 'trader1____Metals', 'trader2____Agriculture', 
    'trader2____Energy','trader2____Equities', 'trader2____FX', 'trader2____InterestRates',
    'trader2____Metals']


  remote_data_select_tool = Bokeh.Collections('RemoteDataSelectTool').create(
    api_endpoint: "http://localhost:5000/", #glyph_specs: [scatter1, scatter2, scatter3],
    control_el:"#selector_div", column_tree:column_tree,
    glyph_tree: glyph_tree, column_ordering:column_ordering,
    
    tools: ['zoom,pan'],  data_source:source)

  existing_tools =   plot1.get_obj('tools')
  existing_tools.push(remote_data_select_tool)
  plot1.set_obj('tools', existing_tools)
  Bokeh.Plotting.show(plot1, $("#plot_target")))





