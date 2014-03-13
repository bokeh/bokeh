define [
  "underscore"
  "jquery"
  "jstree"
  "common/continuum_view"
  "common/has_properties"
], (_, $, $1, ContinuumView, HasProperties) ->

  class ObjectExplorerView extends ContinuumView.View
    initialize: (options) ->
      super(options)
      @onEvent = _.debounce(@onEvent, options.debounce or 200)
      @showToolbar = options.showToolbar or false
      @arrayLimit = options.arrayLimit or 100
      @render()

    base: () ->
      if not @_base?
        @_base = require("common/base")

      @_base

    delegateEvents: (events) ->
      super(events)

      for type in _.keys(@base().locations)
        @base().Collections(type).on("all", @onEvent)

    onEvent: (event) =>
      @reRender()

    createTree: (nonempty=true) ->
      nodes = for type in _.keys(@base().locations)
        children = @base().Collections(type).map (obj, index) =>
          visited = {}
          visited[obj.id] = 1
          @descend(index, obj, visited)
        @node(type, "collection", children)

      if nonempty
        node for node in nodes when node.children.length > 0
      else
        nodes

    descend: (label, obj, visited) ->
      if @isRef(obj)
        ref = true

        if not visited[obj.id]?
          obj = @base().Collections(obj.type).get(obj.id)
        else
          console.log("Cyclic reference to #{obj.type}:#{obj.id}")

      if obj instanceof HasProperties
        visited = _.clone(visited)
        visited[obj.id] = 1
        children = (@descend(attr, value, visited) for own attr, value of obj.attributes when @isAttr(attr))
        type = obj.type
        value = null
        color = null
      else if _.isArray(obj)
        truncate = obj.length > @arrayLimit
        arrayLimit = @arrayLimit or obj.length
        children = (@descend(index, value, visited) for value, index in obj[..@arrayLimit])
        type = "Array[#{obj.length}]" + (if truncate then " (showing first #{@arrayLimit} items)" else "")
        value = null
        color = null
      else if _.isObject(obj)
        children = (@descend(key, value, visited) for own key, value of obj)
        type = "Object[#{_.keys(obj).length}]"
        value = null
        color = null
      else
        children = []
        [type, value, color] =
          if      _.isUndefined(obj) then [null,       null,         'orchid']
          else if _.isNull(obj)      then [null,       null,         'teal']
          else if _.isBoolean(obj)   then ["Boolean",  null,         'darkmagenta']
          else if _.isNumber(obj)    then ["Number",   null,         'green']
          else if _.isString(obj)    then ["String",   "\"#{obj}\"", 'firebrick']
          else if _.isFunction(obj)  then ["Function", null,         null]
          else if _.isDate(obj)      then ["Date",     null,         null]
          else if _.isRegExp(obj)    then ["RegExp",   null,         null]
          else if _.isElement(obj)   then ["Element",  null,         null]
          else                            [typeof obj, null,         null]
        value = "" + obj if not value?
        color = "black" if not color?

      html = ["<span style=\"color:gray\">#{label}</span>"]

      if type?
        html = html.concat([
          ": "
          "<span style=\"color:blue\">#{type}#{if ref then "<span style=\"color:red\">*</span>" else ""}</span>"
        ])

      if value?
        html = html.concat([
          " = "
          "<span style=\"color:#{color}\">#{value}</span>"
        ])

      @node(html.join(""), "", children)

    isRef: (obj) ->
      _.isObject(obj) and (_.isEqual(_.keys(obj), ["id", "type"]) or
                           _.isEqual(_.keys(obj), ["type", "id"]))

    isAttr: (attr) ->
      attr.length > 0 and attr[0] != '_'

    node: (text, type, children, open) ->
      text: text
      type: type
      children: children or []
      state: { open: open or false }

    renderToolbar: () ->
      $toolbar = $('<div class="btn-group"></div>')
      $refresh = $('<button type="button" class="btn btn-default">Refresh</button>')
      $refresh.click (event) => @reRender()
      $toolbar.append($refresh)
      if not @showToolbar
        $toolbar.hide()
      $toolbar

    themeUrl: () -> null

    createContextMenu: (node) =>
      data = node.original
      menu = {}

      if data.type != "collection"
        menu["remove"] = {label: "Remove"}

      menu

    renderTree: () ->
      $('<div/>').jstree
        core:
          data: @createTree()
          themes:
            url: @themeUrl()
        contextmenu:
          items: @createContextMenu
        plugins: ["contextmenu"]

    render: () ->
      @$toolbar = @renderToolbar()
      @$tree = @renderTree()
      @$el.append([@$toolbar, @$tree])

    reRender: () ->
      @$tree.jstree('destroy')
      @$el.empty()
      @render()

  return {
    View: ObjectExplorerView
  }
