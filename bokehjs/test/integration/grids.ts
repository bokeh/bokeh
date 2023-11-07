import {display, fig} from "./_util"

describe("Grid", () => {
  it("should support cross bounds", async () => {
    const p = fig([300, 300])
    p.scatter({x: [4, 5, 6], y: [1, 2, 3], size: 20})

    p.xaxis.fixed_location = 1.5
    p.xaxis.bounds = [4, 5]
    p.xgrid.cross_bounds = [1, 3]

    p.yaxis.fixed_location = 4.5
    p.yaxis.bounds = [1, 3]
    p.ygrid.cross_bounds = [4, 5]

    await display(p)
  })
})
