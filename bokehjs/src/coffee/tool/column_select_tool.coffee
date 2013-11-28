
define [
  "underscore",
  "jquery",
  "backbone",
  "./tool",
  "./event_generators",
  "bootstrap"
], (_, $, Backbone, Tool, EventGenerators, Plotting) ->

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


    _build_renderers: ->
      pmodel = @plot_view.model
      pmodel.set('renderers', [])
      Plotting = require("common/plotting")
      glyphs = Plotting.create_glyphs(pmodel, @renderer_specs(), [@mget_obj('data_source')])
      pmodel.add_renderers(g.ref() for g in glyphs)

    renderer_specs : ->
      specs = []
      for col_name in @mget('selected_columns')
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

    _datasource_columns: ->
      source = @mget_obj('data_source')
      _.keys(source.get('data'))

    _activated: (e) ->
      modal = """
      <div id='previewModal' class='bokeh'>
        <div class="modal" role="dialog" aria-labelledby="previewLabel" aria-hidden="true">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3 id="dataConfirmLabel">Columns </h3></div><div class="modal-body">
          <div class="modal-body">
            <ul>
              <% _.each(columns, function(column_name){ %>
                <li> <%= column_name %> </li>
              <% }) %>
            </ul>
          </div>
          </div><div class="modal-footer">
            <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>
          </div>
        </div>
      </div>
      """ # hack to keep my text editor happy "
      $('body').append(_.template(modal)(columns:@_datasource_columns()))
      $('#previewModal .modal').on('hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool"))
      $('#previewModal > .modal').modal({show:true});

    _close_modal : () ->
      @mset('selected_columns', @_datasource_columns().slice(0, @counter))
      @counter += 1
      @_build_renderers()
      $('#previewModal').remove()
      $('#previewModal > .modal').remove()

  class ColumnSelectTool extends Tool.Model
    default_view: ColumnSelectToolView
    type: "ColumnSelectTool"

    defaults: () ->
      return {
        data_source: null
        columns: []
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
