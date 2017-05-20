import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/../build`)

const LIMITS: {[key: string]: number} = {
  "css/bokeh-widgets.min.css": 160,
  "css/bokeh.min.css":          60,
  "js/bokeh-widgets.min.js":   380,
  "js/bokeh-api.min.js":        75,
  "js/bokeh-gl.min.js":         70,
  "js/bokeh.min.js":           750,
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
