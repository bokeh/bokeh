/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Transform} from "./transform";
import * as p from "core/properties";
import {includes} from "core/util/array";

export class Interpolator extends Transform {
  static initClass() {

    this.define({
      x:    [ p.Any],
      y:    [ p.Any],
      data: [ p.Any],
      clip: [ p.Bool, true]
      });
  }

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options);
    this._x_sorted = [];
    this._y_sorted = [];
    this._sorted_dirty = true;

    this.connect(this.change, () => this._sorted_dirty = true)
  }

  sort(descending) {
    // Verify that all necessary objects exist...
    if (descending == null) { descending = false; }
    if (typeof(this.x) !== typeof(this.y)) {
      throw new Error('The parameters for x and y must be of the same type, either both strings which define a column in the data source or both arrays of the same length');
      return;

    } else {
      if ((typeof(this.x) === 'string') && (this.data === null)) {
        throw new Error('If the x and y parameters are not specified as an array, the data parameter is reqired.');
        return;
      }
    }

    // Stop processing this if the dirty flag is not set
    if(this._sorted_dirty === false) {
      return;
    }

    let tsx = [];
    let tsy = [];

    // Populate the tsx and tsy variables correctly depending on the method by which the user populated the interpolation
    // data.
    if (typeof(this.x) === 'string') {
      const { data } = this;

      const column_names = data.columns();
      if (!includes(column_names, this.x)) {
        throw new Error('The x parameter does not correspond to a valid column name defined in the data parameter');
      }

      if (!includes(column_names, this.y)) {
        throw new Error('The x parameter does not correspond to a valid column name defined in the data parameter');
      }

      tsx = data.get_column(this.x);
      tsy = data.get_column(this.y);
    } else {
      tsx = this.x;
      tsy = this.y;
    }

    if (tsx.length !== tsy.length) {
      throw new Error('The length for x and y do not match');
    }

    if (tsx.length < 2) {
      throw new Error('x and y must have at least two elements to support interpolation');
    }

    // The following sorting code is referenced from:
    // http://stackoverflow.com/questions/11499268/sort-two-arrays-the-same-way
    const list = [];
    for (let j in tsx) {
      list.push({'x': tsx[j], 'y': tsy[j]});
    }

    if (descending === true) {
      list.sort(function(a, b) {
        let left, left1;
        return (((left = a.x < b.x)) != null ? left : -{1 : (((left1 = a.x === b.x)) != null ? left1 : {0 : 1})});
      });
    } else {
      list.sort(function(a, b) {
        let left, left1;
        return (((left = a.x > b.x)) != null ? left : -{1 : (((left1 = a.x === b.x)) != null ? left1 : {0 : 1})});
      });
    }

    for (let k = 0, end = list.length, asc = 0 <= end; asc ? k < end : k > end; asc ? k++ : k--) {
      this._x_sorted[k] = list[k].x;
      this._y_sorted[k] = list[k].y;
    }

    return this._sorted_dirty = false;
  }
}
Interpolator.initClass();
