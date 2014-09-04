define [
  "backbone"
  "underscore"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
  "./selecttemplate"
], (Backbone, build_views, continuum_view, HasParent, Logging, template) ->

  ContinuumView = continuum_view.View
  logger = Logging.logger

  class SelectView extends ContinuumView
    tagName : "div"
    template : template
    events :
      "change select" : "change_input"

    change_input : () ->
      value = @$('select').val()
      logger.debug("selectbox: value = #{value}")
      @mset('value', value)
      @model.save()

    initialize : (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render : () ->
      @$el.empty()
      html = @template(@model.attributes)
      @$el.html(html)
      return this

  class Select extends HasParent
    type : "Select"
    default_view : SelectView

    defaults : () ->
      def =
        title : ''
        value : ''
        options : []
      return def

  class Selects extends Backbone.Collection
    model : Select

  return {
    Model : Select
    Collection : new Selects()
    View : SelectView
  }
