import {expect, expect_instanceof, expect_not_null} from "#framework/assertions"

import {default_resolver} from "@bokehjs/base"
import {Document, type DocJson} from "@bokehjs/document"
import * as events from "@bokehjs/document/events"
import {ModelResolver} from "@bokehjs/core/resolvers"
import {to_object} from "@bokehjs/core/util/object"
import {Circle, ColumnDataSource, CumSum, CustomJS, GlyphRenderer, Grid, Line, LinearAxis, SetValue} from "@bokehjs/models"
import {MountSource} from "@bokehjs/api/io"
import {version as js_version} from "@bokehjs/version"

import fixture_json from "./minimal_ids_fixture.json" with {type: "json"}

type RootFixture = {
  key: string
  index: number
}

type MinimalIDFixture = {
  name: string
  roots: RootFixture[]
  document: DocJson
}

type MinimalIDFixtureData = {
  schema: string
  cases: MinimalIDFixture[]
}

const fixture_data = fixture_json as MinimalIDFixtureData

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
    expect("$id" in first.roots[0]).to.be.false
    expect("$id" in first.roots[1]).to.be.false

    const primary = source.roots.get("primary")
    expect_not_null(primary)
    const retained = document.to_static_json(false, [primary])
    expect("$id" in retained.roots[0]).to.be.true
    expect("$id" in retained.roots[1]).to.be.false
  })

  it("traverses direct properties and mappings without expanding the graph", () => {
    const shared = CustomJS.create({code: "shared"})
    const mapping = CustomJS.create({code: "mapping", args: {shared}})
    const direct = SetValue.create({obj: shared, attr: "code", value: "updated"})
    const document = new Document({roots: [mapping, direct]})

    const encoded = JSON.stringify(document.to_static_json(false))
    expect(encoded.includes(shared.id)).to.be.true
    expect(encoded.includes(mapping.id)).to.be.false
    expect(encoded.includes(direct.id)).to.be.false

    const external = CustomJS.create({code: "outside-document"})
    const with_external_id = JSON.stringify(document.to_static_json(false, [external]))
    expect(with_external_id.includes(external.id)).to.be.false
    expect(with_external_id.includes("outside-document")).to.be.false
  })

  it("compacts literal specs and column data", () => {
    const source = ColumnDataSource.create({data: {x_values: [1, 2], y_values: [3, 4]}})
    const glyph = Line.create({x: {field: "x_values"}, y: {field: "y_values"}, line_color: "#6d4aff", line_width: 3})
    const renderer = GlyphRenderer.create({data_source: source, glyph})
    const document = new Document({roots: [renderer]})

    const [encoded] = document.to_static_json(false).roots as any[]
    expect(encoded.$type).to.be.equal("GlyphRenderer")
    expect(encoded.data_source.data).to.be.equal({x_values: [1, 2], y_values: [3, 4]})
    expect(encoded.glyph.line_color).to.be.equal("#6d4aff")
    expect(encoded.glyph.x).to.be.equal({$field: "x_values"})

    const [decoded_renderer] = Document.from_json(document.to_static_json(false)).roots()
    expect_instanceof(decoded_renderer, GlyphRenderer)
    expect(decoded_renderer.data_source.data).to.be.equal({x_values: [1, 2], y_values: [3, 4]})
    expect(decoded_renderer.glyph.line_color).to.be.equal({value: "#6d4aff"})
  })

  it("compacts expression specs and retains shared expressions", () => {
    const source = ColumnDataSource.create({data: {x_values: [1, 2], y_values: [3, 4]}})
    const expression = CumSum.create({field: "x_values"})
    const first = GlyphRenderer.create({data_source: source, glyph: Line.create({x: {expr: expression}, y: {field: "y_values"}})})
    const second = GlyphRenderer.create({data_source: source, glyph: Line.create({x: {expr: expression}, y: {field: "y_values"}})})
    const document = new Document({roots: [first, second]})

    const [first_rep, second_rep] = document.to_static_json(false).roots as any[]
    expect(first_rep.glyph.x.$expr).to.be.equal({$type: "CumSum", $id: expression.id, field: "x_values"})
    expect(second_rep.glyph.x).to.be.equal({$expr: {$ref: expression.id}})

    const [first_renderer, second_renderer] = Document.from_json(document.to_static_json(false)).roots()
    expect_instanceof(first_renderer, GlyphRenderer)
    expect_instanceof(second_renderer, GlyphRenderer)
    const first_glyph = (first_renderer as GlyphRenderer).glyph as Line
    const second_glyph = (second_renderer as GlyphRenderer).glyph as Line
    const first_spec = first_glyph.properties.x.get_value() as {expr: unknown}
    const second_spec = second_glyph.properties.x.get_value() as {expr: unknown}
    expect(first_spec.expr).to.be.equal(second_spec.expr)
  })

  it("compacts value and field specs with metadata", () => {
    const valued = Circle.create({radius: {value: 1, units: "data"}})
    const fielded = Circle.create({radius: {field: "radius", units: "data"}})
    const document = new Document({roots: [valued, fielded]})

    const [valued_rep, fielded_rep] = document.to_static_json(false).roots as any[]
    expect(valued_rep.radius).to.be.equal({$value: 1, units: "data"})
    expect(fielded_rep.radius).to.be.equal({$field: "radius", units: "data"})

    const [decoded_valued, decoded_fielded] = Document.from_json(document.to_static_json(false)).roots()
    expect_instanceof(decoded_valued, Circle)
    expect_instanceof(decoded_fielded, Circle)
    const value = decoded_valued.properties.radius.get_value()
    const field = decoded_fielded.properties.radius.get_value()
    expect(value).to.be.equal({value: 1, units: "data"})
    expect(field).to.be.equal({field: "radius", units: "data"})
  })

  it("serializes default retained references", () => {
    const axis = LinearAxis.create()
    const grid = Grid.create({dimension: 0, ticker: axis.ticker})
    const document = new Document({roots: [axis, grid]})

    const [encoded_axis, encoded_grid] = document.to_static_json(false).roots as any[]
    expect(encoded_axis.ticker).to.be.equal({$type: "BasicTicker", $id: axis.ticker.id})
    expect(encoded_grid.ticker).to.be.equal({$ref: axis.ticker.id})

    const [decoded_axis, decoded_grid] = Document.from_json(document.to_static_json(false)).roots()
    expect_instanceof(decoded_axis, LinearAxis)
    expect_instanceof(decoded_grid, Grid)
    expect(decoded_grid.ticker).to.be.equal(decoded_axis.ticker)
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
