import {expect} from "assertions"

import {GeoJSONDataSource} from "@bokehjs/models/sources/geojson_data_source"

describe("geojson_data_source module", () => {

  describe("geojson is not a GeometryCollection or FeatureCollection", () => {
    const geojson = `{
       "type": "Point",
       "coordinates": [100.0, 0.0]
    }`

    it("should throw an error", () => {
      const fn = () => new GeoJSONDataSource({geojson})
      expect(fn).to.throw()
    })
  })

  describe("geojson is an empty FeatureCollection", () => {
    const geojson = `{
       "type": "FeatureCollection",
       "features": []
    }`

    it("should throw an error", () => {
      const fn = () => new GeoJSONDataSource({geojson})
      expect(fn).to.throw()
    })
  })

  describe("geojson is an empty GeometryCollection", () => {
    const geojson = `{
       "type": "GeometryCollection",
       "geometries": []
    }`

    it("should throw an error", () => {
      const fn = () => new GeoJSONDataSource({geojson})
      expect(fn).to.throw()
    })
  })

  describe("single xy Point ", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Point",
        "coordinates": [125.6, 10.1]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("add x,y,NaN to data", () => {
      const expected_data = {x: [125.6], y: [10.1], z: [NaN], xs: [[]], ys: [[]], zs: [[]]}
      expect(geo.data).to.be.equal(expected_data)
    })

    it("updates data when geojson updates", () => {
      const new_geojson = `{
        "type": "GeometryCollection",
        "geometries": [{
          "type": "Point",
          "coordinates": [125.6, 22]
          }
        ]
      }`
      geo.geojson = new_geojson
      const expected_data = {x: [125.6], y: [22], z: [NaN], xs: [[]], ys: [[]], zs: [[]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("single xyz Point", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Point",
        "coordinates": [125.6, 10.1, 22]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add x,y,z to data", () => {
      const expected_data = {x: [125.6], y: [10.1], z: [22], xs: [[]], ys: [[]], zs: [[]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy LineString", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "LineString",
        "coordinates": [[125.6, 10.1], [100.1, 9.2]]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add xs,ys to data", () => {
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs:[[125.6, 100.1]], ys:[[10.1, 9.2]], zs: [[NaN, NaN]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy Polygon without hole", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "coordinates": [
          [ [125.6, 10.1], [100.1, 9.2] ]
        ]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add xs,ys to data", () => {
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs:[[125.6, 100.1]], ys:[[10.1, 9.2]], zs: [[NaN, NaN]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy Polygon with hole", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "Polygon",
        "coordinates": [
          [ [125.6, 10.1], [100.1, 9.2] ],
          [ [125.4, 10.2], [100.2, 9.1] ]
        ]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add xs,ys to data", () => {
      // Also puts a warning about only using exterior ring
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs:[[125.6, 100.1]], ys:[[10.1, 9.2]], zs: [[NaN, NaN]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy MultiPoint ", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "MultiPoint",
        "coordinates": [[125.6, 10.1, 22], [100.0, 0.0]]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should not add anything to data", () => {
      // MultiPoint is not supported. There should also be a console warning (not tested)
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs: [[]], ys: [[]], zs: [[]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy MultiLineString", () => {
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "MultiLineString",
        "coordinates": [
          [ [125.6, 10.1], [100.1, 9.2] ],
          [ [125.4, 10.2], [100.2, 9.1] ]
          ]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add xs,ys to datai with NaN in between", () => {
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs:[[125.6, 100.1, NaN, 125.4, 100.2]], ys:[[10.1, 9.2, NaN, 10.2, 9.1]], zs: [[NaN, NaN, NaN, NaN, NaN]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("xy MultiPolygon", () => {
    // This has two polygons to join together with NaNs, but the second one has
    // a hole in it that needs to be ignored (so the coords from the third line
    // of coordinates will not be in the final data)
    const geojson = `{
      "type": "GeometryCollection",
      "geometries": [{
        "type": "MultiPolygon",
        "coordinates": [
          [[[102.0, 2.0], [103.0, 2.1] ]],
          [[[100.0, 0.0], [101.0, 0.1] ],
           [[100.2, 0.2], [100.8, 0.3] ]]
        ]
        }
      ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add xs,ys to datai with NaN in between", () => {
      const expected_data = {x: [NaN], y: [NaN], z: [NaN], xs:[[102.0, 103.0, NaN, 100.0, 101.0]], ys:[[2.0, 2.1, NaN, 0, 0.1]], zs: [[NaN, NaN, NaN, NaN, NaN]]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("Feature with properties", () => {
    const geojson = `{
       "type": "FeatureCollection",
       "features": [
          { "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102, 33]},
            "properties": {"color": "pink", "value": 33}
          }
       ]
    }`

    it("should add the properties to the data", () => {
      const geo = new GeoJSONDataSource({geojson})
      const expected_data = {x: [102], y: [33], z: [NaN], xs: [[]], ys: [[]], zs: [[]], color: ["pink"], value: [33]}
      expect(geo.data).to.be.equal(expected_data)
    })

    it("should convert null property values to NaN", () => {
      const geojson = `{
        "type": "FeatureCollection",
        "features": [
            { "type": "Feature",
              "geometry": {"type": "Point", "coordinates": [102, 33]},
              "properties": {"color": "pink", "value": null}
            }
        ]
      }`
      const geo = new GeoJSONDataSource({geojson})
      const expected_data = {x: [102], y: [33], z: [NaN], xs: [[]], ys: [[]], zs: [[]], color: ["pink"], value: [NaN]}
      expect(geo.data).to.be.equal(expected_data)
    })
  })

  describe("Multiple Features with differing properties", () => {
    const geojson = `{
       "type": "FeatureCollection",
       "features": [
          { "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102, 33]},
            "properties": {"color": "pink", "value": 33}
          },
          { "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [103, 34]},
            "properties": {"size": 54, "value": 36}
          }
       ]
    }`
    const geo = new GeoJSONDataSource({geojson})

    it("should add the properties to the data with NaN's when they're missing", () => {
      const expected_data = {
        x: [102, 103], y: [33, 34], z: [NaN, NaN],
        xs: [[], []], ys: [[], []], zs: [[], []],
        color: ["pink", NaN], value: [33, 36], size: [NaN, 54],
      }
      expect(geo.data).to.be.equal(expected_data)
    })
  })
})
