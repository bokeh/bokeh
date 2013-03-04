utils = require("./serverutils")
base = require("./base")
container = require("./container")
Config = base.Config
utility = utils.utility
Promises = utils.Promises
Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

usercontext = require("usercontext/usercontext")

$(()->
  wswrapper = utility.make_websocket()
  user_load = utility.load_user()
  user_load.done((data) ->
    docs = data['docs']
    userdocs = new usercontext.UserDocs()
    userdocs.reset(docs)
    userdocsview = new usercontext.UserDocsView(collection : userdocs)
    $('#PlotPane').append(userdocsview.el)
  )
)
