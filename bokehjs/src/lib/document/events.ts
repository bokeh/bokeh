import {Document} from "./document"
import {Data} from "core/types"
import {HasProps} from "core/has_props"
import {Model} from "../model"
import {Ref} from "core/util/refs"
import {PatchSet} from "core/patching"
import {equals, Equatable, Comparator} from "core/util/eq"
import {serialize, Serializable, Serializer, ModelRep} from "core/serialization"

export type ModelChanged = {
  kind: "ModelChanged"
  model: Ref
  attr: string
  new: unknown
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
  model: ModelRep
}

export type RootRemoved = {
  kind: "RootRemoved"
  model: Ref
}

export type ColumnDataChanged = {
  kind: "ColumnDataChanged"
  model: Ref
  attr: string
  data: unknown // AnyVal
  cols?: string[]
}

export type ColumnsStreamed = {
  kind: "ColumnsStreamed"
  model: Ref
  attr: string
  data: unknown // AnyVal
  rollover?: number
}

export type ColumnsPatched = {
  kind: "ColumnsPatched"
  model: Ref
  attr: string
  patches: unknown // AnyVal
}

export type DocumentChanged =
  ModelChanged | MessageSent | TitleChanged | RootAdded | RootRemoved | ColumnDataChanged | ColumnsStreamed | ColumnsPatched

export namespace Decoded {
  export type ModelChanged = {
    kind: "ModelChanged"
    model: HasProps
    attr: string
    new: unknown
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
    model: HasProps
  }

  export type RootRemoved = {
    kind: "RootRemoved"
    model: HasProps
  }

  export type ColumnDataChanged = {
    kind: "ColumnDataChanged"
    model: HasProps
    attr: string
    data: Data
    cols?: string[]
  }

  export type ColumnsStreamed = {
    kind: "ColumnsStreamed"
    model: HasProps
    attr: string
    data: Data
    rollover?: number
  }

  export type ColumnsPatched = {
    kind: "ColumnsPatched"
    model: HasProps
    attr: string
    patches: PatchSet<unknown>
  }

  export type DocumentChanged =
    ModelChanged | MessageSent | TitleChanged | RootAdded | RootRemoved | ColumnDataChanged | ColumnsStreamed | ColumnsPatched
}

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
  readonly abstract kind: string
  abstract [serialize](serializer: Serializer): DocumentChanged
}

export class MessageSentEvent extends DocumentChangedEvent {
  kind = "MessageSent" as const

  constructor(document: Document, readonly msg_type: string, readonly msg_data: unknown) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.msg_type, that.msg_type) &&
      cmp.eq(this.msg_data, that.msg_data)
  }

  [serialize](serializer: Serializer): DocumentChanged {
    return {
      kind: this.kind,
      msg_type: this.msg_type,
      msg_data: serializer.encode(this.msg_data),
    }
  }
}

export class ModelChangedEvent extends DocumentChangedEvent {
  kind = "ModelChanged" as const

  constructor(document: Document,
      readonly model: HasProps,
      readonly attr: string,
      readonly value: unknown) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model) &&
      cmp.eq(this.attr, that.attr) &&
      cmp.eq(this.value, that.value)
  }

  [serialize](serializer: Serializer): DocumentChanged {
    return {
      kind: this.kind,
      model: this.model.ref(),
      attr: this.attr,
      new: serializer.encode(this.value),
    }
  }
}

export class ColumnDataChangedEvent extends DocumentChangedEvent {
  kind = "ColumnDataChanged" as const

  constructor(document: Document,
      readonly model: HasProps,
      readonly attr: string,
      readonly data: Data,
      readonly cols?: string[]) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model) &&
      cmp.eq(this.attr, that.attr) &&
      cmp.eq(this.data, that.data) &&
      cmp.eq(this.cols, that.cols)
  }

  [serialize](serializer: Serializer): ColumnDataChanged {
    return {
      kind: this.kind,
      model: this.model.ref(),
      attr: this.attr,
      data: serializer.encode(this.data),
      cols: this.cols,
    }
  }
}

export class ColumnsStreamedEvent extends DocumentChangedEvent {
  kind = "ColumnsStreamed" as const

  constructor(document: Document,
      readonly model: HasProps,
      readonly attr: string,
      readonly data: Data,
      readonly rollover?: number) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model) &&
      cmp.eq(this.attr, that.attr) &&
      cmp.eq(this.data, that.data) &&
      cmp.eq(this.rollover, that.rollover)
  }

  [serialize](serializer: Serializer): ColumnsStreamed {
    return {
      kind: this.kind,
      model: this.model.ref(),
      attr: this.attr,
      data: serializer.encode(this.data),
      rollover: this.rollover,
    }
  }
}

export class ColumnsPatchedEvent extends DocumentChangedEvent {
  kind = "ColumnsPatched" as const

  constructor(document: Document,
      readonly model: HasProps,
      readonly attr: string,
      readonly patches: PatchSet<unknown>) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model) &&
      cmp.eq(this.attr, that.attr) &&
      cmp.eq(this.patches, that.patches)
  }

  [serialize](serializer: Serializer): ColumnsPatched {
    return {
      kind: this.kind,
      attr: this.attr,
      model: this.model.ref(),
      patches: serializer.encode(this.patches),
    }
  }
}

export class TitleChangedEvent extends DocumentChangedEvent {
  kind = "TitleChanged" as const

  constructor(document: Document, readonly title: string) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.title, that.title)
  }

  [serialize](_serializer: Serializer): TitleChanged {
    return {
      kind: this.kind,
      title: this.title,
    }
  }
}

export class RootAddedEvent extends DocumentChangedEvent {
  kind = "RootAdded" as const

  constructor(document: Document, readonly model: HasProps) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model)
  }

  [serialize](serializer: Serializer): RootAdded {
    return {
      kind: this.kind,
      model: serializer.encode(this.model),
    }
  }
}

export class RootRemovedEvent extends DocumentChangedEvent {
  kind = "RootRemoved" as const

  constructor(document: Document, readonly model: HasProps) {
    super(document)
  }

  override [equals](that: this, cmp: Comparator): boolean {
    return super[equals](that, cmp) &&
      cmp.eq(this.model, that.model)
  }

  [serialize](_serializer: Serializer): RootRemoved {
    return {
      kind: this.kind,
      model: this.model.ref(),
    }
  }
}
