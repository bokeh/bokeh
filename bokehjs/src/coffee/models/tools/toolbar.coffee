_ = require "underscore"
$ = require "jquery"
$$1 = require "bootstrap/dropdown"

{logger} = require "../../core/logging"
{Strength}  = require "../../core/layout/solver"
p = require "../../core/properties"

Widget = require "../widgets/widget"

ActionTool = require "./actions/action_tool"
HelpTool = require "./actions/help_tool"
GestureTool = require "./gestures/gesture_tool"
InspectTool = require "./inspectors/inspect_tool"
toolbar_template = require "./toolbar_template"


class ToolbarView extends Widget.View
  template: toolbar_template

  initialize: (options) ->
    super(options)
    @location = options.location
    @listenTo(@model, 'change', () => @render())

  render: () ->
    @update_constraints()
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      'width': @model._width._value
      'margin-left': @model._whitespace_left._value
      'margin-right': @model._whitespace_right._value
      'margin-top': @model._whitespace_top._value
      'margin-bottom': @model._whitespace_bottom._value
    })
    location = if @mget("location")? then @mget('location') else 'above'
    @$el.html(@template({logo: @mget("logo"), location: location}))

    inspectors = @model.get('inspectors')
    button_bar_list = @$(".bk-bs-dropdown[type='inspectors']")

    if inspectors.length == 0
      button_bar_list.hide()
    else
      anchor = $('<a href="#" data-bk-bs-toggle="dropdown"
                  class="bk-bs-dropdown-toggle">inspect
                  <span class="bk-bs-caret"></a>')
      anchor.appendTo(button_bar_list)
      ul = $('<ul class="bk-bs-dropdown-menu" />')
      _.each(inspectors, (tool) ->
        item = $('<li />')
        item.append(new InspectTool.ListItemView({model: tool}).el)
        item.appendTo(ul)
      )
      ul.on('click', (e) -> e.stopPropagation())
      ul.appendTo(button_bar_list)
      anchor.dropdown()

    button_bar_list = @$(".bk-button-bar-list[type='help']")
    _.each(@model.get('help'), (item) ->
      button_bar_list.append(new ActionTool.ButtonView({model: item}).el)
    )

    button_bar_list = @$(".bk-button-bar-list[type='actions']")
    _.each(@model.get('actions'), (item) ->
      button_bar_list.append(new ActionTool.ButtonView({model: item}).el)
    )

    gestures = @model.get('gestures')
    for et of gestures
      button_bar_list = @$(".bk-button-bar-list[type='#{et}']")
      _.each(gestures[et].tools, (item) ->
        button_bar_list.append(new GestureTool.ButtonView({model: item}).el)
      )

    return @

  update_constraints: () ->
    s = @model.document.solver()
    if @mget('responsive') == 'width'
      if @mget('location') in ['left', 'right']
        s.suggest_value(@model._width, 30)
      if @mget('location') in ['above', 'below']
        s.suggest_value(@model._height, 30)
    if @mget('responsive') == 'fixed'
      s.suggest_value(@model._width, @mget('width'))
      s.suggest_value(@model._height, @mget('height'))

class Toolbar extends Widget.Model
  type: 'Toolbar'
  default_view: ToolbarView

  initialize: (attrs, options) ->
    super(attrs, options)
    @listenTo(@, 'change:tools', () => @_init_tools())
    @_init_tools()

  _init_tools: () ->
    for tool in @get('tools')
      if tool instanceof InspectTool.Model
        if not _.some(@inspectors, (t) => t.id == tool.id)
          @inspectors = @inspectors.concat([tool])
      else if tool instanceof HelpTool.Model
        if not _.some(@help, (t) => t.id == tool.id)
          @help = @help.concat([tool])
      else if tool instanceof ActionTool.Model
        if not _.some(@actions, (t) => t.id == tool.id)
          @actions = @actions.concat([tool])
      else if tool instanceof GestureTool.Model
        et = tool.event_type

        if et not of @gestures
          logger.warn("Toolbar: unknown event type '#{et}' for tool:
                      #{tool.type} (#{tool.id})")
          continue

        if not _.some(@gestures[et].tools, (t) => t.id == tool.id)
          @gestures[et].tools = @gestures[et].tools.concat([tool])
        @listenTo(tool, 'change:active', _.bind(@_active_change, tool))

    for et of @gestures
      tools = @gestures[et].tools
      if tools.length == 0
        continue
      @gestures[et].tools = _.sortBy(tools, (tool) -> tool.default_order)
      if et not in ['pinch', 'scroll']
        @gestures[et].tools[0].set('active', true)

  _active_change: (tool) =>
    event_type = tool.event_type
    gestures = @get('gestures')

    # Toggle between tools of the same type by deactivating any active ones
    currently_active_tool = gestures[event_type].active
    if currently_active_tool? and currently_active_tool != tool
      logger.debug("Toolbar: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{event_type}'")
      currently_active_tool.set('active', false)

    # Update the gestures with the new active tool
    gestures[event_type].active = tool
    @set('gestures', gestures)
    logger.debug("Toolbar: activating tool: #{tool.type} (#{tool.id}) for event type '#{event_type}'")
    return null

  @define {
      tools:             [ p.Array,    []                     ]
      logo:              [ p.String,   'normal'               ] # TODO (bev)
  }

  @internal {
    gestures:   [ p.Any, () -> {
      pan:       { tools: [], active: null }
      tap:       { tools: [], active: null }
      doubletap: { tools: [], active: null }
      scroll:    { tools: [], active: null }
      pinch:     { tools: [], active: null }
      press:     { tools: [], active: null }
      rotate:    { tools: [], active: null }
    } ]
    actions:    [ p.Array, [] ]
    inspectors: [ p.Array, [] ]
    help:       [ p.Array, [] ]
    location:   [ p.Location, 'above' ]
  }

  @override {
    responsive: 'width'
  }

  get_edit_variables: () ->
    edit_variables = []
    # If layout is box, we do nothing - toolbar grows to fill its container
    # If layout is fixed, we add both - toolbar is set to whatever is specified
    # If layout is width, we add height/width depending on toolbar location
    # Note: This kind of behavior maybe something we generalize if we conceive
    # of a proper orientation system.
    if @responsive == 'fixed'
      edit_variables.push({edit_variable: @_width, strength: Strength.strong})
      edit_variables.push({edit_variable: @_height, strength: Strength.strong})
    if @responsive == 'width' and @location in ['above', 'below']
      edit_variables.push({edit_variable: @_height, strength: Strength.strong})
    if @responsive == 'width' and @location in ['left', 'right']
      edit_variables.push({edit_variable: @_width, strength: Strength.strong})
    return edit_variables

  get_constrained_variables: () ->
    # Toolbar has its own oddities and the responsive modes behave slightly
    # differently. We always want Toolbar to be only as big as it is (30px) so
    # we don't set the box-equal-size constrained variables so it always stays
    # narrow.
    constrained_variables = {
      'width': @_width
      'height': @_height
      # when this widget is on the edge of a box visually,
      # align these variables down that edge. Right/bottom
      # are an inset from the edge.
      'on-top-edge-align' : @_top
      'on-bottom-edge-align' : @_height_minus_bottom
      'on-left-edge-align' : @_left
      'on-right-edge-align' : @_width_minus_right
      # when this widget is in a box cell with the same "arity
      # path" as a widget in another cell, align these variables
      # between the two box cells. Right/bottom are an inset from
      # the edge.
      'box-cell-align-top' : @_top
      'box-cell-align-bottom' : @_height_minus_bottom
      'box-cell-align-left' : @_left
      'box-cell-align-right' : @_width_minus_right
      # insets from the edge that are whitespace (contain no pixels),
      # this is used for spacing within a box.
      'whitespace-top' : @_whitespace_top
      'whitespace-bottom' : @_whitespace_bottom
      'whitespace-left' : @_whitespace_left
      'whitespace-right' : @_whitespace_right
    }
    return constrained_variables

module.exports =
  Model: Toolbar
  View: ToolbarView
