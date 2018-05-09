import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/..`) // build/test -> build

const LIMITS: {[key: string]: number} = {
  // js
  "js/bokeh.min.js":           690,
  "js/bokeh-widgets.min.js":    90,
  "js/bokeh-tables.min.js":    200,
  "js/bokeh-api.min.js":        75,
  "js/bokeh-gl.min.js":         70,
  // css
  "css/bokeh.min.css":          60,
  "css/bokeh-widgets.min.css":  50,
  "css/bokeh-tables.min.css":   30,
}

describe(`bokehjs/build/*/*.min.{js,css} file sizes`, () => {
  for (const filename in LIMITS) {
    const stats = fs.statSync(path.join(build_dir, filename))
    const limit = LIMITS[filename]

    describe(`${filename} file size`, () => {
      it(`should be ${Math.round(stats.size/1024)} kB <= ${limit} kB`, () => {
        expect(stats.size).to.be.below(limit*1024)
      })
    })
  }
})
