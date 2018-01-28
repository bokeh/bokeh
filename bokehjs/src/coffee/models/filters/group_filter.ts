/* XXX: partial */
import {Filter} from "./filter";
import * as p from "core/properties";
import {logger} from "core/logging"
import {range} from "core/util/array"

export namespace GroupFilter {
  export interface Attrs extends Filter.Attrs {
    column_name: string
    group: string
  }

  export interface Opts extends Filter.Opts {}
}

export interface GroupFilter extends GroupFilter.Attrs {}

export class GroupFilter extends Filter {

  static initClass() {
    this.prototype.type = 'GroupFilter';

    this.define({
      column_name: [ p.String  ],
      group:       [ p.String  ],
    });
  }

  compute_indices(source): any {
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
