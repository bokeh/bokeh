_ = require "underscore"
$ = require "jquery"
build_views = require "common/build_views"
ContinuumView = require "common/continuum_view"
BaseBox = require "widget/basebox"

class StatsBoxView extends ContinuumView

  tag: "div"

  attributes:
    class: "bk-vbox"

  initialize: (options) ->
    super(options)

    styles =
       rel: "stylesheet",
       type: "text/css",
       href: "//s3.amazonaws.com/bcollins/stats_box.css"

    $("<link/>", styles).appendTo("head")

    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()

    name = null
    field_type = null

    for k, v of @mget('display_items')
      if k == 'name'
        name = v
      if k == 'type'
        field_type = v

    # create table
    $table = $('<table class="bk-stats-table" />')
    $table.append("""<tr><th>#{name}</th><th></th></tr>""")

    for k,v of @mget("display_items")
      if k in ['name','type']
        continue
      $table.append("""<tr><td class="table-field"><strong>#{k}</strong></td><td class="table-value">#{v}</td></tr>""")

    @$el.append($table)

    for child in children
      @$el.append(@views[child.id].$el)

    return @

class StatsBox extends BaseBox.Model
  type: "StatsBox"
  default_view: StatsBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
      display_items: {}
      title: null
    }

  children: () ->
    return @get('children')

module.exports =
  Model: StatsBox
  View: StatsBoxView
