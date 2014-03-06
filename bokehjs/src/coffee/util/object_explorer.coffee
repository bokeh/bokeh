define [
  "underscore"
  "jquery"
  "jstree"
  "common/base"
  "common/continuum_view"
  "common/has_properties"
], (_, $, $1, Base, ContinuumView, HasProperties) ->

  class ObjectExplorerView extends ContinuumView.View
    initialize: (options) ->
      super(options)
      @render()

    delegateEvents: (events) ->
      super(events)

      for type in _.keys(Base.locations)
        Base.Collections(type).on("all", _.throttle(@onEvent, 200))

    onEvent: (event) =>
      console.log(event)
      @reRender()

    createTree: () ->
      nodes = for type in _.keys(Base.locations)
        children = Base.Collections(type).map (obj) =>
          @node(obj.id, obj.type, @descend(obj))
        @node("colllection-" + type, type, children, true)

      node for node in nodes when node.children.length > 0

    descend: (obj) ->
      for own attr, value of obj.attributes
        if @isRef(value) # TODO: use ref icon
          value = obj.get_obj(attr)

        if value instanceof HasProperties
          @node(undefined, attr + ": " + value.type, @descend(value))
        else if _.isArray(value)
          items =
          @node(undefined, attr + ": Array[" + value.length + "]", items)
        else
          @leaf(attr + ": " + value)

      ###
      else if _.isUndefined(value)
      else if _.isNull(value)
      else if _.isBoolean(value)
      else if _.isNumber(value)
      else if _.isString(value)
      else if _.isFunction(value)
      else if _.isArray(value)
      else if _.isObject(value)
      else if _.isDate(value)
      else if _.isRegExp(value)
      else if _.isElement(value)
      ###

    isRef: (obj) ->
      _.isObject(obj) && (_.isEqual(_.keys(obj), ["id", "type"]) ||
                          _.isEqual(_.keys(obj), ["type", "id"]))

    node: (id, text, children, open) ->
      id: id
      text: text
      children: children || []
      state: { open: open || false }

    leaf: (text) -> text: "" + text

    reRender: () ->
      @$tree.jstree('destroy')
      @$tree.remove()
      @render()

    render: () ->
      @$tree = $('<div/>').jstree({
        core: {
          data: @createTree()
          themes: {
            url: '/static/vendor/jstree/dist/themes/default/style.min.css'
          }
        }
      })
      @$el.html(@$tree)

  return {
    View: ObjectExplorerView
  }
