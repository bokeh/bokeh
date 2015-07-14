_ = require "underscore"
$ = require "jquery"

ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"
Reloading = require "./reloading"
ErrorPanel = require "./errorpanel"

class DevelopShellView extends ContinuumView
  initialize: (options) ->
    super(options)
    @$el.addClass("bk-develop-shell")
    @reloading_view = new Reloading.View({ model: @mget("reloading") })
    @$el.append(@reloading_view.el)
    @errorpanel_view = new ErrorPanel.View({ model: @mget("error_panel") })
    @$el.append(@errorpanel_view.el)
    @render()

  render: () ->
    return @

class DevelopShell extends HasProperties
  type: "DevelopShell"
  default_view: DevelopShellView

  defaults: () ->
    return _.extend {}, super(), {
        reloading: new Reloading.Model(),
        error_panel: new ErrorPanel.Model()
    }

module.exports =
  Model: DevelopShell
  View: DevelopShellView
