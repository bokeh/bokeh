import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {default_resolver} from "@bokehjs/base"
import {Document} from "@bokehjs/document"
import * as events from "@bokehjs/document/events"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {to_object} from "@bokehjs/core/util/object"
import {CustomJS} from "@bokehjs/models"
import {MountSource} from "@bokehjs/api/io"
import {version as js_version} from "@bokehjs/version"

import {fixture_data} from "./minimal_ids_fixture"

function fixture() {
  expect(fixture_data.schema).to.be.equal("bokeh.embed.minimal-id-fixtures/v1")
  const [fixture] = fixture_data.cases
  return fixture
}

function decode_fixture(): {document: Document, source: MountSource} {
  const {document: fixture_document, roots} = fixture()
  const json = structuredClone(fixture_document)
  json.version = js_version

  const resolver = new ModelResolver(default_resolver, [CustomJS])
  const document = Document.from_json(json, {resolver})
  const keyed_roots = new Map(roots.map(({key, index}) => [key, document.roots()[index]]))
  const source = new MountSource(document, keyed_roots)
  return {document, source}
}

describe("minimal ID cross-language fixtures", () => {
  it("deserializes keyed anonymous, shared, and cyclic models", () => {
    const {source} = decode_fixture()
    const primary = source.roots.get("primary")
    const secondary = source.roots.get("secondary")
    expect_not_null(primary)
    expect_not_null(secondary)
    expect_instanceof(primary, CustomJS)
    expect_instanceof(secondary, CustomJS)

    const primary_args = to_object(primary.args)
    const secondary_args = to_object(secondary.args)
    const anonymous = primary_args.anonymous
    const shared = primary_args.shared
    const cycle_a = primary_args.cycle
    expect_instanceof(anonymous, CustomJS)
    expect_instanceof(shared, CustomJS)
    expect_instanceof(cycle_a, CustomJS)

    expect(anonymous.code).to.be.equal("anonymous")
    expect(secondary_args.shared).to.be.equal(shared)
    expect(shared.id).to.be.equal("shared-callback")

    const cycle_b = to_object(cycle_a.args).other
    expect_instanceof(cycle_b, CustomJS)
    expect(to_object(cycle_b.args).other).to.be.equal(cycle_a)
    expect(cycle_a.id).to.be.equal("cycle-a")
    expect(cycle_b.id).to.be.equal("cycle-b")
    expect(source.document.get_model_by_name("semantic-primary")).to.be.equal(primary)
  })

  it("treats anonymous IDs as runtime reconstruction details", () => {
    const first = decode_fixture()
    const second = decode_fixture()
    const first_primary = first.source.roots.get("primary")
    const second_primary = second.source.roots.get("primary")
    expect_not_null(first_primary)
    expect_not_null(second_primary)

    expect(first_primary.id).to.not.be.equal(second_primary.id)
    expect(first.document.get_model_by_name("semantic-primary")).to.be.equal(first_primary)
  })

  it("serializes deterministically without forcing keyed root IDs", () => {
    const {document, source} = decode_fixture()
    const first = document.to_static_json(false)
    const second = document.to_static_json(false)

    expect(first).to.be.equal(second)
    expect("id" in first.roots[0]).to.be.false
    expect("id" in first.roots[1]).to.be.false

    const primary = source.roots.get("primary")
    expect_not_null(primary)
    const retained = document.to_static_json(false, [primary])
    expect("id" in retained.roots[0]).to.be.true
    expect("id" in retained.roots[1]).to.be.false
  })

  it("keeps canonical documents and live patches ID-full", () => {
    const {document, source} = decode_fixture()
    const primary = source.roots.get("primary")
    expect_not_null(primary)
    expect(document.get_model_by_id(primary.id)).to.be.equal(primary)

    const canonical = document.to_json(false)
    expect((canonical.roots[0] as {id?: string}).id).to.be.equal(primary.id)

    const event = new events.ModelChangedEvent(document, primary, "code", "updated")
    const patch = document.create_json_patch([event])
    expect((patch.events[0] as {model: {id: string}}).model.id).to.be.equal(primary.id)
  })
})
