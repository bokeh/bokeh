(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["backbone", "underscore", "common/base", "common/load_models", "common/logging"], function(Backbone, _, base, load_models, Logging) {
    var Config, WebSocketWrapper, logger, submodels;
    Config = base.Config;
    logger = Logging.logger;
    WebSocketWrapper = (function() {
      _.extend(WebSocketWrapper.prototype, Backbone.Events);

      function WebSocketWrapper(ws_conn_string) {
        this.onmessage = __bind(this.onmessage, this);
        var error,
          _this = this;
        this.auth = {};
        this.ws_conn_string = ws_conn_string;
        this._connected = $.Deferred();
        this.connected = this._connected.promise();
        try {
          if (window.MozWebSocket) {
            this.s = new MozWebSocket(ws_conn_string);
          } else {
            this.s = new WebSocket(ws_conn_string);
          }
        } catch (_error) {
          error = _error;
          logger.error("websocket creation failed for connection string: " + ws_conn_string);
          logger.error(" - " + error);
        }
        this.s.onopen = function() {
          return _this._connected.resolve();
        };
        this.s.onmessage = this.onmessage;
      }

      WebSocketWrapper.prototype.onmessage = function(msg) {
        var data, index, topic;
        data = msg.data;
        index = data.indexOf(":");
        index = data.indexOf(":", index + 1);
        topic = data.substring(0, index);
        data = data.substring(index + 1);
        this.trigger("msg:" + topic, data);
        return null;
      };

      WebSocketWrapper.prototype.send = function(msg) {
        var _this = this;
        return $.when(this.connected).done(function() {
          return _this.s.send(msg);
        });
      };

      WebSocketWrapper.prototype.subscribe = function(topic, auth) {
        var msg;
        this.auth[topic] = auth;
        msg = JSON.stringify({
          msgtype: 'subscribe',
          topic: topic,
          auth: auth
        });
        return this.send(msg);
      };

      return WebSocketWrapper;

    })();
    submodels = function(wswrapper, topic, apikey) {
      wswrapper.subscribe(topic, apikey);
      return wswrapper.on("msg:" + topic, function(msg) {
        var clientid, model, msgobj, ref, _i, _len, _ref;
        msgobj = JSON.parse(msg);
        if (msgobj['msgtype'] === 'modelpush') {
          load_models(msgobj['modelspecs']);
        } else if (msgobj['msgtype'] === 'modeldel') {
          _ref = msgobj['modelspecs'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ref = _ref[_i];
            model = resolve_ref(ref['type'], ref['id']);
            if (model) {
              model.destroy({
                'local': true
              });
            }
          }
        } else if (msgobj['msgtype'] === 'status' && msgobj['status'][0] === 'subscribesuccess') {
          clientid = msgobj['status'][2];
          Config.clientid = clientid;
          $.ajaxSetup({
            'headers': {
              'Continuum-Clientid': clientid
            }
          });
        } else {
          log.warn("unknown msgtype '" + msgobj['msgtype'] + "' for message: " + msgobj);
        }
        return null;
      });
    };
    return {
      WebSocketWrapper: WebSocketWrapper,
      submodels: submodels
    };
  });

}).call(this);

/*
//@ sourceMappingURL=socket.js.map
*/