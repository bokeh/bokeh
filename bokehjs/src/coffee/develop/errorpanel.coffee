_ = require "underscore"
$ = require "jquery"

ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"
errorpanel_template = require "./errorpanel_template"

class ErrorPanelView extends ContinuumView
  initialize: (options) ->
    super(options)
    @$contents = null
    @show_detail = false
    @$el.addClass("bk-error-panel")
    @render()
    # TODO often all three properties change at once,
    # when that happens we render three times
    @listenTo(@model, 'change:error', @changedMessages)
    @listenTo(@model, 'change:error_detail', @changedMessages)
    @listenTo(@model, 'change:visible', @render)

  # the ... stuff is because we want to be able to call
  # jquery show/hide with no args when not animating.
  updateDetailExpansion: (animate...) ->
    if @mget("error_detail").length > 0
      if @show_detail
        @$el.find(".bk-error-expander").addClass("open")
        @$el.find(".bk-error-bottom").show(animate...)
        @$el.find(".bk-error-expand-hint").show()
        @$el.find(".bk-error-expand-hint").css("visibility", "hidden")
      else
        @$el.find(".bk-error-expander").removeClass("open")
        @$el.find(".bk-error-bottom").hide(animate...)
        @$el.find(".bk-error-expand-hint").css("visibility", "visible")
        @$el.find(".bk-error-expand-hint").show()
      @$el.find(".bk-error-expander").show()
    else
      # this is because there are no details, so no animation
      @$el.find(".bk-error-expander").hide()
      @$el.find(".bk-error-bottom").hide()
      @$el.find(".bk-error-expand-hint").hide()

  render: () ->
    if @mget("visible")
      first = @$contents == null
      animate = [500]
      if first
        @$contents = $(errorpanel_template(@model.attributes))
        @$el.html(@$contents)
        animate = []
        @$el.find(".bk-error-expander").click (event) =>
          event.preventDefault()
          @show_detail = not @show_detail
          @render()
        @$el.find(".bk-error-expand-hint").click (event) =>
          event.preventDefault()
          @show_detail = not @show_detail
          @render()
      @updateDetailExpansion(animate...)
      @$el.show()
    else
      @$el.hide()
      @invalidateContents()

  invalidateContents: () ->
    @$contents?.detach()
    @$contents = null
    @$el.empty()

  changedMessages: () ->
    @invalidateContents()
    @render()

class ErrorPanel extends HasProperties
  type: "ErrorPanel"
  default_view: ErrorPanelView

  defaults: () ->
    return _.extend {}, super(), {
      visible: false,
      error: "",
      error_detail: ""
    }

module.exports =
  Model: ErrorPanel
  View: ErrorPanelView
