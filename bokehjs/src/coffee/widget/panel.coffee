_ = require "underscore"
$ = require "jquery"
Collection = require "../common/collection"
ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"

class PanelView extends ContinuumView

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.empty()
    return @

class Panel extends HasProperties
  type: "Panel"
  default_view: PanelView

  defaults: () ->
    return _.extend {}, super(), {
      title: ""
      child: null
      closable: false
    }

class Panels extends Collection
  model: Panel

module.exports =
  Model: Panel
  View: PanelView
  Collection: new Panels()
