import {DOMElement, DOMElementView} from "./dom_element"
import type * as p from "core/properties"

export class SpanView extends DOMElementView {
  declare model: Span
  static override tag_name = "span" as const
}

export namespace Span {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props
}

export interface Span extends Span.Attrs {}

export class Span extends DOMElement {
  declare properties: Span.Props
  declare __view_type__: SpanView

  constructor(attrs?: Partial<Span.Attrs>) {
    super(attrs)
    this.maybe_initialize(Span.__name__, attrs)
  }

  static {
    this.prototype.default_view = SpanView
  }
}

export class DivView extends DOMElementView {
  declare model: Div
  static override tag_name = "div" as const
}

export namespace Div {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props
}

export interface Div extends Div.Attrs {}

export class Div extends DOMElement {
  constructor(attrs?: Partial<Div.Attrs>) {
    super(attrs)
    this.maybe_initialize(Div.__name__, attrs)
  }

  declare properties: Div.Props
  declare __view_type__: DivView

  static {
    this.prototype.default_view = DivView
  }
}

export class TableView extends DOMElementView {
  declare model: Table
  static override tag_name = "table" as const
}

export namespace Table {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props
}

export interface Table extends Table.Attrs {}

export class Table extends DOMElement {
  declare properties: Table.Props
  declare __view_type__: TableView

  constructor(attrs?: Partial<Table.Attrs>) {
    super(attrs)
    this.maybe_initialize(Table.__name__, attrs)
  }

  static {
    this.prototype.default_view = TableView
  }
}

export class TableRowView extends DOMElementView {
  declare model: TableRow
  static override tag_name = "tr" as const
}

export namespace TableRow {
  export type Attrs = p.AttrsOf<Props>
  export type Props = DOMElement.Props
}

export interface TableRow extends TableRow.Attrs {}

export class TableRow extends DOMElement {
  declare properties: TableRow.Props
  declare __view_type__: TableRowView

  constructor(attrs?: Partial<TableRow.Attrs>) {
    super(attrs)
    this.maybe_initialize(TableRow.__name__, attrs)
  }

  static {
    this.prototype.default_view = TableRowView
  }
}
