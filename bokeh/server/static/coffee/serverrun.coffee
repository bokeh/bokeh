utils = require("./serverutils")
base = require("./base")
container = require("./container")
Config = base.Config
utility = utils.utility
Promises = utils.Promises
Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

usercontext = require("usercontext/usercontext")

$(()->
  user_load = utility.load_user()
)
