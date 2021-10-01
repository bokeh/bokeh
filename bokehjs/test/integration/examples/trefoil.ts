import {display} from "../_util"

import {figure} from "@bokehjs/api/plotting"
import {radians} from "@bokehjs/core/util/math"
import {Title, TeeHead, VeeHead} from "@bokehjs/models"

const {cos, sin} = Math

describe("Examples", () => {
  it("should support Trefoil", async () => {
    const cdot = "\u22c5"
    const degree = "\u00b0"

    // https://www.orau.org/ptp/articlesstories/radwarnsymbstory.htm
    function trefoil(R: number = 1) {
      const p = figure({
        x_range: [-6*R, 6*R], y_range: [-6*R, 6*R],
        frame_width: 500, frame_height: 500,
        background_fill_color: "yellow",
        title: new Title({text: "Radiation Warning Symbol (Trefoil)", align: "center", text_font_size: "20px"}),
        x_axis_type: null, y_axis_type: null,
        toolbar_location: null,
      })

      p.annular_wedge({
        x: 0, y: 0,
        inner_radius: 1.5*R, outer_radius: 5*R,
        start_angle: [0, 120, 240], start_angle_units: "deg",
        end_angle: [60, 180, 300], end_angle_units: "deg",
        line_color: "black", fill_color: "magenta",
      })
      p.circle({
        x: 0, y: 0,
        radius: R,
        line_color: "black", fill_color: "magenta",
      })

      const arc = p.arc({
        x: 0, y: 0,
        radius: 5.3*R,
        start_angle: [60, 120], start_angle_units: "deg",
        end_angle: [120, 180], end_angle_units: "deg",
        line_color: "black",
      })
      arc.add_decoration(new TeeHead({size: 10}), "start")
      arc.add_decoration(new VeeHead({size: 8}), "start")
      arc.add_decoration(new TeeHead({size: 10}), "end")
      arc.add_decoration(new VeeHead({size: 8}), "end")

      const [x1, y1] = [5.5*R*cos(radians(150)), 5.5*R*sin(radians(150))]
      p.text({x: [0, x1], y: [5.3*R, y1], text: {value: `60${degree}`}, text_baseline: "bottom", text_align: "center"})

      p.segment({
        x0: [   0,    R, 1.5*R,  5*R],
        y0: 0,
        x1: [   0,    R, 1.5*R,  5*R],
        y1: [-4*R, -2*R,  -3*R, -4*R],
        line_color: "black", line_dash: {value: [3, 3]},
      })

      const s = p.segment({
        x0: 0,
        y0: [-2*R,  -3*R, -4*R],
        x1: [   R, 1.5*R,  5*R],
        y1: [-2*R,  -3*R, -4*R],
        line_color: "black",
      })
      s.add_decoration(new TeeHead({size: 10}), "start")
      s.add_decoration(new VeeHead({size: 8}), "start")
      s.add_decoration(new TeeHead({size: 10}), "end")
      s.add_decoration(new VeeHead({size: 8}), "end")

      p.text({x: 1.0*R/2, y: -2*R, text: {value: "R"}, text_baseline: "bottom", text_align: "center"})
      p.text({x: 1.5*R/2, y: -3*R, text: {value: `1.5${cdot}R`}, text_baseline: "bottom", text_align: "center"})
      p.text({x: 5.0*R/2, y: -4*R, text: {value: `5${cdot}R`}, text_baseline: "bottom", text_align: "center"})

      return p
    }

    await display(trefoil())
  })
})
