/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {DataSource} from "./data_source";
import {Signal} from "core/signaling";
import {logger} from "core/logging";
import {SelectionManager} from "core/selection_manager";
import * as p from "core/properties";
import {uniq, range} from "core/util/array"
;

// Abstract baseclass for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute
export class ColumnarDataSource extends DataSource {

  data: {[key: string]: any}
  _shapes: {[key: string]: any}

  static initClass() {
    this.prototype.type = 'ColumnarDataSource';

    this.define({
      column_names: [ p.Array, [] ]
    });

    this.internal({
      selection_manager: [ p.Instance, self => new SelectionManager({source: self}) ],
      inspected:         [ p.Any ],
      _shapes:      [ p.Any, {}]
    });
  }

  initialize(options) {
    super.initialize(options);

    this.select = new Signal(this, "select");
    this.inspect = new Signal(this, "inspect"); // XXX: <[indices, tool, renderer-view, source, data], this>

    this.streaming = new Signal(this, "streaming");
    return this.patching = new Signal(this, "patching"); // <number[], ColumnarDataSource>
  }

  get_column(colname) {
    return this.data[colname] != null ? this.data[colname] : null;
  }

  columns() {
    // return the column names in this data source
    return Object.keys(this.data);
  }

  get_length(soft) {
    if (soft == null) { soft = true; }
    const lengths = uniq(((() => {
      const result = [];
      for (let _key in this.data) {
        const val = this.data[_key];
        result.push(val.length);
      }
      return result;
    })()));

    switch (lengths.length) {
      case 0:
        return null; // XXX: don't guess, treat on case-by-case basis
      case 1:
        return lengths[0];
      default:
        var msg = "data source has columns of inconsistent lengths";
        if (soft) {
          logger.warn(msg);
          return lengths.sort()[0];
        } else {
          throw new Error(msg);
        }
    }
  }

  get_indices() {
    let length = this.get_length();
    if ((length == null)) { length = 1; }
    return range(0, length);
  }
}
ColumnarDataSource.initClass();
