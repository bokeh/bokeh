
define [
  "underscore",
  "jquery",
  "backbone",
  "./tool",
  "./event_generators",
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

  class RemoteDataSelectModal extends Backbone.View
    initialize: (options) ->
      @plot_view = options.plot_view
      super(options)

    events:
      "click input": "update_selected_columns"
      "hidden .modal" : -> "signal_closed"
      
    template: """
      <div class='column_select'>
          <div class="header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3 id="dataConfirmLabel">Data Sources </h3></div><div class="modal-body">
          <div class="body">
            <ul>
              <% _.each(columns, function(column_data){ %>
                <li> <%= column_data %> </li>
                <input name='<%= column_data %>' <%= column_data %> type='checkbox' />
              <% }) %>
            </ul>
          </div>
          </div><div class="footer">
            <button class="btn" aria-hidden="true">Close</button>
          </div>
      </div>
      """ 

    render: ->
      @$el = $(@$el)
      @template_context = _.template(@template)
      @$el.html(@template_context(@model.toJSON()));

      return this;

    signal_closed : ->
      @plot_view.eventSink.trigger("clear_active_tool")
      
    _add_renderer: (renderer_name) ->
        Plotting = require("common/plotting")
        pview = @plot_view
        pmodel = @plot_view.model

        data_source = @model.get_obj('data_source')

        x_range = pmodel.get_obj("x_range")
        y_range = pmodel.get_obj("y_range")
        data_source.remote_add_column(renderer_name, =>
            data = data_source.get('data')
            gspecs =  @model.get('glyph_specs')
            gspec_pointer = @model.get('glyph_spec_pointer')

            scatter2 = gspecs[gspec_pointer]
            scatter2.x = 'index'
            scatter2.y = renderer_name
            @inc_glyph_spec_pointer()
            glyphs = Plotting.create_glyphs(pmodel, scatter2, [data_source])
            console.log(glyphs)
            pmodel.add_renderers(g.ref() for g in glyphs)

            x_min = Math.min.apply(data.index, data.index)
            x_max = Math.max.apply(data.index, data.index)

            y_min = Math.min.apply(data[renderer_name], data[renderer_name])
            y_max = Math.max.apply(data[renderer_name], data[renderer_name])

            y_min2 = Math.min(y_range.get('min'), y_min)
            y_max2 = Math.max(y_range.get('max'), y_max)

            pview.update_range({
              xr: {start: x_min, end: x_max },
              yr: {start: y_min2, end: y_max2 }
              })
            
            pview.request_render()
            @renderer_map[renderer_name] = glyphs[0]
            )

    inc_glyph_spec_pointer: () ->
      if @model.get('glyph_spec_pointer') == ((@model.get('glyph_specs').length) - 1)
         @model.set('glyph_spec_pointer', 0)
      else
        @model.set('glyph_spec_pointer', @model.get('glyph_spec_pointer') + 1)
        
    update_selected_columns: (e) ->
      rname =  $(e.currentTarget).attr('name')
      add = $(e.currentTarget).is(":checked")
      selected_columns = @model.get('selected_columns')

      if add
        @_add_renderer(rname)
        selected_columns.push(rname)
      else
        renderer = @renderer_map[rname]
        pview = @plot_view
        pmodel = @plot_view.model
        
        existing_renderers = pmodel.get('renderers')
        modified_renderers = []
        for r in existing_renderers
          if not (r.id == renderer.id)
            modified_renderers.push(r)
        pmodel.set('renderers', modified_renderers)
        pview.request_render()
        console.log(rname)
      
  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class RemoteDataSelectToolView extends Tool.View
    initialize: (options) ->
      @counter = 0

      @$el = @mget('control_el')
      @$el = $(@$el)
      #debugger;
      super(options)
    events:
      "click input": "update_selected_columns"

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Remote Data Select" }
    toolType: "RemoteDataSelectTool"
    tool_events: {
       activated: "_activated"
       deactivated: "_close_modal"
    }

    _activated: (e) ->
      @mset('columns', @mget_obj('data_source').get('columns'))
      @render()

    render: ->
      @template_context = _.template(@template)
      @$el.html(@template_context(@model.toJSON()));

      return this;

    template: """
      <div class='column_select'>
          <div class="header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3 id="dataConfirmLabel">Data Sources </h3></div><div class="modal-body">
          <div class="body">
            <ul>
              <% _.each(columns, function(column_data){ %>
                <li> <%= column_data %> </li>
                <input name='<%= column_data %>' <%= (!(_.has(renderer_map,column_data, true)) || 'checked') %> type='checkbox' />
              <% }) %>
            </ul>
          </div>
          </div><div class="footer">
            <button class="btn" aria-hidden="true">Close</button>
          </div>
      </div>
      """ 

          
    _add_renderer: (renderer_name) ->
        Plotting = require("common/plotting")
        pview = @plot_view
        pmodel = @plot_view.model

        data_source = @model.get_obj('data_source')

        x_range = pmodel.get_obj("x_range")
        y_range = pmodel.get_obj("y_range")
        data_source.remote_add_column(renderer_name, =>
            data = data_source.get('data')
            gspecs =  @model.get('glyph_specs')
            gspec_pointer = @model.get('glyph_spec_pointer')

            scatter2 = gspecs[gspec_pointer]
            scatter2.x = 'index'
            scatter2.y = renderer_name
            @inc_glyph_spec_pointer()
            glyphs = Plotting.create_glyphs(pmodel, scatter2, [data_source])
            console.log(glyphs)
            pmodel.add_renderers(g.ref() for g in glyphs)

            x_min = Math.min.apply(data.index, data.index)
            x_max = Math.max.apply(data.index, data.index)

            y_min = Math.min.apply(data[renderer_name], data[renderer_name])
            y_max = Math.max.apply(data[renderer_name], data[renderer_name])

            y_min2 = Math.min(y_range.get('min'), y_min)
            y_max2 = Math.max(y_range.get('max'), y_max)

            pview.update_range({
              xr: {start: x_min, end: x_max },
              yr: {start: y_min2, end: y_max2 }
              })
            
            pview.request_render()
            @model.get('renderer_map')[renderer_name] = glyphs[0]
            )

    inc_glyph_spec_pointer: () ->
      if @model.get('glyph_spec_pointer') == ((@model.get('glyph_specs').length) - 1)
         @model.set('glyph_spec_pointer', 0)
      else
        @model.set('glyph_spec_pointer', @model.get('glyph_spec_pointer') + 1)
        
    update_selected_columns: (e) ->
      rname =  $(e.currentTarget).attr('name')
      add = $(e.currentTarget).is(":checked")
      selected_columns = @model.get('selected_columns')

      if add
        @_add_renderer(rname)
        selected_columns.push(rname)
      else
        renderer = @model.get('renderer_map')[rname]
        pview = @plot_view
        pmodel = @plot_view.model
        
        existing_renderers = pmodel.get('renderers')
        modified_renderers = []
        for r in existing_renderers
          if not (r.id == renderer.id)
            modified_renderers.push(r)
        pmodel.set('renderers', modified_renderers)
        pview.request_render()
        console.log(rname)
      


            
  class RemoteDataSelectTool extends Tool.Model
    default_view: RemoteDataSelectToolView
    type: "RemoteDataSelectTool"

    defaults: () ->
      rect_base = {
        width: 5, type: 'rect', width_units: 'screen', height: 5,
        height_units: 'screen', fill_color: 'blue', line_color: 'blue'}
      circle_base = {
        type:'circle', radius:5, radius_units:'screen',
        fill_color: 'blue', line_color: 'blue'}


      return {
        columns: [],
        selected_columns: [],
        renderer_map: {},
        api_endpoint: "",
        glyph_specs: [
          _.defaults({fill_color: 'orange', line_color: 'orange'}, circle_base),
          _.defaults({fill_color: 'blue', line_color: 'blue'}, rect_base),
          _.defaults({fill_color: 'red', line_color: 'red'}, rect_base),
          _.defaults({fill_color: 'green', line_color: 'green'}, rect_base),
          _.defaults({fill_color: 'pink', line_color: 'pink'}, rect_base)],
        glyph_spec_pointer: 0,
        data_source: null
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
