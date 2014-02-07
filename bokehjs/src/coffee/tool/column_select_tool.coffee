
define [
  "underscore",
  "jquery",
  "backbone",
  "./tool",
  "./event_generators"
], (_, $, Backbone, Tool, EventGenerators) ->


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

  class ColumnSelectModal extends ModalView
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
            <h3 id="dataConfirmLabel">Columns </h3></div><div class="modal-body">
          <div class="modal-body">
            <ul>
              <% _.each(columns, function(column_data){ %>
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
      column =  $(e.currentTarget).attr('name')
      add = $(e.currentTarget).is(":checked")
      selected_columns = @model.get('selected_columns')
      if add
        selected_columns.push(column)
        @model.set('selected_columns', _.uniq(selected_columns))
      else
        @model.set('selected_columns', _.without(selected_columns, column))
      @_build_renderers()
    
  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class ColumnSelectToolView extends Tool.View
    initialize: (options) ->
      @counter = 0
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"ColumnSelect" }
    toolType: "ColumnSelectTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }
    _datasource_columns: ->
      source = @mget_obj('data_source')
      col_data = []
      selected_columns = @mget('selected_columns')
      for k in _.keys(source.get('data'))
        if _.contains(selected_columns, k)
          col_data.push([k, "checked"])
        else
          col_data.push([k, ""])
      return col_data
      
    _activated: (e) ->
      @mset('columns', @_datasource_columns())
      @modal_view = new ColumnSelectModal(model:@model, plot_view:@plot_view)
      @modal_view.show()

    _close_modal : () ->
      @modal_view.close()

  class ColumnSelectTool extends Tool.Model
    default_view: ColumnSelectToolView
    type: "ColumnSelectTool"

    defaults: () ->
      return {
        data_source: null
        selected_columns: []
      }

    display_defaults: () ->
      super()

  class ColumnSelectTools extends Backbone.Collection
    model: ColumnSelectTool

  return {
    "Model": ColumnSelectTool,
    "Collection": new ColumnSelectTools(),
    "View": ColumnSelectToolView
  }
