fs = require "fs"
path = require "path"

{expect} = require "chai"

build_dir = path.normalize("#{__dirname}/../build")
console.log(build_dir)

LIMITS = {
  "css/bokeh-widgets.min.css": 527
  "css/bokeh.min.css":         74
  "js/bokeh-compiler.min.js":  178
  "js/bokeh-widgets.min.js":   290
  "js/bokeh.min.js":           907
}

for filename, maxsize of LIMITS
  do (filename, maxsize) ->
    describe "#{filename} file size", ->
      it "should remain below limit", ->
        stats = fs.statSync(path.join(build_dir, filename))
        expect(stats['size']).to.be.below maxsize * 1024
