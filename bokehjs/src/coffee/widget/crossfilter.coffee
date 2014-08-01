define [
  "common/has_parent",
  "common/has_properties",
  "common/continuum_view",
  "common/build_views"
  "backbone",
  "underscore",
  "jquery_ui/draggable",
  "jquery_ui/droppable",
  "./crossfiltertemplate"
  "./discretecolumntemplate"
  "./continuouscolumntemplate"
  "./facetcolumntemplate"

], (HasParent, HasProperties, continuum_view,
  build_views, Backbone, _, draggable, droppable,
  crossfiltertemplate,
  discretecolumntemplate, continuouscolumntemplate
  facetcolumntemplate) ->
  ContinuumView = continuum_view.View
  CloseWrapper = continuum_view.CloseWrapper
  class CrossFilterView extends ContinuumView
    tag : "div"
    attributes:
      class : "bk-crossfilter"
    initialize : (options) ->
      super(options)
      @views = {}
      @listenTo(@model, 'change:plot', @render_plot)
      @render()
      @render_plot()
      return this

    render_plot : () ->
      plot = @mget_obj('plot')
      plot_view = new plot.default_view(model : plot)
      @$el.find('.bk-plot').empty()
      @$el.find('.bk-plot').append(plot_view.$el)

    render : () ->
      if @columnview?
        @columnview.$el.detach();

      @$el.empty()
      html = crossfiltertemplate()
      @$el.html(html)


      @filterview = new FilterView(
        el : @$('.bk-filters')
        collection : @model.columns
        model : @model
      )
      @facetsview = new FacetsView(
        el : @$el
        model : @model
      )
      @plotattributeview = new PlotAttributeSelector(
        el : @$el
        model : @model
      )
      @columnview = new ColumnsView(collection : @model.columns)
      @$('.bk-column-list').append(@columnview.el)

      @$('.bk-crossfilter-configuration').height(@mget('height'))
      @$('.bk-crossfilter-configuration').width(500)
      return this

  class CrossFilter extends HasParent
    initialize : (attrs, options) ->
      super(attrs, options)
      @columns = new ColumnCollection()
      @_set_columns()
      @listenTo(this, 'change:columns', @_set_columns)
      console.log(@columns.models)

    _set_columns : () =>
      @columns.reset(@get('columns'))

    type : "CrossFilter"
    default_view : CrossFilterView
    defaults :
      height : 700
      width : 1300

  class CrossFilters extends Backbone.Collection
    model : CrossFilter

  crossfilters = new CrossFilters()

  class PlotAttributeSelector extends ContinuumView
    initialize : (options) ->
      super(options)
      @listenTo(@model, "change:plot_selector", @render_plot_selector)
      @listenTo(@model, "change:x_selector", @render_x_selector)
      @listenTo(@model, "change:y_selector", @render_y_selector)
      @listenTo(@model, "change:agg_selector", @render_agg_selector)
      @render_plot_selector()
      @render_x_selector()
      @render_y_selector()
      @render_agg_selector()

    render_selector : (node, model) ->
      node.empty()
      if model
        @plot_selector_view = new model.default_view(model : model)
        node.append(@plot_selector_view.$el)

    render_plot_selector : () ->
      node = @$('.bk-plot-selector')
      model = @mget_obj('plot_selector')
      @render_selector(node, model)

    render_x_selector : () ->
      node = @$('.bk-x-selector')
      model = @mget_obj('x_selector')
      @render_selector(node, model)

    render_y_selector : () ->
      node = @$('.bk-y-selector')
      model = @mget_obj('y_selector')
      @render_selector(node, model)

    render_agg_selector : () ->
      node = @$('.bk-agg-selector')
      model = @mget_obj('agg_selector')
      @render_selector(node, model)

  class ColumnsView extends Backbone.View
    initialize : (options) ->
      super(options)
      @views = {}
      @listenTo(@collection, 'all', @render)
      @render()
      return this

    render : () ->
      _.map(@views, (view) -> view.$el.detach())
      build_views(@views, @collection.models)
      _.map(@collection.models, (model) => @$el.append(@views[model.id].$el))
      return this

  class FacetView extends ContinuumView
    events:
      "click" : "remove"
    tagName: "span"
    attributes:
      class : "bk-facet-label"
    initialize : (options) ->
      super(options)
      @name = options.name
      @render()
    render : () ->
      @$el.html(facetcolumntemplate(name:@name))

  class FacetsView extends ContinuumView
    initialize : (options) ->
      super(options)
      @render_init()
      @render_all_facets()

      @listenTo(@model, 'change:facet_x', @render_all_facets)
      @listenTo(@model, 'change:facet_y', @render_all_facets)
      @listenTo(@model, 'change:facet_tab', @render_all_facets)

    render_init : () ->
      @facet_x_node = @$('.bk-facet-x')
      @facet_y_node = @$('.bk-facet-y')
      @facet_tab_node = @$('.bk-facet-tab')
      @facet_x_node.droppable(
        drop : @drop_x,
        tolerance : 'pointer'
        hoverClass : 'bk-droppable-hover'
      )
      @facet_y_node.droppable(
        drop : @drop_y,
        tolerance : 'pointer'
        hoverClass : 'bk-droppable-hover'
      )
      @facet_tab_node.droppable(
        drop : @drop_tab,
        tolerance : 'pointer'
        hoverClass : 'bk-droppable-hover'
      )

    render_all_facets : () ->
      @render_facets(@facet_x_node, 'facet_x', @model.get('facet_x'))
      @render_facets(@facet_y_node, 'facet_y', @model.get('facet_y'))
      @render_facets(@facet_tab_node, 'facet_tab', @model.get('facet_tab'))
      return

    render_facets : (node, type, facets) ->
      node = node.find('.bk-facets-selections')
      node.empty()
      for facet in facets
        view = new FacetView(name : facet)
        @listenTo(view, 'remove', () -> @remove_facet(facet, save=true))
        node.append(view.$el)

    remove_facet : (facet, save=true) =>
      for type in ['facet_x', 'facet_y', 'facet_tab']
        facets = _.clone(@model.get(type))
        facets = (x for x in facets when x != facet)
        @model.set(type, facets)
      if save
        @model.save()

    add_facet : (type, facet) =>
      @remove_facet(facet, save=false)
      facets = _.clone(@model.get(type))
      if facets.indexOf(facet) < 0
        facets.push(facet)
        @model.set(type, facets)
      @model.save()

    drop : (type, e, ui) =>
      column_model = ui.helper.data('model')
      name = column_model.get('name')
      @add_facet(type, name)

    drop_x : (e, ui) =>
      @drop('facet_x', e, ui)

    drop_y : (e, ui) =>
      @drop('facet_y', e, ui)

    drop_tab : (e, ui) =>
      @drop('facet_tab', e, ui)

  class FilterView extends ContinuumView
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
      @render_columns_selectors
      @listenTo(@model, 'change:filter_widgets', @render_column_selectors)

    drop : (e, ui) =>
      column_model = ui.helper.data('model')
      filtering_columns = _.clone(@model.get('filtering_columns'))
      filtering_columns.push(column_model.get('name'))
      @model.set('filtering_columns', filtering_columns)
      @model.save()

    render : () ->
      @$el.droppable({
        drop : @drop
        tolerance : 'pointer'
        hoverClass : 'bk-droppable-hover'
      });

    render_column_selectors : () ->
      _.map(@views, (view) -> view.$el.detach())
      @$el.find('.bk-filters-selections').empty()
      filter_widget_dict = {}
      for own key, val of @mget('filter_widgets')
        filter_widget_dict[key] = @model.resolve_ref(val)
      filtering_columns = @mget('filtering_columns')
      filter_widgets = (filter_widget_dict[col] for col in filtering_columns \
        when filter_widget_dict[col]?)
      newviews =build_views(@views, filter_widgets)
      _.map(newviews, (view)=>
        @listenTo(view, 'remove', @child_remove)
      )
      _.map(filter_widgets, (model) =>
        wrapper = new CloseWrapper(view : @views[model.id])
        @$el.find('.bk-filters-selections').append(wrapper.$el)
      )

    child_remove : (view) ->
      for own key, val of @mget('filter_widgets')
        model = @model.resolve_ref(val)
        if model == view.model
          to_remove = key
          break
      newcolumns = _.filter(@mget('filtering_columns'), (x) -> x != to_remove)
      @mset('filtering_columns', newcolumns)
      @model.save()

  class ColumnCollection extends Backbone.Collection
    model : (attrs, options) ->
      if attrs.type == 'DiscreteColumn'
        return new DiscreteColumn(attrs)
      else if attrs.type == 'TimeColumn'
        return new TimeColumn(attrs)
      else
        return new ContinuousColumn(attrs)

  class ColumnView extends ContinuumView
    attributes :
      class : "bk-crossfilter-column-entry bk-bs-panel bk-bs-panel-primary"
    initialize : (options) ->
      super(options)
      @render()
    dragging_helper : () =>
      node = @$el.clone()
      #node.find('tbody').detach()
      return node

    render : () ->
      @$el.html(@template(@model.attributes))
      @$el.draggable(
        appendTo: 'body',
        containment : 'document',
        helper : 'clone',#@dragging_helper,
        start : (e, ui) =>
          ui.helper.data('model', @model)
      )
      return this

  class TimeColumnView extends ColumnView


  class DiscreteColumnView extends ColumnView
    template : discretecolumntemplate

  class ContinuousColumnView extends ColumnView
    template : continuouscolumntemplate

  class TimeColumn extends HasProperties
    idAttribute : "name"
    default_view : TimeColumnView
    defaults:
      type : "TimeColumn"
      name : ""
      count : 0
      unique : 0
      first : 0
      last : 0

  class DiscreteColumn extends HasProperties
    idAttribute : "name"
    default_view : DiscreteColumnView
    defaults:
      type : "DiscreteColumn"
      name : ""
      count : 0
      unique : 0
      top : 0
      freq : 0

  class ContinuousColumn extends HasProperties
    idAttribute : "name"
    default_view : ContinuousColumnView
    defaults:
      type : "ContinuousColumn"
      name : ""
      count : 0
      mean: 0
      std : 0
      min : 0
      max : 0

  return {
    "Model" : CrossFilter
    "Collection" : crossfilters
    "View" : CrossFilterView
  }
