/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import * as p from "core/properties";
import {logger} from "core/logging";
import {uniq, includes} from "core/util/array";
import {ColumnDataSource} from "../../models/sources/column_data_source"
;

export class LegendItem extends Model {

  static initClass() {
    this.prototype.type = "LegendItem";

    this.define({
        label: [ p.StringSpec, null ],
        renderers: [ p.Array, [] ]
    });
  }

  _check_data_sources_on_renderers() {
    const field = this.get_field_from_label_prop();
    if (field != null) {
      if (this.renderers.length < 1) {
        return false;
      }
      const source = this.renderers[0].data_source;
      if (source != null) {
        for (let r of Array.from(this.renderers)) {
          if (r.data_source !== source) {
            return false;
          }
        }
      }
    }
    return true;
  }

  _check_field_label_on_data_source() {
    const field = this.get_field_from_label_prop();
    if (field != null) {
      if (this.renderers.length < 1) {
        return false;
      }
      const source = this.renderers[0].data_source;
      if (source != null && !includes(source.columns(), field)) {
        return false;
      }
    }
    return true;
  }


  initialize(attrs, options) {
    super.initialize(attrs, options);
    // Validate data_sources match
    const data_source_validation = this._check_data_sources_on_renderers();
    if (!data_source_validation) {
      logger.error("Non matching data sources on legend item renderers");
    }
    // Validate label in data_source
    const field_validation = this._check_field_label_on_data_source();
    if (!field_validation) {
      return logger.error(`Bad column name on label: ${this.label}`);
    }
  }

  get_field_from_label_prop() {
    if ((this.label != null) && (this.label.field != null)) {
      return this.label.field;
    }
  }

  get_labels_list_from_label_prop() {
    // Always return a list of the labels
    if ((this.label != null) && (this.label.value != null)) {
      return [this.label.value];
    }
    const field = this.get_field_from_label_prop();
    if (field != null) {
      let source;
      if (this.renderers[0] && (this.renderers[0].data_source != null)) {
        source = this.renderers[0].data_source;
      } else {
        return ["No source found"];
      }
      if (source instanceof ColumnDataSource) {
        const data = source.get_column(field);
        if (data != null) {
          return uniq(data);
        } else {
          return ["Invalid field"];
        }
      }
    }
    return [];
  }
}
LegendItem.initClass();
