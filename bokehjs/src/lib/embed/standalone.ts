import {Document} from "../document"
import {DocumentChangedEvent, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import {HasProps} from "../core/has_props"
import {View} from "../core/view"
import {DOMView} from "../core/dom_view"
import {build_view} from "../core/build_views"
import {div} from "../core/dom"
import {BOKEH_ROOT} from "./dom"

// A map from the root model IDs to their views.
export const index: {[key: string]: View} = {}

export async function add_document_standalone(document: Document, element: HTMLElement,
    roots: (HTMLElement | null)[] = [], use_for_title: boolean = false): Promise<View[]> {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  const views: Map<HasProps, View> = new Map()

  async function render_model(model: HasProps): Promise<View> {
    let root_el: HTMLElement
    const root_models = document.roots()
    const idx = root_models.indexOf((model as any))
    const root = roots[idx]
    if (root != null)
      root_el = root
    else if (element.classList.contains(BOKEH_ROOT))
      root_el = element
    else {
      root_el = div({class: BOKEH_ROOT})
      element.appendChild(root_el)
    }

    const view = await build_view(model, {parent: null})
    if (view instanceof DOMView)
      view.renderTo(root_el)
    views.set(model, view)
    index[model.id] = view
    return view
  }

  function unrender_model(model: HasProps): void {
    const view = views.get(model)
    if (view != null) {
      view.remove()
      views.delete(model)
      delete index[model.id]
    }
  }

  for (const model of document.roots())
    await render_model(model)

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

  return [...views.values()]
}
