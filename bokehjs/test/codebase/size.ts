import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/../..`) // build/test/codebase -> build

const LIMITS: {[key: string]: number} = {
  // es2017
  "js/bokeh.min.js":          700,
  "js/bokeh-widgets.min.js":  250,
  "js/bokeh-tables.min.js":   270,
  "js/bokeh-api.min.js":      90,
  "js/bokeh-gl.min.js":       70,
  // legacy (es5)
  "js/bokeh.legacy.min.js":         830,
  "js/bokeh-widgets.legacy.min.js": 260,
  "js/bokeh-tables.legacy.min.js":  270,
  "js/bokeh-api.legacy.min.js":      90,
  "js/bokeh-gl.legacy.min.js":       70,
}

describe(`bokehjs/build/*/*.min.js file sizes`, () => {
  for (const filename in LIMITS) {
    const stats = fs.statSync(path.join(build_dir, filename))
    const limit = LIMITS[filename]

    describe(`${filename} file size`, () => {
      it(`should be ${Math.round(stats.size/1024)} kB <= ${limit} kB`, () => {
        expect(stats.size).to.be.at.most(limit*1024)
      })
    })
  }
})
