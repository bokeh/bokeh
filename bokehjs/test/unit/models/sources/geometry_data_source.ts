import {expect} from "#framework/assertions"
import {GeometryDataSource} from "@bokehjs/models/sources/geometry_data_source"

describe("GeometryDataSource", () => {
  it("exposes geometry, derived coordinates, and attributes through indexed fields", () => {
    const point = {type: "Point", coordinates: [2, 3]} as const
    const source = GeometryDataSource.create({
      geometries: [{type: point.type, coordinates: [...point.coordinates]}, null],
      data: {name: ["first", null]},
    })
    expect(source.get_length()).to.be.equal(2)
    expect(source.get_field("geometry")).to.be.equal([point, null])
    expect(source.get_field("x")).to.be.equal([2, NaN])
    expect(source.get_record(0)).to.be.equal({geometry: point, name: "first"})

    source.geometries = [{type: "Point", coordinates: [4, 3]}, null]
    expect(source.get_field("x")).to.be.equal([4, NaN])
  })
})
