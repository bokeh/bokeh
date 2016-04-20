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
    # Attach to DOM (should be somewhere under bk-root to make css work)
    @plot_view.el.appendChild(@el)
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
    # Bootstrap creates backdrop DOM element in the body, we move it to
    # somwhere under bk-root so that css works as it should.
    bd = document.getElementsByClassName('bk-bs-modal-backdrop')[0]
    @plot_view.el.appendChild(bd)

class PreviewSaveTool extends ActionTool.Model
  default_view: PreviewSaveToolView
  type: "PreviewSaveTool"
  tool_name: "Preview/Save"
  icon: "bk-tool-icon-save"

module.exports =
  Model: PreviewSaveTool
  View: PreviewSaveToolView
