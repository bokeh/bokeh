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

], (HasParent, HasProperties, continuum_view,
  build_views, Backbone, _, draggable, droppable,
  crossfiltertemplate,
  discretecolumntemplate, continuouscolumntemplate) ->
  ContinuumView = continuum_view.View

  class CrossFilterView extends ContinuumView
    tag : "div"
    attributes:
      class : "bk-crossfilter"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
      return this

    render : () ->
      if @columnview?
        @columnview.$el.detach();

      @$el.empty()
      html = crossfiltertemplate()
      @$el.html(html)

      @columnview = new ColumnsView(collection : @model.columns)
      @filterview = new FilterView(
        el : @$('.bk-filters-selections')
        collection : @model.columns
        model : @model
      )
      @$('.bk-column-list').append(@columnview.el)
      @$el.height(@mget('height'))
      @$el.width(@mget('width'))
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
      height : 900
      widht : 1100

  class CrossFilters extends Backbone.Collection
    model : CrossFilter

  crossfilters = new CrossFilters()

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
      });

    render_column_selectors : () ->
      _.map(@views, (view) -> view.$el.detach())
      filter_widget_dict = {}
      for own key, val of @mget('filter_widgets')
        filter_widget_dict[key] = @model.resolve_ref(val)
      filtering_columns = @mget('filtering_columns')
      filter_widgets = (filter_widget_dict[col] for col in filtering_columns \
        when filter_widget_dict[col]?)
      build_views(@views, filter_widgets)
      _.map(filter_widgets, (model) => @$el.append(@views[model.id].$el))







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
      class : "bk-crossfilter-column-entry"
    initialize : (options) ->
      super(options)
      @render()

    render : () ->
      @$el.html(@template(@model.attributes))
      @$el.draggable(
        appendTo: 'body',
        containment : 'document',
        helper : 'clone',
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