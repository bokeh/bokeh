import * as fs from "fs"
import * as path from "path"

import {expect} from "chai"

const build_dir = path.normalize(`${__dirname}/..`) // build/test -> build

const LIMITS: {[key: string]: number} = {
  // es2017
  "js/bokeh.min.js":         640,
  "js/bokeh-widgets.min.js":  90,
  "js/bokeh-tables.min.js":  270,
  "js/bokeh-api.min.js":      90,
  "js/bokeh-gl.min.js":       70,
  // es5/legacy
  "js/es5/bokeh.min.js":         770,
  "js/es5/bokeh-widgets.min.js": 100,
  "js/es5/bokeh-tables.min.js":  270,
  "js/es5/bokeh-api.min.js":      90,
  "js/es5/bokeh-gl.min.js":       70,
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
