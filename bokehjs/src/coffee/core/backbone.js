//     Backbone.js 1.3.3

//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

import {Events} from './events';
import {isEqual} from './util/eq';
import {extend, clone} from './util/object';

// Backbone.Model
// --------------

// Backbone **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.

// Create a new model with the specified attributes.
export var Model = function(attributes, options) {
  var attrs = attributes || {};
  options || (options = {});
  this.attributes = {};
  this.setv(attrs, options);
  this.changed = {};
  this.initialize.apply(this, arguments);
};

// Attach all inheritable methods to the Model prototype.
extend(Model.prototype, Events, {

  // A hash of attributes whose current and previous value differ.
  changed: null,

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function(){},

  // Get the value of an attribute.
  getv: function(attr) {
    return this.attributes[attr];
  },

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  setv: function(key, val, options) {
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Extract attributes and options.
    var silent     = options.silent;
    var changes    = [];
    var changing   = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = clone(this.attributes);
      this.changed = {};
    }

    var current = this.attributes;
    var changed = this.changed;
    var prev    = this._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for (var attr in attrs) {
      val = attrs[attr];
      if (!isEqual(current[attr], val)) changes.push(attr);
      if (!isEqual(prev[attr], val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }
      current[attr] = val;
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = true;
      for (var i = 0; i < changes.length; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]]);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent && !options.no_change) {
      while (this._pending) {
        this._pending = false;
        this.trigger('change', this);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  },

  destroy: function() {
    this.stopListening();
    this.trigger('destroy', this);
  },

  // Create a new model with identical attributes to this one.
  clone: function() {
    return new this.constructor(this.attributes);
  }
});

Model.getters = function(specs) {
  for (var name in specs) {
    Object.defineProperty(this.prototype, name, { get: specs[name] });
  }
};
