import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"
import * as sinon from "sinon"

import {default_resolver} from "@bokehjs/base"
import {mount, mount_embed_declaration, MountError, type MountTargets, when_mounted} from "@bokehjs/api/io"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {Document} from "@bokehjs/document"
import type {EmbedPayload} from "@bokehjs/embed/payload"
import {resource_loader} from "@bokehjs/embed/resources"
import {Div, DivView} from "@bokehjs/models/widgets/div"
import {version} from "@bokehjs/version"

let declaration_index = 0

function declaration(root: Div): {
  document: Document
  target: HTMLElement
  bootstrap: HTMLScriptElement
  remove(): void
} {
  const source = new Document({roots: [root]})
  const payload: EmbedPayload = {
    schema: "bokeh.embed/v1", bokeh_version: version,
    source: {kind: "standalone", documents: [source.to_json()]},
    roots: [{key: "root", document: 0, root: 0}],
    requires: {components: ["bokeh/core"], extensions: []}, metadata: {},
  }
  const instance = `MountError-Test-${++declaration_index}`
  const target = document.createElement("div")
  target.dataset.bokehEmbedInstance = instance
  target.dataset.bokehRoot = "root"
  const json = document.createElement("script")
  json.type = "application/vnd.bokeh.embed+json"
  json.dataset.bokehEmbedPayload = ""
  json.dataset.bokehEmbedInstance = instance
  json.textContent = JSON.stringify(payload)
  const bootstrap = document.createElement("script")
  bootstrap.dataset.bokehEmbedBootstrap = ""
  bootstrap.dataset.bokehEmbedInstance = instance
  document.body.append(target, json, bootstrap)
  return {
    document: source, target, bootstrap,
    remove() {
      source.destroy()
      target.remove()
      json.remove()
      bootstrap.remove()
    },
  }
}

describe("mount target and failure contracts", () => {
  it("normalizes shared and keyed jQuery targets and subsequent moves", async () => {
    class JQueryTarget {
      [index: number]: HTMLElement
      readonly length = 1
      constructor(target: HTMLElement) {
        this[0] = target
      }
    }
    const runtime = globalThis as typeof globalThis & {$?: typeof JQueryTarget}
    const previous = Object.getOwnPropertyDescriptor(runtime, "$")
    runtime.$ = JQueryTarget
    const first = document.createElement("div")
    const second = document.createElement("div")
    document.body.append(first, second)
    try {
      for (const keyed of [false, true]) {
        const wrapped = new JQueryTarget(first)
        const targets: MountTargets = keyed ? {root: wrapped} : wrapped
        const mounted = mount({root: Div.create({text: "jQuery target"})}, targets)
        try {
          await mounted.ready
          expect(mounted.target("root")).to.be.equal(first)
          expect(first.bokehMount).to.be.equal(mounted)
          await mounted.replace_target("root", new JQueryTarget(second))
          expect(mounted.target("root")).to.be.equal(second)
          expect(second.bokehMount).to.be.equal(mounted)
        } finally {
          await mounted.dispose()
        }
      }
    } finally {
      if (previous == null) {
        delete runtime.$
      } else {
        Object.defineProperty(runtime, "$", previous)
      }
      first.remove()
      second.remove()
    }
  })

  it("preserves render kinds, phases, and root keys for direct and declaration mounts", async () => {
    class FailingDivView extends DivView {
      override async lazy_initialize(): Promise<void> {
        await super.lazy_initialize()
        throw new Error("root view failed")
      }
    }
    class FailingDiv extends Div {
      static {
        this.prototype.default_view = FailingDivView
      }
    }
    const target = document.createElement("div")
    document.body.append(target)
    const mounted = mount({root: FailingDiv.create()}, target)
    try {
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("render")
      expect(error.phase).to.be.equal("render")
      expect(error.root_key).to.be.equal("root")
    } finally {
      await mounted.dispose()
      target.remove()
    }

    const declared = declaration(FailingDiv.create())
    try {
      const resolver = new ModelResolver(default_resolver, [FailingDiv])
      const error = await mount_embed_declaration(declared.bootstrap, {resolver}).then(
        () => null, (error: unknown) => error,
      )
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("render")
      expect(error.phase).to.be.equal("render")
      expect(error.root_key).to.be.equal("root")
      expect(error.source?.kind).to.be.equal("embed-declaration")
      expect(declared.target.bokehMountError).to.be.equal(error)
      expect(await when_mounted(declared.target).then(() => null, (error: unknown) => error)).to.be.equal(error)
    } finally {
      declared.remove()
    }
  })

  it("preserves target phases when a declaration destination is removed during preparation", async () => {
    const target = document.createElement("div")
    const mounted = mount(Div.create(), target)
    try {
      const error = await mounted.ready.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("target")
      expect(error.phase).to.be.equal("target")
    } finally {
      await mounted.dispose()
    }

    const declared = declaration(Div.create())
    let notify_preparing!: () => void
    let finish_preparation!: () => void
    const preparing = new Promise<void>((resolve) => notify_preparing = resolve)
    const complete = new Promise<void>((resolve) => finish_preparation = resolve)
    const ensure = sinon.stub(resource_loader, "ensure").callsFake(async () => {
      notify_preparing()
      await complete
    })
    try {
      const mounting = mount_embed_declaration(declared.bootstrap)
      await preparing
      declared.target.remove()
      finish_preparation()
      const error = await mounting.then(() => null, (error: unknown) => error)
      expect_instanceof(error, MountError)
      expect(error.kind).to.be.equal("target")
      expect(error.phase).to.be.equal("target")
      expect(error.root_key).to.be.equal("root")
      expect(error.source?.kind).to.be.equal("embed-declaration")
    } finally {
      finish_preparation()
      ensure.restore()
      declared.remove()
    }
  })

  for (const failure of ["missing-api", "timeout"]) {
    it(`discovers standard external bootstrap ${failure} failures on every declaration target`, async () => {
      const instance = `BootstrapError-Test-${++declaration_index}`
      const iframe = document.createElement("iframe")
      const setup = failure == "missing-api"
        ? 'globalThis.Bokeh = {version: "3.10.1"}'
        : "let now = 0; Date.now = () => now += 30_001"
      iframe.srcdoc = `<!DOCTYPE html>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'nonce-bootstrap-test'">
<script nonce="bootstrap-test">${setup}</script>
<div data-bokeh-embed-instance="${instance}" data-bokeh-root="first"></div>
<script src="/static/js/bokeh-embed-bootstrap.min.js" nonce="bootstrap-test"
        data-bokeh-embed-bootstrap data-bokeh-embed-instance="${instance}" data-bokeh-payload-url="/payload.json"></script>
<div data-bokeh-embed-instance="${instance}" data-bokeh-root="second"></div>
<div data-bokeh-embed-instance="${instance}" data-bokeh-document-target></div>
<div data-bokeh-embed-instance="Other" data-bokeh-root="unrelated"></div>`
      try {
        const loaded = new Promise<void>((resolve, reject) => {
          iframe.addEventListener("load", () => resolve(), {once: true})
          iframe.addEventListener("error", () => reject(new Error("failed to load bootstrap test frame")), {once: true})
        })
        document.body.append(iframe)
        await loaded
        const frame = iframe.contentDocument
        expect_not_null(frame)
        const targets = [...frame.querySelectorAll<HTMLElement>(
          `[data-bokeh-embed-instance="${instance}"]:is([data-bokeh-root], [data-bokeh-document-target])`,
        )]
        expect(targets.length).to.be.equal(3)
        const errors = await Promise.all(targets.map((target) => when_mounted(target).then(
          () => null, (error: unknown) => error,
        )))
        const error = targets[0].bokehMountError
        expect_not_null(error)
        expect(errors.every((discovered) => discovered == error)).to.be.true
        expect(error.name).to.be.equal("BokehMountError")
        expect(error.kind).to.be.equal("resource")
        expect(error.phase).to.be.equal("bootstrap")
        expect({...error.source}).to.be.equal({kind: "embed-declaration", embed: instance, url: "/payload.json"})
        expect(error.message.includes(failure == "missing-api" ? "3.10.1 does not support" : "bootstrap timeout")).to.be.true
        expect(frame.querySelector<HTMLElement>("[data-bokeh-embed-instance='Other']")?.bokehMountError).to.be.undefined
      } finally {
        iframe.remove()
      }
    })
  }
})
