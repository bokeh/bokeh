import {Document} from "../document"
import {DocumentChangedEvent, RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import {HasProps} from "../core/has_props"
import {View, ViewManager} from "../core/view"
import {DOMView} from "../core/dom_view"
import {build_view} from "../core/build_views"

// A map from the root model IDs to their views.
export const index: {[key: string]: View} = {}

export async function add_document_standalone(document: Document, element: HTMLElement,
    roots: (HTMLElement | null)[] = [], use_for_title: boolean = false): Promise<ViewManager> {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  const views = new ViewManager()

  async function render_model(model: HasProps): Promise<View> {
    const view = await build_view(model, {parent: null, owner: views})

    if (view instanceof DOMView) {
      const i = document.roots().indexOf(model)
      const root_el = roots[i] ?? element
      view.renderTo(root_el)
    }

    views.add(view)
    index[model.id] = view

    return view
  }

  function unrender_model(model: HasProps): void {
    const view = views.get(model)
    if (view != null) {
      view.remove()
      views.delete(view)
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

  return views
}
