/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {RemoteDataSource} from "./remote_data_source";
import {logger} from "core/logging";
import * as p from "core/properties"
;

export class AjaxDataSource extends RemoteDataSource {
  constructor(...args) {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { this; }).toString();
      let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
      eval(`${thisName} = this;`);
    }
    this.destroy = this.destroy.bind(this);
    this.setup = this.setup.bind(this);
    this.get_data = this.get_data.bind(this);
    super(...args);
  }

  static initClass() {
    this.prototype.type = 'AjaxDataSource';

    this.define({
        mode:         [ p.String, 'replace'          ],
        content_type: [ p.String, 'application/json' ],
        http_headers: [ p.Any,    {}                 ], // TODO (bev)
        max_size:     [ p.Number                     ],
        method:       [ p.String, 'POST'             ], // TODO (bev)  enum?
        if_modified:  [ p.Bool,   false              ]
      });
  }

  destroy() {
    if (this.interval != null) {
      return clearInterval(this.interval);
    }
  }

  setup() {
    if ((this.initialized == null)) {
      this.initialized = true;
      this.get_data(this.mode);
      if (this.polling_interval) {
        return this.interval = setInterval(this.get_data, this.polling_interval,
                                this.mode, this.max_size, this.if_modified);
      }
    }
  }

  get_data(mode, max_size, if_modified) {
    if (max_size == null) { max_size = 0; }
    if (if_modified == null) { if_modified = false; }
    const xhr = new XMLHttpRequest();
    xhr.open(this.method, this.data_url, true);
    xhr.withCredentials = false;
    xhr.setRequestHeader("Content-Type", this.content_type);
    for (let name in this.http_headers) {
      const value = this.http_headers[name];
      xhr.setRequestHeader(name, value);
    }
    // TODO: if_modified
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        switch (mode) {
          case 'replace':
            return this.data = data;
          case 'append':
            var original_data = this.data;
            for (let column of Array.from(this.columns())) {
              data[column] = original_data[column].concat(data[column]).slice(-max_size);
            }
            return this.data = data;
        }
      }
    });
    xhr.addEventListener("error", () => {
      return logger.error(`Failed to fetch JSON from ${this.data_url} with code ${xhr.status}`);
    });
    xhr.send();
    return null;
  }
}
AjaxDataSource.initClass();
