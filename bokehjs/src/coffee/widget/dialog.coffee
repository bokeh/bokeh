define [
  "underscore"
  "backbone"
  "jquery"
  "bootstrap/modal"
  "common/has_properties"
  "common/continuum_view"
  "./dialog_template"
], (_, Backbone, $, $1, HasProperties, continuum_view, dialog_template) ->

  class DialogView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'destroy', @remove)
      @listenTo(@model, 'change:visible', @changeVisibility)
      @listenTo(@model, 'change:content', @changeContent)

    render: () ->
      @$modal = $(dialog_template(@model.attributes))
      @$modal.modal({show: @mget("visible")})
      @$modal.on('hidden.bk-bs.modal', @onHide)
      @$el.html(@$modal)

    onHide: (event) =>
      @mset("visible", false, {silent: true})

    changeVisibility: () =>
      @$modal.modal(if @mget("visible") then "show" else "hide")

    changeContent: () =>
      @$modal.find(".bk-bs-modal-body").text(@mget("content"))

  class Dialog extends HasProperties
    type: "Dialog"
    default_view: DialogView
    defaults: ->
      _.extend {}, super(), {
        visible: false
        closable: true
        title: ""
        content: ""
        buttons: []
      }

  class Dialogs extends Backbone.Collection
    model: Dialog

  return {
    Model: Dialog
    Collection: new Dialogs()
    View: DialogView
  }
