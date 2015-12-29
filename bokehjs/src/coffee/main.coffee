Bokeh = {}
Bokeh.require = require
Bokeh.version = '0.10.0'

# binding the libs that bokeh uses so others can reference them
Bokeh._                 = require("underscore")
Bokeh.$                 = require("jquery")

Bokeh.Backbone          = require("backbone")
Bokeh.Backbone.$        = Bokeh.$

# set up logger
logging = require("./common/logging")
Bokeh.logger            = logging.logger
Bokeh.set_log_level     = logging.set_log_level

# fallback to Array if necessary
if not window.Float64Array
  Bokeh.logger.warn("Float64Array is not supported. Using generic Array instead.")
  window.Float64Array = Array

Bokeh.index             = require("./common/base").index
Bokeh.embed             = require("./common/embed")

Bokeh.Collections       = require("./common/base").Collections
Bokeh.Config            = require("./common/base").Config

require("./api")(Bokeh)

# widgets
Bokeh.Layout                 = require('./widget/layout')
Bokeh.BaseBox                = require('./widget/basebox')
Bokeh.HBox                   = require('./widget/hbox')
Bokeh.VBox                   = require('./widget/vbox')
Bokeh.VBoxForm               = require('./widget/vboxform')

# Add the jquery plugin
require("./api/plugin")

# Here for backwards capability?
Bokeh.Bokeh = Bokeh
module.exports = Bokeh
