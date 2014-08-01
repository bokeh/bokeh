
define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "backbone",
  "common/bulk_save",
  "./tool",
  "./event_generators",
  "./preview_save_tool_template",
], (_, $, $$1, Backbone, bulk_save, Tool, EventGenerators, preview_save_tool_template) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator

  class PreviewSaveToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { 
      buttonText: "Preview/Save", 
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAE4SURBVEiJ5ZbhTcMwEIW/h/hPN6AbUCagbNANKJNQJqiYgI7SbpARygRNJ3j8iFOq1E6s0BSpPClK4rPv+XzvbMs2l8TNRdn+gvA20jYCHvo4k7RJ2Q6ps918CvfHzvYsRWgbRURj4AtYAVPgKTL+AyjD94xqRTbABLgDXiWtciO07XWwLWJhNBzVfaa2J7bL8D+PRXhW0UgqqFZlD3w2SWEAlXaRDlIWDdKl7dGvCI8dUJVRinQR7AflxurwGGWifZe5JRbhPc4lXFFJfdzejULSOmcGrYSSSmCe4ygX/3PzPiCocUl3Dpt4T+W0SzRz+uVQVHV4gq4lrWvsWZnomsn1i+b6CVMqvbf9xs9p/2I7dvKnUI8fNw2xK0ZBz0tUCx6D31NCSdienpFsK2lb88QiHBQXF803MWL34Bj7qCQAAAAASUVORK5CYII=" 
    }
    toolType: "PreviewSaveTool"
    tool_events: {
      activated: "_activated"
      deactivated: "_close_modal"
    }

    _activated: (e) ->
      data_uri = @plot_view.canvas_view.canvas[0].toDataURL()
      @plot_model.set('png', @plot_view.canvas_view.canvas[0].toDataURL())

      @$modal = $(preview_save_tool_template({data_uri: data_uri}))
      $('body').append(@$modal)

      @$modal.on('hidden', () =>
        @plot_view.eventSink.trigger("clear_active_tool"))
      @$modal.modal({show: true})

    _close_modal : () ->
      @$modal.remove()

  class PreviewSaveTool extends Tool.Model
    default_view: PreviewSaveToolView
    type: "PreviewSaveTool"

    display_defaults: () ->
      super()

  class PreviewSaveTools extends Backbone.Collection
    model: PreviewSaveTool

  return {
    Model: PreviewSaveTool,
    Collection: new PreviewSaveTools(),
    View: PreviewSaveToolView,
  }
