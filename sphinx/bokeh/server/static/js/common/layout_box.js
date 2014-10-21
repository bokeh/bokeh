(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["underscore", "./collection", "kiwi", "./has_properties", "range/range1d"], function(_, Collection, kiwi, HasProperties, Range1d) {
    var Constraint, EQ, Expr, GE, LE, LayoutBox, LayoutBoxs, Var, _ref, _ref1;
    Var = kiwi.Variable;
    Expr = kiwi.Expression;
    Constraint = kiwi.Constraint;
    EQ = kiwi.Operator.Eq;
    LE = kiwi.Operator.Le;
    GE = kiwi.Operator.Ge;
    LayoutBox = (function(_super) {
      __extends(LayoutBox, _super);

      function LayoutBox() {
        _ref = LayoutBox.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      LayoutBox.prototype.type = 'LayoutBox';

      LayoutBox.prototype.initialize = function(attrs, options) {
        var name, v, _i, _j, _len, _len1, _ref1, _ref2,
          _this = this;
        LayoutBox.__super__.initialize.call(this, attrs, options);
        this.solver = this.get('solver');
        this.var_constraints = {};
        _ref1 = ['top', 'left', 'width', 'height'];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          v = _ref1[_i];
          name = '_' + v;
          this[name] = new Var(v);
          this.register_property(v, this._get_var, false);
          this.register_setter(v, this._set_var);
          this.solver.add_edit_variable(this[name], kiwi.Strength.strong);
        }
        _ref2 = ['right', 'bottom'];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          v = _ref2[_j];
          name = '_' + v;
          this[name] = new Var(v);
          this.register_property(v, this._get_var, false);
        }
        this.solver.add_constraint(new Constraint(new Expr(this._top), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._bottom), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._left), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._right), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._width), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._height), GE));
        this.solver.add_constraint(new Constraint(new Expr(this._left, this._width, [-1, this._right]), EQ));
        this.solver.add_constraint(new Constraint(new Expr(this._bottom, this._height, [-1, this._top]), EQ));
        this._h_range = new Range1d.Model({
          start: this.get('left'),
          end: this.get('left') + this.get('width')
        });
        this.register_property('h_range', function() {
          _this._h_range.set('start', _this.get('left'));
          _this._h_range.set('end', _this.get('left') + _this.get('width'));
          return _this._h_range;
        }, false);
        this.add_dependencies('h_range', this, ['left', 'width']);
        this._v_range = new Range1d.Model({
          start: this.get('bottom'),
          end: this.get('bottom') + this.get('height')
        });
        this.register_property('v_range', function() {
          _this._v_range.set('start', _this.get('bottom'));
          _this._v_range.set('end', _this.get('bottom') + _this.get('height'));
          return _this._v_range;
        }, false);
        this.add_dependencies('v_range', this, ['bottom', 'height']);
        this._aspect_constraint = null;
        this.register_property('aspect', function() {
          return _this.get('width') / _this.get('height');
        }, true);
        this.register_setter('aspect', this._set_aspect);
        return this.add_dependencies('aspect', this, ['width', 'height']);
      };

      LayoutBox.prototype.contains = function(vx, vy) {
        return vx >= this.get('left') && vx <= this.get('right') && vy >= this.get('bottom') && vy <= this.get('top');
      };

      LayoutBox.prototype._set_var = function(value, prop_name) {
        var c, v;
        v = this['_' + prop_name];
        if (typeof value === 'number') {
          return this.solver.suggest_value(v, value);
        } else if (typeof value === 'string') {

        } else {
          c = new Constraint(new Expr(v, [-1, value]), EQ);
          if (this.var_constraints[prop_name] == null) {
            this.var_constraints[prop_name] = [];
          }
          this.var_constraints[prop_name].push(c);
          return this.solver.add_constraint(c);
        }
      };

      LayoutBox.prototype._get_var = function(prop_name) {
        return this['_' + prop_name].value();
      };

      LayoutBox.prototype._set_aspect = function(aspect) {
        var c;
        if (this._aspect_constraint != null) {
          this.solver.remove_constraint(this.aspect_constraint);
          c = new Constraint(new Expr([aspect, this._height], [-1, this._width]), EQ);
          this._aspect_constraint = c;
          return this.solver.add_constraint(c);
        }
      };

      LayoutBox.prototype.defaults = function() {
        return _.extend({}, LayoutBox.__super__.defaults.call(this), {
          'top_strength': kiwi.Strength.strong,
          'bottom_strength': kiwi.Strength.strong,
          'left_strength': kiwi.Strength.strong,
          'right_strength': kiwi.Strength.strong,
          'width_strength': kiwi.Strength.strong,
          'height_strength': kiwi.Strength.strong
        });
      };

      return LayoutBox;

    })(HasProperties);
    LayoutBoxs = (function(_super) {
      __extends(LayoutBoxs, _super);

      function LayoutBoxs() {
        _ref1 = LayoutBoxs.__super__.constructor.apply(this, arguments);
        return _ref1;
      }

      LayoutBoxs.prototype.model = LayoutBox;

      return LayoutBoxs;

    })(Collection);
    return {
      "Model": LayoutBox,
      "Collection": new LayoutBoxs()
    };
  });

}).call(this);

/*
//@ sourceMappingURL=layout_box.js.map
*/