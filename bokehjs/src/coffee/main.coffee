import "./core/util/underscore"

module.exports = exports = Bokeh = {}

Bokeh.require = require
Bokeh.version = require("./version")

# binding the libs that bokeh uses so others can reference them
Bokeh._                 = require("underscore")
Bokeh.$                 = require("jquery")

export {logger, set_log_level} from "./core/logging"
export {Models, index} from "./base"
Bokeh.embed             = require("./embed")
export {safely} from "./safely"
