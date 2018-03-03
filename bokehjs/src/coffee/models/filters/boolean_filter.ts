/* XXX: partial */
import {Filter} from "./filter";
import * as p from "core/properties";
import {logger} from "core/logging";
import {range, all} from "core/util/array";
import {isBoolean} from "core/util/types"

export namespace BooleanFilter {
  export interface Attrs extends Filter.Attrs {
    booleans: boolean[] | null
  }
}

export interface BooleanFilter extends BooleanFilter.Attrs {}

export class BooleanFilter extends Filter {

  constructor(attrs?: Partial<BooleanFilter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'BooleanFilter';

    this.define({
      booleans: [ p.Array, null ],
    });
  }

  compute_indices(source): any {
    if ((this.booleans != null ? this.booleans.length : undefined) > 0) {
      if (all(this.booleans, isBoolean)) {
        if (this.booleans.length !== source.get_length()) {
          logger.warn(`BooleanFilter ${this.id}: length of booleans doesn't match data source`);
        }
        return (range(0, this.booleans.length).filter((i) => this.booleans[i] === true));
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
