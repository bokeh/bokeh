fs = require "fs"
path = require "path"

{expect} = require "chai"

build_dir = path.normalize("#{__dirname}/../build")
console.log(build_dir)

LIMITS = {
  "css/bokeh-widgets.min.css": 515
  "css/bokeh.min.css":         69
  "js/bokeh-compiler.min.js":  175
  "js/bokeh-widgets.min.js":   284
  "js/bokeh.min.js":           886
}

for filename, maxsize of LIMITS
  do (filename, maxsize) ->
    describe "#{filename} file size", ->
      it "should remain below limit", ->
        stats = fs.statSync(path.join(build_dir, filename))
        expect(stats['size']).to.be.below maxsize * 1024
