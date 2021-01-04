import {expect} from "assertions"

import {Interpolator} from "@bokehjs/models/transforms/interpolator"
import {NumberArray} from "@bokehjs/core/types"

describe("Interpolator model", () => {
  let x_sorted: NumberArray
  let y_sorted: NumberArray

  class CustomInterpolator extends Interpolator {
    compute(_x: number): number {
      return NaN
    }

    sort(descending: boolean = false): void {
      super.sort(descending)
      x_sorted = this._x_sorted
      y_sorted = this._y_sorted
    }
  }

  it("should correcty sort multiple arrays simultaneously (descending = false)", () => {
    const interpolator = new CustomInterpolator({
      x: [15, 1, 0, -3, 15, 17, -4, 18, -5, 100, -15],
      y: [-1, 18, -2, 8, -17, -16, 4, 5, 12, -3, 12],
    })
    interpolator.sort(false)
    expect(x_sorted).to.be.equal(NumberArray.from([-15, -5, -4, -3, 0, 1, 15, 15, 17, 18, 100]))
    expect(y_sorted).to.be.equal(NumberArray.from([12, 12, 4, 8, -2, 18, -1, -17, -16, 5, -3]))
  })

  it("should correcty sort multiple arrays simultaneously (descending = true)", () => {
    const interpolator = new CustomInterpolator({
      x: [15, 1, 0, -3, 15, 17, -4, 18, -5, 100, -15],
      y: [-1, 18, -2, 8, -17, -16, 4, 5, 12, -3, 12],
    })
    interpolator.sort(true)
    expect(x_sorted).to.be.equal(NumberArray.from([100, 18, 17, 15, 15, 1, 0, -3, -4, -5, -15]))
    expect(y_sorted).to.be.equal(NumberArray.from([-3, 5, -16, -1, -17, 18, -2, 8, 4, 12, 12]))
  })
})
