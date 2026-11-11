import {createElement} from "react"
import {h} from "vue"

import "./vue_components.js"

import {
  ColumnDataSource, Document, ModelResolver, MountError, MountSource, Plotting, Range1d,
  mount, publish_mount_error, register_models, register_standard_models, server_document, when_mounted,
} from "@bokeh/bokehjs"
import type {BokehMount, ClientSession, ServerDocumentOptions, properties as p} from "@bokeh/bokehjs"
import {SessionMountController} from "@bokeh/framework"
import type {BokehSessionSource} from "@bokeh/framework"
import {Bokeh as ReactBokeh, BokehDocument as ReactBokehDocument, BokehRoot as ReactBokehRoot, BokehSession as ReactBokehSession} from "@bokeh/react"
import type {useBokeh as useReactBokeh} from "@bokeh/react"
import {bokeh, bokehDocument, bokehRoot, bokehSession} from "@bokeh/svelte"
import {Bokeh as VueBokeh, BokehDocument as VueBokehDocument, BokehRoot as VueBokehRoot, BokehSession as VueBokehSession} from "@bokeh/vue"
import type {useBokeh as useVueBokeh} from "@bokeh/vue"
import {defineBokehDocumentElement, defineBokehElement, defineBokehRootElement, defineBokehSessionElement} from "@bokeh/web-component"
import type {BokehDocumentElement, BokehElement, BokehRootElement, BokehSessionElement} from "@bokeh/web-component"

const source = ColumnDataSource.create({data: {x: [0, 1], y: [1, 0]}})
const plot = Plotting.figure({tools: []})
plot.line({field: "x"}, {field: "y"}, {source})
const detail = Plotting.figure({tools: [], x_range: plot.x_range})
detail.scatter({field: "x"}, {field: "y"}, {source})
const roots = [plot, detail]
const roots_document = new Document({roots})

const target = document.createElement("div")
const server_options: ServerDocumentOptions = {
  arguments: {dataset: "sales"}, headers: {Authorization: "Bearer example"},
  credentials: "include", signal: new AbortController().signal,
  on_error: (error) => void error.kind,
}
const server_mount: BokehMount = server_document("/app", "#plot", server_options)
void server_mount.ready
void server_mount.dispose()
void server_document("/app", target)
const direct_mount = mount(plot, target)
void direct_mount
void target.bokehMount?.ready
void target.bokehMountError
void when_mounted(target)
void when_mounted(target, {signal: new AbortController().signal})
publish_mount_error(target, new MountError("source", "test bootstrap failure"))
void mount(roots, document.createElement("div"))
void mount(plot, undefined, {signal: new AbortController().signal})
const keyed_source = new MountSource(roots_document, {overview: plot, detail})
const keyed_mount = mount(keyed_source, {
  overview: document.createElement("div"), detail: document.createElement("div"),
})
void keyed_mount.ready
void keyed_mount.root("overview")
void keyed_mount.attach("overview", document.createElement("div"))
keyed_mount.detach("detail")
void keyed_mount.view_lookup.find_one(plot)
void keyed_mount.view_lookup.find_one_by_id(plot.id)
// @ts-expect-error Mount view lookup is query-only and doesn't expose ViewManager mutation.
keyed_mount.view_lookup.clear()
void mount(roots_document, document.createElement("div"))
const shown = Plotting.show(plot, target)
void shown.ready
void shown.dispose()
createElement(ReactBokeh, {model: roots})
createElement(ReactBokehDocument, {models: roots},
  createElement("section", null, createElement(ReactBokehRoot, {model: plot})),
  createElement("aside", null, createElement(ReactBokehRoot, {model: detail})),
)
const react_hook_model: Parameters<typeof useReactBokeh>[0] = roots
void react_hook_model
const vue_composable_model: Parameters<typeof useVueBokeh>[0] = () => roots
void vue_composable_model
void h(VueBokeh, {model: roots})
void h(VueBokehDocument, {models: roots}, () => [
  h("section", null, h(VueBokehRoot, {model: plot})),
  h("aside", null, h(VueBokehRoot, {model: detail})),
])
void bokeh(document.createElement("div"), {model: roots})
void bokehDocument(document.createElement("main"), {models: roots})
void bokehRoot(document.createElement("div"), {model: plot})
const web_component_model: BokehElement["model"] = roots
void web_component_model
const web_component_document_models: BokehDocumentElement["models"] = roots
const web_component_root_model: BokehRootElement["model"] = plot
void web_component_document_models
void web_component_root_model
void defineBokehElement
void defineBokehDocumentElement
void defineBokehRootElement

declare const session: ClientSession
const borrowed_session: BokehSessionSource = {session}
const owned_session: BokehSessionSource = {connection: {url: "wss://example.test/app/ws", token: "issued-token"}}
// @ts-expect-error A provider must either borrow or own its session.
const ambiguous_session: BokehSessionSource = {session, connection: owned_session.connection}
void ambiguous_session
createElement(ReactBokehSession, {source: borrowed_session, onSession: (value) => void value.document},
  createElement(ReactBokehRoot, {model: "plot"}),
)
void h(VueBokehSession, {source: owned_session, onSession: (value) => void value.document},
  () => h(VueBokehRoot, {model: "plot"}),
)
void bokehSession(document.createElement("main"), {source: borrowed_session, onSession: (value) => void value.document})
void bokehRoot(document.createElement("div"), {model: "plot"})
declare const session_element: BokehSessionElement
declare const root_element: BokehRootElement
session_element.source = owned_session
root_element.bokehDocument = session_element
root_element.model = "plot"
void defineBokehSessionElement
const session_controller = new SessionMountController()
session_controller.update(borrowed_session)
session_controller.attach("plot", target)
session_controller.update(null)
session_controller.dispose()

namespace CustomRange {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Range1d.Props & {
    history_enabled: p.Property<boolean>
  }
}
interface CustomRange extends CustomRange.Attrs {}
class CustomRange extends Range1d {
  declare properties: CustomRange.Props
  readonly history: number[] = []

  static {
    this.define<CustomRange.Props>(({Bool}) => ({
      history_enabled: [Bool, true],
    }))
  }

  override initialize(): void {
    super.initialize()
    if (this.history_enabled) {
      this.history.push(this.start)
    }
  }
}
const custom_range = CustomRange.create({start: 0, end: 1, history_enabled: true})
custom_range.history.push(custom_range.end)
// @ts-expect-error Bokeh models must be constructed through their inherited factory.
new Range1d({start: 0, end: 1})
// @ts-expect-error The inherited factory accepts only declared Bokeh properties.
CustomRange.create({missing: true})
const resolver = new ModelResolver(null)
register_models({CustomRange}, resolver)
register_standard_models(resolver)
