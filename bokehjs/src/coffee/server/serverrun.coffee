define ["common/base",
  "./serverutils",
  "./usercontext/usercontext"
],  (base, serverutils, usercontext) ->
  Config = base.Config
  utility = serverutils.utility
  Promises = serverutils.Promises
  Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

  load = () ->
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
  return load : load