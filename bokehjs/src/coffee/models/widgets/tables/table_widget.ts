/* XXX: partial */
import {Widget} from "../widget";
import {CDSView} from "../../sources/cds_view";
import * as p from "core/properties"

export class TableWidget extends Widget {
  static initClass() {
    this.prototype.type = "TableWidget";

    this.define({
      source: [ p.Instance ],
      view:   [ p.Instance, () => new CDSView() ],
    });
  }

  initialize(options: any): void {
    super.initialize(options);

    if ((this.view.source == null)) {
      this.view.source = this.source;
      this.view.compute_indices();
    }
  }
}
TableWidget.initClass();
