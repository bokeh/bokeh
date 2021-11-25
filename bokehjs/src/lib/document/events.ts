import {Document} from "./document"
import {Data} from "core/types"
import {HasProps} from "core/has_props"
import {Ref} from "core/util/refs"
import {PatchSet} from "models/sources/column_data_source"
import {equals, Equatable, Comparator} from "core/util/eq"
import {serialize, Serializable, Serializer} from "core/serializer"

export type ModelChanged = {
  kind: "ModelChanged"
  model: Ref
  attr: string
  new: unknown
  hint?: unknown
}

export type MessageSent = {
  kind: "MessageSent"
  msg_type: string
  msg_data?: unknown
}

export type TitleChanged = {
  kind: "TitleChanged"
  title: string
}

export type RootAdded = {
  kind: "RootAdded"
  model: Ref
}

export type RootRemoved = {
  kind: "RootRemoved"
  model: Ref
}

export type ColumnDataChanged = {
  kind: "ColumnDataChanged"
  column_source: Ref
  cols?: any
  new: unknown
}

export type ColumnsStreamed = {
  kind: "ColumnsStreamed"
  column_source: Ref
  data: Data
  rollover?: number
}

export type ColumnsPatched = {
  kind: "ColumnsPatched"
  column_source: Ref
  patches: PatchSet<unknown>
}

export type DocumentChanged =
  ModelChanged | MessageSent | TitleChanged | RootAdded | RootRemoved | ColumnDataChanged | ColumnsStreamed | ColumnsPatched

export abstract class DocumentEvent implements Equatable {
  constructor(readonly document: Document) {}

  get [Symbol.toStringTag](): string {
    return (this.constructor as any).__name__
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.document, that.document)
  }
}

export class DocumentEventBatch<T extends DocumentChangedEvent> extends DocumentEvent {
  constructor(document: Document, readonly events: T[]) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.events, that.events)
  }
}

export abstract class DocumentChangedEvent extends DocumentEvent implements Serializable {
  abstract [serialize](serializer: Serializer): DocumentChanged
}

export class MessageSentEvent extends DocumentChangedEvent {
  constructor(document: Document, readonly msg_type: string, readonly msg_data: unknown) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.msg_type, that.msg_type) &&
      cmp.eq(this.msg_data, that.msg_data)
  }

  [serialize](serializer: Serializer): DocumentChanged {
    const value = this.msg_data
    const value_serialized = serializer.to_serializable(value)
    return {
      kind: "MessageSent",
      msg_type: this.msg_type,
      msg_data: value_serialized,
    }
  }
}

export class ModelChangedEvent extends DocumentChangedEvent {

  constructor(document: Document,
      readonly model: HasProps,
      readonly attr: string,
      readonly old: unknown,
      readonly new_: unknown,
      readonly hint?: DocumentChangedEvent) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model) &&
      cmp.eq(this.attr, that.attr) &&
      cmp.eq(this.old, that.old) &&
      cmp.eq(this.new_, that.new_) &&
      cmp.eq(this.hint, that.hint)
  }

  [serialize](serializer: Serializer): DocumentChanged {
    if (this.hint != null)
      return serializer.to_serializable(this.hint)

    const value = this.new_
    const value_serialized = serializer.to_serializable(value)

    if (this.model != value) {
      // we know we don't want a whole new copy of the obj we're
      // patching unless it's also the value itself
      serializer.remove_def(this.model)
    }

    return {
      kind: "ModelChanged",
      model: this.model.ref(),
      attr: this.attr,
      new: value_serialized,
    }
  }
}

export class ColumnsPatchedEvent extends DocumentChangedEvent {

  constructor(document: Document,
      readonly column_source: Ref,
      readonly patches: PatchSet<unknown>) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.column_source, that.column_source) &&
      cmp.eq(this.patches, that.patches)
  }

  [serialize](_serializer: Serializer): ColumnsPatched {
    return {
      kind: "ColumnsPatched",
      column_source: this.column_source,
      patches: this.patches,
    }
  }
}

export class ColumnsStreamedEvent extends DocumentChangedEvent {

  constructor(document: Document,
      readonly column_source: Ref,
      readonly data: Data,
      readonly rollover?: number) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.column_source, that.column_source) &&
      cmp.eq(this.data, that.data) &&
      cmp.eq(this.rollover, that.rollover)
  }

  [serialize](_serializer: Serializer): ColumnsStreamed {
    return {
      kind: "ColumnsStreamed",
      column_source: this.column_source,
      data: this.data,
      rollover: this.rollover,
    }
  }
}

export class TitleChangedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly title: string) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.title, that.title)
  }

  [serialize](_serializer: Serializer): TitleChanged {
    return {
      kind: "TitleChanged",
      title: this.title,
    }
  }
}

export class RootAddedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly model: HasProps) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model)
  }

  [serialize](serializer: Serializer): RootAdded {
    return {
      kind: "RootAdded",
      model: serializer.to_serializable(this.model),
    }
  }
}

export class RootRemovedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly model: HasProps) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model)
  }

  [serialize](_serializer: Serializer): RootRemoved {
    return {
      kind: "RootRemoved",
      model: this.model.ref(),
    }
  }
}
