_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
else
  $1 = require "bootstrap/modal"
ActionTool = require "./action_tool"
preview_save_tool_template = require "./preview_save_tool_template"

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
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozMjFERDhENjIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozMjFERDhENzIwQjIxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQ0MjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjMyMUREOEQ1MjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+h5hT8AAAAKBJREFUeNpiWbhs5QcGBgZ+hgECTAwDDGAO+AjEjGj4Lw5xUrAAkl3ocr8IhQAzjT3PRu0o+I+EHw65NDDqgJHrABYC8t9JMIuRmiHACS2IKC0LOKH0X1JDAOTzs0BsBs3XlIKz5KSBRCA+RQXLjwNxNDlp4BoQm9Mo7fGPZsNRB4w6YNQBI94BfwfaAV9G08CoA9DbA/xUavkMvRAACDAAaPgYViexODkAAAAASUVORK5CYII="

module.exports =
  Model: PreviewSaveTool
  View: PreviewSaveToolView