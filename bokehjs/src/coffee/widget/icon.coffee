_ = require "underscore"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class IconView extends ContinuumView
  tagName: "i"
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @prev_spin_state = @mget("spin")
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    # Reset modified html properties
    @$el.empty()
    @$el.removeClass()

    @$el.addClass("bk-fa")
    @$el.addClass("bk-fa-" + @mget("name"))

    size = @mget("size")
    if size? then @$el.css("font-size": size + "em")

    flip = @mget("flip")
    if flip? then @$el.addClass("bk-fa-flip-" + flip)

    if @mget("spin")
      @$el.addClass("bk-fa-spin")

    if @prev_spin_state != @mget("spin")
      # This is a hack to add an additional request/response cycle when updating
      # the icon's spin attribute. Suppose we want to load a large amount of data
      # or perform a large computation, but want to notify the user that this is
      # happening by adding a spin animation to this icon. Since the bokeh-server
      # only provides a single transaction for the initial action, we can't first
      # update the spin animation and then load the data. Instead, we only update
      # the spin animation, send back that the spin_updates counter has incremented,
      # and then have the downstream script listen to changes in spin_updates to
      # perform its larger actions.
      #
      # Try for example: bokeh-server --script examples/app/spinning_icon/spin_app.py
      @prev_spin_state = @mget("spin")
      @change_input()

    return @

  change_input: () ->
    # Increment counter of number of changes of spin
    @mset('spin_updates', @mget('spin_updates') + 1)
    @model.save()
    @mget('callback')?.execute(@model)

class Icon extends HasParent
  type: "Icon"
  default_view: IconView

  defaults: ->
    return _.extend {}, super(), {
      name: ""
      size: null
      flip: null
      spin: false
      spin_updates: 0
    }

module.exports =
  Model: Icon
  View: IconView
