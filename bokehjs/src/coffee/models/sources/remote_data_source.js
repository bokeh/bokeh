/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {ColumnDataSource} from "./column_data_source";
import * as p from "core/properties"
;

export class RemoteDataSource extends ColumnDataSource {
  static initClass() {
    this.prototype.type = 'RemoteDataSource';

    this.define({
        data_url:         [ p.String    ],
        polling_interval: [ p.Number    ]
      });
  }
}
RemoteDataSource.initClass();
