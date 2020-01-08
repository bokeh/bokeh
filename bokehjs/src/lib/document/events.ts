import {Document, References} from "./document"
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
  msg_data: unknown
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
  patches: PatchSet
}

export type DocumentChanged =
  ModelChanged | MessageSent | TitleChanged | RootAdded | RootRemoved | ColumnDataChanged | ColumnsStreamed | ColumnsPatched

export abstract class DocumentChangedEvent {
  constructor(readonly document: Document) {}

  abstract json(references: References): DocumentChanged
}

export class MessageSentEvent extends DocumentChangedEvent {
  constructor(document: Document, readonly msg_type: string, readonly msg_data: unknown) {
    super(document)
  }

  json(_references: References): DocumentChanged {
    const value = this.msg_data
    const value_json = HasProps._value_to_json("", value, null)
    const value_refs: {[key: string]: HasProps} = {}
    HasProps._value_record_references(value, value_refs, true)
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
      readonly old: any,
      readonly new_: any,
      readonly setter_id?: string,
      readonly hint?: any) {
    super(document)
  }

  json(references: References): DocumentChanged {
    if (this.attr === "id") {
      throw new Error("'id' field should never change, whatever code just set it is wrong")
    }

    if (this.hint != null)
      return this.hint.json(references)

    const value = this.new_
    const value_json = HasProps._value_to_json(this.attr, value, this.model)
    const value_refs: {[key: string]: HasProps} = {}
    HasProps._value_record_references(value, value_refs, true) // true = recurse
    if (this.model.id in value_refs && this.model !== value) {
      // we know we don't want a whole new copy of the obj we're
      // patching unless it's also the value itself
      delete value_refs[this.model.id]
    }
    for (const id in value_refs) {
      references[id] = value_refs[id]
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
      readonly patches: PatchSet) {
    super(document)
  }

  json(_references: References): ColumnsPatched {
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

  json(_references: References): ColumnsStreamed {
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

  json(_references: References): TitleChanged {
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

  json(references: References): RootAdded {
    HasProps._value_record_references(this.model, references, true)
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

  json(_references: References): RootRemoved {
    return {
      kind: "RootRemoved",
      model: this.model.ref(),
    }
  }
}
