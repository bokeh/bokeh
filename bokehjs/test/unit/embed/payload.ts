import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {default_resolver} from "@bokehjs/base"
import {
  BOKEH_MOUNTED_ATTRIBUTE, mount, mount_embed_declaration, MountError, type MountErrorPhase, when_mounted,
} from "@bokehjs/api/io"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {to_object} from "@bokehjs/core/util/object"
import {documents} from "@bokehjs/document"
import type {EmbedPayload} from "@bokehjs/embed/payload"
import {canonical_embed_json, EmbedError, compute_embed_fingerprint, validate_embed_payload} from "@bokehjs/embed/payload"
import type {ResourceRequirements} from "@bokehjs/embed/resources"
import {ResourceError, ResourceLoader} from "@bokehjs/embed/resources"
import {CustomJS} from "@bokehjs/models"
import {version as js_version} from "@bokehjs/version"

import fixture_data from "./embed_fixtures.json" with {type: "json"}

const core: ResourceRequirements = {components: ["bokeh/core"], extensions: []}
let declaration_index = 0

function fixture(name: string): EmbedPayload {
  expect(fixture_data.schema).to.be.equal("bokeh.embed.fixtures/v1")
  const value = structuredClone(fixture_data.cases.find((item) => item.name == name)!.payload) as unknown as EmbedPayload
  value.bokeh_version = js_version
  value.fingerprint = `fixture-${name}`
  if (value.source.kind == "standalone") {
    value.source.documents.forEach((document) => document.version = js_version)
  }
  return value
}

async function mountable_fixture(name: string): Promise<EmbedPayload> {
  const value = fixture(name)
  value.fingerprint = await compute_embed_fingerprint(value)
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
    target.dataset.bokehEmbed = embed_payload.fingerprint
    target.dataset.bokehEmbedInstance = instance
    target.dataset.bokehRoot = root.key
    return target
  })
  const payload = document.createElement("script")
  payload.type = "application/vnd.bokeh.embed+json"
  payload.dataset.bokehEmbedPayload = ""
  payload.dataset.bokehEmbed = embed_payload.fingerprint
  payload.dataset.bokehEmbedInstance = instance
  payload.textContent = JSON.stringify(value)
  const bootstrap = document.createElement("script")
  bootstrap.dataset.bokehEmbedBootstrap = ""
  bootstrap.dataset.bokehEmbed = embed_payload.fingerprint
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

  it("consumes the shared keyed-root fixture through BokehMount", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
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
    const payload = await mountable_fixture("standalone-compact-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const mounted = mount(payload, {resources: "none", resolver})
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

  it("creates independent documents for repeated mounts of one payload", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
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
    const payload = await mountable_fixture("standalone-keyed-roots")
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

  it("keeps repeated identical declarations isolated by DOM order", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
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

  it("rejects incomplete declarative target sets before decoding", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
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
    const payload = await mountable_fixture("standalone-keyed-roots")
    const instance = `Test-${++declaration_index}`
    const targets = payload.roots.map((root) => {
      const target = document.createElement("div")
      target.dataset.bokehEmbed = payload.fingerprint
      target.dataset.bokehEmbedInstance = instance
      target.dataset.bokehRoot = root.key
      return target
    })
    const bootstrap = document.createElement("script")
    bootstrap.dataset.bokehEmbedBootstrap = ""
    bootstrap.dataset.bokehEmbed = payload.fingerprint
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
        kind: "embed-declaration", embed: payload.fingerprint, url: "/payloads/missing.json",
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
    const payload = await mountable_fixture("standalone-keyed-roots")
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
    const payload = await mountable_fixture("standalone-keyed-roots")
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

  it("publishes schema, fingerprint, resource, and deserialize preparation phases", async () => {
    const base = await mountable_fixture("standalone-keyed-roots")
    const cases: [MountErrorPhase, EmbedPayload, unknown][] = []

    cases.push(["schema", base, {...base, schema: "bokeh.embed/v2"}])

    const fingerprint = structuredClone(base)
    fingerprint.metadata.changed = true
    cases.push(["fingerprint", fingerprint, fingerprint])

    const resource = structuredClone(base)
    resource.bokeh_version = "99.0.0"
    resource.fingerprint = await compute_embed_fingerprint(resource)
    cases.push(["resource", resource, resource])

    const deserialize = structuredClone(base)
    if (deserialize.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    deserialize.source.documents[0].roots[0].name = "MissingEmbedModel"
    deserialize.fingerprint = await compute_embed_fingerprint(deserialize)
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
        expect((await Promise.all(discoveries)).every((published) => published == error)).to.be.true
      } finally {
        declaration.remove()
      }
    }
  })

  it("rejects unknown fingerprint-envelope fields consistently", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
    const envelope = {...payload, unexpected: true}
    const root = structuredClone(payload) as EmbedPayload & {
      roots: ({unexpected?: boolean} & EmbedPayload["roots"][number])[]
    }
    root.roots[0].unexpected = true

    expect(() => validate_embed_payload(envelope)).to.throw(EmbedError, /unknown fields/)
    expect(() => validate_embed_payload(root)).to.throw(EmbedError, /unknown fields/)
  })

  it("rejects unsafe and ambiguous server URLs", async () => {
    const payload = await mountable_fixture("server-existing-session")
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
    const payload = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const documents_before = documents.length
    const mounted = mount(payload, document.createElement("div"), {resources: "none", resolver})

    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("target")
    expect(mounted.disposed).to.be.true
    expect(documents.length).to.be.equal(documents_before)
  })

  it("can be disposed before payload decoding completes", async () => {
    const payload = await mountable_fixture("standalone-keyed-roots")
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
    const payload = await mountable_fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    document.body.append(target)

    const unsupported = mount({...payload, schema: "bokeh.embed/v2"} as unknown as EmbedPayload, target, {resources: "none"})
    const schema_error = await unsupported.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(schema_error, MountError)
    expect(schema_error.kind).to.be.equal("schema")

    const mismatched_payload = {...payload, bokeh_version: "99.0.0"}
    mismatched_payload.fingerprint = await compute_embed_fingerprint(mismatched_payload)
    const mismatched = mount(mismatched_payload, target, {resources: "none"})
    const resource_error = await mismatched.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(resource_error, MountError)
    expect(resource_error.kind).to.be.equal("resource")
    expect(resource_error.message.includes("incompatible")).to.be.true

    const tampered = structuredClone(payload)
    tampered.metadata.tampered = true
    const invalid_fingerprint = mount(tampered, target, {resources: "none"})
    const fingerprint_error = await invalid_fingerprint.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(fingerprint_error, MountError)
    expect(fingerprint_error.kind).to.be.equal("schema")
    expect(fingerprint_error.message.includes("fingerprint mismatch")).to.be.true
    target.remove()
  })

  it("surfaces server bootstrap HTTP failures without a second lifecycle", async () => {
    const payload = await mountable_fixture("server-existing-session")
    if (payload.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    payload.source = {
      ...payload.source,
      relative_urls: true,
      headers: {Authorization: "Bearer token"},
      credentials: "include",
    }
    payload.fingerprint = await compute_embed_fingerprint(payload)
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
      expect(new URL(requested).origin).to.be.equal(window.location.origin)
      expect(new URL(requested).pathname).to.be.equal("/app/embed.json")
      expect(new Headers(request_init?.headers).get("Authorization")).to.be.equal("Bearer token")
      expect(request_init?.credentials).to.be.equal("include")
      expect(mounted.session).to.be.null
      expect(mounted.disposed).to.be.true
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("validates the versioned server bootstrap before opening a websocket", async () => {
    const payload = await mountable_fixture("server-existing-session")
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

  it("validates shared fixture envelopes and Python-compatible fingerprints", async () => {
    for (const item of fixture_data.cases) {
      const raw = structuredClone(item.payload) as unknown as EmbedPayload
      expect(await compute_embed_fingerprint(raw)).to.be.equal(raw.fingerprint)
    }
    const standalone = validate_embed_payload(fixture("standalone-keyed-roots"))
    expect(standalone.source.kind).to.be.equal("standalone")
    const server = validate_embed_payload(fixture("server-existing-session"))
    expect(server.source.kind).to.be.equal("server")
    expect(server.roots).to.be.equal([{key: "detail", model_id: "fixture-root"}])
  })

  it("uses the canonical cross-language JSON representation", () => {
    expect(canonical_embed_json({
      z: null,
      small: 1e-7,
      fixed: 1e-6,
      negative_zero: -0,
      "\ue000": 1,
      "\u{10000}": 2,
    })).to.be.equal('{"fixed":0.000001,"negative_zero":0,"small":1e-7,"z":null,"𐀀":2,"":1}')
  })

  it("rejects non-finite and unsafe fingerprint numbers", async () => {
    for (const value of [NaN, Infinity, 2**53, 1e20, 1e21]) {
      const payload = fixture("standalone-keyed-roots")
      payload.metadata = {value}
      const error = await compute_embed_fingerprint(payload).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, EmbedError)
      expect(error.message.includes("finite") || error.message.includes("safe integer")).to.be.true
    }
  })

  it("keeps envelope metadata outside model ID normalization", async () => {
    const actual = fixture("standalone-keyed-roots")
    if (actual.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    const retained = actual.source.documents[0].roots[0] as {id?: string}
    retained.id = "retained-model-id"
    actual.metadata = {id: "retained-model-id"}
    const normalized_lookalike = structuredClone(actual)
    normalized_lookalike.metadata = {id: "model-0"}

    expect(await compute_embed_fingerprint(actual)).to.not.be.equal(
      await compute_embed_fingerprint(normalized_lookalike),
    )
  })

  it("rejects missing fingerprints, removed buffers, and malformed resource literals", () => {
    const missing = fixture("standalone-keyed-roots") as unknown as {[key: string]: unknown}
    delete missing.fingerprint
    expect(() => validate_embed_payload(missing)).to.throw(EmbedError, /fingerprint/)

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

    const server = fixture("server-existing-session") as unknown as {source: {[key: string]: unknown}}
    for (const [field, value] of [["session_id", 1], ["token", {}], ["relative_urls", "yes"]] as const) {
      server.source[field] = value
      expect(() => validate_embed_payload(server)).to.throw(EmbedError, new RegExp(field))
      delete server.source[field]
    }

    const duplicate_components = fixture("standalone-keyed-roots")
    duplicate_components.requires.components = ["bokeh/core", "bokeh/core"]
    expect(() => validate_embed_payload(duplicate_components)).to.throw(EmbedError, /components must be unique/)

    const duplicate_extensions = fixture("standalone-keyed-roots")
    duplicate_extensions.requires.extensions = [
      {name: "duplicate", assets: []},
      {name: "duplicate", assets: []},
    ]
    expect(() => validate_embed_payload(duplicate_extensions)).to.throw(EmbedError, /duplicate.*extension/)

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
    const core_asset = {kind: "script" as const, content: "globalThis.embed_core += 1"}
    const widget_asset = {kind: "script" as const, content: "globalThis.embed_widgets += 1"}

    await Promise.all([
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
    ])
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    await loader.ensure(widgets, {mode: "resolved", assets: [core_asset, widget_asset]})

    expect(state.embed_core).to.be.equal(1)
    expect(state.embed_widgets).to.be.equal(1)
    expect(document.querySelectorAll("[data-bokeh-resource]").length).to.be.equal(2)
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

  it("awaits inline module evaluation", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {embed_inline_module?: number}
    state.embed_inline_module = 0

    await loader.ensure(core, {mode: "resolved", assets: [{
      kind: "script", module: true, content: "globalThis.embed_inline_module = 1",
    }]})

    expect(state.embed_inline_module).to.be.equal(1)
  })

  it("treats resources none as host-owned without erasing requirements", async () => {
    const loader = new ResourceLoader()
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    await loader.ensure(widgets, "none")
    expect(loader.size).to.be.equal(0)
    expect(document.querySelectorAll("[data-bokeh-resource]").length).to.be.equal(0)
    expect(widgets.components).to.be.equal(["bokeh/core", "bokeh/widgets"])
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

  it("loads the standard external bootstrap under a strict CSP", async () => {
    const embed_payload = await mountable_fixture("standalone-keyed-roots")
    const instance = `Test-${++declaration_index}`
    const payload_url = URL.createObjectURL(new Blob([JSON.stringify(embed_payload)], {
      type: "application/vnd.bokeh.embed+json",
    }))
    const iframe = document.createElement("iframe")
    const targets = embed_payload.roots.map((root) =>
      `<div data-bokeh-embed="${embed_payload.fingerprint}" data-bokeh-embed-instance="${instance}" data-bokeh-root="${root.key}"></div>`,
    ).join("\n")
    iframe.srcdoc = `<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'self'; connect-src blob:; style-src 'unsafe-inline'">
    <script src="/static/js/bokeh.min.js"></script>
    <script src="/static/js/bokeh-api.min.js"></script>
  </head>
  <body>
    ${targets}
    <script src="/static/js/bokeh-embed-bootstrap.min.js"
            data-bokeh-embed-bootstrap
            data-bokeh-embed="${embed_payload.fingerprint}"
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
