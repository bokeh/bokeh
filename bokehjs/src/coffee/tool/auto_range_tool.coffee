
define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "backbone",
  "./tool",
  "./event_generators",
  "./embed_tool_template",
  "common/safebind"
], (_, $, $$1, Backbone, Tool, EventGenerators, embed_tool_template, safebind) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  escapeHTML = (unsafe_str) ->
    unsafe_str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')

  class AutoRangeToolView extends Tool.View
    initialize: (options) ->
      super(options)
  
      update_ranges = (e) =>
        try
          PADDING_PERCENTAGE = 0.02
          start_x = @plot_view.x_ranges.default.get('start')
          end_x = @plot_view.x_ranges.default.get('end')
    
          renderers = _.values(@plot_view.renderers)
          glyph_renderers = _.filter(renderers,  (x) ->  x.model.type == "Glyph")
          console.log('glyph_renderers', glyph_renderers)
          yranges = {}
          ds = ""  #data_source
          x_col = ""
          for gr in glyph_renderers
            ds = gr.model.get_obj('data_source')
            yr = gr.y_range_name
            x_col = gr.x
            y_extents = gr.model.get('glyphspec').y_extents
            if _.has(yranges, yr)
              yranges[yr] = yranges[yr].concat( y_extents)
            else
              yranges[yr] = y_extents
    
          data = ds.get('data')
          x_index = x_col
          start_index = _.sortedIndex(x_index, start_x)
          end_index = _.sortedIndex(x_index, end_x)
          console.log('start_index, end_index', start_index, end_index, start_x, end_x)
          _.each(yranges, (y_columns, range_name) =>
            extents =  _.filter(_.map(_.uniq(y_columns), (colName) ->
              if typeof(colName) == "number"
                return colName
              else
                y_arr = _.reject(data[colName].slice(_.max([0, start_index - 1]), end_index), isNaN)
                if(y_arr.length == 0)
                  return false
                return [_.min(y_arr), _.max(y_arr)]
              ), _.identity)
            f_extents = _.flatten(extents)
            min_y = _.min(f_extents)
            max_y = _.max(f_extents)
            diff = max_y - min_y
            if diff == 0
              console.log("exiting because diff == 0 ")
              return
            padding = diff * PADDING_PERCENTAGE
            min_y2 = min_y - padding
            max_y2 = max_y + padding
            yrange_obj = @plot_view.y_ranges[range_name]
            console.log('old start and end y', yrange_obj.get('start'), yrange_obj.get('end'))
            console.log('setting range', range_name,  min_y, max_y, min_y2, max_y2)
    
            _.defer((->
              
              yrange_obj.set('start', min_y2)
              yrange_obj.set('end', max_y2)), 100)
          )
        catch error
          console.log("error")
          
      safebind(this, @plot_view.x_ranges.default, 'change', update_ranges)
      #debugger;
      #update_ranges()
      console.log("about to call safebind inside of auto_range_tool")
      safebind(this, @plot_view, 'set_initial_range', update_ranges)
      #.get('start')
    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Auto Range", showButton:false }
    toolType: "AutoRangeTool"
    tool_events: {
       activated: "_activated"
    }


  class AutoRangeTool extends Tool.Model
     default_view: AutoRangeToolView
     type: "AutoRangeTool"

  class AutoRangeTools extends Backbone.Collection
    model: AutoRangeTool

    display_defaults: () ->
      super()

  return {
    Model: AutoRangeTool,
    Collection: new AutoRangeTools(),
    View: AutoRangeToolView,
  }


