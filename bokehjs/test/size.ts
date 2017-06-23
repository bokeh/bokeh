import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/../build`)

const LIMITS: {[key: string]: number} = {
  // css
  "css/bokeh.min.css":          60,
  "css/bokeh-widgets.min.css":  70,
  "css/bokeh-tables.min.css":   30,
  // js
  "js/bokeh.min.js":           730,
  "js/bokeh-widgets.min.js":    90,
  "js/bokeh-tables.min.js":    200,
  "js/bokeh-api.min.js":        75,
  "js/bokeh-gl.min.js":         70,
}

for (const filename in LIMITS) {
  const maxsize = LIMITS[filename]

  describe(`${filename} file size`, () => {
    it(`should remain below ${maxsize} kB limit`, () => {
      const stats = fs.statSync(path.join(build_dir, filename))
      expect(stats.size).to.be.below(maxsize*1024)
    })
  })
}
