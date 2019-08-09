import {Document, DocumentChangedEvent, ModelChangedEvent} from "document"
import {Receiver, Fragment} from "protocol/receiver"
import {keys, values} from "core/util/object"
import {version} from "version"

import {add_document_standalone} from "../standalone"
import {DocsJson, RenderItem} from "../json"

// TODO: use unique name to allow different bokeh version in different jlab tabs
const module_name = "bokehjs"
const module_version = version

type RenderBundle = {
  docs_json: DocsJson
  render_items: RenderItem[]
  div: string
}

import("@jupyter-widgets/base").then((widgets) => {
  const {DOMWidgetModel, DOMWidgetView} = widgets

  class BokehModel extends DOMWidgetModel {
    defaults(): object {
      return {
        ...super.defaults(),
        _model_name: "BokehModel",
        _model_module: module_name,
        _model_module_version: module_version,
        _view_name: "BokehView",
        _view_module: module_name,
        _view_module_version: module_version,
        render_bundle: {},
      }
    }

    static serializers = {
      ...DOMWidgetModel.serializers,
    }
  }

  class BokehView extends DOMWidgetView {
    private _document: Document | null
    private _receiver: Receiver
    private _blocked: boolean

    constructor(options?: any) {
      super(options)
      this._document = null
      this._blocked = false
      this._receiver = new Receiver()
      this.model.on("change:render_bundle", () => this.render())
      this.listenTo(this.model, "msg:custom", (msg) => this._consume_patch(msg))
    }

    render(): void {
      const bundle = JSON.parse(this.model.get("render_bundle"))
      const {docs_json, render_items, div} = bundle as RenderBundle
      this.el.innerHTML = div
      const element = this.el.children[0]
      const json = values(docs_json)[0]
      this._document = Document.from_json(json)
      for (const item of render_items) {
        const roots: {[key: string]: HTMLElement} = {}
        for (const root_id in item.roots)
          roots[root_id] = element
        add_document_standalone(this._document, element, roots)
      }
      this._document.on_change((event) => this._change_event(event))
    }

    protected _change_event(event: DocumentChangedEvent): void {
      if (!this._blocked && event instanceof ModelChangedEvent)
        this.send({event: "jsevent", id: event.model.id, new: event.new_, attr: event.attr, old: event.old})
    }

    protected _consume_patch(content: {msg: "patch", payload: Fragment}): void {
      if (this._document == null)
        return
      if (content.msg == "patch") {
        this._receiver.consume(content.payload)
        const comm_msg = this._receiver.message
        if (comm_msg != null && keys(comm_msg.content).length > 0) {
          this._blocked = true
          try {
            this._document.apply_json_patch(comm_msg.content, comm_msg.buffers)
          } finally {
            this._blocked = false
          }
        }
      }
    }
  }

  return {BokehModel, BokehView}
}).then(({BokehModel, BokehView}) => {
  const global = window as any
  global.require.undef(module_name)
  global.define(module_name, [], function() {
    return {BokehModel, BokehView}
  })
})
