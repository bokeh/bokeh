import {expect} from "#framework/assertions"

import {
  create_data_mapping, data_mapping_is_precise, map_packed_point, missing_data_value, pack_data_points,
  with_data_origin,
} from "@bokehjs/models/glyphs/webgl/data_mapping"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"

function linear(source: [number, number], target: [number, number]): LinearScale {
  return new LinearScale({
    source_range: new Range1d({start: source[0], end: source[1]}),
    target_range: new Range1d({start: target[0], end: target[1]}),
  })
}

function log(source: [number, number], target: [number, number]): LogScale {
  return new LogScale({
    source_range: new Range1d({start: source[0], end: source[1]}),
    target_range: new Range1d({start: target[0], end: target[1]}),
  })
}

describe("WebGL data mapping", () => {
  it("should retain sub-second precision for large datetime coordinates", () => {
    const xscale = linear([1_720_000_000_000, 1_720_000_001_000], [40, 840])
    const yscale = linear([-1, 1], [400, 0])
    const mapping = create_data_mapping(xscale, yscale)!
    const point = new Float32Array(2)
    const x = 1_720_000_000_123.25
    const y = 0.125

    const {origin} = pack_data_points(point, [x], [y], mapping)
    const [sx, sy] = map_packed_point(point, with_data_origin(mapping, origin))

    expect(Math.abs(sx - xscale.compute(x)) < 0.02).to.be.true
    expect(Math.abs(sy - yscale.compute(y)) < 0.02).to.be.true
  })

  it("should map logarithmic coordinates with the same affine shader contract", () => {
    const xscale = log([1, 10000], [10, 510])
    const yscale = log([0.1, 100], [410, 10])
    const mapping = create_data_mapping(xscale, yscale)!
    const points = new Float32Array(4)

    const {origin} = pack_data_points(points, [10, 1000], [1, 10], mapping)
    const resolved = with_data_origin(mapping, origin)
    for (let i = 0; i < 2; i++) {
      const [sx, sy] = map_packed_point(points.subarray(2*i, 2*i + 2), resolved)
      expect(Math.abs(sx - xscale.compute([10, 1000][i])) < 0.02).to.be.true
      expect(Math.abs(sy - yscale.compute([1, 10][i])) < 0.02).to.be.true
    }
  })

  it("should encode non-finite and non-positive logarithmic values as missing", () => {
    const mapping = create_data_mapping(log([1, 100], [0, 100]), linear([0, 1], [100, 0]))!
    const points = new Float32Array(6)
    pack_data_points(points, [0, NaN, 10], [0.5, 0.5, Infinity], mapping)

    expect(points[0]).to.be.equal(missing_data_value)
    expect(points[2]).to.be.equal(missing_data_value)
    expect(points[4]).to.be.equal(missing_data_value)
  })

  it("should fall back for categorical scales", () => {
    const categorical = new CategoricalScale({
      source_range: new FactorRange({factors: ["a", "b"]}),
      target_range: new Range1d({start: 0, end: 100}),
    })
    expect(create_data_mapping(categorical, linear([0, 1], [100, 0]))).to.be.null
  })

  it("should reject rebased precision only when current zoom makes its error visible", () => {
    const mapping = create_data_mapping(linear([0, 1e12], [0, 1000]), linear([0, 1], [100, 0]))!
    const points = new Float32Array(6)
    const {error} = pack_data_points(points, [0, 1e12, 1e12 + 1], [0, 0, 0], mapping)
    expect(data_mapping_is_precise(mapping, error)).to.be.true

    const zoomed = create_data_mapping(linear([1e12, 1e12 + 10], [0, 1000]), linear([0, 1], [100, 0]))!
    expect(data_mapping_is_precise(zoomed, error)).to.be.false
  })
})
