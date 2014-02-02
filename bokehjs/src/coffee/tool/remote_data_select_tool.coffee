
define [
  "underscore",
  "jquery",
  "backbone",
  "./tool",
  "./event_generators",
  "bootstrap"
], (_, $, Backbone, Tool, EventGenerators, Plotting) ->


  class ModalView extends  Backbone.View
    events: 
        'click .close': 'close'
        
    initialize: ->
        this.template_context = _.template(this.template)

    render: ->
        this.$el.html(this.template_context(this.model.toJSON()));
        return this;

    show: ->
        $(document.body).append(this.render().el);                
        @$el.find(".modal").modal(show:true)
        @$el.find('.modal').on('hidden', () =>
          @plot_view.eventSink.trigger("clear_active_tool"))

    close: ->
        this.remove();

  class RemoteDataSelectModal extends ModalView
    initialize: (options) ->
      @plot_view = options.plot_view
      super(options)
    events:
      "click input": "update_selected_columns"
      "hidden .modal" : -> "signal_closed"
      
    template: """
      <div id='previewModal' class='bokeh'>
        <div class="modal" role="dialog" aria-labelledby="previewLabel" aria-hidden="true">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3 id="dataConfirmLabel">Data Sources </h3></div><div class="modal-body">
          <div class="modal-body">
            <ul>
              <% _.each(data_source_names, function(column_data){ %>
                <li> <%= column_data[0] %> </li>
                <input name='<%= column_data[0] %>' <%= column_data[1] %> type='checkbox' />
              <% }) %>
            </ul>
          </div>
          </div><div class="modal-footer">
            <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
          </div>
        </div>
      </div>
      """ 

    signal_closed : ->
      @plot_view.eventSink.trigger("clear_active_tool")

    close: ->
      this.remove();
      
    _build_renderers: ->
      pmodel = @plot_view.model
      pmodel.set('renderers', [])
      Plotting = require("common/plotting")
      glyphs = Plotting.create_glyphs(pmodel, @renderer_specs(), [@model.get_obj('data_source')])
      pmodel.add_renderers(g.ref() for g in glyphs)

    _add_renderer: (renderer_name) ->
        
        Bokeh = require('main')
        pmodel = @plot_view.model
        Plotting = require("common/plotting")

        $.getJSON(  
          "http://localhost:5006/static/datasource_endpoint.json",
          {},
          (json )->
            
            source2 = Bokeh.Collections('ColumnDataSource').create(
              data:
                x: json.x,
                y2: json.y)
          
            scatter2 = {
              type: 'rect'
              x: 'x'
              y: 'y2'
              width: 5
              width_units: 'screen'
              height: 5
              height_units: 'screen'
              fill_color: 'blue'}


            glyphs = Plotting.create_glyphs(pmodel, scatter2, [source2])
            pmodel.add_renderers(g.ref() for g in glyphs)

        );
        
      

    renderer_specs : ->
      specs = []
      for col_name in @model.get('selected_columns')
        spec = {
          type: 'rect'
          x: 'x'
          y: col_name
          width: 5
          width_units: 'screen'
          height: 5
          height_units: 'screen'
          fill_color: 'blue'}
        specs.push(spec)
      specs

    update_selected_columns: (e) ->
      rname =  $(e.currentTarget).attr('name')
      add = $(e.currentTarget).is(":checked")
      selected_columns = @model.get('selected_columns')
      if add
        @_add_renderer(rname)
        selected_columns.push(rname)
      else
        #not implemented for now
        
        #@model.set('selected_columns', _.without(selected_columns, column))
      #@_build_renderers()
    
  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class RemoteDataSelectToolView extends Tool.View
    initialize: (options) ->
      @counter = 0
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Remote Data Select" }
    toolType: "RemoteDataSelectTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }
    _datasource_columns: ->
      col_data = []
      console.log("@mget('data_source_names')", @mget('data_source_names'))
      selected_columns = @mget('selected_columns')
      for k in @mget('data_source_names')
        if _.contains(selected_columns, k)
          col_data.push([k, "checked"])
        else
          col_data.push([k, ""])
      return col_data
      
    _activated: (e) ->
      @modal_view = new RemoteDataSelectModal(model:@model, plot_view:@plot_view)
      @modal_view.show()

    _close_modal : () ->
      @modal_view.close()

  class RemoteDataSelectTool extends Tool.Model
    default_view: RemoteDataSelectToolView
    type: "RemoteDataSelectTool"

    defaults: () ->
      return {
        data_source_names: []
        selected_columns: []
      }

    display_defaults: () ->
      super()

  class RemoteDataSelectTools extends Backbone.Collection
    model: RemoteDataSelectTool

  return {
    "Model": RemoteDataSelectTool,
    "Collection": new RemoteDataSelectTools(),
    "View": RemoteDataSelectToolView
  }
