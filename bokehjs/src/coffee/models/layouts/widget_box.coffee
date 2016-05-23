_ = require "underscore"
$ = require "jquery"

build_views = require "../../common/build_views"

BokehView = require "../../core/bokeh_view"
{WEAK_EQ, GE, EQ, Strength, Variable}  = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"


class WidgetBoxView extends LayoutDOM.View
  className: "bk-widget-box"

  render: () ->
    super()
    if @model.responsive == 'width_ar'
      @$el.css({
        # The -10 is a hack because the widget box has padding on the css.
        # TODO(bird) Make this configurable & less flaky
        width: @model._width._value - 10
        height: @model._height._value
      })

  get_height: () ->
    height = 0
    for own key, child_view of @child_views
      height += child_view.el.scrollHeight
    return height


class WidgetBox extends LayoutDOM.Model
  type: 'WidgetBox'
  default_view: WidgetBoxView

  get_constrained_variables: () ->
    return _.extend {}, super(), {
      'on-edge-align-top'    : @_top
      'on-edge-align-bottom' : @_height_minus_bottom
      'on-edge-align-left'   : @_left
      'on-edge-align-right'  : @_width_minus_right

      'box-cell-align-top'   : @_top
      'box-cell-align-bottom': @_height_minus_bottom
      'box-cell-align-left'  : @_left
      'box-cell-align-right' : @_width_minus_right

      # TODO This forces height to the widget box, but means that
      # widget box is not responsive to the height of the widgets inside it
      # - which it could be with a little effort summing up the total height
      # of all widgets.
      'box-equal-size-top'   : @_top
      'box-equal-size-bottom': @_height_minus_bottom
      'box-equal-size-left'  : @_left
      'box-equal-size-right' : @_width_minus_right
    }
  
  get_layoutable_children: () ->
    return @children

  @define {
    'children': [ p.Array, [] ]
  }

module.exports =
  Model: WidgetBox
