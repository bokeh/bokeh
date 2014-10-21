(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(["common/collection", "underscore", "jquery_ui/draggable", "jquery_ui/droppable", "common/has_parent", "common/has_properties", "common/continuum_view", "common/close_wrapper", "common/build_views", "./crossfilter_template", "./crossfilter_column_template", "./crossfilter_facet_template"], function(Collection, _, draggable, droppable, HasParent, HasProperties, ContinuumView, CloseWrapper, build_views, crossfilter_template, crossfilter_column_template, crossfilter_facet_template) {
    var ColumnCollection, ColumnView, ColumnsView, ContinuousColumn, ContinuousColumnView, CrossFilter, CrossFilterView, CrossFilters, DiscreteColumn, DiscreteColumnView, FacetView, FacetsView, FilterView, PlotAttributeSelector, TimeColumn, TimeColumnView, column_types, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    CrossFilterView = (function(_super) {
      __extends(CrossFilterView, _super);

      function CrossFilterView() {
        _ref = CrossFilterView.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      CrossFilterView.prototype.tag = "div";

      CrossFilterView.prototype.attributes = {
        "class": "bk-crossfilter"
      };

      CrossFilterView.prototype.initialize = function(options) {
        CrossFilterView.__super__.initialize.call(this, options);
        this.views = {};
        this.listenTo(this.model, 'change:plot', this.render_plot);
        this.render();
        this.render_plot();
        return this;
      };

      CrossFilterView.prototype.render_plot = function() {
        var plot, plot_view;
        plot = this.mget('plot');
        plot_view = new plot.default_view({
          model: plot
        });
        this.$el.find('.bk-plot').empty();
        return this.$el.find('.bk-plot').append(plot_view.$el);
      };

      CrossFilterView.prototype.render = function() {
        var html;
        if (this.columnview != null) {
          this.columnview.$el.detach();
        }
        this.$el.empty();
        html = crossfilter_template();
        this.$el.html(html);
        this.filterview = new FilterView({
          el: this.$('.bk-filters'),
          collection: this.model.columns,
          model: this.model
        });
        this.facetsview = new FacetsView({
          el: this.$el,
          model: this.model
        });
        this.plotattributeview = new PlotAttributeSelector({
          el: this.$el,
          model: this.model
        });
        this.columnview = new ColumnsView({
          collection: this.model.columns
        });
        this.$('.bk-column-list').append(this.columnview.el);
        this.$('.bk-crossfilter-configuration').height(this.mget('height'));
        this.$('.bk-crossfilter-configuration').width(400);
        return this;
      };

      return CrossFilterView;

    })(ContinuumView);
    CrossFilter = (function(_super) {
      __extends(CrossFilter, _super);

      function CrossFilter() {
        this._set_columns = __bind(this._set_columns, this);
        _ref1 = CrossFilter.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      CrossFilter.prototype.default_view = CrossFilterView;

      CrossFilter.prototype.type = "CrossFilter";

      CrossFilter.prototype.initialize = function(attrs, options) {
        CrossFilter.__super__.initialize.call(this, attrs, options);
        this.columns = new ColumnCollection();
        this._set_columns();
        return this.listenTo(this, 'change:columns', this._set_columns);
      };

      CrossFilter.prototype._set_columns = function() {
        return this.columns.reset(this.get('columns'));
      };

      CrossFilter.prototype.defaults = function() {
        return _.extend({}, CrossFilter.__super__.defaults.call(this), {
          height: 700,
          width: 1300
        });
      };

      return CrossFilter;

    })(HasParent);
    CrossFilters = (function(_super) {
      __extends(CrossFilters, _super);

      function CrossFilters() {
        _ref2 = CrossFilters.__super__.constructor.apply(this, arguments);
        return _ref2;
      }

      CrossFilters.prototype.model = CrossFilter;

      return CrossFilters;

    })(Collection);
    PlotAttributeSelector = (function(_super) {
      __extends(PlotAttributeSelector, _super);

      function PlotAttributeSelector() {
        _ref3 = PlotAttributeSelector.__super__.constructor.apply(this, arguments);
        return _ref3;
      }

      PlotAttributeSelector.prototype.initialize = function(options) {
        PlotAttributeSelector.__super__.initialize.call(this, options);
        this.listenTo(this.model, "change:plot_selector", _.bind(this.render_selector, 'plot'));
        this.listenTo(this.model, "change:x_selector", _.bind(this.render_selector, 'x'));
        this.listenTo(this.model, "change:y_selector", _.bind(this.render_selector, 'y'));
        this.listenTo(this.model, "change:agg_selector", _.bind(this.render_selector, 'agg'));
        this.render_selector('plot');
        this.render_selector('x');
        this.render_selector('y');
        return this.render_selector('agg');
      };

      PlotAttributeSelector.prototype.render_selector = function(selector) {
        var model, node;
        node = this.$(".bk-" + selector + "-selector").empty();
        model = this.mget("" + selector + "_selector");
        this.plot_selector_view = new model.default_view({
          model: model
        });
        return node.append(this.plot_selector_view.$el);
      };

      return PlotAttributeSelector;

    })(ContinuumView);
    ColumnsView = (function(_super) {
      __extends(ColumnsView, _super);

      function ColumnsView() {
        _ref4 = ColumnsView.__super__.constructor.apply(this, arguments);
        return _ref4;
      }

      ColumnsView.prototype.initialize = function(options) {
        ColumnsView.__super__.initialize.call(this, options);
        this.views = {};
        this.listenTo(this.collection, 'all', this.render);
        this.render();
        return this;
      };

      ColumnsView.prototype.render = function() {
        var _this = this;
        _.map(this.views, function(view) {
          return view.$el.detach();
        });
        build_views(this.views, this.collection.models);
        _.map(this.collection.models, function(model) {
          return _this.$el.append(_this.views[model.id].$el);
        });
        return this;
      };

      return ColumnsView;

    })(ContinuumView);
    FacetView = (function(_super) {
      __extends(FacetView, _super);

      function FacetView() {
        _ref5 = FacetView.__super__.constructor.apply(this, arguments);
        return _ref5;
      }

      FacetView.prototype.events = {
        "click": "remove"
      };

      FacetView.prototype.tagName = "span";

      FacetView.prototype.attributes = {
        "class": "bk-facet-label"
      };

      FacetView.prototype.initialize = function(options) {
        FacetView.__super__.initialize.call(this, options);
        this.name = options.name;
        return this.render();
      };

      FacetView.prototype.render = function() {
        return this.$el.html(crossfilter_facet_template({
          name: this.name
        }));
      };

      return FacetView;

    })(ContinuumView);
    FacetsView = (function(_super) {
      __extends(FacetsView, _super);

      function FacetsView() {
        this.drop_tab = __bind(this.drop_tab, this);
        this.drop_y = __bind(this.drop_y, this);
        this.drop_x = __bind(this.drop_x, this);
        this.drop = __bind(this.drop, this);
        this.add_facet = __bind(this.add_facet, this);
        this.remove_facet = __bind(this.remove_facet, this);
        _ref6 = FacetsView.__super__.constructor.apply(this, arguments);
        return _ref6;
      }

      FacetsView.prototype.initialize = function(options) {
        FacetsView.__super__.initialize.call(this, options);
        this.render_init();
        this.render_all_facets();
        this.listenTo(this.model, 'change:facet_x', this.render_all_facets);
        this.listenTo(this.model, 'change:facet_y', this.render_all_facets);
        return this.listenTo(this.model, 'change:facet_tab', this.render_all_facets);
      };

      FacetsView.prototype.render_init = function() {
        this.facet_x_node = this.$('.bk-facet-x');
        this.facet_y_node = this.$('.bk-facet-y');
        this.facet_tab_node = this.$('.bk-facet-tab');
        this.facet_x_node.droppable({
          drop: this.drop_x,
          tolerance: 'pointer',
          hoverClass: 'bk-droppable-hover'
        });
        this.facet_y_node.droppable({
          drop: this.drop_y,
          tolerance: 'pointer',
          hoverClass: 'bk-droppable-hover'
        });
        return this.facet_tab_node.droppable({
          drop: this.drop_tab,
          tolerance: 'pointer',
          hoverClass: 'bk-droppable-hover'
        });
      };

      FacetsView.prototype.render_all_facets = function() {
        this.render_facets(this.facet_x_node, 'facet_x', this.model.get('facet_x'));
        this.render_facets(this.facet_y_node, 'facet_y', this.model.get('facet_y'));
        this.render_facets(this.facet_tab_node, 'facet_tab', this.model.get('facet_tab'));
      };

      FacetsView.prototype.render_facets = function(node, type, facets) {
        var facet, view, _i, _len, _results;
        node = node.find('.bk-facets-selections');
        node.empty();
        _results = [];
        for (_i = 0, _len = facets.length; _i < _len; _i++) {
          facet = facets[_i];
          view = new FacetView({
            name: facet
          });
          this.listenTo(view, 'remove', function() {
            var save;
            return this.remove_facet(facet, save = true);
          });
          _results.push(node.append(view.$el));
        }
        return _results;
      };

      FacetsView.prototype.remove_facet = function(facet, save) {
        var facets, type, x, _i, _len, _ref7;
        if (save == null) {
          save = true;
        }
        _ref7 = ['facet_x', 'facet_y', 'facet_tab'];
        for (_i = 0, _len = _ref7.length; _i < _len; _i++) {
          type = _ref7[_i];
          facets = _.clone(this.model.get(type));
          facets = (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = facets.length; _j < _len1; _j++) {
              x = facets[_j];
              if (x !== facet) {
                _results.push(x);
              }
            }
            return _results;
          })();
          this.model.set(type, facets);
        }
        if (save) {
          return this.model.save();
        }
      };

      FacetsView.prototype.add_facet = function(type, facet) {
        var facets, save;
        this.remove_facet(facet, save = false);
        facets = _.clone(this.model.get(type));
        if (facets.indexOf(facet) < 0) {
          facets.push(facet);
          this.model.set(type, facets);
        }
        return this.model.save();
      };

      FacetsView.prototype.drop = function(type, e, ui) {
        var column_model, name;
        column_model = ui.helper.data('model');
        name = column_model.get('name');
        return this.add_facet(type, name);
      };

      FacetsView.prototype.drop_x = function(e, ui) {
        return this.drop('facet_x', e, ui);
      };

      FacetsView.prototype.drop_y = function(e, ui) {
        return this.drop('facet_y', e, ui);
      };

      FacetsView.prototype.drop_tab = function(e, ui) {
        return this.drop('facet_tab', e, ui);
      };

      return FacetsView;

    })(ContinuumView);
    FilterView = (function(_super) {
      __extends(FilterView, _super);

      function FilterView() {
        this.drop = __bind(this.drop, this);
        _ref7 = FilterView.__super__.constructor.apply(this, arguments);
        return _ref7;
      }

      FilterView.prototype.initialize = function(options) {
        FilterView.__super__.initialize.call(this, options);
        this.views = {};
        this.render();
        this.render_columns_selectors;
        return this.listenTo(this.model, 'change:filter_widgets', this.render_column_selectors);
      };

      FilterView.prototype.drop = function(e, ui) {
        var column_model, filtering_columns;
        column_model = ui.helper.data('model');
        filtering_columns = _.clone(this.model.get('filtering_columns'));
        filtering_columns.push(column_model.get('name'));
        this.model.set('filtering_columns', filtering_columns);
        return this.model.save();
      };

      FilterView.prototype.render = function() {
        return this.$el.droppable({
          drop: this.drop,
          tolerance: 'pointer',
          hoverClass: 'bk-droppable-hover'
        });
      };

      FilterView.prototype.render_column_selectors = function() {
        var col, filter_widget_dict, filter_widgets, filtering_columns, key, newviews, val, _ref8,
          _this = this;
        _.map(this.views, function(view) {
          return view.$el.detach();
        });
        this.$el.find('.bk-filters-selections').empty();
        filter_widget_dict = {};
        _ref8 = this.mget('filter_widgets');
        for (key in _ref8) {
          if (!__hasProp.call(_ref8, key)) continue;
          val = _ref8[key];
          filter_widget_dict[key] = this.model.resolve_ref(val);
        }
        filtering_columns = this.mget('filtering_columns');
        filter_widgets = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = filtering_columns.length; _i < _len; _i++) {
            col = filtering_columns[_i];
            if (filter_widget_dict[col] != null) {
              _results.push(filter_widget_dict[col]);
            }
          }
          return _results;
        })();
        newviews = build_views(this.views, filter_widgets);
        _.map(newviews, function(view) {
          return _this.listenTo(view, 'remove', _this.child_remove);
        });
        return _.map(filter_widgets, function(model) {
          var wrapper;
          wrapper = new CloseWrapper.View({
            view: _this.views[model.id]
          });
          return _this.$el.find('.bk-filters-selections').append(wrapper.$el);
        });
      };

      FilterView.prototype.child_remove = function(view) {
        var key, model, newcolumns, to_remove, val, _ref8;
        _ref8 = this.mget('filter_widgets');
        for (key in _ref8) {
          if (!__hasProp.call(_ref8, key)) continue;
          val = _ref8[key];
          model = this.model.resolve_ref(val);
          if (model === view.model) {
            to_remove = key;
            break;
          }
        }
        newcolumns = _.filter(this.mget('filtering_columns'), function(x) {
          return x !== to_remove;
        });
        this.mset('filtering_columns', newcolumns);
        return this.model.save();
      };

      return FilterView;

    })(ContinuumView);
    ColumnView = (function(_super) {
      __extends(ColumnView, _super);

      function ColumnView() {
        _ref8 = ColumnView.__super__.constructor.apply(this, arguments);
        return _ref8;
      }

      ColumnView.prototype.template = crossfilter_column_template;

      ColumnView.prototype.attributes = {
        "class": "bk-crossfilter-column-entry bk-bs-panel bk-bs-panel-primary"
      };

      ColumnView.prototype.initialize = function(options) {
        ColumnView.__super__.initialize.call(this, options);
        return this.render();
      };

      ColumnView.prototype.render = function() {
        var _this = this;
        this.$el.html(this.template(this.model.attributes));
        this.$el.draggable({
          appendTo: 'body',
          containment: 'document',
          helper: 'clone',
          start: function(e, ui) {
            return ui.helper.data('model', _this.model);
          }
        });
        return this;
      };

      return ColumnView;

    })(ContinuumView);
    TimeColumnView = (function(_super) {
      __extends(TimeColumnView, _super);

      function TimeColumnView() {
        _ref9 = TimeColumnView.__super__.constructor.apply(this, arguments);
        return _ref9;
      }

      return TimeColumnView;

    })(ColumnView);
    TimeColumn = (function(_super) {
      __extends(TimeColumn, _super);

      function TimeColumn() {
        _ref10 = TimeColumn.__super__.constructor.apply(this, arguments);
        return _ref10;
      }

      TimeColumn.prototype.default_view = TimeColumnView;

      TimeColumn.prototype.defaults = function() {
        return _.extend({}, TimeColumn.__super__.defaults.call(this), {
          type: "TimeColumn",
          label: "Time",
          name: "",
          fields: ['count', 'unique', 'first', 'last'],
          count: 0,
          unique: 0,
          first: 0,
          last: 0
        });
      };

      return TimeColumn;

    })(HasProperties);
    DiscreteColumnView = (function(_super) {
      __extends(DiscreteColumnView, _super);

      function DiscreteColumnView() {
        _ref11 = DiscreteColumnView.__super__.constructor.apply(this, arguments);
        return _ref11;
      }

      return DiscreteColumnView;

    })(ColumnView);
    DiscreteColumn = (function(_super) {
      __extends(DiscreteColumn, _super);

      function DiscreteColumn() {
        _ref12 = DiscreteColumn.__super__.constructor.apply(this, arguments);
        return _ref12;
      }

      DiscreteColumn.prototype.default_view = DiscreteColumnView;

      DiscreteColumn.prototype.defaults = function() {
        return _.extend({}, DiscreteColumn.__super__.defaults.call(this), {
          type: "DiscreteColumn",
          label: "Factor",
          name: "",
          fields: ['count', 'unique', 'top', 'freq'],
          count: 0,
          unique: 0,
          top: 0,
          freq: 0
        });
      };

      return DiscreteColumn;

    })(HasProperties);
    ContinuousColumnView = (function(_super) {
      __extends(ContinuousColumnView, _super);

      function ContinuousColumnView() {
        _ref13 = ContinuousColumnView.__super__.constructor.apply(this, arguments);
        return _ref13;
      }

      return ContinuousColumnView;

    })(ColumnView);
    ContinuousColumn = (function(_super) {
      __extends(ContinuousColumn, _super);

      function ContinuousColumn() {
        _ref14 = ContinuousColumn.__super__.constructor.apply(this, arguments);
        return _ref14;
      }

      ContinuousColumn.prototype.default_view = ContinuousColumnView;

      ContinuousColumn.prototype.defaults = function() {
        return _.extend({}, ContinuousColumn.__super__.defaults.call(this), {
          type: "ContinuousColumn",
          label: "Continuous",
          name: "",
          fields: ['count', 'mean', 'std', 'min', 'max'],
          count: 0,
          mean: 0,
          std: 0,
          min: 0,
          max: 0
        });
      };

      return ContinuousColumn;

    })(HasProperties);
    column_types = {
      'DiscreteColumn': DiscreteColumn,
      'TimeColumn': TimeColumn,
      'ContinuousColumn': ContinuousColumn
    };
    ColumnCollection = (function(_super) {
      __extends(ColumnCollection, _super);

      function ColumnCollection() {
        _ref15 = ColumnCollection.__super__.constructor.apply(this, arguments);
        return _ref15;
      }

      ColumnCollection.prototype.model = function(attrs, options) {
        if (attrs.type in column_types) {
          return new column_types[attrs.type](attrs);
        }
        console.log("Unknown column type: '" + attrs.type + "'");
        return null;
      };

      return ColumnCollection;

    })(Collection);
    return {
      Model: CrossFilter,
      Collection: new CrossFilters(),
      View: CrossFilterView
    };
  });

}).call(this);

/*
//@ sourceMappingURL=crossfilter.js.map
*/