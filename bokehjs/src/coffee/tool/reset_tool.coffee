
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  ButtonEventGenerator = EventGenerators.ButtonEventGenerator
  RightClickEventGenerator = EventGenerators.RightClickEventGenerator

  class ResetToolView extends Tool.View
    initialize: (options) ->
      super(options)

    eventGeneratorClass: ButtonEventGenerator
    evgen_options: { 
      buttonText:"Reset View", 
      showButton: false
      buttonIcon:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAJASURBVEiJ3Za9axVBEMB/K3nRSBqLoEkhIY36ED8wgp02FsaPwsrSIiAYSOVLQCG9liqCqPgPSAqJWGhjkZhKNCZYKoIYsLIxHybvZ3EbuVzu7r2nUcGBKXZvZn47uzc7G1T+pmz5q7R/AWxLD0IIuUZqBegGTgKHgUPAMvAGeA+MA/MhhJWMX26wn1oA61cfqKsWy6p6X63mxO5MM0IalM1QHQauA9vi1IuY0Yc41wXsjpkDLAEjIYSb0f80cA641DBDdSyVwSP1lNpesAsD6kTK/ppaU1fUuXWMPKA6lHKuFYEy0A71as52T5YC1aq6HI2vNAJloIMp3zWZKgTW6/WgPoyG4+rWJkG96tPoVy8DrqvDEMJ+4CLJL38rhLDUZHLHgB3ACpBfW6nVpXWvOqM+N6m9lkQ9q95TF1s5w261r1VYBtyvjqjz6mwpcDNF7VGPFgLjx55NBG7Q7MSs+tmk9o78JqwaMywFTqYO+1v8Ac78AqyiTqtv1T1lwCk3ynf1pXqhBeCJuGDVA4V1mOdL0sK+AtNNwjqBUaADuAPMZA3KMlxWB5vNLMarRd8FdV/2DNuy9plxBehSO0IICw1A24Eh4Eacugy8yzNM65xJS6mZtJg1mVAHCkAVk9aVbk9jObE3NmDgLvA4hPAkOgzHFa9d4s+Aj8CXON4F9ALHSe7QRWA01YBzV5jWzpzvVRs/MerqbbW/JHbjJ0Z624CdwHmgDzgItAOvgVcx808hhNUsMCvZLf3j8v8/hH8At02YtB91tJYAAAAASUVORK5CYII=" 
    }
    toolType: "ResetTool"
    tool_events: {
       activated: "_activated"
    }

    _activated: (e) ->
      @plot_view.update_range()
      _.delay((() => @plot_view.eventSink.trigger("clear_active_tool")), 100)

  class ResetTool extends Tool.Model
     default_view: ResetToolView
     type: "ResetTool"

  class ResetTools extends Backbone.Collection
    model: ResetTool

    display_defaults: () ->
      super()

  return {
    "Model": ResetTool,
    "Collection": new ResetTools(),
    "View": ResetToolView,
  }


