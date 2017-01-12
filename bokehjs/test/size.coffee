fs = require "fs"
path = require "path"

{expect} = require "chai"

build_dir = path.normalize("#{__dirname}/../build")

LIMITS = {
  "css/bokeh-widgets.min.css": 160
  "css/bokeh.min.css":         60
  "js/bokeh-widgets.min.js":   380
  "js/bokeh-api.min.js":        75
  "js/bokeh.min.js":           699
}

for filename, maxsize of LIMITS
  do (filename, maxsize) ->
    describe "#{filename} file size", ->
      it "should remain below limit", ->
        stats = fs.statSync(path.join(build_dir, filename))
        expect(stats['size']).to.be.below maxsize * 1024
