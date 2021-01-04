import {Document} from "./document"
import {Data} from "core/types"
import {HasProps} from "core/has_props"
import {Ref} from "core/util/refs"
import {PatchSet} from "models/sources/column_data_source"
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

export abstract class DocumentEvent {
  constructor(readonly document: Document) {}
}

export class DocumentEventBatch<T extends DocumentChangedEvent> extends DocumentEvent {
  constructor(document: Document, readonly events: T[], readonly setter_id?: string) {
    super(document)
  }
}

export abstract class DocumentChangedEvent extends DocumentEvent implements Serializable {
  abstract [serialize](serializer: Serializer): DocumentChanged
}

export class MessageSentEvent extends DocumentChangedEvent {
  constructor(document: Document, readonly msg_type: string, readonly msg_data: unknown) {
    super(document)
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
      readonly setter_id?: string,
      readonly hint?: DocumentChangedEvent) {
    super(document)
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

  constructor(document: Document, readonly title: string, readonly setter_id?: string) {
    super(document)
  }

  [serialize](_serializer: Serializer): TitleChanged {
    return {
      kind: "TitleChanged",
      title: this.title,
    }
  }
}

export class RootAddedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly model: HasProps, readonly setter_id?: string) {
    super(document)
  }

  [serialize](serializer: Serializer): RootAdded {
    return {
      kind: "RootAdded",
      model: serializer.to_serializable(this.model),
    }
  }
}

export class RootRemovedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly model: HasProps, readonly setter_id?: string) {
    super(document)
  }

  [serialize](_serializer: Serializer): RootRemoved {
    return {
      kind: "RootRemoved",
      model: this.model.ref(),
    }
  }
}
