_ = require "underscore"
$ = require "jquery"
$1 = require "bootstrap/modal"

p = require "../../core/properties"

dialog_template = require "./dialog_template"
Widget = require "./widget"


class DialogView extends Widget.View

  initialize: (options) ->
    super(options)
    @render()
    @render_content()
    @render_buttons()
    @listenTo(@model, 'destroy', @remove)
    @listenTo(@model, 'change:visible', @change_visibility)
    @listenTo(@model, 'change:content', @change_content)

  render_content: () ->
    if @content_view?
      @content_view.remove()

    content = @model.content
    if content?
      if typeof(content) != "string"
        @content_view = new content.default_view(model: content)
        @$el.find('.bk-dialog-content').empty()
        @$el.find('.bk-dialog-content').append(@content_view.$el)
      else
        @$el.find('.bk-dialog-content').empty()
        @$el.find('.bk-dialog-content').text(content)
    return @

  render_buttons: () ->
    if @buttons_box_view?
      @buttons_box_view.remove()
    buttons_box = @model.buttons_box
    if buttons_box?
      @buttons_box_view = new buttons_box.default_view(model: buttons_box)
      @$el.find('.bk-dialog-buttons_box').empty()
      @$el.find('.bk-dialog-buttons_box').append(@buttons_box_view.$el)
    return @

  render: () ->
    @$modal = $(dialog_template(@model.attributes))
    @$modal.modal({show: @model.visible})
    @$modal.on('hidden.bk-bs.modal', @onHide)
    @$el.html(@$modal)
    return @

  onHide: (event) =>
    @model.setv("visible", false, {silent: true})

  change_visibility: () =>
    @$modal.modal(if @model.visible then "show" else "hide")

  change_content: () =>
    @render_content()

class Dialog extends Widget.Model
  type: "Dialog"
  default_view: DialogView

  initialize: (options) ->
    super(options)
    @children = []
    if typeof(@content) != "string"
      @children.push(@content)

  @define {
      visible:     [ p.Bool,    false ]
      closable:    [ p.Bool,    true  ]
      title:       [ p.String,  ""    ]
      content:     [ p.Any,     ""    ]  # str or LayoutDOM
      buttons:     [ p.Array,   []    ]
      buttons_box: [ p.Instance       ]
    }

  @internal {
      children:    [ p.Array,   []    ]
  }

  get_layoutable_children: () ->
    return @get('children')

  get_edit_variables: () ->
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints

module.exports =
  Model: Dialog
  View: DialogView
