import {XYGlyph, XYGlyphView} from "./xy_glyph"
import {BorderRadius, Padding, TextAnchorSpec} from "../common/kinds"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import * as p from "core/properties"

export abstract class TextBaseView extends XYGlyphView {
  declare model: TextBase
  declare visuals: TextBase.Visuals
}

export namespace TextBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    text: p.NullStringSpec
    angle: p.AngleSpec
    x_offset: p.NumberSpec
    y_offset: p.NumberSpec
    anchor: TextAnchorSpec
    padding: p.Property<Padding>
    border_radius: p.Property<BorderRadius>
  } & Mixins

  export type Mixins =
    mixins.TextVector &
    mixins.BorderLineVector &
    mixins.BackgroundFillVector &
    mixins.BackgroundHatchVector

  export type Visuals = XYGlyph.Visuals & {
    text: visuals.TextVector
    border_line: visuals.LineVector
    background_fill: visuals.FillVector
    background_hatch: visuals.HatchVector
  }
}

export interface TextBase extends TextBase.Attrs {}

export abstract class TextBase extends XYGlyph {
  declare properties: TextBase.Props
  declare __view_type__: TextBaseView

  constructor(attrs?: Partial<TextBase.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<TextBase.Mixins>([
      mixins.TextVector,
      ["border_",     mixins.LineVector],
      ["background_", mixins.FillVector],
      ["background_", mixins.HatchVector],
    ])

    this.define<TextBase.Props>(() => ({
      text: [ p.NullStringSpec, {field: "text"} ],
      angle: [ p.AngleSpec, 0 ],
      x_offset: [ p.NumberSpec, 0 ],
      y_offset: [ p.NumberSpec, 0 ],
      anchor: [ TextAnchorSpec, {value: "auto"} ],
      padding: [ Padding, 0 ],
      border_radius: [ BorderRadius, 0 ],
    }))

    this.override<TextBase.Props>({
      border_line_color: null,
      background_fill_color: null,
      background_hatch_color: null,
    })
  }
}
