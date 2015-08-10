_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
else
  $1 = require "bootstrap/tab"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"
tabs_template = require "./tabs_template"

class TabsView extends ContinuumView
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    for own key, val of @views
      val.$el.detach()
    @$el.empty()

    tabs = @mget('tabs')
    active = @mget("active")

    children = (tab.get("child") for tab in tabs)
    build_views(@views, children)

    html = $(tabs_template({
      tabs: tabs
      active: (i) -> if i == active then 'bk-bs-active' else ''
    }))

    that = this  # To keep reference to TabsView
    html.find("> li > a").click (event) ->
      event.preventDefault()
      $(this).tab('show')
      # Update active index
      that.change_input($(this).data('index'))

    $panels = html.children(".bk-bs-tab-pane")

    for [child, panel] in _.zip(children, $panels)
      $(panel).html(@views[child.id].$el)

    @$el.append(html)
    @$el.tabs
    return @

  change_input: (active) ->
    @mset('active', active)
    @model.save()
    @mget('callback')?.execute(@model)

class Tabs extends HasProperties
  type: "Tabs"
  default_view: TabsView

  defaults: ->
    return _.extend {}, super(), {
      tabs: []
      active: 0
    }

module.exports =
  Model: Tabs
  View: TabsView
