/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Filter} from "./filter";
import * as p from "core/properties";
import {logger} from "core/logging"
import {range} from "core/util/array"

export class GroupFilter extends Filter {
  static initClass() {
    this.prototype.type = 'GroupFilter';

    this.define({
      column_name:  [ p.String  ],
      group:        [ p.String  ]
    });
  }

  compute_indices(source) {
    const column = source.get_column(this.column_name);
    if ((column == null)) {
      logger.warn("group filter: groupby column not found in data source");
      return null;
    } else {
      this.indices = (range(0, source.get_length()).filter((i) => column[i] === this.group));
      if (this.indices.length === 0) {
        logger.warn(`group filter: group '${this.group}' did not match any values in column '${this.column_name}'`);
      }
      return this.indices;
    }
  }
}
GroupFilter.initClass();
