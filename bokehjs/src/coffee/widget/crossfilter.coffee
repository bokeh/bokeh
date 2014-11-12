define [
  "common/collection",
  "underscore",
  "jquery_ui/draggable",
  "jquery_ui/droppable",
  "common/has_parent",
  "common/has_properties",
  "common/continuum_view",
  "common/close_wrapper",
  "common/build_views"
  "./crossfilter_template"
  "./crossfilter_column_template"
  "./crossfilter_facet_template"
], (Collection, _, draggable, droppable, HasParent, HasProperties, ContinuumView, CloseWrapper, build_views, crossfilter_template, crossfilter_column_template, crossfilter_facet_template) ->

  class CrossFilterView extends ContinuumView
    tag: "div"
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
      if @plot_view?
        @plot_view.remove()
      plot = @mget('plot')
      @plot_view = new plot.default_view(model : plot)
      @$el.find('.bk-crossfilter-plot').empty()
      @$el.find('.bk-crossfilter-plot').append(@plot_view.$el)

    render : () ->
      if @columnview?
        @columnview.$el.detach();

      @$el.empty()
      html = crossfilter_template()
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
      @$('.bk-crossfilter-configuration').width(400)
      return this

  class CrossFilter extends HasParent
    default_view: CrossFilterView
    type: "CrossFilter"

    initialize: (attrs, options) ->
      super(attrs, options)
      @columns = new ColumnCollection()
      @_set_columns()
      @listenTo(this, 'change:columns', @_set_columns)

    _set_columns: () =>
      @columns.reset(@get('columns'))

    defaults: ->
      return _.extend {}, super(), {
        height: 700
        width: 1300
      }

  class CrossFilters extends Collection
    model: CrossFilter

  class PlotAttributeSelector extends ContinuumView

    initialize: (options) ->
      super(options)
      @listenTo(@model, "change:plot_selector", _.bind(@render_selector, 'plot'))
      @listenTo(@model, "change:x_selector", _.bind(@render_selector, 'x'))
      @listenTo(@model, "change:y_selector", _.bind(@render_selector, 'y'))
      @listenTo(@model, "change:agg_selector", _.bind(@render_selector, 'agg'))
      @render_selector('plot')
      @render_selector('x')
      @render_selector('y')
      @render_selector('agg')

    render_selector: (selector) ->
      node = @$(".bk-#{selector}-selector").empty()
      model = @mget("#{selector}_selector")
      @plot_selector_view = new model.default_view(model: model)
      node.append(@plot_selector_view.$el)

  class ColumnsView extends ContinuumView
    initialize: (options) ->
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
      @$el.html(crossfilter_facet_template(name: @name))

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
      newviews = build_views(@views, filter_widgets)
      _.map(newviews, (view)=>
        @listenTo(view, 'remove', @child_remove)
      )
      _.map(filter_widgets, (model) =>
        wrapper = new CloseWrapper.View(view : @views[model.id])
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

  class ColumnView extends ContinuumView

    template: crossfilter_column_template
    attributes:
      class: "bk-crossfilter-column-entry bk-bs-panel bk-bs-panel-primary"

    initialize: (options) ->
      super(options)
      @render()

    render: () ->
      @$el.html(@template(@model.attributes))
      @$el.draggable(
        appendTo: 'body',
        containment: 'document',
        helper: 'clone',
        start: (e, ui) =>
          ui.helper.data('model', @model)
      )
      return this

  class TimeColumnView extends ColumnView

  class TimeColumn extends HasProperties
    default_view: TimeColumnView
    defaults: ->
      return _.extend {}, super(), {
        type: "TimeColumn"
        label: "Time"
        name: ""
        fields: ['count', 'unique', 'first', 'last']
        count: 0
        unique: 0
        first: 0
        last: 0
      }

  class DiscreteColumnView extends ColumnView

  class DiscreteColumn extends HasProperties
    default_view: DiscreteColumnView
    defaults: ->
      return _.extend {}, super(), {
        type: "DiscreteColumn"
        label: "Factor"
        name: ""
        fields: ['count', 'unique', 'top', 'freq']
        count: 0
        unique: 0
        top: 0
        freq: 0
      }

  class ContinuousColumnView extends ColumnView

  class ContinuousColumn extends HasProperties
    default_view: ContinuousColumnView
    defaults: ->
      return _.extend {}, super(), {
        type: "ContinuousColumn"
        label: "Continuous"
        name: ""
        fields: ['count', 'mean', 'std', 'min', 'max']
        count: 0
        mean: 0
        std: 0
        min: 0
        max: 0
      }

  column_types = {
    'DiscreteColumn'   : DiscreteColumn
    'TimeColumn'       : TimeColumn
    'ContinuousColumn' : ContinuousColumn
  }

  class ColumnCollection extends Collection

    model : (attrs, options) ->
      if attrs.type of column_types
        return new column_types[attrs.type](attrs)

      console.log("Unknown column type: '#{attrs.type}'")
      return null

  return {
    Model: CrossFilter
    Collection: new CrossFilters()
    View: CrossFilterView
  }
