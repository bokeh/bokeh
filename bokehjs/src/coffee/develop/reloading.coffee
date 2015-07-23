_ = require "underscore"
$ = require "jquery"

ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"

class ReloadingView extends ContinuumView
  initialize: (options) ->
    super(options)
    @$el.addClass("bk-reloading")
    @$el.html("<div class=\"bk-reloading-icon\"></div>")
    @render()

    @listenTo(@model, 'change:visible', @changed)

  render: () ->
    if @mget("visible")
      @$el.show()
    else
      @$el.hide()
    return @

  changed: () ->
    @render()

class Reloading extends HasProperties
  type: "Reloading"
  default_view: ReloadingView

  initialize: (options) ->
    super(options)

  defaults: () ->
    return _.extend {}, super(), {
      visible: false
    }

module.exports =
  Model: Reloading
  View: ReloadingView
