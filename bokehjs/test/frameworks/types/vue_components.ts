import type {BokehMount, MountOptions} from "@bokeh/bokehjs"
import type {BokehModel, BokehRootModel} from "@bokeh/framework"
import type {Bokeh, BokehDocument, BokehRoot} from "@bokeh/vue"

declare const model: BokehRootModel
declare const models: readonly BokehRootModel[]
declare const mounted: BokehMount

type SingleProps = InstanceType<typeof Bokeh>["$props"]
type DocumentProps = InstanceType<typeof BokehDocument>["$props"]
type RootProps = InstanceType<typeof BokehRoot>["$props"]

const single_props: SingleProps = {model}
const document_props: DocumentProps = {models}
const root_props: RootProps = {model}

const source: BokehModel = single_props.model
const options: MountOptions | undefined = single_props.mountOptions
void source
void options
void document_props
void root_props

// @ts-expect-error Every component requires its source prop.
const missing_model: SingleProps = {}
// @ts-expect-error Document components require a collection of roots.
const missing_models: DocumentProps = {model}
// @ts-expect-error Root slots require one root, not a collection.
const invalid_root: RootProps = {model: models}
void missing_model
void missing_models
void invalid_root

declare const single: InstanceType<typeof Bokeh>
declare const document: InstanceType<typeof BokehDocument>
single.$emit("mounted", mounted)
document.$emit("mounted", mounted)
single.$emit("mount-error", new Error("test"))
// @ts-expect-error Mounted events carry a BokehMount.
single.$emit("mounted", "not a mount")
// @ts-expect-error The document component has no other public events.
document.$emit("unknown-event")

const on_mounted: NonNullable<SingleProps["onMounted"]> = (handle) => {
  const ready: Promise<void> = handle.ready
  void ready
}
void on_mounted
