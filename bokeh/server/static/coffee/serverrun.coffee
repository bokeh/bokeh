utils = require("./serverutils")
base = require("./base")
container = require("./container")
Config = base.Config
utility = utils.utility
Promises = utils.Promises
Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"
$(()->
  utility.load_default_document()
)
$.when(Promises.doc_loaded).then(()->
  $('#PlotPane').empty().append(utils.plotcontextview.el)
)
