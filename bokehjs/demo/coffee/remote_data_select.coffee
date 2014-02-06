require(['main'], (Bokeh) ->
  xs = ((x/50) for x in _.range(630))
  ys1 = (Math.sin(x) for x in xs)
  ys2 = (Math.cos(x) for x in xs)
  ys3 = (Math.tan(x) for x in xs)

  source = Bokeh.Collections('RemoteDataSource').create(
    api_endpoint: "http://localhost:5000/"
    data:
      x: xs
      y1: ys1
      y3: ys3
  )

  xdr = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['x']}]
  )

  ydr1 = Bokeh.Collections('DataRange1d').create(
    sources: [{ref: source.ref(), columns: ['y1']}]
  )


  options = {
    title: "Scatter Demo"
    dims: [600, 600]
    xrange: xdr
    xaxes: "datetime"
    yaxes: "min"
    #    tools: ['zoom,pan']
    legend: false}

  plot1 = Bokeh.Plotting.make_plot(
    [],
    source, _.extend({title: "Plot 1", yrange: ydr1}, options))

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
  remote_data_select_tool = Bokeh.Collections('RemoteDataSelectTool').create(
    api_endpoint: "http://localhost:5000/", #glyph_specs: [scatter1, scatter2, scatter3],
    control_el:"#selector_div", column_tree:column_tree,
    tools: ['zoom,pan'],  data_source:source)

  existing_tools =   plot1.get_obj('tools')
  existing_tools.push(remote_data_select_tool)
  plot1.set_obj('tools', existing_tools)
  #plot1.set_obj('tools', [remote_data_select_tool])
  Bokeh.Plotting.show(plot1, $("#plot_target")))



