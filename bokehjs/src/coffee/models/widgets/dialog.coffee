import * as _ from "underscore"
import * as $ from "jquery"
import "bootstrap/modal"

import * as p from "../../core/properties"

import dialog_template from "./dialog_template"
import {Widget, WidgetView} from "./widget"

export class DialogView extends WidgetView

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
      if typeof content is 'object'
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
    super()
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

export class Dialog extends Widget
  type: "Dialog"
  default_view: DialogView

  @define {
      visible:     [ p.Bool,    false ]
      closable:    [ p.Bool,    true  ]
      title:       [ p.String,  ""    ]
      content:     [ p.String,  ""    ]
      buttons:     [ p.Array,   []    ]
      buttons_box: [ p.Instance       ]
    }
