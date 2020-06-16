import {Document} from "./document"
import {Data} from "core/types"
import {HasProps} from "core/has_props"
import {Ref} from "core/util/refs"
import {PatchSet} from "models/sources/column_data_source"

export interface ModelChanged {
  kind: "ModelChanged"
  model: Ref
  attr: string
  new: any
  hint?: any
}

export interface MessageSent {
  kind: "MessageSent"
  msg_type: string
  msg_data?: unknown
}

export interface TitleChanged {
  kind: "TitleChanged"
  title: string
}

export interface RootAdded {
  kind: "RootAdded"
  model: Ref
}

export interface RootRemoved {
  kind: "RootRemoved"
  model: Ref
}

export interface ColumnDataChanged {
  kind: "ColumnDataChanged"
  column_source: Ref
  cols?: any
  new: any
}

export interface ColumnsStreamed {
  kind: "ColumnsStreamed"
  column_source: Ref
  data: Data
  rollover?: number
}

export interface ColumnsPatched {
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

export abstract class DocumentChangedEvent extends DocumentEvent {
  abstract json(references: Set<HasProps>): DocumentChanged
}

export class MessageSentEvent extends DocumentChangedEvent {
  constructor(document: Document, readonly msg_type: string, readonly msg_data: unknown) {
    super(document)
  }

  json(_references: Set<HasProps>): DocumentChanged {
    const value = this.msg_data
    const value_json = HasProps._value_to_json(value)
    const value_refs = new Set<HasProps>()
    HasProps._value_record_references(value, value_refs, {recursive: true})
    /* XXX: this will cause all referenced models to be reinitialized
    for (const id in value_refs) {
      references[id] = value_refs[id]
    }
    */
    return {
      kind: "MessageSent",
      msg_type: this.msg_type,
      msg_data: value_json,
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
      readonly hint?: any) {
    super(document)
  }

  json(references: Set<HasProps>): DocumentChanged {
    if (this.attr === "id") {
      throw new Error("'id' field should never change, whatever code just set it is wrong")
    }

    if (this.hint != null)
      return this.hint.json(references)

    const value = this.new_
    const value_json = HasProps._value_to_json(value)
    const value_refs = new Set<HasProps>()
    HasProps._value_record_references(value, value_refs, {recursive: true})
    if (value_refs.has(this.model) && this.model !== value) {
      // we know we don't want a whole new copy of the obj we're
      // patching unless it's also the value itself
      value_refs.delete(this.model)
    }
    for (const ref of value_refs) {
      references.add(ref)
    }
    return {
      kind: "ModelChanged",
      model: this.model.ref(),
      attr: this.attr,
      new: value_json,
    }
  }
}

export class ColumnsPatchedEvent extends DocumentChangedEvent {

  constructor(document: Document,
      readonly column_source: Ref,
      readonly patches: PatchSet<unknown>) {
    super(document)
  }

  json(_references: Set<HasProps>): ColumnsPatched {
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

  json(_references: Set<HasProps>): ColumnsStreamed {
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

  json(_references: Set<HasProps>): TitleChanged {
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

  json(references: Set<HasProps>): RootAdded {
    HasProps._value_record_references(this.model, references, {recursive: true})
    return {
      kind: "RootAdded",
      model: this.model.ref(),
    }
  }
}

export class RootRemovedEvent extends DocumentChangedEvent {

  constructor(document: Document, readonly model: HasProps, readonly setter_id?: string) {
    super(document)
  }

  json(_references: Set<HasProps>): RootRemoved {
    return {
      kind: "RootRemoved",
      model: this.model.ref(),
    }
  }
}
