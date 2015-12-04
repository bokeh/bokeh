_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/tab"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
tabs_template = require "./tabs_template"
Widget = require "./widget"

class TabsView extends ContinuumView

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo @model, 'change', this.render

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

    that = this
    html.find("> li > a").click (event) ->
      event.preventDefault()
      $(this).tab('show')
      panelId = $(this).attr('href').replace('#tab-','')
      tabs = that.model.get('tabs')
      panelIdx = _.indexOf(tabs, _.find(tabs, (panel) ->
        return panel.id == panelId
      ))
      that.model.set('active', panelIdx)
      that.model.get('callback')?.execute(that.model)

    $panels = html.children(".bk-bs-tab-pane")

    for [child, panel] in _.zip(children, $panels)
      $(panel).html(@views[child.id].$el)

    @$el.append(html)
    @$el.tabs
    return @

class Tabs extends Widget.Model
  type: "Tabs"
  default_view: TabsView

  defaults: ->
    return _.extend {}, super(), {
      tabs: []
      active: 0
      callback: null
    }

module.exports =
  Model: Tabs
  View: TabsView
