import {Document} from "../document"
import {DocumentChangedEvent, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import {HasProps} from "../core/has_props"
import {DOMView} from "../core/dom_view"
import * as base from "../base"

export function _create_view(model: HasProps): DOMView {
  const view = new model.default_view({model: model, parent: null}) as DOMView
  base.index[model.id] = view
  return view
}

// Replace element with a view of model_id from document
export function add_model_standalone(model_id: string, element: HTMLElement, doc: Document): DOMView {
  const model = doc.get_model_by_id(model_id)
  if (model == null)
    throw new Error(`Model ${model_id} was not in document ${doc}`)
  const view = _create_view(model)
  view.renderTo(element)
  return view
}

// Fill element with the roots from doc
export function add_document_standalone(document: Document, element: HTMLElement,
    roots: {[key: string]: string} = {}, use_for_title: boolean = false): {[key: string]: DOMView} {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  const views: {[key: string]: DOMView} = {}

  function render_model(model: HasProps): void {
    let root_el: HTMLElement
    if (model.id in roots) {
      const el = window.document.getElementById(roots[model.id])
      if (el == null)
        return
      else
        root_el = el
    } else
      root_el = element

    const view = _create_view(model)
    view.renderTo(root_el)
    views[model.id] = view
  }

  function unrender_model(model: HasProps): void {
    if (model.id in views) {
      const view = views[model.id]
      view.remove()
      delete views[model.id]
      delete base.index[model.id]
    }
  }

  for (const model of document.roots())
    render_model(model)

  if (use_for_title)
    window.document.title = document.title()

  document.on_change((event: DocumentChangedEvent): void => {
    if (event instanceof RootAddedEvent)
      render_model(event.model)
    else if (event instanceof RootRemovedEvent)
      unrender_model(event.model)
    else if (use_for_title && event instanceof TitleChangedEvent)
      window.document.title = event.title
  })

  return views
}
