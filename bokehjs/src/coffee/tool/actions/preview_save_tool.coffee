
define [
  "underscore"
  "jquery"
  "bootstrap/modal"
  "common/collection"
  "./action_tool"
  "./preview_save_tool_template"
], (_, $, $$1, Collection, ActionTool, preview_save_tool_template) ->

  class PreviewSaveToolView extends ActionTool.View
    className: "bk-bs-modal"
    template: preview_save_tool_template

    initialize: (options) ->
      super(options)
      @$el.html(@template())
      @$el.attr("tabindex", "-1")
      $('body').append(@$el)
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
    icon: "bk-icon-previewsave"

  class PreviewSaveTools extends Collection
    model: PreviewSaveTool

  return {
    Model: PreviewSaveTool,
    Collection: new PreviewSaveTools(),
    View: PreviewSaveToolView,
  }
