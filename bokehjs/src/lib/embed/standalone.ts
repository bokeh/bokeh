import {Document} from "../document"
import {DocumentChangedEvent, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import {HasProps} from "../core/has_props"
import {DOMView} from "../core/dom_view"
import {div} from "../core/dom"
import * as base from "../base"
import {BOKEH_ROOT} from "./dom"

function _create_view(model: HasProps): DOMView {
  const view = new model.default_view({model: model, parent: null}) as DOMView
  base.index[model.id] = view
  return view
}

export function add_document_standalone(document: Document, element: HTMLElement,
    roots: {[key: string]: HTMLElement} = {}, use_for_title: boolean = false): {[key: string]: DOMView} {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  const views: {[key: string]: DOMView} = {}

  function render_model(model: HasProps): void {
    let root_el: HTMLElement
    if (model.id in roots)
      root_el = roots[model.id]
    else if (element.classList.contains(BOKEH_ROOT))
      root_el = element
    else {
      root_el = div({class: BOKEH_ROOT})
      element.appendChild(root_el)
    }

    const view = _create_view(model)
    view.renderTo(root_el)
    views[model.id] = view
  }

  function unrender_model(model: HasProps): void {
    const {id} = model
    if (id in views) {
      const view = views[id]
      view.remove()
      delete views[id]
      delete base.index[id]
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
