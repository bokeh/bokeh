import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {default_resolver} from "@bokehjs/base"
import {
  BOKEH_MOUNTED_ATTRIBUTE, mount, mount_artifact_declaration, MountError, type MountErrorPhase, when_mounted,
} from "@bokehjs/api/io"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {documents} from "@bokehjs/document"
import type {EmbedArtifact} from "@bokehjs/embed/artifact"
import {ArtifactError, compute_embed_artifact_fingerprint, validate_embed_artifact} from "@bokehjs/embed/artifact"
import type {ResourceRequirements} from "@bokehjs/embed/resources"
import {ResourceError, ResourceLoader} from "@bokehjs/embed/resources"
import {CustomJS} from "@bokehjs/models"
import {version as js_version} from "@bokehjs/version"

import fixture_data from "./artifact_fixtures.json" with {type: "json"}

const core: ResourceRequirements = {components: ["bokeh/core"], extensions: []}

function fixture(name: string): EmbedArtifact {
  expect(fixture_data.schema).to.be.equal("bokeh.embed.fixtures/v1")
  const value = structuredClone(fixture_data.cases.find((item) => item.name == name)!.artifact) as unknown as EmbedArtifact
  value.bokeh_version = js_version
  value.fingerprint = `fixture-${name}`
  if (value.source.kind == "standalone") {
    value.source.documents.forEach((document) => document.version = js_version)
  }
  return value
}

async function mountable_fixture(name: string): Promise<EmbedArtifact> {
  const value = fixture(name)
  value.fingerprint = await compute_embed_artifact_fingerprint(value)
  return value
}

function remove_test_resources(): void {
  document.querySelectorAll("[data-bokeh-resource]").forEach((element) => element.remove())
}

function inline_declaration(artifact: EmbedArtifact, value: unknown = artifact): {
  targets: HTMLElement[]
  payload: HTMLScriptElement
  bootstrap: HTMLScriptElement
  remove(): void
} {
  const targets = artifact.roots.map((root) => {
    const target = document.createElement("div")
    target.dataset.bokehArtifact = artifact.fingerprint
    target.dataset.bokehRoot = root.key
    return target
  })
  const payload = document.createElement("script")
  payload.type = "application/vnd.bokeh.embed+json"
  payload.dataset.bokehArtifactPayload = ""
  payload.dataset.bokehArtifact = artifact.fingerprint
  payload.textContent = JSON.stringify(value)
  const bootstrap = document.createElement("script")
  bootstrap.dataset.bokehArtifactBootstrap = ""
  bootstrap.dataset.bokehArtifact = artifact.fingerprint
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

describe("EmbedArtifact runtime", () => {
  after_each(() => remove_test_resources())

  it("consumes the shared keyed-root fixture through BokehMount", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    document.body.append(target)
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const documents_before = documents.length

    const mounted = mount(artifact, target, {resources: "none", resolver})
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

  it("creates independent documents for repeated mounts of one artifact", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const first_target = document.createElement("div")
    const second_target = document.createElement("div")
    document.body.append(first_target, second_target)

    const first = mount(artifact, first_target, {resources: "none", resolver})
    const second = mount(artifact, second_target, {resources: "none", resolver})
    await Promise.all([first.ready, second.ready])
    expect(first.document).to.not.be.equal(second.document)
    expect(first.root("primary")).to.not.be.equal(second.root("primary"))

    await Promise.all([first.dispose(), second.dispose()])
    first_target.remove()
    second_target.remove()
  })

  it("publishes one declarative handle for early and late multi-root discovery", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(artifact)
    try {
      const early = declaration.targets.map((target) => when_mounted(target))
      const bootstrapping = mount_artifact_declaration(declaration.bootstrap, {resolver})
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
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const first = inline_declaration(artifact)
    const second = inline_declaration(artifact)
    const discoveries = [...first.targets, ...second.targets].map((target) => when_mounted(target))
    try {
      const [first_mount, second_mount] = await Promise.all([
        mount_artifact_declaration(first.bootstrap, {resolver}),
        mount_artifact_declaration(second.bootstrap, {resolver}),
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
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const declaration = inline_declaration(artifact)
    const [target] = declaration.targets
    declaration.targets[1].remove()
    const discovery = when_mounted(target)
    try {
      const error = await mount_artifact_declaration(declaration.bootstrap).then(() => null, (error: unknown) => error)
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
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const targets = artifact.roots.map((root) => {
      const target = document.createElement("div")
      target.dataset.bokehArtifact = artifact.fingerprint
      target.dataset.bokehRoot = root.key
      return target
    })
    const bootstrap = document.createElement("script")
    bootstrap.dataset.bokehArtifactBootstrap = ""
    bootstrap.dataset.bokehArtifact = artifact.fingerprint
    bootstrap.dataset.bokehPayloadUrl = "/artifacts/missing.json"
    document.body.append(...targets, bootstrap)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => new Response("missing", {status: 503, statusText: "Unavailable"})
    try {
      const discoveries = targets.map((target) => when_mounted(target).then(
        () => null, (error: unknown) => error,
      ))
      const error = await mount_artifact_declaration(bootstrap).then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("http")
      expect(error.phase).to.be.equal("payload")
      expect(error.source).to.be.equal({
        kind: "artifact-declaration", artifact: artifact.fingerprint, url: "/artifacts/missing.json",
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
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const declaration = inline_declaration(artifact)
    const controller = new AbortController()
    const discovery = when_mounted(declaration.targets[0], {signal: controller.signal})
    controller.abort(new Error("caller stopped waiting"))
    try {
      const waiting_error = await discovery.then(() => null, (error: unknown) => error)
      expect_instanceof(waiting_error, MountError)
      expect(waiting_error.kind).to.be.equal("abort")

      const mounted = await mount_artifact_declaration(declaration.bootstrap, {resolver})
      expect(await when_mounted(declaration.targets[0])).to.be.equal(mounted)
      expect(declaration.targets[0].bokehMountError).to.be.undefined
      await mounted.dispose()
    } finally {
      declaration.remove()
    }
  })

  it("publishes a bootstrap abort before a mount handle exists", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const declaration = inline_declaration(artifact)
    const controller = new AbortController()
    const discoveries = declaration.targets.map((target) => when_mounted(target).then(
      () => null, (error: unknown) => error,
    ))
    controller.abort(new Error("bootstrap cancelled"))
    try {
      const error = await mount_artifact_declaration(declaration.bootstrap, {signal: controller.signal}).then(
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
    const cases: [MountErrorPhase, EmbedArtifact, unknown][] = []

    cases.push(["schema", base, {...base, schema: "bokeh.embed/v2"}])

    const fingerprint = structuredClone(base)
    fingerprint.metadata.changed = true
    cases.push(["fingerprint", fingerprint, fingerprint])

    const resource = structuredClone(base)
    resource.bokeh_version = "99.0.0"
    resource.fingerprint = await compute_embed_artifact_fingerprint(resource)
    cases.push(["resource", resource, resource])

    const deserialize = structuredClone(base)
    if (deserialize.source.kind != "standalone") {
      throw new Error("expected a standalone fixture")
    }
    deserialize.source.documents[0].roots[0].name = "MissingArtifactModel"
    deserialize.fingerprint = await compute_embed_artifact_fingerprint(deserialize)
    cases.push(["deserialize", deserialize, deserialize])

    for (const [phase, declaration_artifact, value] of cases) {
      const declaration = inline_declaration(declaration_artifact, value)
      const discoveries = declaration.targets.map((target) => when_mounted(target).then(
        () => null, (error: unknown) => error,
      ))
      try {
        const error = await mount_artifact_declaration(declaration.bootstrap).then(
          () => null, (error: unknown) => error,
        )
        expect_instanceof(error, MountError)
        expect(error.phase).to.be.equal(phase)
        expect(error.source?.kind).to.be.equal("artifact-declaration")
        expect((await Promise.all(discoveries)).every((published) => published == error)).to.be.true
      } finally {
        declaration.remove()
      }
    }
  })

  it("rolls back a decoded artifact after target failure", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const documents_before = documents.length
    const mounted = mount(artifact, document.createElement("div"), {resources: "none", resolver})

    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("target")
    expect(mounted.disposed).to.be.true
    expect(documents.length).to.be.equal(documents_before)
  })

  it("can be disposed before artifact decoding completes", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const target = document.createElement("div")
    document.body.append(target)
    const documents_before = documents.length
    const mounted = mount(artifact, target, {resources: "none", resolver})

    await mounted.dispose()
    const error = await mounted.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(error, MountError)
    expect(error.kind).to.be.equal("disposed")
    expect(documents.length).to.be.equal(documents_before)
    target.remove()
  })

  it("reports schema and runtime version errors through handle.ready", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    document.body.append(target)

    const unsupported = mount({...artifact, schema: "bokeh.embed/v2"} as unknown as EmbedArtifact, target, {resources: "none"})
    const schema_error = await unsupported.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(schema_error, MountError)
    expect(schema_error.kind).to.be.equal("schema")

    const mismatched_artifact = {...artifact, bokeh_version: "99.0.0"}
    mismatched_artifact.fingerprint = await compute_embed_artifact_fingerprint(mismatched_artifact)
    const mismatched = mount(mismatched_artifact, target, {resources: "none"})
    const resource_error = await mismatched.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(resource_error, MountError)
    expect(resource_error.kind).to.be.equal("resource")
    expect(resource_error.message.includes("incompatible")).to.be.true

    const tampered = structuredClone(artifact)
    tampered.metadata.tampered = true
    const invalid_fingerprint = mount(tampered, target, {resources: "none"})
    const fingerprint_error = await invalid_fingerprint.ready.then(() => null, (error: unknown) => error)
    expect_instanceof(fingerprint_error, MountError)
    expect(fingerprint_error.kind).to.be.equal("schema")
    expect(fingerprint_error.message.includes("fingerprint mismatch")).to.be.true
    target.remove()
  })

  it("surfaces server bootstrap HTTP failures without a second lifecycle", async () => {
    const artifact = await mountable_fixture("server-existing-session")
    if (artifact.source.kind != "server") {
      throw new Error("expected a server fixture")
    }
    artifact.source = {...artifact.source, relative_urls: true}
    artifact.fingerprint = await compute_embed_artifact_fingerprint(artifact)
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    let requested = ""
    globalThis.fetch = async (input) => {
      requested = `${input}`
      return new Response("denied", {status: 401, statusText: "Unauthorized"})
    }
    try {
      const mounted = mount(artifact, target, {resources: "none"})
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("http")
      expect(error.message.includes("401 Unauthorized")).to.be.true
      expect(new URL(requested).origin).to.be.equal(window.location.origin)
      expect(new URL(requested).pathname).to.be.equal("/app/embed.json")
      expect(mounted.session).to.be.null
      expect(mounted.disposed).to.be.true
    } finally {
      globalThis.fetch = original_fetch
      target.remove()
    }
  })

  it("validates the versioned server bootstrap before opening a websocket", async () => {
    const artifact = await mountable_fixture("server-existing-session")
    const target = document.createElement("div")
    document.body.append(target)
    const original_fetch = globalThis.fetch
    globalThis.fetch = async () => Response.json({
      schema: "bokeh.embed-server/v2",
      bokeh_version: js_version,
      token: "unused",
    })
    try {
      const mounted = mount(artifact, target, {resources: "none"})
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
      const raw = structuredClone(item.artifact) as unknown as EmbedArtifact
      expect(await compute_embed_artifact_fingerprint(raw)).to.be.equal(raw.fingerprint)
    }
    const standalone = validate_embed_artifact(fixture("standalone-keyed-roots"))
    expect(standalone.source.kind).to.be.equal("standalone")
    const server = validate_embed_artifact(fixture("server-existing-session"))
    expect(server.source.kind).to.be.equal("server")
    expect(server.roots).to.be.equal([{key: "detail", model_id: "fixture-root"}])
  })

  it("rejects non-finite and unsafe fingerprint numbers", async () => {
    for (const value of [NaN, Infinity, 2**53, 1e20, 1e21]) {
      const artifact = fixture("standalone-keyed-roots")
      artifact.metadata = {value}
      const error = await compute_embed_artifact_fingerprint(artifact).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, ArtifactError)
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

    expect(await compute_embed_artifact_fingerprint(actual)).to.not.be.equal(
      await compute_embed_artifact_fingerprint(normalized_lookalike),
    )
  })

  it("rejects missing fingerprints, removed buffers, and malformed resource literals", () => {
    const missing = fixture("standalone-keyed-roots") as unknown as {[key: string]: unknown}
    delete missing.fingerprint
    expect(() => validate_embed_artifact(missing)).to.throw(ArtifactError, /fingerprint/)

    const buffered = fixture("standalone-keyed-roots") as unknown as {[key: string]: unknown}
    buffered.buffers = []
    expect(() => validate_embed_artifact(buffered)).to.throw(ArtifactError, /not part of bokeh\.embed\/v1/)

    const malformed = fixture("standalone-keyed-roots") as unknown as {
      requires: {extensions: unknown[]}
    }
    malformed.requires.extensions = [{
      name: "bad",
      assets: [{kind: "bogus", content: "void 0"}],
    }]
    expect(() => validate_embed_artifact(malformed)).to.throw(ArtifactError, /kind must be 'script' or 'style'/)

    const module_style = fixture("standalone-keyed-roots")
    module_style.requires.extensions = [{
      name: "bad-style",
      assets: [{kind: "style", content: "body {}", module: true}],
    }]
    expect(() => validate_embed_artifact(module_style)).to.throw(ArtifactError, /style resources cannot be modules/)

    const artifact_nonce = fixture("standalone-keyed-roots") as unknown as {
      requires: {extensions: unknown[]}
    }
    artifact_nonce.requires.extensions = [{
      name: "bad-nonce",
      assets: [{kind: "script", content: "void 0", nonce: "artifact"}],
    }]
    expect(() => validate_embed_artifact(artifact_nonce)).to.throw(ArtifactError, /nonce is host-owned/)

    const server = fixture("server-existing-session") as unknown as {source: {[key: string]: unknown}}
    for (const [field, value] of [["session_id", 1], ["token", {}], ["relative_urls", "yes"]] as const) {
      server.source[field] = value
      expect(() => validate_embed_artifact(server)).to.throw(ArtifactError, new RegExp(field))
      delete server.source[field]
    }

    const duplicate_components = fixture("standalone-keyed-roots")
    duplicate_components.requires.components = ["bokeh/core", "bokeh/core"]
    expect(() => validate_embed_artifact(duplicate_components)).to.throw(ArtifactError, /components must be unique/)

    const duplicate_extensions = fixture("standalone-keyed-roots")
    duplicate_extensions.requires.extensions = [
      {name: "duplicate", assets: []},
      {name: "duplicate", assets: []},
    ]
    expect(() => validate_embed_artifact(duplicate_extensions)).to.throw(ArtifactError, /duplicate.*extension/)

    const multiple_documents = fixture("standalone-keyed-roots")
    if (multiple_documents.source.kind != "standalone") {
      throw new Error("expected standalone fixture")
    }
    multiple_documents.source.documents.push(structuredClone(multiple_documents.source.documents[0]))
    expect(() => validate_embed_artifact(multiple_documents)).to.throw(ArtifactError, /exactly one document/)

    const mixed_root = fixture("standalone-keyed-roots")
    Object.assign(mixed_root.roots[0], {model_id: "not-structural"})
    expect(() => validate_embed_artifact(mixed_root)).to.throw(ArtifactError, /cannot declare model_id/)
  })

  it("deduplicates concurrent and sequential additive resource loads", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {artifact_core?: number, artifact_widgets?: number}
    state.artifact_core = 0
    state.artifact_widgets = 0
    const core_asset = {kind: "script" as const, content: "globalThis.artifact_core += 1"}
    const widget_asset = {kind: "script" as const, content: "globalThis.artifact_widgets += 1"}

    await Promise.all([
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
      loader.ensure(core, {mode: "resolved", assets: [core_asset]}),
    ])
    const widgets: ResourceRequirements = {components: ["bokeh/core", "bokeh/widgets"], extensions: []}
    await loader.ensure(widgets, {mode: "resolved", assets: [core_asset, widget_asset]})

    expect(state.artifact_core).to.be.equal(1)
    expect(state.artifact_widgets).to.be.equal(1)
    expect(document.querySelectorAll("[data-bokeh-resource]").length).to.be.equal(2)
  })

  it("doesn't conflate inline resources that collided under the old 32-bit hash", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {artifact_collision?: number[]}
    state.artifact_collision = []
    const first = "globalThis.artifact_collision.push(416739)"
    const second = "globalThis.artifact_collision.push(1029994)"

    await loader.ensure(core, {mode: "resolved", assets: [
      {kind: "script", content: first},
      {kind: "script", content: second},
    ]})

    expect(state.artifact_collision).to.be.equal([416739, 1029994])
  })

  it("waits for existing loading resources and validates their declarations", async () => {
    const loader = new ResourceLoader()
    const state = globalThis as typeof globalThis & {artifact_existing?: number}
    state.artifact_existing = 0
    const content = "globalThis.artifact_existing += 1"
    const url = `data:text/javascript,${encodeURIComponent(content)}`
    const script = document.createElement("script")
    script.src = url
    script.dataset.bokehResource = "fixture"
    script.dataset.bokehResourceState = "loading"
    document.head.append(script)

    await loader.ensure(core, {mode: "resolved", assets: [{kind: "script", url}]})
    expect(state.artifact_existing).to.be.equal(1)
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
    const state = globalThis as typeof globalThis & {artifact_inline_module?: number}
    state.artifact_inline_module = 0

    await loader.ensure(core, {mode: "resolved", assets: [{
      kind: "script", module: true, content: "globalThis.artifact_inline_module = 1",
    }]})

    expect(state.artifact_inline_module).to.be.equal(1)
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

  it("requires hosts to resolve artifact extension resources", async () => {
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

  it("rejects javascript resource URLs", async () => {
    const loader = new ResourceLoader()
    const error = await loader.ensure(core, {
      mode: "resolved",
      assets: [{kind: "script", url: "javascript:alert(1)"}],
    }).then(() => null, (error: unknown) => error)

    expect_instanceof(error, ResourceError)
    expect(error.kind).to.be.equal("policy")
    expect(error.message.includes("javascript: URLs")).to.be.true
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

})
