import * as fs from "fs"
import * as path from "path"

// TODO: import {expect} from "../unit/assertions"
// restore when bokehjs is modularized with lerna

const build_dir = path.normalize(`${__dirname}/../..`) // build/test/codebase -> build

const LIMITS = new Map([
  // es2017
  ["js/bokeh.min.js",                800],
  ["js/bokeh-widgets.min.js",        300],
  ["js/bokeh-tables.min.js",         350],
  ["js/bokeh-api.min.js",             90],
  // legacy (es5)
  ["js/bokeh.legacy.min.js",         990],
  ["js/bokeh-widgets.legacy.min.js", 350],
  ["js/bokeh-tables.legacy.min.js",  350],
  ["js/bokeh-api.legacy.min.js",      90],
])

describe(`bokehjs/build/*/*.min.js file sizes`, () => {
  for (const [filename, limit] of LIMITS) {
    const stats = fs.statSync(path.join(build_dir, filename))

    describe(`${filename} file size`, () => {
      it(`should be ${Math.round(stats.size/1024)} kB < ${limit} kB`, () => {
        // TODO: expect(stats.size).to.be.below(limit*1024)
        if (!(stats.size < limit*1024)) {
          throw new Error(`expected ${stats.size} to be below ${limit*1024}`)
        }
      })
    })
  }
})
