import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/..`) // build/test -> build

const LIMITS: {[key: string]: number} = {
  // js
  "js/bokeh.min.js":             770,
  "js/bokeh-widgets.min.js":     100,
  "js/bokeh-tables.min.js":      270,
  "js/bokeh-api.min.js":          90,
  "js/bokeh-gl.min.js":           70,
  // es6
  "js/bokeh-es6.min.js":         640,
  "js/bokeh-widgets-es6.min.js":  90,
  "js/bokeh-tables-es6.min.js":  250,
  "js/bokeh-api-es6.min.js":      90,
  "js/bokeh-gl-es6.min.js":       70,
  // css
  "css/bokeh.min.css":           0,
  "css/bokeh-widgets.min.css":   0,
  "css/bokeh-tables.min.css":    0,
}

describe(`bokehjs/build/*/*.min.{js,css} file sizes`, () => {
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
