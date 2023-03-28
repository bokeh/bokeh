import {Delaunay} from "https://cdn.skypack.dev/d3-delaunay@6"
// TODO: import {min, max, transpose} from "@bokeh/bokehjs-utils"
const {min, max, transpose} = Bokeh.require("core/util/array")

export default function({source, slider}) {
  const px = source.data["x"]
  const py = source.data["y"]
  const ext = [
    min(px) - slider.value,
    min(py) - slider.value,
    max(px) + slider.value,
    max(py) + slider.value,
  ]

  // Create the delaunay/voronoi object using d3, and iterate through its polygons
  // populating arrays storing polygon geometries as we go.
  const delaunay = Delaunay.from(transpose([px, py]))
  const vor = delaunay.voronoi(ext)
  const polyxs = []
  const polyys = []
  const inds = []
  for (const vp of vor.cellPolygons()) {
    // It's possible that a polygon with less than 3 points will be produced.
    // In that case, we want to assign an empty geometry instead.
    if (vp.length > 3) {
      inds.push(vp.index)
      const tp = transpose(vp)
      polyxs.push(tp[0])
      polyys.push(tp[1])
    } else {
      polyxs.push([])
      polyys.push([])
    }
  }
  source.data["pxs"] = polyxs
  source.data["pys"] = polyys
  source.change.emit()
}
