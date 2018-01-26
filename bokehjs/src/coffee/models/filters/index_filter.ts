/* XXX: partial */
import {Filter} from "./filter";
import * as p from "core/properties";
import {logger} from "core/logging";
import {isInteger} from "core/util/types";
import {all} from "core/util/array"

export namespace IndexFilter {
  export interface Attrs extends Filter.Attrs {
    indices: number[] | null
  }
}

export interface IndexFilter extends IndexFilter.Attrs {}

export class IndexFilter extends Filter {

  static initClass() {
    this.prototype.type = 'IndexFilter';

    this.define({
      indices: [ p.Array, null ],
    });
  }

  compute_indices(_source): any {
    if ((this.indices != null ? this.indices.length : undefined) >= 0) {
      if (all(this.indices, isInteger)) {
        return this.indices;
      } else {
        logger.warn(`IndexFilter ${this.id}: indices should be array of integers, defaulting to no filtering`);
        return null;
      }
    } else {
      logger.warn(`IndexFilter ${this.id}: indices was not set, defaulting to no filtering`);
      return null;
    }
  }
}
IndexFilter.initClass();
