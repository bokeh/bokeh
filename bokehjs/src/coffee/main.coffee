_ = require("underscore")

Bokeh = {}
Bokeh.require = require
Bokeh.version = require("./version")

# binding the libs that bokeh uses so others can reference them
Bokeh._                 = require("underscore")
Bokeh.$                 = require("jquery")

Bokeh.Backbone          = require("backbone")
Bokeh.Backbone.$        = Bokeh.$

# set up logger
logging = require("./core/logging")
Bokeh.logger            = logging.logger
Bokeh.set_log_level     = logging.set_log_level

Bokeh.index             = require("./base").index
Bokeh.embed             = require("./embed")

Bokeh.Models            = require("./base").Models

_.extend(Bokeh, require("./api"))

# Here for backwards capability?
Bokeh.Bokeh = Bokeh
module.exports = Bokeh
