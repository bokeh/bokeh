_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/tab"

tabs_template = require "./tabs_template"
Widget = require "./widget"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"

class TabsView extends BokehView

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

  @define {
      tabs:     [ p.Array,   [] ]
      active:   [ p.Number,  0  ]
      callback: [ p.Instance    ]
    }

module.exports =
  Model: Tabs
  View: TabsView
