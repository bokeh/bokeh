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

    # create caption
    $caption = $('<caption/>')
    $caption.append("<strong>#{name}</strong>")
    $caption.css('font-family', 'Lucida Sans Unicode')
    $caption.css('text-align', 'left')

    # create table
    $table = $('<table/>')
    $table.append($caption)

    for k,v of @mget("display_items")
      if k in ['name','type']
        continue
      $table.append("""<tr><td class="table-field"><strong>#{k}</strong></td><td class="table-value">#{v}</td></tr>""")

    # add style
    $table.css('font-family', 'Lucida Sans Unicode')
    $table.css('font-size', '12px')
    $table.css('background', '#fff')
    $table.css('width', '10em')
    $table.css('border-collapse', 'collapse')
    $table.css('text-align', 'left')
    $table.css('margin', '20px')

    $table.find('td').css('padding', '2em')
    $table.find('td').css('border', '#4E95F4 1px solid')
    $table.find('tr').css('background', '#B81F3')

    $table.find('td.table-field').css('padding', '2em')
    $table.find('td').css('border', '#4E95F4 1px solid')
    $table.find('tr').css('background', '#B81F3')

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
