import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {default_resolver} from "@bokehjs/base"
import {mount, mount_artifact_declaration, MountError} from "@bokehjs/api/io"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {documents} from "@bokehjs/document"
import * as embed from "@bokehjs/embed"
import type {EmbedArtifact} from "@bokehjs/embed/artifact"
import {compute_embed_artifact_fingerprint, validate_embed_artifact} from "@bokehjs/embed/artifact"
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

  it("mounts a declarative inline payload through the shared bootstrap", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const resolver = new ModelResolver(default_resolver, [CustomJS])
    const targets = artifact.roots.map((root) => {
      const target = document.createElement("div")
      target.dataset.bokehArtifact = artifact.fingerprint
      target.dataset.bokehRoot = root.key
      return target
    })
    const payload = document.createElement("script")
    payload.type = "application/vnd.bokeh.embed+json"
    payload.dataset.bokehArtifactPayload = ""
    payload.textContent = JSON.stringify(artifact)
    const bootstrap = document.createElement("script")
    document.body.append(...targets, payload, bootstrap)

    const mounted = await mount_artifact_declaration(bootstrap, {resolver})
    expect(mounted.root_keys).to.be.equal(["primary", "secondary"])
    expect(targets.every((target) => target.dataset.bokehMounted == artifact.fingerprint)).to.be.true

    await mounted.dispose()
    targets.forEach((target) => target.remove())
    payload.remove()
    bootstrap.remove()
  })

  it("rejects incomplete declarative target sets before decoding", async () => {
    const artifact = await mountable_fixture("standalone-keyed-roots")
    const target = document.createElement("div")
    target.dataset.bokehArtifact = artifact.fingerprint
    target.dataset.bokehRoot = "primary"
    const payload = document.createElement("script")
    payload.type = "application/vnd.bokeh.embed+json"
    payload.dataset.bokehArtifactPayload = ""
    payload.textContent = JSON.stringify(artifact)
    const bootstrap = document.createElement("script")
    document.body.append(target, payload, bootstrap)
    try {
      const error = await mount_artifact_declaration(bootstrap).then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("target")
      expect(error.root_key).to.be.equal("secondary")
      expect(target.dataset.bokehMounted).to.be.undefined
    } finally {
      target.remove()
      payload.remove()
      bootstrap.remove()
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
    expect(standalone.buffers).to.be.equal([{id: "buffer-0", encoding: "base64", data: "AA=="}])
    const server = validate_embed_artifact(fixture("server-existing-session"))
    expect(server.source.kind).to.be.equal("server")
    expect(server.roots).to.be.equal([{key: "detail", model_id: "fixture-root"}])
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

  it("provides explicit migration diagnostics for removed browser envelopes", async () => {
    const item_error = await embed.embed_item({}).then(() => null, (error: unknown) => error)
    expect_instanceof(item_error, embed.EmbedMigrationError)
    expect(item_error.message.includes("JsonItem")).to.be.true

    const items_error = await embed.embed_items({}, []).then(() => null, (error: unknown) => error)
    expect_instanceof(items_error, embed.EmbedMigrationError)
    expect(items_error.message.includes("RenderItem")).to.be.true
  })
})
