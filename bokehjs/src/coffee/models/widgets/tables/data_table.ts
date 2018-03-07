/* XXX: partial */
import {Grid as SlickGrid} from "slickgrid";

import {RowSelectionModel} from "slickgrid/plugins/slick.rowselectionmodel";
import {CheckboxSelectColumn} from "slickgrid/plugins/slick.checkboxselectcolumn";

import * as hittest from "core/hittest";
import * as p from "core/properties";
import {uniqueId} from "core/util/string";
import {any, range} from "core/util/array";
import {logger} from "core/logging";

import {TableWidget} from "./table_widget";
import {TableColumn} from "./table_column"
import {WidgetView} from "../widget"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {CDSView} from "../../sources/cds_view"

export const DTINDEX_NAME = "__bkdt_internal_index__";

declare var $: any

export class DataProvider {

  index: number[]

  constructor(readonly source: ColumnarDataSource, readonly view: CDSView) {
    if (DTINDEX_NAME in this.source.data)
      throw new Error(`special name ${DTINDEX_NAME} cannot be used as a data table column`);

    this.index = this.view.indices;
  }

  getLength(): number {
    return this.index.length
  }

  getItem(offset: number) {
    const item = {};
    for (const field of Object.keys(this.source.data)) {
      item[field] = this.source.data[field][this.index[offset]];
    }
    item[DTINDEX_NAME] = this.index[offset];
    return item;
  }

  setItem(offset, item) {
    for (const field in item) {
      // internal index is maintained independently, ignore
      const value = item[field];
      if (field !== DTINDEX_NAME) {
        this.source.data[field][this.index[offset]] = value;
      }
    }
    this._update_source_inplace();
    return null;
  }

  getField(offset, field) {
    if (field === DTINDEX_NAME) {
      return this.index[offset];
    }
    return this.source.data[field][this.index[offset]];
  }

  setField(offset, field, value) {
    // field assumed never to be internal index name (ctor would throw)
    this.source.data[field][this.index[offset]] = value;
    this._update_source_inplace();
    return null;
  }

  getItemMetadata(_index) { return null; }

  getRecords() {
    return (range(0, this.getLength()).map((i) => this.getItem(i)));
  }

  sort(columns) {
    let cols = columns.map((column) => [column.sortCol.field, column.sortAsc ? 1 : -1]);

    if (cols.length === 0) {
      cols = [[DTINDEX_NAME, 1]];
    }

    const records = this.getRecords();
    const old_index = this.index.slice();

    // TODO (bev) this sort is unstable, which is not great
    return this.index.sort(function(i1, i2) {
      for (const [field, sign] of cols) {
        const value1 = records[old_index.indexOf(i1)][field];
        const value2 = records[old_index.indexOf(i2)][field];
        const result =
          value1 === value2 ? 0
          : value1 >  value2 ? sign
          :                         -sign;
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    });
  }

  _update_source_inplace() {
    this.source.properties.data.change.emit();
  }
}

export class DataTableView extends WidgetView {
  model: DataTable

  private data: DataProvider
  private grid: SlickGrid

  protected _in_selection_update = false
  protected _warned_not_reorderable = false

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.change, () => this.render());
    this.connect(this.model.source.properties.data.change, () => this.updateGrid());
    this.connect(this.model.source.streaming, () => this.updateGrid());
    this.connect(this.model.source.patching, () => this.updateGrid());
    this.connect(this.model.source.change, () => this.updateSelection());
  }

  updateGrid(): void {
    // TODO (bev) This is to enure that CDSView indices are properly computed
    // before passing to the DataProvider. This will result in extra calls to
    // compute_indices. This "over execution" will be addressed in a more
    // general look at events
    this.model.view.compute_indices();

    this.data.constructor(this.model.source, this.model.view);
    this.grid.invalidate();
    this.grid.render();

    // This is only needed to call @_tell_document_about_change()
    this.model.source.data = this.model.source.data;
    this.model.source.change.emit();
  }

  updateSelection() {
    if (this._in_selection_update)
      return;

    const { selected } = this.model.source;
    const selected_indices = selected['1d'].indices;

    const permuted_indices = (selected_indices.map((x) => this.data.index.indexOf(x)));

    this._in_selection_update = true;
    this.grid.setSelectedRows(permuted_indices);
    this._in_selection_update = false;
    // If the selection is not in the current slickgrid viewport, scroll the
    // datatable to start at the row before the first selected row, so that
    // the selection is immediately brought into view. We don't scroll when
    // the selection is already in the viewport so that selecting from the
    // datatable itself does not re-scroll.
    const cur_grid_range = this.grid.getViewport();

    const scroll_index = this.model.get_scroll_index(cur_grid_range, permuted_indices);
    if (scroll_index != null) {
      return this.grid.scrollRowToTop(scroll_index);
    }
  }

  newIndexColumn() {
    return {
      id: uniqueId(),
      name: "#",
      field: DTINDEX_NAME,
      width: 40,
      behavior: "select",
      cannotTriggerInsert: true,
      resizable: false,
      selectable: false,
      sortable: true,
      cssClass: "bk-cell-index",
    };
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-data-table")
  }

  render() {
    let checkboxSelector;
    let columns = (this.model.columns.map((column) => column.toColumn()));

    if (this.model.selectable === "checkbox") {
      checkboxSelector = new CheckboxSelectColumn({cssClass: "bk-cell-select"});
      columns.unshift(checkboxSelector.getColumnDefinition());
    }

    if (this.model.row_headers) {
      columns.unshift(this.newIndexColumn());
    }

    let { reorderable } = this.model;

    if (reorderable && (__guard__(typeof $ !== 'undefined' && $ !== null ? $.fn : undefined, x => x.sortable) == null)) {
      if (!this._warned_not_reorderable) {
        logger.warn("jquery-ui is required to enable DataTable.reorderable");
        this._warned_not_reorderable = true;
      }
      reorderable = false;
    }

    const options = {
      enableCellNavigation: this.model.selectable !== false,
      enableColumnReorder: reorderable,
      forceFitColumns: this.model.fit_columns,
      autoHeight: this.model.height === "auto",
      multiColumnSort: this.model.sortable,
      editable: this.model.editable,
      autoEdit: false,
    };

    if (this.model.width != null) {
      this.el.style.width = `${this.model.width}px`;
    } else {
      this.el.style.width = `${this.model.default_width}px`;
    }

    if ((this.model.height != null) && (this.model.height !== "auto")) {
      this.el.style.height = `${this.model.height}px`;
    }

    this.data = new DataProvider(this.model.source, this.model.view);
    this.grid = new SlickGrid(this.el, this.data, columns, options);

    this.grid.onSort.subscribe((_event, args) => {
      columns = args.sortCols;
      this.data.sort(columns);
      this.grid.invalidate();
      this.updateSelection();
      return this.grid.render();
    });

    if (this.model.selectable !== false) {
      this.grid.setSelectionModel(new RowSelectionModel({selectActiveRow: (checkboxSelector == null)}));
      if (checkboxSelector != null) { this.grid.registerPlugin(checkboxSelector); }

      this.grid.onSelectedRowsChanged.subscribe((_event, args) => {
        if (this._in_selection_update) {
          return;
        }

        const selected = hittest.create_empty_hit_test_result();
        selected.indices = (args.rows.map((i) => this.data.index[i]));
        return this.model.source.selected = selected;
      });

      this.updateSelection();
    }

    return this;
  }
}

export namespace DataTable {
  export interface Attrs extends TableWidget.Attrs {
    columns: TableColumn[]
    fit_columns: boolean
    sortable: boolean
    reorderable: boolean
    editable: boolean
    selectable: boolean
    row_headers: boolean
    scroll_to_selection: boolean
  }
}

export interface DataTable extends DataTable.Attrs {}

export class DataTable extends TableWidget {

  constructor(attrs?: Partial<DataTable.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'DataTable';
    this.prototype.default_view = DataTableView;

    this.define({
      columns:             [ p.Array,  []    ],
      fit_columns:         [ p.Bool,   true  ],
      sortable:            [ p.Bool,   true  ],
      reorderable:         [ p.Bool,   true  ],
      editable:            [ p.Bool,   false ],
      selectable:          [ p.Bool,   true  ],
      row_headers:         [ p.Bool,   true  ],
      scroll_to_selection: [ p.Bool,   true  ],
    });

    this.override({
      height: 400,
    });
  }

  readonly default_width = 600

  get_scroll_index(grid_range, selected_indices) {
    if (!this.scroll_to_selection || (selected_indices.length === 0)) {
      return null;
    }

    if (!any(selected_indices, i => grid_range.top <= i && i <= grid_range.bottom)) {
      return Math.max(0, Math.min(...selected_indices || []) - 1);
    }

    return null;
  }
}
DataTable.initClass();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
