_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/modal"

ActionTool = require "./action_tool"
preview_save_tool_template = require "./preview_save_tool_template"

class PreviewSaveToolView extends ActionTool.View
  className: "bk-bs-modal"
  template: preview_save_tool_template

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.empty()
    @$el.html(@template())
    @$el.attr("tabindex", "-1")
    @$el.on('hidden', () => @$el.modal('hide'))
    @$el.modal({show: false})

  do: () ->
    canvas = @plot_view.canvas_view.canvas[0]
    @$('.bk-bs-modal-body img').attr("src", canvas.toDataURL());
    @$el.modal('show')

class PreviewSaveTool extends ActionTool.Model
  default_view: PreviewSaveToolView
  type: "PreviewSaveTool"
  tool_name: "Preview/Save"
  icon: "bk-tool-icon-save"

module.exports =
  Model: PreviewSaveTool
  View: PreviewSaveToolView
