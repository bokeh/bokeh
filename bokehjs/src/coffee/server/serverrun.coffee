define ["common/base",
  "./serverutils",
  "./usercontext/usercontext",
  "common/has_properties"
],  (base, serverutils, usercontext, HasProperties) ->
  Config = base.Config
  utility = serverutils.utility
  Promises = serverutils.Promises
  Config.ws_conn_string = "ws://#{window.location.host}/bokeh/sub"

  load = () ->
    HasProperties.prototype.sync = Backbone.sync
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