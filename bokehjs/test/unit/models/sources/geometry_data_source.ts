import {expect} from "#framework/assertions"

import {
  GeometryDataSource,
  geojson_to_geometry_records,
} from "@bokehjs/models/sources/geometry_data_source"

describe("GeometryDataSource", () => {
  it("exposes natural geometry and attribute fields", () => {
    const geometry = {
      type: "Point" as const,
      coordinates: [2, 3, 4],
    }
    const source = GeometryDataSource.create({
      geometries: [geometry],
      data: {name: ["A"]},
    })

    expect(source.get("geometry")).to.be.equal([geometry])
    expect(source.get("name")).to.be.equal(["A"])
    expect(source.get("x")).to.be.equal([2])
    expect(source.get("y")).to.be.equal([3])
    expect(source.get("z")).to.be.equal([4])
  })

  it("retains Polygon holes in virtual coordinate fields", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "Polygon",
        coordinates: [
          [[0, 0], [4, 0], [4, 4], [0, 0]],
          [[1, 1], [2, 1], [1, 2], [1, 1]],
        ],
      }],
    })

    expect(source.get("xs")).to.be.equal([[0, 4, 4, 0, NaN, 1, 2, 1, 1]])
    expect(source.get("ys")).to.be.equal([[0, 0, 4, 0, NaN, 1, 1, 2, 1]])
  })

  it("retains every ring of every MultiPolygon member", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "MultiPolygon",
        coordinates: [
          [[[0, 0], [1, 0], [0, 0]]],
          [
            [[3, 3], [5, 3], [3, 3]],
            [[3.5, 3.2], [4, 3.2], [3.5, 3.2]],
          ],
        ],
      }],
    })

    expect(source.get("xs")).to.be.equal([[0, 1, 0, NaN, 3, 5, 3, NaN, 3.5, 4, 3.5]])
    expect(source.get("ys")).to.be.equal([[0, 0, 0, NaN, 3, 3, 3, NaN, 3.2, 3.2, 3.2]])
  })

  it("turns GeometryCollection members into independently selectable records", () => {
    const {geometries, data} = geojson_to_geometry_records({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {group: "A"},
        geometry: {
          type: "GeometryCollection",
          geometries: [
            {type: "Point", coordinates: [1, 2]},
            {type: "LineString", coordinates: [[0, 0], [1, 1]]},
          ],
        },
      }],
    })

    expect(geometries.map((geometry) => geometry?.type)).to.be.equal(["Point", "LineString"])
    expect(data).to.be.equal({group: ["A", "A"]})
  })

  it("commits virtual coordinate edits back to natural geometry", () => {
    const source = GeometryDataSource.create({
      geometries: [{
        type: "MultiPolygon",
        coordinates: [
          [[[0, 0, 5], [2, 0, 6], [0, 0, 5]]],
          [
            [[4, 4], [6, 4], [4, 4]],
            [[4.5, 4.2], [5, 4.2], [4.5, 4.2]],
          ],
        ],
      }],
    })
    const xs = source.get_array<number[]>("xs")
    const ys = source.get_array<number[]>("ys")
    xs[0][1] = 3
    ys[0][1] = 1

    source.commit_coordinates()

    const geometry = source.geometries[0]
    expect(geometry?.type).to.be.equal("MultiPolygon")
    if (geometry?.type == "MultiPolygon") {
      expect(geometry.coordinates[0][0][1]).to.be.equal([3, 1, 6])
      expect(geometry.coordinates.map((polygon) => polygon.length)).to.be.equal([1, 2])
    }
  })

  it("appends and deletes aligned feature records", () => {
    const source = GeometryDataSource.create({
      geometries: [{type: "Point", coordinates: [0, 0]}],
      data: {name: ["old"]},
    })

    source.append_polygon([1, 2, 1], [1, 1, 1], {name: "new", color: "red"})
    expect(source.geometries.map((geometry) => geometry?.type)).to.be.equal(["Point", "Polygon"])
    expect(source.data).to.be.equal({name: ["old", "new"], color: [NaN, "red"]})

    source.delete([0])
    expect(source.geometries.map((geometry) => geometry?.type)).to.be.equal(["Polygon"])
    expect(source.data).to.be.equal({name: ["new"], color: ["red"]})
  })
})
