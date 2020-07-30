import {display, fig, row} from "../utils"

import {MarkerType, OutputBackend} from "@bokehjs/core/enums"
import {Random} from "@bokehjs/core/util/random"

describe("Marker glyph", () => {
  const random = new Random(1)
  const N = 10

  const x = random.floats(N)
  const y = random.floats(N)

  for (const marker_type of MarkerType) {
    it(`should support '${marker_type}' marker type`, async () => {
      function* plots() {
        for (const output_backend of OutputBackend) {
          const p = fig([150, 150], {
            output_backend,
            title: `${marker_type} - ${output_backend}`,
            x_axis_type: null,
            y_axis_type: null,
          })
          p.scatter({
            x, y, marker: marker_type, size: 14,
            line_color: "navy", fill_color: "orange", alpha: 0.5,
          })
          yield p
        }
      }
      await display(row([...plots()]), [3*150 + 50, 150 + 50])
    })
  }
})
