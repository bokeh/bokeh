/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import * as p from "core/properties";
import {isBoolean, isInteger} from "core/util/types";
import {all, range} from "core/util/array";
import {logger} from "core/logging"
;

export class Filter extends Model {
  static initClass() {
    this.prototype.type = 'Filter';

    this.define({
      filter:      [p.Array,   null ]
    });
  }

  initialize(options) {
    return super.initialize(options);
  }

  compute_indices() {
    if ((this.filter != null ? this.filter.length : undefined) >= 0) {
      if (all(this.filter, isBoolean)) {
        return (Array.from(range(0, this.filter.length)).filter((i) => this.filter[i] === true));
      } else if (all(this.filter, isInteger)) {
        return this.filter;
      } else {
        logger.warn(`Filter ${this.id}: filter should either be array of only booleans or only integers, defaulting to no filtering`);
        return null;
      }
    } else {
      logger.warn(`Filter ${this.id}: filter was not set to be an array, defaulting to no filtering`);
      return null;
    }
  }
}
Filter.initClass();
