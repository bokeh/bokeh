import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"

import {default_resolver, register_models} from "@bokehjs/base"
import {ClientConnection} from "@bokehjs/client/connection"
import {ClientSession} from "@bokehjs/client/session"
import {
  BOKEH_MOUNTED_ATTRIBUTE, BokehMount, mount, mount_embed_declaration, MountError, type MountErrorPhase, when_mounted,
} from "@bokehjs/api/io"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {defer} from "@bokehjs/core/util/defer"
import {to_object} from "@bokehjs/core/util/object"
import {ReleaseType, Version} from "@bokehjs/core/util/version"
import {Document, documents} from "@bokehjs/document"
import type {EmbedPayload} from "@bokehjs/embed/payload"
import {EmbedError, prepare_embed, validate_embed_payload} from "@bokehjs/embed/payload"
import type {ResourceRequirements} from "@bokehjs/embed/resources"
import {resource_loader, ResourceError, ResourceLoader} from "@bokehjs/embed/resources"
import {CustomJS} from "@bokehjs/models"
import {Div} from "@bokehjs/models/widgets/div"
import {version as js_version} from "@bokehjs/version"

import fixture_data from "./embed_fixtures.json" with {type: "json"}

const core: ResourceRequirements = {components: ["bokeh/core"], extensions: []}
let declaration_index = 0

function fixture(name: string): EmbedPayload {
  expect(fixture_data.schema).to.be.equal("bokeh.embed.fixtures/v1")
  const value = structuredClone(fixture_data.cases.find((item) => item.name == name)!.payload) as unknown as EmbedPayload
  value.bokeh_version = js_version
  if (value.source.kind == "standalone") {
    value.source.documents.forEach((document) => document.version = js_version)
  }
  return value
}

function remove_test_resources(): void {
  document.querySelectorAll("[data-bokeh-resource]").forEach((element) => element.remove())
}

function inline_declaration(embed_payload: EmbedPayload, value: unknown = embed_payload): {
  targets: HTMLElement[]
  payload: HTMLScriptElement
  bootstrap: HTMLScriptElement
  remove(): void
} {
  const instance = `Test-${++declaration_index}`
  const targets = embed_payload.roots.map((root) => {
    const target = document.createElement("div")
    target.dataset.bokehEmbedInstance = instance
    target.dataset.bokehRoot = root.key
    return target
  })
  const payload = document.createElement("script")
  payload.type = "application/vnd.bokeh.embed+json"
  payload.dataset.bokehEmbedPayload = ""
  payload.dataset.bokehEmbedInstance = instance
  payload.textContent = JSON.stringify(value)
  const bootstrap = document.createElement("script")
  bootstrap.dataset.bokehEmbedBootstrap = ""
  bootstrap.dataset.bokehEmbedInstance = instance
  document.body.append(...targets, payload, bootstrap)
  return {
    targets,
    payload,
    bootstrap,

    remove() {
      targets.forEach((target) => target.remove())
      payload.remove()
      bootstrap.remove()
    },
  }
}

describe("EmbedPayload runtime", () => {
  after_each(() => remove_test_resources())

  it("rejects mount queries before payload preparation completes", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const mounted = mount(payload, undefined, {resources: "none", resolver})

    const queries: (() => unknown)[] = [
      () => mounted.root_keys,
      () => mounted.roots,
      () => mounted.models,
      () => mounted.views,
      () => mounted.targets,
      () => mounted.view_lookup,
      () => mounted.root("primary"),
      () => mounted.view("primary"),
      () => mounted.target("primary"),
    ]
    for (const query of queries) {
      expect(query).to.throw(MountError, /not available before source preparation completes/)
    }

    await mounted.ready
    await mounted.dispose()
  })

  it("consumes preparation for an already aborted payload mount", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const controller = new AbortController()
    const reason = new Error("component unmounted")
    controller.abort(reason)
    const documents_before = documents.length

    const mounted = mount(payload, undefined, {resources: "none", resolver, signal: controller.signal})
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("abort")
    expect(error.cause).to.be.equal(reason)
    await mounted.when_disposed
    expect(documents.length).to.be.equal(documents_before)
  })

  it("waits for cancelled payload preparation before reporting disposal", async () => {
    const payload = fixture("standalone-keyed-roots")
    let preparation_signal: AbortSignal | undefined
    let reject_preparation!: (reason: unknown) => void
    const ensure = sinon.stub(resource_loader, "ensure").callsFake(
      async (_requirements, _policy, _version, signal) => {
        preparation_signal = signal
        return new Promise<void>((_resolve, reject) => reject_preparation = reject)
      },
    )

    try {
      const mounted = mount(payload, undefined, {resources: "none"})
      const disposal = mounted.dispose()
      let disposed = false
      void disposal.then(() => disposed = true)

      expect(preparation_signal?.aborted).to.be.true
      await Promise.resolve()
      expect(disposed).to.be.false

      reject_preparation(preparation_signal?.reason)
      await disposal
      expect(disposed).to.be.true
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("disposed")
    } finally {
      ensure.restore()
    }
  })

  it("consumes the shared keyed-root fixture through BokehMount", async () => {
    const payload = fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    document.body.append(target)
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const documents_before = documents.length

    const mounted = mount(payload, target, {resources: "none", resolver})
    expect(mounted.state).to.be.equal("pending")
    await mounted.ready
    expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
    expect_instanceof(mounted.root("primary"), CustomJS)
    expect((mounted.root("primary") as CustomJS).code).to.be.equal("primary")
    expect(mounted.ownership.document).to.be.equal("mount")
    expect(mounted.ownership.resources).to.be.equal("shared")
    expect(mounted.ownership.session).to.be.equal("none")
    expect(mounted.session).to.be.null
    expect(documents.length).to.be.equal(documents_before + 1)

    await mounted.dispose()
    await mounted.dispose()
    expect(mounted.disposed).to.be.true
    expect(documents.length).to.be.equal(documents_before)
    target.remove()
  })

  it("mounts compact shared and cyclic model data", async () => {
    const payload = fixture("standalone-compact-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const mounted = mount(payload, undefined, {resources: "none", resolver})
    try {
      await mounted.ready
      const primary = mounted.root("primary")
      const secondary = mounted.root("secondary")
      expect_instanceof(primary, CustomJS)
      expect_instanceof(secondary, CustomJS)
      const shared = to_object(primary.args).shared
      expect_instanceof(shared, CustomJS)
      expect(to_object(secondary.args).shared).to.be.equal(shared)
      expect(to_object(shared.args).self).to.be.equal(shared)
    } finally {
      await mounted.dispose()
    }
  })

  it("registers required custom models before payload deserialization", async () => {
    class ResourceOrderedModel extends CustomJS {}

    const payload = fixture("standalone-keyed-roots")
    if (payload.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    const model_name = `ResourceOrderedModel${++declaration_index}`
    payload.source.documents[0].roots[0].name = model_name
    const registration = "globalThis.register_resource_ordered_model()"
    const asset = {kind: "script" as const, content: registration}
    payload.requires = {
      components: ["bokeh/core"],
      extensions: [{name: "resource-ordered-model", assets: [asset]}],
    }

    const resolver = new ModelResolver(default_resolver)
    const state = globalThis as typeof globalThis & {register_resource_ordered_model?: () => void}
    state.register_resource_ordered_model = () => {
      register_models({[model_name]: ResourceOrderedModel}, resolver)
    }
    expect(resolver.get(model_name)).to.be.null
    const target = document.createElement("div")
    document.body.append(target)
    const mounted = mount(payload, target, {
      resolver,
      resources: {mode: "resolved", assets: [asset]},
    })

    try {
      await mounted.ready
      expect(resolver.get(model_name)).to.be.equal(ResourceOrderedModel)
      expect_instanceof(mounted.root("primary"), ResourceOrderedModel)
      expect((mounted.root("primary") as ResourceOrderedModel).code).to.be.equal("primary")
    } finally {
      await mounted.dispose()
      delete state.register_resource_ordered_model
      target.remove()
    }
  })

  it("creates independent documents for repeated mounts of one payload", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const first_target = document.createElement("div")
    const second_target = document.createElement("div")
    document.body.append(first_target, second_target)

    const first = mount(payload, first_target, {resources: "none", resolver})
    const second = mount(payload, second_target, {resources: "none", resolver})
    await Promise.all([first.ready, second.ready])
    expect(first.document).to.not.be.equal(second.document)
    expect(first.root("primary")).to.not.be.equal(second.root("primary"))

    await Promise.all([first.dispose(), second.dispose()])
    first_target.remove()
    second_target.remove()
  })

  it("publishes one declarative handle for early and late multi-root discovery", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(payload)
    try {
      const early = declaration.targets.map((target) => when_mounted(target))
      const bootstrapping = mount_embed_declaration(declaration.bootstrap, {resolver})
      const discovered = await Promise.all(early)
      const mounted = await bootstrapping

      expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
      expect(discovered.every((handle) => handle == mounted)).to.be.true
      expect(declaration.targets.every((target) => target.bokehMount == mounted)).to.be.true
      expect(declaration.targets.every((target) => target.getAttribute(BOKEH_MOUNTED_ATTRIBUTE) == "")).to.be.true
      expect(await when_mounted(declaration.targets[0])).to.be.equal(mounted)

      await mounted.dispose()
      expect(declaration.targets.every((target) => target.bokehMount == null)).to.be.true
      expect(declaration.targets.every((target) => !target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE))).to.be.true
    } finally {
      declaration.remove()
    }
  })

  it("waits for pending generated resources before declarative mounting", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(payload)
    const resource = document.createElement("script")
    resource.type = "application/json"
    resource.dataset.bokehResource = ""
    resource.dataset.bokehResourceState = "loading"
    document.head.append(resource)

    try {
      const bootstrapping = mount_embed_declaration(declaration.bootstrap, {resolver})
      await Promise.resolve()
      expect(declaration.targets.every((target) => target.bokehMount == null)).to.be.true

      resource.dataset.bokehResourceState = "loaded"
      resource.dispatchEvent(new Event("load"))
      const mounted = await bootstrapping
      expect(resource.dataset.bokehResourceState).to.be.equal("loaded")
      expect(declaration.targets.every((target) => target.bokehMount == mounted)).to.be.true
      await mounted.dispose()
    } finally {
      resource.remove()
      declaration.remove()
    }
  })

  it("keeps repeated identical declarations isolated by instance ID", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const first = inline_declaration(payload)
    const second = inline_declaration(payload)
    const discoveries = [...first.targets, ...second.targets].map((target) => when_mounted(target))
    try {
      const [first_mount, second_mount] = await Promise.all([
        mount_embed_declaration(first.bootstrap, {resolver}),
        mount_embed_declaration(second.bootstrap, {resolver}),
      ])
      const published = await Promise.all(discoveries)
      expect(first_mount == second_mount).to.be.false
      expect(published.slice(0, 2).every((mounted) => mounted == first_mount)).to.be.true
      expect(published.slice(2).every((mounted) => mounted == second_mount)).to.be.true
      await Promise.all([first_mount.dispose(), second_mount.dispose()])
    } finally {
      first.remove()
      second.remove()
    }
  })

  it("requires an adjacent inline payload with the same instance ID", async () => {
    const payload = fixture("standalone-keyed-roots")
    for (const mode of ["different-instance", "not-adjacent"] as const) {
      const declaration = inline_declaration(payload)
      const separator = document.createElement("div")
      if (mode == "different-instance") {
        declaration.payload.dataset.bokehEmbedInstance = "Other-instance"
      } else {
        declaration.bootstrap.before(separator)
      }
      const documents_before = documents.length
      try {
        const error = await mount_embed_declaration(declaration.bootstrap).then(
          () => null, (error: unknown) => error,
        )
        expect_instanceof(error, MountError)
        expect(error.kind).to.be.equal("source")
        expect(error.phase).to.be.equal("payload")
        expect(error.message.includes("matching JSON payload script")).to.be.true
        expect(error.source?.embed).to.be.equal(declaration.bootstrap.dataset.bokehEmbedInstance)
        expect(declaration.targets.every((target) => target.bokehMountError == error)).to.be.true
        expect(documents.length).to.be.equal(documents_before)
      } finally {
        separator.remove()
        declaration.remove()
      }
    }
  })

  it("rejects incomplete declarative target sets before decoding", async () => {
    const payload = fixture("standalone-keyed-roots")
    const declaration = inline_declaration(payload)
    const [target] = declaration.targets
    declaration.targets[1].remove()
    const discovery = when_mounted(target)
    try {
      const error = await mount_embed_declaration(declaration.bootstrap).then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("target")
      expect(error.root_key).to.be.equal("secondary")
      expect(target.dataset.bokehMounted).to.be.undefined
      expect(await discovery.then(() => null, (error: unknown) => error)).to.be.equal(error)
      expect(target.bokehMountError).to.be.equal(error)
    } finally {
      declaration.remove()
    }
  })

  it("publishes one structured payload failure to every declaration target", async () => {
    const payload = fixture("standalone-keyed-roots")
    const instance = `Test-${++declaration_index}`
    const targets = payload.roots.map((root) => {
      const target = document.createElement("div")
      target.dataset.bokehEmbedInstance = instance
      target.dataset.bokehRoot = root.key
      return target
    })
    const bootstrap = document.createElement("script")
    bootstrap.dataset.bokehEmbedBootstrap = ""
    bootstrap.dataset.bokehEmbedInstance = instance
    bootstrap.dataset.bokehPayloadUrl = "/payloads/missing.json"
    document.body.append(...targets, bootstrap)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => new Response("missing", {status: 503, statusText: "Unavailable"})
    try {
      const discoveries = targets.map((target) => when_mounted(target).then(
        () => null, (error: unknown) => error,
      ))
      const error = await mount_embed_declaration(bootstrap).then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("http")
      expect(error.phase).to.be.equal("payload")
      expect(error.source).to.be.equal({
        kind: "embed-declaration", embed: instance, url: "/payloads/missing.json",
      })
      expect(error.cause).to.be.instanceof(Response)
      expect((await Promise.all(discoveries)).every((published) => published == error)).to.be.true
      expect(targets.every((target) => target.bokehMountError == error)).to.be.true
      expect(await when_mounted(targets[0]).then(() => null, (error: unknown) => error)).to.be.equal(error)
    } finally {
      globalThis.fetch = original_fetch
      targets.forEach((target) => target.remove())
      bootstrap.remove()
    }
  })

  it("keeps waiter abort ownership separate from declarative mount ownership", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(payload)
    const controller = new AbortController()
    const discovery = when_mounted(declaration.targets[0], {signal: controller.signal})
    controller.abort(new Error("caller stopped waiting"))
    try {
      const waiting_error = await discovery.then(() => null, (error: unknown) => error)
      expect_instanceof(waiting_error, MountError)
      expect(waiting_error.kind).to.be.equal("abort")

      const mounted = await mount_embed_declaration(declaration.bootstrap, {resolver})
      expect(await when_mounted(declaration.targets[0])).to.be.equal(mounted)
      expect(declaration.targets[0].bokehMountError).to.be.undefined
      await mounted.dispose()
    } finally {
      declaration.remove()
    }
  })

  it("publishes a bootstrap abort before a mount handle exists", async () => {
    const payload = fixture("standalone-keyed-roots")
    const declaration = inline_declaration(payload)
    const controller = new AbortController()
    const discoveries = declaration.targets.map((target) => when_mounted(target).then(
      () => null, (error: unknown) => error,
    ))
    controller.abort(new Error("bootstrap cancelled"))
    try {
      const error = await mount_embed_declaration(declaration.bootstrap, {signal: controller.signal}).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("abort")
      expect(error.phase).to.be.equal("abort")
      expect(error.message).to.be.equal("bootstrap cancelled")
      expect((await Promise.all(discoveries)).every((published) => published == error)).to.be.true
    } finally {
      declaration.remove()
    }
  })

  it("publishes schema, resource, and deserialize preparation phases", async () => {
    const base = fixture("standalone-keyed-roots")
    const cases: [MountErrorPhase, EmbedPayload, unknown][] = []

    cases.push(["schema", base, {...base, schema: "bokeh.embed/v2"}])

    const resource = structuredClone(base)
    resource.bokeh_version = "99.0.0"
    cases.push(["resource", resource, resource])

    const deserialize = structuredClone(base)
    if (deserialize.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    deserialize.source.documents[0].roots[0].name = "MissingEmbedModel"
    cases.push(["deserialize", deserialize, deserialize])

    for (const [phase, declaration_payload, value] of cases) {
      const declaration = inline_declaration(declaration_payload, value)
      const discoveries = declaration.targets.map((target) => when_mounted(target).then(
        () => null, (error: unknown) => error,
      ))
      try {
        const error = await mount_embed_declaration(declaration.bootstrap).then(
          () => null, (error: unknown) => error,
        )
        expect_instanceof(error, MountError)
        expect(error.phase).to.be.equal(phase)
        expect(error.source?.kind).to.be.equal("embed-declaration")
        expect(error.source?.embed).to.be.equal(declaration.bootstrap.dataset.bokehEmbedInstance)
        expect((await Promise.all(discoveries)).every((published) => published == error)).to.be.true
      } finally {
        declaration.remove()
      }
    }
  })

  it("rejects unknown payload and root fields consistently", async () => {
    const payload = fixture("standalone-keyed-roots")
    const envelope = {...payload, unexpected: true}
    const root = structuredClone(payload) as EmbedPayload & {
      roots: ({unexpected?: boolean} & EmbedPayload["roots"][number])[]
    }
    root.roots[0].unexpected = true

    expect(() => validate_embed_payload(envelope)).to.throw(EmbedError, /unknown fields/)
    expect(() => validate_embed_payload(root)).to.throw(EmbedError, /unknown fields/)
    expect(() => validate_embed_payload({...payload, fingerprint: "removed"})).to.throw(EmbedError, /unknown fields: fingerprint/)
  })

  it("rejects unsafe and ambiguous server URLs", async () => {
    const payload = fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    for (const url of ["data:text/html,unsafe", "//evil.test/app", "https://example.test/app?tenant=1"]) {
      const value = structuredClone(payload)
      value.source = {...payload.source, url}
      expect(() => validate_embed_payload(value)).to.throw(EmbedError)
    }
  })

  it("rolls back a decoded payload after target failure", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const controller = new AbortController()
    const remove_listener = sinon.spy(controller.signal, "removeEventListener")
    const documents_before = documents.length
    const mounted = mount(payload, document.createElement("div"), {
      resources: "none", resolver, signal: controller.signal,
    })

    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("target")
    expect(mounted.disposed).to.be.true
    expect(remove_listener.calledWith("abort")).to.be.true
    expect(documents.length).to.be.equal(documents_before)
  })

  it("preserves target failures when prepared release cleanup throws", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const prepared = await prepare_embed(payload, "none", resolver)
    const release = sinon.stub(prepared, "release").throws(new Error("release failed"))
    const destroy = sinon.spy(prepared.document, "destroy")
    const mounted = new BokehMount(
      Promise.resolve(prepared), document.createElement("div"), {}, null,
    )

    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("target")
    expect(error.message).to.be.equal("Bokeh mount targets must be connected HTMLElements")
    expect(mounted.error).to.be.equal(error)
    await mounted.when_disposed
    expect(mounted.state).to.be.equal("failed")
    expect(release.calledOnce).to.be.true
    expect(destroy.calledOnce).to.be.true
  })

  it("releases prepared content rejected by mount-source validation", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const prepared = await prepare_embed(payload, "none", resolver)
    const primary = prepared.roots.get("primary")
    expect_not_null(primary)
    prepared.roots.set("secondary", primary)
    const release = sinon.spy(prepared, "release")
    const destroy = sinon.spy(prepared.document, "destroy")

    const mounted = new BokehMount(Promise.resolve(prepared), undefined, {}, null)
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("source")
    expect(release.calledOnce).to.be.true
    expect(destroy.calledOnce).to.be.true
  })

  it("preserves source failures when rejected prepared cleanup throws", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const prepared = await prepare_embed(payload, "none", resolver)
    const primary = prepared.roots.get("primary")
    expect_not_null(primary)
    prepared.roots.set("secondary", primary)
    const release = sinon.stub(prepared, "release").throws(new Error("release failed"))
    const destroy = sinon.spy(prepared.document, "destroy")

    const mounted = new BokehMount(Promise.resolve(prepared), undefined, {}, null)
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("source")
    expect(error.message.includes("assigned to more than one mount root")).to.be.true
    expect(mounted.error).to.be.equal(error)
    await mounted.when_disposed
    expect(release.calledOnce).to.be.true
    expect(destroy.calledOnce).to.be.true
  })

  it("can be disposed before payload decoding completes", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const target = document.createElement("div")
    document.body.append(target)
    const documents_before = documents.length
    const mounted = mount(payload, target, {resources: "none", resolver})

    await mounted.dispose()
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("disposed")
    expect(documents.length).to.be.equal(documents_before)
    target.remove()
  })

  it("reports schema and runtime version errors through handle.ready", async () => {
    const payload = fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    document.body.append(target)

    const unsupported = mount(
      {...payload, schema: "bokeh.embed/v2"} as unknown as EmbedPayload,
      target, {resources: "none"},
    )
    const schema_error = await unsupported.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(schema_error, MountError)
    expect(schema_error.kind).to.be.equal("schema")

    const mismatched_payload = {...payload, bokeh_version: "99.0.0"}
    const mismatched = mount(mismatched_payload, target, {resources: "none"})
    const resource_error = await mismatched.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(resource_error, MountError)
    expect(resource_error.kind).to.be.equal("resource")
    expect(resource_error.message.includes("incompatible")).to.be.true
    target.remove()
  })

  it("allows an explicitly selected runtime version for a different payload release", async () => {
    const payload = fixture("standalone-keyed-roots")
    payload.bokeh_version = "99.0.0"
    if (payload.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    payload.source.documents[0].version = payload.bokeh_version
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const mounted = mount(payload, undefined, {resources: {mode: "none", override_version: js_version}, resolver})
    try {
      await mounted.ready
      expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
      expect_instanceof(mounted.root("primary"), CustomJS)
    } finally {
      await mounted.dispose()
    }
  })

  it("rejects a loaded runtime that differs from an explicit version override", async () => {
    const payload = fixture("standalone-keyed-roots")
    const mounted = mount(payload, undefined, {resources: {mode: "none", override_version: "99.0.0"}})
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("resource")
    expect(error.message.includes("expects BokehJS 99.0.0")).to.be.true
  })

  it("ignores local build metadata on an explicit CDN version override", async () => {
    const payload = fixture("standalone-keyed-roots")
    payload.bokeh_version = "99.0.0"
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const override_version = `${js_version.split("+")[0]}+local`
    const mounted = mount(payload, undefined, {resources: {mode: "none", override_version}, resolver})
    try {
      await mounted.ready
      expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
    } finally {
      await mounted.dispose()
    }
  })

  it("uses a declarative version override without resolving already loaded resources again", async () => {
    const payload = fixture("standalone-keyed-roots")
    payload.bokeh_version = "99.0.0"
    if (payload.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    payload.source.documents[0].version = payload.bokeh_version
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(payload)
    declaration.bootstrap.dataset.bokehResourceMode = "inline"
    declaration.bootstrap.dataset.bokehResourceOverrideVersion = js_version
    try {
      const mounted = await mount_embed_declaration(declaration.bootstrap, {resolver})
      expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
      await mounted.dispose()
    } finally {
      declaration.remove()
    }
  })

  it("gives an explicit mount version override precedence over a declaration", async () => {
    const payload = fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(payload)
    declaration.bootstrap.dataset.bokehResourceOverrideVersion = js_version
    try {
      const error = await mount_embed_declaration(declaration.bootstrap, {
        resources: {mode: "none", override_version: "99.0.0"}, resolver,
      }).then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("resource")
      expect(error.message.includes("expects BokehJS 99.0.0")).to.be.true

      declaration.bootstrap.dataset.bokehResourceOverrideVersion = "99.0.0"
      const mounted = await mount_embed_declaration(declaration.bootstrap, {
        resources: {mode: "none", override_version: js_version}, resolver,
      })
      await mounted.dispose()
    } finally {
      declaration.remove()
    }
  })

  it("surfaces server bootstrap HTTP failures without a second lifecycle", async () => {
    const payload = fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    payload.source = {
      ...payload.source,
      relative_urls: true,
      headers: {Authorization: "Bearer token"},
      credentials: "include",
    }
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    let requested = ""
    let request_init: RequestInit | undefined
    globalThis.fetch = async (input, init) => {
      requested = `${input}`
      request_init = init
      return new Response("denied", {status: 401, statusText: "Unauthorized"})
    }
    try {
      const mounted = mount(payload, target, {resources: "none"})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("http")
      expect(error.message.includes("401 Unauthorized")).to.be.true
      const request_url = new URL(requested)
      expect(request_url.origin).to.be.equal(window.location.origin)
      expect(request_url.pathname).to.be.equal("/app/embed.json")
      expect(request_url.searchParams.get("account")).to.be.equal("123")
      expect(request_url.searchParams.has("bokeh-session-id")).to.be.false
      expect(request_url.searchParams.has("bokeh-token")).to.be.false
      const request_headers = new Headers(request_init?.headers)
      expect(request_headers.get("Authorization")).to.be.equal("Bearer token")
      expect(request_headers.get("Bokeh-Session-Id")).to.be.equal("fixture-session")
      expect(request_headers.get("Bokeh-Token")).to.be.null
      expect(request_init?.credentials).to.be.equal("include")
      expect(mounted.session).to.be.null
      expect(mounted.disposed).to.be.true
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("validates the versioned server bootstrap before opening a websocket", async () => {
    const payload = fixture("server-existing-session")
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v2",
      bokeh_version: js_version,
      token: "unused",
    })
    try {
      const mounted = mount(payload, target, {resources: "none"})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("schema")
      expect(error.message.includes("embed-server/v1")).to.be.true
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("publishes preparation failures to direct targets and discovery waiters", async () => {
    const payload = fixture("server-existing-session")
    const target = document.createElement("div")
    target.id = "failed-server-mount"
    document.body.append(target)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => new Response("denied", {status: 403})
    try {
      for (const targets of [target, "#failed-server-mount", {detail: target}]) {
        delete target.bokehMountError
        const discovery = when_mounted(target).then(() => null, (error: unknown) => error)
        const mounted = mount(payload, targets, {resources: "none"})
        const error = await mounted.ready.then(() => null, (error: unknown) => error)
        expect_instanceof(error, MountError)
        expect(error.kind).to.be.equal("http")
        expect(await discovery).to.be.equal(error)
        expect((target as HTMLElement).bokehMountError).to.be.equal(error)
        expect(await when_mounted(target).then(() => null, (error: unknown) => error)).to.be.equal(error)
      }
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("classifies login HTML as a server payload decoding failure", async () => {
    const payload = fixture("server-existing-session")
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => new Response("<!doctype html><title>Login</title>")
    try {
      const mounted = mount(payload, target, {resources: "none"})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("decode")
      expect(error.phase).to.be.equal("payload")
      expect_not_null(error.source)
      expect(error.source.kind).to.be.equal("embed")
      expect(error.source.embed).to.be.undefined
      expect_not_null(error.source.url)
      expect(new URL(error.source.url).pathname).to.be.equal("/app/embed.json")
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("resolves server extension URLs against the public application origin", async () => {
    const payload = fixture("server-existing-session")
    payload.source = {kind: "server", url: "https://public.example/proxy/app"}
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1",
      bokeh_version: js_version,
      token: "unused",
      requires: {components: [], extensions: []},
      resources: {mode: "resolved", assets: [{kind: "script", url: "/proxy/static/extensions/example.js"}]},
    })
    let asset_url = ""
    const ensure = sinon.stub(resource_loader, "ensure").callsFake(async (_requirements, policy) => {
      if (typeof policy == "object" && policy.mode == "resolved") {
        asset_url = policy.assets![0].url!
        throw new ResourceError("load", "stop before connecting")
      }
    })
    try {
      await prepare_embed(payload, "none").catch(() => {})
      expect(asset_url).to.be.equal("https://public.example/proxy/static/extensions/example.js")
    } finally {
      ensure.restore()
      globalThis.fetch = original_fetch
    }
  })

  it("preserves a deliberate runtime version override through server resource resolution", async () => {
    const root = Div.create({text: "server version override"})
    const server_document = new Document({roots: [root]})
    const connection = new ClientConnection()
    const session = new ClientSession(connection, server_document)
    connection.session = session
    const connect = sinon.stub(ClientConnection.prototype, "connect").resolves(session)
    const payload = fixture("server-existing-session")
    payload.bokeh_version = "99.0.0"
    payload.roots = [{key: "detail", model_id: root.id}]
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1",
      bokeh_version: payload.bokeh_version,
      token: btoa(JSON.stringify({session_id: "test"})),
      requires: {components: [], extensions: []},
      resources: {mode: "resolved", assets: []},
    })
    try {
      const prepared = await prepare_embed(payload, {mode: "none", override_version: js_version})
      expect(prepared.roots.get("detail")).to.be.equal(root)
      expect(prepared.session).to.be.equal(session)
      prepared.release()
    } finally {
      if (!server_document.is_destroyed) {
        session.close()
        server_document.destroy()
      }
      connect.restore()
      globalThis.fetch = original_fetch
    }
  })

  it("tracks full server pages while preserving named targets and page lifecycle", async () => {
    const previous_title = document.title
    const initial = Div.create({text: "initial"})
    const server_document = new Document({roots: [initial]})
    server_document.set_title("initial server title")
    const connection = new ClientConnection()
    const session = new ClientSession(connection, server_document)
    connection.session = session
    const connect = sinon.stub(ClientConnection.prototype, "connect").resolves(session)
    const send = sinon.stub(ClientConnection.prototype, "send").returns(true)
    const payload = fixture("server-existing-session")
    payload.roots = [{key: "detail", model_id: initial.id}]
    payload.metadata = {embedding: {full_document: true}}
    const declaration = inline_declaration(payload)
    const fallback = document.createElement("div")
    fallback.dataset.bokehDocumentTarget = ""
    fallback.dataset.bokehEmbedInstance = declaration.bootstrap.dataset.bokehEmbedInstance
    declaration.payload.before(fallback)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1", bokeh_version: js_version, token: btoa(JSON.stringify({session_id: "test"})),
      requires: {components: [], extensions: []}, resources: {mode: "resolved", assets: []},
    })
    let mounted: BokehMount | undefined
    try {
      mounted = await mount_embed_declaration(declaration.bootstrap)
      expect(mounted.target("detail")).to.be.equal(declaration.targets[0])
      expect(document.title).to.be.equal("initial server title")
      expect(fallback.childElementCount).to.be.equal(1)
      expect(fallback.bokehMount).to.be.equal(mounted)
      server_document.clear()
      const replacement = Div.create({text: "replacement"})
      server_document.add_root(replacement)
      await defer()
      expect(mounted.target(replacement.id)).to.be.equal(fallback)
      expect(mounted.view(replacement.id)).to.not.be.null
      expect(declaration.targets[0].childElementCount).to.be.equal(0)
      server_document.set_title("updated server title")
      expect(document.title).to.be.equal("updated server title")
    } finally {
      await mounted?.dispose()
      if (!server_document.is_destroyed) {
        session.close()
        server_document.destroy()
      }
      connect.restore()
      send.restore()
      globalThis.fetch = original_fetch
      declaration.remove()
      fallback.remove()
      document.title = previous_title
    }
  })

  it("mounts current full-page roots when they changed before the session pull", async () => {
    const replacement = Div.create({text: "replacement before pull"})
    const server_document = new Document({roots: [replacement]})
    const connection = new ClientConnection()
    const session = new ClientSession(connection, server_document)
    connection.session = session
    const connect = sinon.stub(ClientConnection.prototype, "connect").resolves(session)
    const payload = fixture("server-existing-session")
    payload.roots = [{key: "detail", model_id: "removed-root"}]
    payload.metadata = {embedding: {full_document: true}}
    const declaration = inline_declaration(payload)
    const fallback = document.createElement("div")
    fallback.dataset.bokehDocumentTarget = ""
    fallback.dataset.bokehEmbedInstance = declaration.bootstrap.dataset.bokehEmbedInstance
    declaration.payload.before(fallback)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1", bokeh_version: js_version, token: btoa(JSON.stringify({session_id: "test"})),
      requires: {components: [], extensions: []}, resources: {mode: "resolved", assets: []},
    })
    let mounted: BokehMount | undefined
    try {
      mounted = await mount_embed_declaration(declaration.bootstrap)
      expect(mounted.root_keys).to.be.equal([replacement.id])
      expect(mounted.target(replacement.id)).to.be.equal(fallback)
      expect(mounted.view(replacement.id)).to.not.be.null
      expect(declaration.targets[0].childElementCount).to.be.equal(0)
    } finally {
      await mounted?.dispose()
      if (!server_document.is_destroyed) {
        session.close()
        server_document.destroy()
      }
      connect.restore()
      globalThis.fetch = original_fetch
      declaration.remove()
      fallback.remove()
    }
  })

  it("loads server-provided extension assets before opening and deserializing a session", async () => {
    const payload = fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    delete payload.source.session_id
    payload.source.token = "signed-token"
    payload.requires = core
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    const state = globalThis as typeof globalThis & {server_extension_loaded?: boolean}
    state.server_extension_loaded = false
    let requested = ""
    let request_headers = new Headers()
    globalThis.fetch = async (input, init) => {
      requested = `${input}`
      request_headers = new Headers(init?.headers)
      return Response.json({
        schema: "bokeh.embed-server/v1",
        bokeh_version: js_version,
        token: "invalid",
        requires: {
          components: [],
          extensions: [{
            name: "package:server-extension",
            assets: [{kind: "script", package: "server-extension"}],
          }],
        },
        resources: {
          mode: "resolved",
          assets: [{kind: "script", content: "globalThis.server_extension_loaded = true"}],
        },
      })
    }
    try {
      const mounted = mount(payload, target, {resources: {mode: "server", nonce: "host-nonce"}})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(state.server_extension_loaded).to.be.true
      expect(request_headers.get("Bokeh-Token")).to.be.equal("signed-token")
      expect(request_headers.get("Bokeh-Resource-Mode")).to.be.equal("server")
      const request_url = new URL(requested)
      expect(request_url.searchParams.has("bokeh-session-id")).to.be.false
      expect(request_url.searchParams.has("bokeh-token")).to.be.false
      const extension = [...document.querySelectorAll<HTMLScriptElement>("script[data-bokeh-resource]")].find(
        (script) => script.textContent.includes("server_extension_loaded"),
      )
      expect_not_null(extension)
      expect(extension.nonce).to.be.equal("host-nonce")
      expect(mounted.session).to.be.null
    } finally {
      globalThis.fetch = original_fetch
      delete state.server_extension_loaded
      target.remove()
    }
  })

  it("uses declaration resource attributes for server extension requests", async () => {
    const payload = fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    delete payload.source.session_id
    payload.source.token = "declaration-token"
    payload.requires = core
    const declaration = inline_declaration(payload)
    declaration.bootstrap.dataset.bokehResourceMode = "server"
    declaration.bootstrap.dataset.bokehResourceMinified = "false"
    declaration.bootstrap.nonce = "declaration-nonce"
    const original_fetch = globalThis.fetch
    const state = globalThis as typeof globalThis & {declaration_extension_loaded?: boolean}
    state.declaration_extension_loaded = false
    let request_headers = new Headers()
    globalThis.fetch = async (_input, init) => {
      request_headers = new Headers(init?.headers)
      return Response.json({
        schema: "bokeh.embed-server/v1",
        bokeh_version: js_version,
        token: "invalid",
        requires: {
          components: [],
          extensions: [{
            name: "declaration-extension",
            assets: [{kind: "script", content: "globalThis.declaration_extension_loaded = true"}],
          }],
        },
        resources: {
          mode: "resolved",
          assets: [{kind: "script", content: "globalThis.declaration_extension_loaded = true"}],
        },
      })
    }
    try {
      const error = await mount_embed_declaration(declaration.bootstrap).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, MountError)
      expect(state.declaration_extension_loaded).to.be.true
      expect(request_headers.get("Bokeh-Token")).to.be.equal("declaration-token")
      expect(request_headers.get("Bokeh-Resource-Mode")).to.be.equal("server")
      expect(request_headers.get("Bokeh-Resource-Minified")).to.be.equal("false")
      const extension = [...document.querySelectorAll<HTMLScriptElement>("script[data-bokeh-resource]")].find(
        (script) => script.textContent.includes("declaration_extension_loaded"),
      )
      expect_not_null(extension)
      expect(extension.nonce).to.be.equal("declaration-nonce")
    } finally {
      globalThis.fetch = original_fetch
      delete state.declaration_extension_loaded
      declaration.remove()
    }
  })

  it("applies host external-only policy to server extension assets", async () => {
    const payload = fixture("server-existing-session")
    payload.requires = core
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    const state = globalThis as typeof globalThis & {forbidden_server_extension_loaded?: boolean}
    state.forbidden_server_extension_loaded = false
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1",
      bokeh_version: js_version,
      token: "unused",
      requires: {
        components: [],
        extensions: [{
          name: "inline-server-extension",
          assets: [{kind: "script", content: "globalThis.forbidden_server_extension_loaded = true"}],
        }],
      },
      resources: {
        mode: "resolved",
        assets: [{kind: "script", content: "globalThis.forbidden_server_extension_loaded = true"}],
      },
    })
    try {
      const mounted = mount(payload, target, {resources: {mode: "server", external_only: true}})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("resource")
      expect(error.message.includes("external_only")).to.be.true
      expect(state.forbidden_server_extension_loaded).to.be.false
    } finally {
      globalThis.fetch = original_fetch
      delete state.forbidden_server_extension_loaded
      target.remove()
    }
  })

  it("applies host integrity policy to server extension assets", async () => {
    const payload = fixture("server-existing-session")
    payload.requires = core
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v1",
      bokeh_version: js_version,
      token: "unused",
      requires: {
        components: [],
        extensions: [{
          name: "unhashed-server-extension",
          assets: [{kind: "script", url: "https://example.invalid/unhashed-extension.js"}],
        }],
      },
      resources: {
        mode: "resolved",
        assets: [{kind: "script", url: "https://example.invalid/unhashed-extension.js"}],
      },
    })
    try {
      const mounted = mount(payload, target, {resources: {mode: "cdn", integrity: true}})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("resource")
      expect(error.message.includes("SRI hash")).to.be.true
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("lets explicit host assets satisfy server extension requirements", async () => {
    const payload = fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    delete payload.source.session_id
    payload.source.token = "signed-token"
    payload.requires = core
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    const state = globalThis as typeof globalThis & {
      host_server_extension_loaded?: boolean
      endpoint_server_extension_loaded?: boolean
    }
    state.host_server_extension_loaded = false
    state.endpoint_server_extension_loaded = false
    let request_headers = new Headers()
    globalThis.fetch = async (_input, init) => {
      request_headers = new Headers(init?.headers)
      return Response.json({
        schema: "bokeh.embed-server/v1",
        bokeh_version: js_version,
        token: "invalid",
        requires: {
          components: [],
          extensions: [{
            name: "package:server-extension",
            assets: [{kind: "script", package: "server-extension"}],
          }],
        },
        resources: {
          mode: "resolved",
          assets: [{kind: "script", content: "globalThis.endpoint_server_extension_loaded = true"}],
        },
      })
    }
    try {
      const mounted = mount(payload, target, {resources: {
        mode: "server",
        assets: [{kind: "script", content: "globalThis.host_server_extension_loaded = true"}],
      }})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(state.host_server_extension_loaded).to.be.true
      expect(state.endpoint_server_extension_loaded).to.be.false
      expect(request_headers.get("Bokeh-Resource-Mode")).to.be.equal("none")
    } finally {
      globalThis.fetch = original_fetch
      delete state.host_server_extension_loaded
      delete state.endpoint_server_extension_loaded
      target.remove()
    }
  })

  it("validates shared fixture envelopes without payload fingerprints", () => {
    for (const item of fixture_data.cases) {
      const raw = structuredClone(item.payload) as unknown as EmbedPayload
      expect(validate_embed_payload(raw)).to.be.equal(raw)
      expect("fingerprint" in raw).to.be.false
    }
    const standalone = validate_embed_payload(fixture("standalone-keyed-roots"))
    expect(standalone.source.kind).to.be.equal("standalone")
    const server = validate_embed_payload(fixture("server-existing-session"))
    expect(server.source.kind).to.be.equal("server")
    expect(server.roots).to.be.equal([{key: "detail", model_id: "fixture-root"}])
  })

  it("validates JSON-compatible values", () => {
    for (const value of [NaN, Infinity, () => {}, 1n]) {
      const payload = fixture("standalone-keyed-roots")
      payload.metadata = {value}
      expect(() => validate_embed_payload(payload)).to.throw(EmbedError, /finite|JSON-compatible/)
    }

    const cyclic: {[key: string]: unknown} = {}
    cyclic.self = cyclic
    const payload = fixture("standalone-keyed-roots")
    payload.metadata = {cyclic}
    expect(() => validate_embed_payload(payload)).to.throw(EmbedError, /cyclic/)

    payload.metadata = {value: 1e22}
    expect(validate_embed_payload(payload)).to.be.equal(payload)
  })

  it("rejects removed buffers and malformed resource literals", () => {
    const buffered = fixture("standalone-keyed-roots") as unknown as {[key: string]: unknown}
    buffered.buffers = []
    expect(() => validate_embed_payload(buffered)).to.throw(EmbedError, /not part of bokeh\.embed\/v1/)

    const malformed = fixture("standalone-keyed-roots") as unknown as {
      requires: {extensions: unknown[]}
    }
    malformed.requires.extensions = [{
      name: "bad",
      assets: [{kind: "bogus", content: "void 0"}],
    }]
    expect(() => validate_embed_payload(malformed)).to.throw(EmbedError, /kind must be 'script' or 'style'/)

    const module_style = fixture("standalone-keyed-roots")
    module_style.requires.extensions = [{
      name: "bad-style",
      assets: [{kind: "style", content: "body {}", module: true}],
    }]
    expect(() => validate_embed_payload(module_style)).to.throw(EmbedError, /style resources cannot be modules/)

    const payload_nonce = fixture("standalone-keyed-roots") as unknown as {
      requires: {extensions: unknown[]}
    }
    payload_nonce.requires.extensions = [{
      name: "bad-nonce",
      assets: [{kind: "script", content: "void 0", nonce: "payload"}],
    }]
    expect(() => validate_embed_payload(payload_nonce)).to.throw(EmbedError, /nonce is host-owned/)

    const packaged = fixture("standalone-keyed-roots")
    packaged.requires.extensions = [{
      name: "packaged",
      assets: [{kind: "script", package: "example-extension"}],
    }]
    expect(validate_embed_payload(packaged)).to.be.equal(packaged)

    const ambiguous_package = fixture("standalone-keyed-roots") as unknown as {
      requires: {extensions: unknown[]}
    }
    ambiguous_package.requires.extensions = [{
      name: "bad-package",
      assets: [{kind: "script", package: "example-extension", content: "void 0"}],
    }]
    expect(() => validate_embed_payload(ambiguous_package)).to.throw(EmbedError, /exactly one/)

    const server = fixture("server-existing-session") as unknown as {source: {[key: string]: unknown}}
    for (const [field, value] of [["session_id", 1], ["token", {}], ["relative_urls", "yes"]] as const) {
      server.source[field] = value
      expect(() => validate_embed_payload(server)).to.throw(EmbedError, new RegExp(field))
      delete server.source[field]
    }
    server.source.session_id = "session"
    server.source.token = "token"
    expect(() => validate_embed_payload(server)).to.throw(EmbedError, /either session_id or token/)

    const duplicate_components = fixture("standalone-keyed-roots")
    duplicate_components.requires.components = ["bokeh/core", "bokeh/core"]
    expect(() => validate_embed_payload(duplicate_components)).to.throw(EmbedError, /components must be unique/)

    const duplicate_extensions = fixture("standalone-keyed-roots")
    duplicate_extensions.requires.extensions = [
      {name: "duplicate", assets: []},
      {name: "duplicate", assets: []},
    ]
    expect(() => validate_embed_payload(duplicate_extensions)).to.throw(EmbedError, /duplicate.*extension/)

    const duplicate_standalone_root = fixture("standalone-keyed-roots")
    duplicate_standalone_root.roots[1] = {...duplicate_standalone_root.roots[0], key: "duplicate"}
    expect(() => validate_embed_payload(duplicate_standalone_root)).to.throw(EmbedError, /unique models/)

    const duplicate_server_root = fixture("server-existing-session")
    duplicate_server_root.roots.push({...duplicate_server_root.roots[0], key: "duplicate"})
    expect(() => validate_embed_payload(duplicate_server_root)).to.throw(EmbedError, /unique models/)

    const multiple_documents = fixture("standalone-keyed-roots")
    if (multiple_documents.source.kind != "standalone") {
      throw new Error("expected standalone fixture")
    }
    multiple_documents.source.documents.push(structuredClone(multiple_documents.source.documents[0]))
    expect(() => validate_embed_payload(multiple_documents)).to.throw(EmbedError, /exactly one document/)

    const mixed_root = fixture("standalone-keyed-roots")
    Object.assign(mixed_root.roots[0], {model_id: "not-structural"})
    expect(() => validate_embed_payload(mixed_root)).to.throw(EmbedError, /cannot declare model_id/)
  })

  it("deduplicates concurrent and sequential additive resource loads", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {embed_core?: number, embed_widgets?: number}
    state.embed_core = 0
    state.embed_widgets = 0
    const core_asset = {
      kind: "script" as const,
      content: "globalThis.embed_core += 1",
      content_sha256: "0".repeat(64),
    }
    const widget_asset = {
      kind: "script" as const,
      content: "globalThis.embed_widgets += 1",
      content_sha256: "1".repeat(64),
    }

    await Promise.all([
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
    ])
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    await loader.ensure(widgets, {mode: "resolved", assets: [core_asset, widget_asset]})

    expect(state.embed_core).to.be.equal(1)
    expect(state.embed_widgets).to.be.equal(1)
    expect(document.querySelectorAll("[data-bokeh-resource]").length).to.be.equal(2)
    const markers = [...document.querySelectorAll<HTMLElement>("[data-bokeh-resource]")]
      .map((element) => element.dataset.bokehResource).sort()
    expect(markers).to.be.equal([
      `script:sha256:${core_asset.content_sha256}`,
      `script:sha256:${widget_asset.content_sha256}`,
    ])
  })

  it("adopts parser-rendered inline resources by compact digest", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {embed_parser_script?: number}
    state.embed_parser_script = 0

    const script_source = "globalThis.embed_parser_script += 1"
    const script_digest = "a".repeat(64)
    const script = document.createElement("script")
    script.textContent = script_source
    script.dataset.bokehResource = `script:sha256:${script_digest}`
    script.dataset.bokehResourceState = "loaded"

    const style_source = ".embed-parser-style { color: rgb(1, 2, 3); }"
    const style_digest = "b".repeat(64)
    const style = document.createElement("style")
    style.textContent = style_source
    style.dataset.bokehResource = `style:sha256:${style_digest}`
    style.dataset.bokehResourceState = "loaded"

    document.head.append(script, style)
    expect(state.embed_parser_script).to.be.equal(1)

    await loader.ensure(core, {mode: "resolved", assets: [
      {kind: "script", content: script_source, content_sha256: script_digest},
      {kind: "style", content: style_source, content_sha256: style_digest},
    ]})

    expect(state.embed_parser_script).to.be.equal(1)
    expect(loader.size).to.be.equal(2)
    const scripts = document.querySelectorAll("script[data-bokeh-resource]")
    const styles = document.querySelectorAll("style[data-bokeh-resource]")
    expect(scripts.length).to.be.equal(1)
    expect(styles.length).to.be.equal(1)
    expect(scripts[0]).to.be.equal(script)
    expect(styles[0]).to.be.equal(style)
    delete state.embed_parser_script
  })

  it("doesn't conflate inline resources that collided under the old 32-bit hash", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {embed_collision?: number[]}
    state.embed_collision = []
    const first = "globalThis.embed_collision.push(416739)"
    const second = "globalThis.embed_collision.push(1029994)"

    await loader.ensure(core, {mode: "resolved", assets: [
      {kind: "script", content: first},
      {kind: "script", content: second},
    ]})

    expect(state.embed_collision).to.be.equal([416739, 1029994])
  })

  it("waits for existing loading resources and validates their declarations", async () => {
    const loader = new ResourceLoader()
    const url = "https://example.invalid/existing.js"
    const script = document.createElement("script")
    script.type = "application/json"
    script.src = url
    script.dataset.bokehResource = "fixture"
    script.dataset.bokehResourceState = "loading"
    document.head.append(script)

    let loaded = false
    const loading = loader.ensure(core, {mode: "resolved", assets: [{kind: "script", url}]}).then(() => loaded = true)
    expect(loaded).to.be.false
    script.dispatchEvent(new Event("load"))
    await loading
    expect(loaded).to.be.true
    expect(script.dataset.bokehResourceState).to.be.equal("loaded")

    loader.clear()
    const conflict = await loader.ensure(core, {mode: "resolved", assets: [
      {kind: "script", url, module: true},
    ]}).then(() => null, (error: unknown) => error)
    expect_instanceof(conflict, ResourceError)
    expect(conflict.kind).to.be.equal("conflict")
  })

  it("reports failures from pending generated resources", async () => {
    const loader = new ResourceLoader()
    const resource = document.createElement("script")
    resource.type = "application/json"
    resource.dataset.bokehResource = ""
    resource.dataset.bokehResourceState = "loading"
    document.head.append(resource)

    try {
      const waiting = loader.wait_for_pending()
      resource.dispatchEvent(new Event("error"))
      const error = await waiting.then(() => null, (error: unknown) => error)

      expect_instanceof(error, ResourceError)
      expect(error.kind).to.be.equal("load")
      expect(resource.dataset.bokehResourceState).to.be.equal("failed")
    } finally {
      resource.remove()
    }
  })

  it("bounds and cancels waits for pending generated resources", async () => {
    const clock = sinon.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]})
    const loader = new ResourceLoader()
    const resource = document.createElement("script")
    resource.type = "application/json"
    resource.dataset.bokehResource = ""
    resource.dataset.bokehResourceState = "loading"
    document.head.append(resource)

    try {
      const timed = loader.wait_for_pending()
      clock.tick(30_000)
      const timeout = await timed.then(() => null, (error: unknown) => error)
      expect_instanceof(timeout, ResourceError)
      expect(timeout.message.includes("timed out")).to.be.true
      expect(resource.dataset.bokehResourceState).to.be.equal("failed")

      resource.dispatchEvent(new Event("load"))
      expect(resource.dataset.bokehResourceState).to.be.equal("loaded")
      await loader.wait_for_pending()

      resource.dataset.bokehResourceState = "loading"
      const controller = new AbortController()
      const cancelled = loader.wait_for_pending(controller.signal)
      const reason = new Error("cancelled")
      controller.abort(reason)
      expect(await cancelled.then(() => null, (error: unknown) => error)).to.be.equal(reason)
      expect(resource.dataset.bokehResourceState).to.be.equal("loading")
    } finally {
      clock.restore()
      resource.remove()
    }
  })

  it("continues tracking generated resources after a cancelled wait", async () => {
    const loader = new ResourceLoader()

    for (const [event, state] of [
      ["load", "loaded"],
      ["bokeh:resource-loaded", "loaded"],
      ["error", "failed"],
    ] as const) {
      const resource = document.createElement("script")
      resource.type = "application/json"
      resource.dataset.bokehResource = ""
      resource.dataset.bokehResourceState = "loading"
      document.head.append(resource)

      try {
        const controller = new AbortController()
        const waiting = loader.wait_for_pending(controller.signal)
        const reason = new Error("cancelled")
        controller.abort(reason)
        expect(await waiting.then(() => null, (error: unknown) => error)).to.be.equal(reason)

        resource.dispatchEvent(new Event(event))
        expect(resource.dataset.bokehResourceState).to.be.equal(state)

        const resumed = loader.wait_for_pending()
        if (state == "loaded") {
          await resumed
        } else {
          const error = await resumed.then(() => null, (error: unknown) => error)
          expect_instanceof(error, ResourceError)
          expect(error.kind).to.be.equal("load")
        }
      } finally {
        resource.remove()
      }
    }
  })

  it("bounds reuse of a previously loaded foreign script without resource timing", async () => {
    const clock = sinon.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]})
    const loader = new ResourceLoader()
    const url = "https://example.invalid/already-loaded.js"
    const script = document.createElement("script")
    script.type = "application/json"
    script.src = url
    document.head.append(script)
    script.dispatchEvent(new Event("load"))

    try {
      expect(performance.getEntriesByName(url, "resource")).to.be.empty
      const loading = loader.ensure(core, {
        mode: "resolved", assets: [{kind: "script", url}],
      })
      clock.tick(5_000)
      const error = await loading.then(() => null, (error: unknown) => error)

      expect_instanceof(error, ResourceError)
      expect(error.kind).to.be.equal("load")
      expect(error.message.includes("timed out waiting")).to.be.true

      script.dispatchEvent(new Event("load"))
      await Promise.resolve()
      expect(script.dataset.bokehResourceState).to.be.undefined
    } finally {
      clock.restore()
      script.remove()
    }
  })

  it("awaits inline module evaluation", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {embed_inline_module?: number}
    state.embed_inline_module = 0

    await loader.ensure(core, {mode: "resolved", assets: [{
      kind: "script", module: true, content: "globalThis.embed_inline_module = 1",
    }]})

    expect(state.embed_inline_module).to.be.equal(1)
  })

  it("records generated module completion before a declaration starts waiting", async () => {
    const resource = document.createElement("script")
    resource.type = "application/json"
    resource.dataset.bokehResource = ""
    resource.dataset.bokehResourceState = "loading"
    document.head.append(resource)

    try {
      resource.dispatchEvent(new Event("load"))
      expect(resource.dataset.bokehResourceState).to.be.equal("loaded")
      await new ResourceLoader().wait_for_pending()
    } finally {
      resource.remove()
    }
  })

  it("rejects inline module parse and evaluation errors and permits retry", async () => {
    const loader = new ResourceLoader()
    const expected_error = (event: ErrorEvent) => {
      if (event.filename.startsWith("bokeh_inline_resource")) {
        event.preventDefault()
      }
    }
    window.addEventListener("error", expected_error)

    try {
      for (const content of ["export const =", "throw new Error('inline module failure')"]) {
        const policy = {mode: "resolved" as const, assets: [{kind: "script" as const, module: true, content}]}
        for (const retry of [false, true]) {
          const error = await loader.ensure(core, {...policy, retry}).then(() => null, (error: unknown) => error)
          expect_instanceof(error, ResourceError)
          expect(error.kind).to.be.equal("load")
          expect(document.querySelectorAll('[data-bokeh-resource-state="loading"]').length).to.be.equal(0)
        }
      }
    } finally {
      window.removeEventListener("error", expected_error)
    }
  })

  it("bounds resource loading when blocked scripts emit no completion event", async () => {
    const clock = sinon.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]})
    const append = sinon.stub(document.head, "append")
    const loader = new ResourceLoader()

    try {
      const loading = loader.ensure(core, {mode: "resolved", assets: [{
        kind: "script", module: true, content: "globalThis.blocked_resource = true",
      }]}).then(() => null, (error: unknown) => error)
      await Promise.resolve()
      clock.tick(30_000)
      const error = await loading

      expect_instanceof(error, ResourceError)
      expect(error.message.includes("timed out")).to.be.true
    } finally {
      append.restore()
      clock.restore()
    }
  })

  it("ignores unrelated host data URLs when finding existing resources", async () => {
    const foreign_script = document.createElement("script")
    foreign_script.type = "application/json"
    foreign_script.src = "data:text/javascript,void%200"
    const foreign_style = document.createElement("link")
    foreign_style.rel = "stylesheet"
    foreign_style.href = "data:text/css,body%7B%7D"
    document.head.append(foreign_script, foreign_style)
    const append = sinon.stub(document.head, "append").callsFake((...nodes: (Node | string)[]) => {
      for (const node of nodes) {
        if (node instanceof HTMLElement) {
          node.dispatchEvent(new Event("load"))
        }
      }
    })

    try {
      await new ResourceLoader().ensure(core, {mode: "resolved", assets: [
        {kind: "script", url: "https://example.test/resource-probe.js"},
        {kind: "style", url: "https://example.test/resource-probe.css"},
      ]})
      expect(append.callCount).to.be.equal(2)
    } finally {
      append.restore()
      foreign_script.remove()
      foreign_style.remove()
    }
  })

  it("uses Python prerelease spelling for additive CDN bundles", async () => {
    const version = Version.from(js_version)!
    const suffix = version.type == ReleaseType.Dev ? `.dev${version.revision}`
      : version.type == ReleaseType.Candidate ? `rc${version.revision}` : ""
    const cdn_version = `${version.major}.${version.minor}.${version.patch}${suffix}`
    const urls: string[] = []
    const append = sinon.stub(document.head, "append").callsFake((...nodes: (Node | string)[]) => {
      for (const node of nodes) {
        if (node instanceof HTMLScriptElement) {
          urls.push(node.src)
          node.dispatchEvent(new Event("load"))
        }
      }
    })

    try {
      await new ResourceLoader().ensure({components: ["bokeh/widgets"], extensions: []}, "cdn")
      expect(urls).to.be.equal([
        `https://cdn.bokeh.org/bokeh/${version.type == ReleaseType.Release ? "release" : "dev"}/bokeh-widgets-${cdn_version}.min.js`,
      ])
    } finally {
      append.restore()
    }
  })

  it("defaults to host-owned resources without erasing requirements", async () => {
    const loader = new ResourceLoader()
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    await loader.ensure(widgets)
    expect(loader.size).to.be.equal(0)
    expect(document.querySelectorAll("[data-bokeh-resource]").length).to.be.equal(0)
    expect(widgets.components).to.be.equal(["bokeh/core", "bokeh/widgets"])
  })

  it("retains explicit automatic CDN resource loading", async () => {
    const loader = new ResourceLoader()
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    const version = js_version.split("+")[0].replace(/-dev\.(\d+)$/, ".dev$1").replace(/-rc\.(\d+)$/, "rc$1")
    const url = `https://cdn.bokeh.org/bokeh/${version.includes("dev") || version.includes("rc") ? "dev" : "release"}/bokeh-widgets-${version}.min.js`
    const script = document.createElement("script")
    script.type = "application/json"
    script.src = url
    script.dataset.bokehResourceState = "loaded"
    document.head.append(script)

    try {
      await loader.ensure(widgets, "auto")
      expect(loader.size).to.be.equal(1)
    } finally {
      script.remove()
    }
  })

  it("loads the API bundle when it is explicitly required", async () => {
    const loader = new ResourceLoader()
    const api: ResourceRequirements = {components: ["bokeh/core", "bokeh/api"], extensions: []}
    const version = js_version.split("+")[0].replace(/-dev\.(\d+)$/, ".dev$1").replace(/-rc\.(\d+)$/, "rc$1")
    const url = `https://cdn.bokeh.org/bokeh/${version.includes("dev") || version.includes("rc") ? "dev" : "release"}/bokeh-api-${version}.min.js`
    const script = document.createElement("script")
    script.type = "application/json"
    script.src = url
    script.dataset.bokehResourceState = "loaded"
    document.head.append(script)

    try {
      await loader.ensure(api, "auto")
      expect(loader.size).to.be.equal(1)
    } finally {
      script.remove()
    }
  })

  it("applies CSP attributes and reports actionable declaration conflicts", async () => {
    const loader = new ResourceLoader()
    const asset = {kind: "script" as const, content: "void 0", nonce: "fixture-nonce"}
    await loader.ensure(core, {mode: "resolved", assets: [asset]})
    const script = document.querySelector<HTMLScriptElement>("script[data-bokeh-resource]")
    expect_not_null(script)
    expect(script.nonce).to.be.equal("fixture-nonce")

    const error = await loader.ensure(core, {
      mode: "resolved",
      assets: [{...asset, nonce: "different-nonce"}],
    }).then(() => null, (error: unknown) => error)
    expect_instanceof(error, ResourceError)
    expect(error.kind).to.be.equal("conflict")
    expect(error.message.includes("conflicting declarations")).to.be.true
  })

  it("applies the host CSP nonce to extension requirements", async () => {
    const loader = new ResourceLoader()
    const requirements: ResourceRequirements = {components: ["bokeh/core"], extensions: [{
      name: "host-nonce",
      assets: [{kind: "script", content: "void 0"}],
    }]}
    await loader.ensure(requirements, {
      mode: "cdn",
      nonce: "host-nonce",
      assets: requirements.extensions[0].assets,
    })
    const script = document.querySelector<HTMLScriptElement>("script[data-bokeh-resource]")
    expect_not_null(script)
    expect(script.nonce).to.be.equal("host-nonce")
  })

  it("requires hosts to resolve payload extension resources", async () => {
    const loader = new ResourceLoader()
    const requirements: ResourceRequirements = {components: ["bokeh/core"], extensions: [{
      name: "untrusted-extension",
      assets: [{kind: "script", url: "https://example.test/extension.js"}],
    }]}

    const error = await loader.ensure(requirements, "cdn").then(() => null, (error: unknown) => error)
    expect_instanceof(error, ResourceError)
    expect(error.kind).to.be.equal("policy")
    expect(error.message.includes("must be resolved by the host")).to.be.true
  })

  async function rejects_resource_url(url: string): Promise<void> {
    const loader = new ResourceLoader()
    const error = await loader.ensure(core, {
      mode: "resolved",
      assets: [{kind: "script", url}],
    }).then(() => null, (error: unknown) => error)

    expect_instanceof(error, ResourceError)
    expect(error.kind).to.be.equal("policy")
    expect(error.message.includes("URLs are not valid Bokeh resources")).to.be.true
  }

  it("rejects javascript resource URLs", async () => rejects_resource_url("javascript:alert(1)"))
  it("rejects data resource URLs", async () => rejects_resource_url("data:text/javascript,alert(1)"))
  it("rejects vbscript resource URLs", async () => rejects_resource_url("vbscript:alert(1)"))

  it("validates compact inline resource identities", async () => {
    const loader = new ResourceLoader()
    for (const asset of [
      {kind: "script" as const, content: "void 0", content_sha256: "not-a-digest"},
      {kind: "script" as const, url: "https://example.test/extension.js", content_sha256: "0".repeat(64)},
    ]) {
      const error = await loader.ensure(core, {mode: "resolved", assets: [asset]}).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, ResourceError)
      expect(error.kind).to.be.equal("policy")
      expect(error.message.includes("content_sha256")).to.be.true
    }
  })

  it("rejects offline URLs and unresolved integrity policies", async () => {
    const loader = new ResourceLoader()
    const external = {kind: "script" as const, url: "https://example.test/bokeh.js"}

    const offline = await loader.ensure(core, {mode: "offline", assets: [external]}).then(
      () => null, (error: unknown) => error,
    )
    expect_instanceof(offline, ResourceError)
    expect(offline.kind).to.be.equal("policy")
    expect(offline.message.includes("offline")).to.be.true

    const integrity = await loader.ensure(core, {mode: "resolved", assets: [external], integrity: true}).then(
      () => null, (error: unknown) => error,
    )
    expect_instanceof(integrity, ResourceError)
    expect(integrity.message.includes("SRI hash")).to.be.true
  })

  it("loads the standard external bootstrap with a deferred core bundle under a strict CSP", async () => {
    const embed_payload = fixture("standalone-keyed-roots")
    const instance = `Test-${++declaration_index}`
    const payload_url = URL.createObjectURL(new Blob([JSON.stringify(embed_payload)], {
      type: "application/vnd.bokeh.embed+json",
    }))
    const iframe = document.createElement("iframe")
    const targets = embed_payload.roots.map((root) =>
      `<div data-bokeh-embed-instance="${instance}" data-bokeh-root="${root.key}"></div>`,
    ).join("\n")
    iframe.srcdoc = `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'self'; connect-src blob:; style-src 'unsafe-inline'">
    <script src="/static/js/bokeh.min.js" defer></script>
  </head>
  <body>
    ${targets}
    <script src="/static/js/bokeh-embed-bootstrap.min.js"
            data-bokeh-embed-bootstrap
            data-bokeh-embed-instance="${instance}"
            data-bokeh-payload-url="${payload_url}"></script>
  </body>
</html>`

    type Mounted = {
      ready: Promise<void>
      root_keys: string[]
      dispose(): Promise<void>
    }
    type BokehAPI = {
      when_mounted(target: HTMLElement): Promise<Mounted>
    }

    let mounted: Mounted | null = null
    try {
      const loaded = new Promise<void>((resolve, reject) => {
        iframe.addEventListener("load", () => resolve(), {once: true})
        iframe.addEventListener("error", () => reject(new Error("failed to load CSP test frame")), {once: true})
      })
      document.body.append(iframe)
      await loaded

      const frame = iframe.contentWindow as (Window & typeof globalThis & {Bokeh?: BokehAPI}) | null
      const target = iframe.contentDocument?.querySelector<HTMLElement>("[data-bokeh-root='primary']") ?? null
      expect_not_null(frame)
      expect_not_null(frame.Bokeh)
      expect_not_null(target)
      mounted = await frame.Bokeh.when_mounted(target)
      await mounted.ready

      expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
      expect(target.hasAttribute(BOKEH_MOUNTED_ATTRIBUTE)).to.be.true
    } finally {
      await mounted?.dispose()
      URL.revokeObjectURL(payload_url)
      iframe.remove()
    }
  })

})
