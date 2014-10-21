(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "common/collection", "common/has_properties", "common/logging", "range/range1d", "range/data_range1d"], function(_, Collection, HasProperties, Logging, Range1d, DataRange1d) {
    var ServerDataSource, ServerDataSources, ajax_throttle, logger, _ref, _ref1;
    logger = Logging.logger;
    ajax_throttle = function(func) {
      var busy, callback, has_callback, resp;
      busy = false;
      resp = null;
      has_callback = false;
      callback = function() {
        if (busy) {
          if (has_callback) {
            return logger.debug('already bound, ignoring');
          } else {
            logger.debug('busy, so doing it later');
            has_callback = true;
            return resp.done(function() {
              has_callback = false;
              return callback();
            });
          }
        } else {
          logger.debug('executing');
          busy = true;
          resp = func();
          return resp.done(function() {
            logger.debug('done, setting to false');
            busy = false;
            return resp = null;
          });
        }
      };
      return callback;
    };
    ServerDataSource = (function(_super) {
      __extends(ServerDataSource, _super);

      function ServerDataSource() {
        this.heatmap_update = __bind(this.heatmap_update, this);
        this.line1d_update = __bind(this.line1d_update, this);
        this.initialize = __bind(this.initialize, this);
        _ref = ServerDataSource.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      ServerDataSource.prototype.type = 'ServerDataSource';

      ServerDataSource.prototype.initialize = function(attrs, options) {
        ServerDataSource.__super__.initialize.call(this, attrs, options);
        return this.callbacks = {};
      };

      ServerDataSource.prototype.stoplistening_for_updates = function(column_data_source) {
        var entry, _i, _len, _ref1, _results;
        if (this.callbacks[column_data_source.get('id')]) {
          _ref1 = this.callbacks[column_data_source.get('id')];
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            entry = _ref1[_i];
            _results.push(this.stopListening.apply(this, entry));
          }
          return _results;
        }
      };

      ServerDataSource.prototype.update_url = function() {
        var owner_username, prefix, url;
        owner_username = this.get('owner_username');
        prefix = this.get_base().Config.prefix;
        return url = "" + prefix + "bokeh/data/" + owner_username + "/" + (this.get('doc')) + "/" + (this.get('id'));
      };

      ServerDataSource.prototype.listen_for_line1d_updates = function(column_data_source, plot_x_span, plot_y_span, domain_span, range_span, screen_span, primary_column, domain_name, columns, input_params) {
        var callback, plot_state, throttle,
          _this = this;
        plot_state = {
          screen_x: plot_x_span,
          screen_y: plot_y_span
        };
        this.stoplistening_for_updates(column_data_source);
        this.line1d_update(column_data_source, plot_state, domain_span, range_span, screen_span, primary_column, domain_name, columns, input_params);
        throttle = _.throttle(this.line1d_update, 300);
        callback = function() {
          return throttle(column_data_source, plot_state, domain_span, range_span, screen_span, primary_column, domain_name, columns, input_params);
        };
        this.listenTo(screen_span, 'change', callback);
        this.listenTo(domain_span, 'change', callback);
        return this.callbacks[column_data_source.get('id')] = [[screen_span, 'change', callback], [domain_span, 'change', callback]];
      };

      ServerDataSource.prototype.line1d_update = function(column_data_source, plot_state, domain_span, range_span, screen_span, primary_column, domain_name, columns, input_params) {
        var domain_limit, domain_resolution, params, range_limit;
        domain_resolution = (screen_span.get('end') - screen_span.get('start')) / 2;
        domain_resolution = Math.floor(domain_resolution);
        domain_limit = [domain_span.get('start'), domain_span.get('end')];
        range_limit = [range_span.get('start'), range_span.get('end')];
        if (plot_state['screen_x'].get('start') === plot_state['screen_x'].get('end') || plot_state['screen_y'].get('start') === plot_state['screen_y'].get('end') || domain_limit[0] > domain_limit[1] || range_limit[0] > range_limit[1]) {
          return $.ajax();
        }
        if (_.any(_.map(domain_limit, function(x) {
          return _.isNaN(x);
        })) || _.every(_.map(domain_limit, function(x) {
          return _.isEqual(0, x);
        }))) {
          domain_limit = 'auto';
        }
        if (_.any(_.map(range_limit, function(x) {
          return _.isNaN(x);
        })) || _.every(_.map(range_limit, function(x) {
          return _.isEqual(0, x);
        }))) {
          range_limit = 'auto';
        }
        params = [primary_column, domain_name, columns, domain_limit, range_limit, domain_resolution, input_params];
        return $.ajax({
          dataType: 'json',
          url: this.update_url(),
          xhrField: {
            withCredentials: true
          },
          success: function(data) {
            if (domain_limit === 'auto') {
              domain_span.set({
                start: data.domain_limit[0],
                end: data.domain_limit[1]
              });
            }
            if (range_limit === 'auto') {
              range_span.set({
                start: data.range_limit[0],
                end: data.range_limit[1]
              });
            }
            return column_data_source.set('data', data.data);
          },
          data: {
            resample_parameters: JSON.stringify(params),
            plot_state: JSON.stringify(plot_state)
          }
        });
      };

      ServerDataSource.prototype.listen_for_ar_updates = function(plot_view, column_data_source, plot_x_range, plot_y_range, x_data_range, y_data_range, input_params) {
        var callback, param, plot_state, _i, _len, _ref1,
          _this = this;
        plot_state = {
          data_x: x_data_range,
          data_y: y_data_range,
          screen_x: plot_x_range,
          screen_y: plot_y_range
        };
        this.stoplistening_for_updates(column_data_source);
        callback = ajax_throttle(function() {
          return _this.ar_update(plot_view, column_data_source, plot_state, input_params);
        });
        callback();
        this.callbacks[column_data_source.get('id')] = [];
        _ref1 = [x_data_range, y_data_range, plot_x_range, plot_y_range];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          param = _ref1[_i];
          this.listenTo(param, 'change', callback);
          this.callbacks[column_data_source.get('id')].push([param, 'change', callback]);
        }
        this.listenTo(this, 'change:index_slice', callback);
        this.callbacks[column_data_source.get('id')].push([this, 'change:index_slice', callback]);
        this.listenTo(this, 'change:data_slice', callback);
        this.callbacks[column_data_source.get('id')].push([this, 'change:data_slice', callback]);
        return null;
      };

      ServerDataSource.prototype.ar_update = function(plot_view, column_data_source, plot_state, input_params) {
        var domain_limit, item, key, proxy, render_state, resp, sendable_plot_state;
        domain_limit = 'not auto';
        render_state = column_data_source.get('data')['render_state'];
        if (!render_state) {
          render_state = {};
        }
        if (plot_state['screen_x'].get('start') === plot_state['screen_x'].get('end') || plot_state['screen_y'].get('start') === plot_state['screen_y'].get('end')) {
          logger.debug("skipping due to under-defined view state");
          return $.ajax();
        }
        if (plot_view.x_range.get('start') === plot_view.x_range.get('end') || _.isNaN(plot_view.x_range.get('start')) || _.isNaN(plot_view.x_range.get('end')) || plot_view.y_range.get('start') === plot_view.y_range.get('end') || _.isNaN(plot_view.y_range.get('start')) || _.isNaN(plot_view.y_range.get('end'))) {
          domain_limit = 'auto';
        }
        sendable_plot_state = {};
        for (key in plot_state) {
          item = plot_state[key];
          proxy = new Range1d.Model();
          proxy.set('start', item.get('start'));
          proxy.set('end', item.get('end'));
          sendable_plot_state[key] = proxy;
        }
        logger.debug("Sent render State", render_state);
        resp = $.ajax({
          dataType: 'json',
          url: this.update_url(),
          xhrField: {
            withCredentials: true
          },
          success: function(data) {
            var new_data;
            if (data.render_state === "NO UPDATE") {
              logger.info("No update");
              return;
            }
            if (domain_limit === 'auto') {
              plot_state['data_x'].set({
                start: data.x_range.start,
                end: data.x_range.end
              });
              plot_state['data_y'].set({
                start: data.y_range.start,
                end: data.y_range.end
              });
            }
            logger.debug("New render State:", data.render_state);
            new_data = _.clone(column_data_source.get('data'));
            _.extend(new_data, data);
            column_data_source.set('data', new_data);
            return plot_view.request_render();
          },
          data: {
            resample_parameters: JSON.stringify([input_params]),
            plot_state: JSON.stringify(sendable_plot_state),
            render_state: JSON.stringify(render_state)
          }
        });
        return resp;
      };

      ServerDataSource.prototype.listen_for_heatmap_updates = function(column_data_source, plot_x_range, plot_y_range, x_data_range, y_data_range, input_params) {
        var callback, param, plot_state, _i, _len, _ref1,
          _this = this;
        plot_state = {
          data_x: x_data_range,
          data_y: y_data_range,
          screen_x: plot_x_range,
          screen_y: plot_y_range
        };
        this.stoplistening_for_updates(column_data_source);
        callback = ajax_throttle(function() {
          return _this.heatmap_update(column_data_source, plot_state, input_params);
        });
        callback();
        this.callbacks[column_data_source.get('id')] = [];
        _ref1 = [x_data_range, y_data_range, plot_x_range, plot_y_range];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          param = _ref1[_i];
          this.listenTo(param, 'change', callback);
          this.callbacks[column_data_source.get('id')].push([param, 'change', callback]);
        }
        this.listenTo(this, 'change:index_slice', callback);
        this.callbacks[column_data_source.get('id')].push([this, 'change:index_slice', callback]);
        this.listenTo(this, 'change:data_slice', callback);
        this.callbacks[column_data_source.get('id')].push([this, 'change:data_slice', callback]);
        return null;
      };

      ServerDataSource.prototype.heatmap_update = function(column_data_source, plot_state, input_params) {
        var data_slice, global_offset_x, global_offset_y, global_x_range, global_y_range, index_slice, params;
        global_x_range = this.get('data').global_x_range;
        global_y_range = this.get('data').global_y_range;
        global_offset_x = this.get('data').global_offset_x[0];
        global_offset_y = this.get('data').global_offset_y[0];
        index_slice = this.get('index_slice');
        data_slice = this.get('data_slice');
        if (plot_state['screen_x'].get('start') === plot_state['screen_x'].get('end') || plot_state['screen_y'].get('start') === plot_state['screen_y'].get('end')) {
          logger.debug("skipping due to under-defined view state");
          return $.ajax();
        }
        params = [global_x_range, global_y_range, global_offset_x, global_offset_y, index_slice, data_slice, this.get('transpose'), input_params];
        return $.ajax({
          dataType: 'json',
          url: this.update_url(),
          xhrField: {
            withCredentials: true
          },
          success: function(data) {
            var new_data;
            new_data = _.clone(column_data_source.get('data'));
            _.extend(new_data, data);
            return column_data_source.set('data', new_data);
          },
          data: {
            resample_parameters: JSON.stringify(params),
            plot_state: JSON.stringify(plot_state)
          }
        });
      };

      return ServerDataSource;

    })(HasProperties);
    ServerDataSources = (function(_super) {
      __extends(ServerDataSources, _super);

      function ServerDataSources() {
        _ref1 = ServerDataSources.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      ServerDataSources.prototype.model = ServerDataSource;

      return ServerDataSources;

    })(Collection);
    return {
      "Model": ServerDataSource,
      "Collection": new ServerDataSources()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=server_data_source.js.map
*/