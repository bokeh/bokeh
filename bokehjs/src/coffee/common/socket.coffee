define [
  "jquery",
  "underscore",
  "backbone",
  "common/base",
  "common/load_models"
  "common/logging"
], ($, _, Backbone, base, load_models, Logging) ->

  Config = base.Config
  logger = Logging.logger

  class WebSocketWrapper
    _.extend(@prototype, Backbone.Events)

    # ### method :
    constructor : (ws_conn_string) ->
      @auth = {}
      @ws_conn_string = ws_conn_string
      @_connected = $.Deferred()
      @connected = @_connected.promise()
      try
        if window.MozWebSocket
          @s = new MozWebSocket(ws_conn_string)
        else
          @s = new WebSocket(ws_conn_string)
      catch error
        logger.error("websocket creation failed for connection string: #{ws_conn_string}")
        logger.error(" - #{error}")

      @s.onopen = () =>
        @_connected.resolve()
      @s.onmessage = @onmessage

    onmessage : (msg) =>
      data = msg.data
      index = data.indexOf(":") # first colon marks topic namespace
      index = data.indexOf(":", index + 1) # second colon marks the topic
      topic = data.substring(0, index)
      data = data.substring(index + 1)
      @trigger("msg:" + topic, data)
      return null

    send : (msg) ->
      $.when(@connected).done(() =>
        @s.send(msg)
      )

    subscribe : (topic, auth) ->
      @auth[topic] = auth
      msg = JSON.stringify(
        {msgtype : 'subscribe', topic : topic, auth : auth}
      )
      @send(msg)

  # ###function : submodels

  submodels = (wswrapper, topic, apikey) ->
    # subscribes and listens for model changes on a WebSocketWrapper
    # ##### Parameters
    # * wswrapper : WebSocketWrapper
    # * topic : topic to listen on (send to the server on connect)
    # * apikey : apikey for server
    wswrapper.subscribe(topic, apikey)
    wswrapper.on("msg:" + topic, (msg) ->
      msgobj = JSON.parse(msg)
      if msgobj['msgtype'] == 'modelpush'
        load_models(msgobj['modelspecs'])
      else if msgobj['msgtype'] == 'modeldel'
        for ref in msgobj['modelspecs']
          model = resolve_ref(ref['type'], ref['id'])
          if model
            model.destroy({'local' : true})
      else if msgobj['msgtype'] == 'status' and
        msgobj['status'][0] == 'subscribesuccess'
          clientid = msgobj['status'][2]
          Config.clientid = clientid
          $.ajaxSetup({'headers' : {'Continuum-Clientid' : clientid}})
      else
        log.warn("unknown msgtype '#{msgobj['msgtype']}' for message: #{msgobj}")
      return null
    )

  return {
    WebSocketWrapper : WebSocketWrapper
    submodels : submodels
  }
