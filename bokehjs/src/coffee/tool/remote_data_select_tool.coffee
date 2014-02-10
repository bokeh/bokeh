
define [
  "underscore",
  "jquery",
  "backbone",
  "./tool",
  "./event_generators",
  "renderer/annotation/legend"
], (_, $, Backbone, Tool, EventGenerators, Legend) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class RemoteDataSelectToolView extends Tool.View
    initialize: (options) ->
      @counter = 0
      @$el = @mget('control_el')
      @$el = $(@$el)
      super(options)

    events:
      "click input.column_check": "update_selected_columns"
      "click input.category_check": "update_selected_category"

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { buttonText:"Remote Data Select" }
    toolType: "RemoteDataSelectTool"
    tool_events: {
       activated: "_activated"
    }

    _activated: (e) ->
      @mset('columns', @mget_obj('data_source').get('columns'))
      @render()

    render: ->
      @template_context = _.template(@template)
      @$el.html(@template_context(@model.toJSON()));
      return this;

    template: """
      <div>
        <h1> <%= Selector_title %> </h1> 
        <ul class='category_list'>
          <% _.each(column_tree, function(columns, category){ %>
            <li class='category_item'> <%= category %> </li>
              <input class='category_check' name='<%= category %>'
                  <%= (!(_.contains(selected_categories, category, true)) || 'checked') %>
              type='checkbox' />
              <ul class='column_list'>
                <% _.each(columns, function(column_data){ %>
                  <li class='column_item' > <%= column_data %> 
                    <input class='column_check' name='<%= column_data %>' <%= (!(_.has(renderer_map,column_data, true)) || 'checked') %> type='checkbox' />
                   </li>
                <% }) %>
              </ul> 
            </li>
          <% }) %>
        </ul>
      </div>
      """
    update_selected_category: (e) ->
      category_name =  $(e.currentTarget).attr('name')
      category_columns = @model.get('column_tree')[category_name]
      add = $(e.currentTarget).is(":checked")
      if add
        for column in category_columns
          @_add_renderer(column)
        @model.get('selected_categories').push(category_name)
      else
        for column in category_columns
          @unreder_column(column)
        @model.set('selected_categories',
          _.without(@model.get('selected_categories'), category_name))
      @render()      

    update_selected_columns: (e) ->
      rname =  $(e.currentTarget).attr('name')
      add = $(e.currentTarget).is(":checked")
      if add
        @_add_renderer(rname)
      else
        @unreder_column(rname)
      @render()

    unreder_column: (rname) ->
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
      rmap = @model.get('renderer_map')
      delete rmap[rname]
          
    _add_renderer: (renderer_name) ->
        Plotting = require("common/plotting")
        pview = @plot_view
        pmodel = @plot_view.model

        data_source = @model.get_obj('data_source')

        x_range = pmodel.get_obj("x_range")
        y_range = pmodel.get_obj("y_range")
        data_source.remote_add_column(renderer_name, =>
            data = data_source.get('data')

            scatter2 = @get_glyph_spec(renderer_name)

            scatter2.x = 'index'
            scatter2.y = renderer_name
            glyphs = Plotting.create_glyphs(pmodel, scatter2, [data_source])
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
            old_legends = @model.set('legends')
            @_reset_legends()
            pview.request_render()
            @model.get('renderer_map')[renderer_name] = glyphs[0])

    _unreder_legend:  ->
      renderer = @model.get('legend_renderer')
      pview = @plot_view
      pmodel = @plot_view.model

      existing_renderers = pmodel.get('renderers')
      modified_renderers = []

      for r in existing_renderers
        if renderer and not (r.id == renderer.id)
          modified_renderers.push(r)
      pmodel.set('renderers', modified_renderers)
      pview.request_render()

    _reset_legends: ->
      @_unreder_legend()
      pview = @plot_view
      pmodel = @plot_view.model

      legends = {}
      _.each(@model.get('renderer_map'), (r, rname) ->
        legends[rname] = [r])
      legend_renderer = Legend.Collection.create({
        parent: pmodel.ref()
        plot: pmodel.ref()
        orientation: "top_right"
        legends: legends
      })
      pmodel.add_renderers([legend_renderer.ref()])
      @model.set('legend_renderer', legend_renderer)

    find_category: (renderer_name) ->
      ctree = @model.get('column_tree')
      for cat in _.keys(ctree)
        if renderer_name in ctree[cat]
          return cat

    get_glyph_spec : (renderer_name) ->
      ctree = @model.get('column_tree')
      c_order = @model.get('column_ordering')
      g_tree = @model.get('glyph_tree')
      category = @find_category(renderer_name)
      item_list = ctree[category]
      category_index = _.indexOf(c_order, category)
      item_index = _.indexOf(item_list, renderer_name)
      console.log("category_index", category_index, "item_index", item_index)
      base = g_tree['base']

      level_0 = _.defaults({}, g_tree.levels[0][category_index], base)
      level_1 = _.defaults({}, g_tree.levels[1][item_index], level_0)
      console.log(level_1.line_color)
      return level_1

    inc_glyph_spec_pointer: () ->
      if @model.get('glyph_spec_pointer') == ((@model.get('glyph_specs').length) - 1)
         @model.set('glyph_spec_pointer', 0)
      else
        @model.set('glyph_spec_pointer', @model.get('glyph_spec_pointer') + 1)

            
  class RemoteDataSelectTool extends Tool.Model
    default_view: RemoteDataSelectToolView
    type: "RemoteDataSelectTool"

    defaults: () ->
      rect_base = {
        width: 5, type: 'rect', width_units: 'screen', height: 5,
        height_units: 'screen', fill_color: 'blue', line_color: 'blue'}
      circle_base = {
        type:'line', radius:5, radius_units:'screen',
        fill_color: 'blue', line_color: 'blue'}

      return {
        columns: [],
        selected_columns: [],
        selected_categories: [],
        renderer_map: {},
        api_endpoint: "",
        column_tree: {'a':['ab']}
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




