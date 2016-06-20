module.exports = {
  ## api/typings/models/annotations.d.ts
  Arrow:                                  require("../models/annotations/arrow").Model
  OpenHead:                               require("../models/annotations/arrow_head").OpenHead
  NormalHead:                             require("../models/annotations/arrow_head").NormalHead
  VeeHead:                                require("../models/annotations/arrow_head").VeeHead
  BoxAnnotation:                          require("../models/annotations/box_annotation").Model
  Label:                                  require("../models/annotations/label").Model
  LabelSet:                               require("../models/annotations/label_set").Model
  Legend:                                 require("../models/annotations/legend").Model
  PolyAnnotation:                         require("../models/annotations/poly_annotation").Model
  Span:                                   require("../models/annotations/span").Model
  Title:                                  require("../models/annotations/title").Model
  Tooltip:                                require("../models/annotations/tooltip").Model

  ## api/typings/models/axes.d.ts
  Axis:                                   require("../models/axes/axis").Model
  ContinuousAxis:                         require("../models/axes/continuous_axis").Model
  LinearAxis:                             require("../models/axes/linear_axis").Model
  LogAxis:                                require("../models/axes/log_axis").Model
  CategoricalAxis:                        require("../models/axes/categorical_axis").Model
  DatetimeAxis:                           require("../models/axes/datetime_axis").Model

  ## api/typings/models/callbacks.d.ts
  #Callback:                              require("../models/callbacks/callback").Model
  OpenURL:                                require("../models/callbacks/open_url").Model
  CustomJS:                               require("../models/callbacks/customjs").Model

  ## api/typings/models/formatters.d.ts
  TickFormatter:                          require("../models/formatters/tick_formatter").Model
  BasicTickFormatter:                     require("../models/formatters/basic_tick_formatter").Model
  LogTickFormatter:                       require("../models/formatters/basic_tick_formatter").Model
  CategoricalTickFormatter:               require("../models/formatters/categorical_tick_formatter").Model
  DatetimeTickFormatter:                  require("../models/formatters/datetime_tick_formatter").Model
  FuncTickFormatter:                      require("../models/formatters/func_tick_formatter").Model
  NumeralTickFormatter:                   require("../models/formatters/numeral_tick_formatter").Model
  PrintfTickFormatter:                    require("../models/formatters/printf_tick_formatter").Model

  ## api/typings/models/glyphs.d.ts
  Glyph:                                  require("../models/glyphs/glyph").Model
  AnnularWedge:                           require("../models/glyphs/annular_wedge").Model
  Annulus:                                require("../models/glyphs/annulus").Model
  Arc:                                    require("../models/glyphs/arc").Model
  Bezier:                                 require("../models/glyphs/bezier").Model
  Ellipse:                                require("../models/glyphs/ellipse").Model
  ImageRGBA:                              require("../models/glyphs/image_rgba").Model
  Image:                                  require("../models/glyphs/image").Model
  ImageURL:                               require("../models/glyphs/image_url").Model
  Line:                                   require("../models/glyphs/line").Model
  MultiLine:                              require("../models/glyphs/multi_line").Model
  Oval:                                   require("../models/glyphs/oval").Model
  Patch:                                  require("../models/glyphs/patch").Model
  Patches:                                require("../models/glyphs/patches").Model
  Quad:                                   require("../models/glyphs/quad").Model
  Quadratic:                              require("../models/glyphs/quadratic").Model
  Ray:                                    require("../models/glyphs/ray").Model
  Rect:                                   require("../models/glyphs/rect").Model
  Segment:                                require("../models/glyphs/segment").Model
  Text:                                   require("../models/glyphs/text").Model
  Wedge:                                  require("../models/glyphs/wedge").Model
  Gear:                                   require("../models/glyphs/gear").Model

  ## api/typings/models/grids.d.ts
  Grid:                                   require("../models/grids/grid").Model

  ## api/typings/models/images.d.ts
  ImageSource:                            require("../models/tiles/image_source").Model

  ## api/typings/models/layouts.d.ts
  LayoutDOM:                              require("../models/layouts/layout_dom").Model
  Row:                                    require("../models/layouts/row").Model
  Column:                                 require("../models/layouts/column").Model
  Spacer:                                 require("../models/layouts/spacer").Model
  WidgetBox:                              require("../models/layouts/widget_box").Model

  ## api/typings/models/map_plots.d.ts
  GMapPlot:                               require("../models/plots/gmap_plot").Model

  ## api/typings/models/mappers.d.ts
  #ColorMapper:                           require("../models/mappers/color_mapper").Model
  LinearColorMapper:                      require("../models/mappers/linear_color_mapper").Model

  ## api/typings/models/markers.d.ts
  Marker:                                 require("../models/markers/marker").Model
  Asterisk:                               require("../models/markers/asterisk").Model
  Circle:                                 require("../models/glyphs/circle").Model
  CircleCross:                            require("../models/markers/circle_cross").Model
  CircleX:                                require("../models/markers/circle_x").Model
  Cross:                                  require("../models/markers/cross").Model
  Diamond:                                require("../models/markers/diamond").Model
  DiamondCross:                           require("../models/markers/diamond_cross").Model
  InvertedTriangle:                       require("../models/markers/inverted_triangle").Model
  Square:                                 require("../models/markers/square").Model
  SquareCross:                            require("../models/markers/square_cross").Model
  SquareX:                                require("../models/markers/square_x").Model
  Triangle:                               require("../models/markers/triangle").Model
  X:                                      require("../models/markers/x").Model

  ## api/typings/models/model.d.ts
  Model:                                  require("../model").Model

  ## api/typings/models/plots.d.ts
  Plot:                                   require("../models/plots/plot").Model

  ## api/typings/models/ranges.d.ts
  Range:                                  require("../models/ranges/range").Model
  Range1d:                                require("../models/ranges/range1d").Model
  DataRange:                              require("../models/ranges/data_range").Model
  DataRange1d:                            require("../models/ranges/data_range1d").Model
  FactorRange:                            require("../models/ranges/factor_range").Model

  ## api/typings/models/renderers.d.ts
  Renderer:                               require("../models/renderers/renderer").Model
  #DataRenderer:                          require("../models/renderers/data_renderer").Model
  TileRenderer:                           require("../models/tiles/tile_renderer").Model
  DynamicImageRenderer:                   require("../models/tiles/dynamic_image_renderer").Model
  GlyphRenderer:                          require("../models/renderers/glyph_renderer").Model
  GuideRenderer:                          require("../models/renderers/guide_renderer").Model

  ## api/typings/models/sources.d.ts
  DataSource:                             require("../models/sources/data_source").Model
  ColumnDataSource:                       require("../models/sources/column_data_source").Model
  #RemoteSource:                          require("../models/sources/remote_source").Model
  AjaxDataSource:                         require("../models/sources/ajax_data_source").Model

  ## api/typings/models/tickers.d.ts
  Ticker:                                 require("../models/tickers/ticker").Model
  ContinuousTicker:                       require("../models/tickers/continuous_ticker").Model
  FixedTicker:                            require("../models/tickers/fixed_ticker").Model
  AdaptiveTicker:                         require("../models/tickers/adaptive_ticker").Model
  CompositeTicker:                        require("../models/tickers/composite_ticker").Model
  SingleIntervalTicker:                   require("../models/tickers/single_interval_ticker").Model
  DaysTicker:                             require("../models/tickers/days_ticker").Model
  MonthsTicker:                           require("../models/tickers/months_ticker").Model
  YearsTicker:                            require("../models/tickers/years_ticker").Model
  BasicTicker:                            require("../models/tickers/basic_ticker").Model
  LogTicker:                              require("../models/tickers/log_ticker").Model
  CategoricalTicker:                      require("../models/tickers/categorical_ticker").Model
  DatetimeTicker:                         require("../models/tickers/datetime_ticker").Model

  ## api/typings/models/tiles.d.ts
  TileSource:                             require("../models/tiles/tile_source").Model
  MercatorTileSource:                     require("../models/tiles/mercator_tile_source").Model
  TMSTileSource:                          require("../models/tiles/tms_tile_source").Model
  WMTSTileSource:                         require("../models/tiles/wmts_tile_source").Model
  QUADKEYTileSource:                      require("../models/tiles/quadkey_tile_source").Model
  BBoxTileSource:                         require("../models/tiles/bbox_tile_source").Model

  ## api/typings/models/toolbars.d.ts
  ToolbarBase:                            require("../models/tools/toolbar_base").Model
  Toolbar:                                require("../models/tools/toolbar").Model
  ToolbarBox:                             require("../models/tools/toolbar_box").Model

  ## api/typings/models/tools.d.ts
  ToolEvents:                             require("../common/tool_events").Model
  Tool:                                   require("../models/tools/tool").Model
  PanTool:                                require("../models/tools/gestures/pan_tool").Model
  WheelZoomTool:                          require("../models/tools/gestures/wheel_zoom_tool").Model
  SaveTool:                               require("../models/tools/actions/save_tool").Model
  UndoTool:                               require("../models/tools/actions/undo_tool").Model
  RedoTool:                               require("../models/tools/actions/redo_tool").Model
  ResetTool:                              require("../models/tools/actions/reset_tool").Model
  ResizeTool:                             require("../models/tools/gestures/resize_tool").Model
  CrosshairTool:                          require("../models/tools/inspectors/crosshair_tool").Model
  BoxZoomTool:                            require("../models/tools/gestures/box_zoom_tool").Model
  BoxSelectTool:                          require("../models/tools/gestures/box_select_tool").Model
  LassoSelectTool:                        require("../models/tools/gestures/lasso_select_tool").Model
  PolySelectTool:                         require("../models/tools/gestures/poly_select_tool").Model
  TapTool:                                require("../models/tools/gestures/tap_tool").Model
  HoverTool:                              require("../models/tools/inspectors/hover_tool").Model
  HelpTool:                               require("../models/tools/actions/help_tool").Model
}
