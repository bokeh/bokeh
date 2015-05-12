_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
else
  $1 = require "bootstrap/modal"
ContinuumView = require "../common/continuum_view"
HasProperties = require "../common/has_properties"
dialog_template = require "./dialog_template"

class DialogView extends ContinuumView

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

    content = @mget('content')
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
    buttons_box = @mget('buttons_box')
    if buttons_box?
      @buttons_box_view = new buttons_box.default_view(model: buttons_box)
      @$el.find('.bk-dialog-buttons_box').empty()
      @$el.find('.bk-dialog-buttons_box').append(@buttons_box_view.$el)
    return @

  render: () ->
    @$modal = $(dialog_template(@model.attributes))
    @$modal.modal({show: @mget("visible")})
    @$modal.on('hidden.bk-bs.modal', @onHide)
    @$el.html(@$modal)
    return @

  onHide: (event) =>
    @mset("visible", false, {silent: true})

  change_visibility: () =>
    @$modal.modal(if @mget("visible") then "show" else "hide")

  change_content: () =>
    @render_content()

class Dialog extends HasProperties
  type: "Dialog"
  default_view: DialogView

  defaults: () ->
    return _.extend {}, super(), {
      visible: false
      closable: true
      title: ""
      content: ""
      buttons: []
      buttons_box: null
    }

module.exports =
  Model: Dialog
  View: DialogView