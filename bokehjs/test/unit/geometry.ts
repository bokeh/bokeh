import {expect, expect_instanceof} from "#framework/assertions"
import {Document} from "@bokehjs/document"
import type {DocumentChangedEvent} from "@bokehjs/document/events"
import {geometry} from "@bokehjs/index"
import {GeometryDataSource} from "@bokehjs/models/sources/geometry_data_source"

describe("geometry helpers", () => {
  it("ingests all geometry types as feature rows", () => {
    const ring = [[0, 0], [4, 0], [4, 4], [0, 4]]
    const hole = [[1, 1], [2, 1], [1, 2]]
    const geometries = [
      geometry.point([1, 2]), geometry.multi_point([[1, 2], [3, 4]]),
      geometry.line_string([[0, 0], [1, 1]]), geometry.multi_line_string([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]),
      geometry.polygon([ring, hole]), geometry.multi_polygon([[ring, hole], [ring]]),
      geometry.geometry_collection([geometry.point([2, 3]), geometry.line_string([[2, 3], [4, 5]])]),
    ]

    const source = GeometryDataSource.create({geometries, data: {name: [..."abcdefg"]}})

    expect(source.geometries).to.be.equal(geometries)
    expect(source.data).to.be.equal({name: [..."abcdefg"]})
  })

  it("keeps helper coordinates independent of source vertex patches", () => {
    const coordinates = [[0, 0, 7], [1, 1, 8]]
    const line = geometry.line_string(coordinates)
    const source = GeometryDataSource.create({geometries: [line]})

    source.patch({geometry: [[[0, 1], [2, 3, 8]]]})

    expect(line.coordinates).to.be.identical(coordinates)
    expect(coordinates).to.be.equal([[0, 0, 7], [1, 1, 8]])
    expect(source.geometries).to.be.equal([{type: "LineString", coordinates: [[0, 0, 7], [2, 3, 8]]}])
  })

  it("streams a helper geometry directly", () => {
    const source = GeometryDataSource.create()

    source.stream(geometry.point([1, 2]))

    expect(source.geometries).to.be.equal([{type: "Point", coordinates: [1, 2]}])
    expect(source.data).to.be.equal({})
  })

  for (const input of [
    geometry.point([1, 2, 3]),
    geometry.multi_point([[1, 2], [3, 4]]),
    geometry.line_string([[0, 0], [1, 1]]),
    geometry.multi_line_string([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]),
    geometry.polygon([[[0, 0], [2, 0], [0, 2]]]),
    geometry.multi_polygon([[[[0, 0], [2, 0], [0, 2]]]]),
    geometry.geometry_collection([geometry.point([2, 3]), geometry.line_string([[2, 3], [4, 5]])]),
  ]) {
    it(`streams helper ${input.type} records through document patches`, () => {
      const source = GeometryDataSource.create({geometries: [null], data: {v: [0]}})
      const document = new Document({roots: [source]})
      const receiver = Document.from_json(document.to_json())
      const events: DocumentChangedEvent[] = []
      document.on_change(event => events.push(event))

      source.stream({geometries: [input], data: {v: [1]}}, 1)
      receiver.apply_json_patch(document.create_json_patch(events))

      const copy = receiver.get_model_by_id(source.id)!
      expect_instanceof(copy, GeometryDataSource)
      expect(source.geometries).to.be.equal([input])
      expect(copy.geometries).to.be.equal(source.geometries)
      expect(source.data).to.be.equal({v: [1]})
      expect(copy.data).to.be.equal(source.data)
    })

    it(`patches helper ${input.type} geometries through document patches`, () => {
      const source = GeometryDataSource.create({geometries: [null], data: {v: [0]}})
      const document = new Document({roots: [source]})
      const receiver = Document.from_json(document.to_json())
      const events: DocumentChangedEvent[] = []
      document.on_change(event => events.push(event))

      source.patch({geometry: [[0, input]], v: [[0, 1]]})
      receiver.apply_json_patch(document.create_json_patch(events))

      const copy = receiver.get_model_by_id(source.id)!
      expect_instanceof(copy, GeometryDataSource)
      expect(source.geometries).to.be.equal([input])
      expect(copy.geometries).to.be.equal(source.geometries)
      expect(source.data).to.be.equal({v: [1]})
      expect(copy.data).to.be.equal(source.data)
    })
  }
})
