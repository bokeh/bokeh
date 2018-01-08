/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Filter} from "./filter";
import * as p from "core/properties";
import {logger} from "core/logging";
import {range, all} from "core/util/array";
import {isBoolean} from "core/util/types"
;

export class BooleanFilter extends Filter {
  static initClass() {
    this.prototype.type = 'BooleanFilter';

    this.define({
      booleans:    [ p.Array,  null ]
    });
  }

  compute_indices(source) {
    if ((this.booleans != null ? this.booleans.length : undefined) > 0) {
      if (all(this.booleans, isBoolean)) {
        if (this.booleans.length !== source.get_length()) {
          logger.warn(`BooleanFilter ${this.id}: length of booleans doesn't match data source`);
        }
        return (Array.from(range(0, this.booleans.length)).filter((i) => this.booleans[i] === true));
      } else {
        logger.warn(`BooleanFilter ${this.id}: booleans should be array of booleans, defaulting to no filtering`);
        return null;
      }
    } else {
      if ((this.booleans != null ? this.booleans.length : undefined) === 0) {
        logger.warn(`BooleanFilter ${this.id}: booleans is empty, defaulting to no filtering`);
      } else {
        logger.warn(`BooleanFilter ${this.id}: booleans was not set, defaulting to no filtering`);
      }
      return null;
    }
  }
}
BooleanFilter.initClass();
