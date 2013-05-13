utils = require("./serverutils")
base = require("./base")
Config = base.Config
utility = utils.utility
Promises = utils.Promises
Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

usercontext = require("usercontext/usercontext")

$(()->
  wswrapper = utility.make_websocket()
  userdocs = new usercontext.UserDocs()
  userdocs.subscribe(wswrapper, 'defaultuser')
  window.userdocs = userdocs
  load = userdocs.fetch()
  load.done(() ->
    userdocsview = new usercontext.UserDocsView(collection : userdocs)
    $('#PlotPane').append(userdocsview.el)
  )
)
