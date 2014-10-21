(function() {
  define(["backbone", "underscore", "kiwi"], function(Backbone, _, kiwi) {
    var Solver;
    Solver = (function() {
      function Solver() {
        this.solver = new kiwi.Solver();
      }

      Solver.prototype.update_variables = function(trigger) {
        if (trigger == null) {
          trigger = true;
        }
        this.solver.updateVariables();
        if (trigger) {
          return this.trigger('layout_update');
        }
      };

      Solver.prototype.add_constraint = function(constraint) {
        return this.solver.addConstraint(constraint);
      };

      Solver.prototype.remove_constraint = function(constraint) {
        return this.solver.removeConstraint(constraint);
      };

      Solver.prototype.add_edit_variable = function(variable, strength) {
        if (strength == null) {
          strength = kiwi.Strength.strong;
        }
        return this.solver.addEditVariable(variable, strength);
      };

      Solver.prototype.suggest_value = function(variable, value) {
        return this.solver.suggestValue(variable, value);
      };

      return Solver;

    })();
    _.extend(Solver.prototype, Backbone.Events);
    return Solver;
  });

}).call(this);

/*
//@ sourceMappingURL=solver.js.map
*/