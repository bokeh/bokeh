define [
  "underscore",
  "jquery",
  "bootstrap/modal",
  "common/collection",
  "tool/action_tool",
  "./object_explorer_tool_template",
  "widget/object_explorer",
], (_, $, $$1, Collection, ActionTool, object_explorer_tool_template, ObjectExplorer) ->

  class ObjectExplorerToolView extends ActionTool.View

    activate: () ->
      @$modal = $(object_explorer_tool_template({}))
      @$object_explorer_view = new ObjectExplorer.View({
        el: @$modal.find(".bk-bs-modal-body")
      })
      $('body').append(@$modal)
      @$modal.on('hidden', () => @mset('active', false))
      @$modal.modal({show: true})

    deactivate: () ->
      @$modal.remove()

  class ObjectExplorerTool extends ActionTool.Model
    default_view: ObjectExplorerToolView
    type: "ObjectExplorerTool"
    tool_name: "Object Explorer"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAJHSURBVEiJvZbPTlNREManQmtSvTvqI7gw4R1cQpP6ABoahKWURxBfgo0ulRfgGYA9lI1dIdEFMSo0sZLY3p+L+514eu85t7dKOskk58838+XMmTNnaoAtUu4tlM3MDLCqpwQ2KMrGPDzREwLLQJKmaU3zB2a2pu1fUjOzNaBpZpamaQ1IgOWZzLm1OrADfAQ6wCOgDfwAJsCudKK1dWGeyeYVUA/y5AmBhsh8+QqMNb4EHksvtTYRxpcdoFFKCCx5ZCOgD9xofgOcAm8UgbrGpzlMX7aOdKmMMAEGAve1tgUcA92Sa+kKs6V5Xz4GQBIl1KV3gN/AN2Azevlx8k3ZjoGOl3ThO9SmC9HJPxCeuPDm1ovPQiFtm9l9MxuZ2X7AYYssY9tAK8C5L9uGMA/zDpx2gQ/e6c4CZKvAoZeJh8BqAHfmJdF7soIxHVKm5ROwl3OyAhxp/4sUra3ksHvy4UuQcET2oJ9QfLhtYa6Ap9Irra3nsHX52OXvE4mWNqRVpAwX9hMJ6QXwOodreSH9LC0L6cWskLqkGQpwF0kzlM9ugVDARHd1C/wEngeclT4L4IVsb4WJVxrPyD2N4/D1xIV5Hr4rbWbWNLPvZvZuXkIzeyvbJl5pKzBrHCveR8B2yam2hXmpebXiTfn3NATOKX5P516iXTPP96SNBtBjWlz1h6yCuA/YVZOxML70mPUBe5uuxRiQtQ2uxbgm+9170lCLMZBttRbDAxSaKODAC7cL2wEVmqiZhJHk+O82sVaV7K5k4Z33H/QTdNyD5wyAAAAAAElFTkSuQmCC"
    event_type: null

  class ObjectExplorerTools extends Collection
    model: ObjectExplorerTool

  return {
    Model: ObjectExplorerTool,
    Collection: new ObjectExplorerTools(),
    View: ObjectExplorerToolView,
  }
