import {Model} from "../../model"
import * as dom from "core/dom"
import type * as p from "core/properties"

export namespace StyleSheet {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface StyleSheet extends StyleSheet.Attrs {}

export abstract class StyleSheet extends Model {
  declare properties: StyleSheet.Props

  constructor(attrs?: Partial<StyleSheet.Attrs>) {
    super(attrs)
  }

  abstract underlying(): dom.StyleSheet
}

export namespace InlineStyleSheet {
  export type Attrs = p.AttrsOf<Props>
  export type Props = StyleSheet.Props & {
    css: p.Property<string>
  }
}

export interface InlineStyleSheet extends InlineStyleSheet.Attrs {}

export class InlineStyleSheet extends StyleSheet {
  declare properties: InlineStyleSheet.Props

  constructor(attrs?: Partial<InlineStyleSheet.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InlineStyleSheet.Props>(({Str}) => ({
      css: [ Str ],
    }))
  }

  underlying(): dom.StyleSheet {
    return new dom.InlineStyleSheet(this.css)
  }
}

export namespace ImportedStyleSheet {
  export type Attrs = p.AttrsOf<Props>
  export type Props = StyleSheet.Props & {
    url: p.Property<string>
  }
}

export interface ImportedStyleSheet extends ImportedStyleSheet.Attrs {}

export class ImportedStyleSheet extends StyleSheet {
  declare properties: ImportedStyleSheet.Props

  constructor(attrs?: Partial<ImportedStyleSheet.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ImportedStyleSheet.Props>(({Str}) => ({
      url: [ Str ],
    }))
  }

  underlying(): dom.StyleSheet {
    return new dom.ImportedStyleSheet(this.url)
  }
}

export namespace GlobalInlineStyleSheet {
  export type Attrs = p.AttrsOf<Props>
  export type Props = InlineStyleSheet.Props
}

export interface GlobalInlineStyleSheet extends GlobalInlineStyleSheet.Attrs {}

export class GlobalInlineStyleSheet extends InlineStyleSheet {
  declare properties: GlobalInlineStyleSheet.Props

  constructor(attrs?: Partial<GlobalInlineStyleSheet.Attrs>) {
    super(attrs)
  }

  private _underlying: dom.StyleSheet | null = null

  override underlying(): dom.StyleSheet {
    if (this._underlying == null) {
      this._underlying = new dom.GlobalInlineStyleSheet(this.css)
    }
    return this._underlying
  }
}

export namespace GlobalImportedStyleSheet {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ImportedStyleSheet.Props
}

export interface GlobalImportedStyleSheet extends GlobalImportedStyleSheet.Attrs {}

export class GlobalImportedStyleSheet extends ImportedStyleSheet {
  declare properties: GlobalImportedStyleSheet.Props

  constructor(attrs?: Partial<GlobalImportedStyleSheet.Attrs>) {
    super(attrs)
  }

  private _underlying: dom.StyleSheet | null = null

  override underlying(): dom.StyleSheet {
    if (this._underlying == null) {
      this._underlying = new dom.GlobalImportedStyleSheet(this.url)
    }
    return this._underlying
  }
}
