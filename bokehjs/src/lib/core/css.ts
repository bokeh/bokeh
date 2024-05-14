import {logger} from "core/logging"
import type {Dict} from "core/types"
import {entries} from "core/util/object"
import {isString, isPlainObject} from "core/util/types"
import type {Styles} from "models/dom/styles"

export type GlobalValues = "inherit" | "initial" | "revert" | "revert-layer" | "unset"
export type FlexDirection = GlobalValues | "row" | "row-reverse" | "column" | "column-reverse"
export type Position = GlobalValues | "static" | "relative" | "absolute" | "fixed" | "sticky"
export type Display =
  GlobalValues | "block" | "inline" | "inline-block" | "flex" | "inline-flex" |
  "grid" | "inline-grid" | "table" | "inline-table" | "flow-root" | "none" | "contents"

type CSSStylesCamel = {
  accentColor?: string | null
  alignContent?: string | null
  alignItems?: string | null
  alignSelf?: string | null
  alignmentBaseline?: string | null
  all?: string | null
  animation?: string | null
  animationDelay?: string | null
  animationDirection?: string | null
  animationDuration?: string | null
  animationFillMode?: string | null
  animationIterationCount?: string | null
  animationName?: string | null
  animationPlayState?: string | null
  animationTimingFunction?: string | null
  appearance?: string | null
  aspectRatio?: string | null
  backfaceVisibility?: string | null
  background?: string | null
  backgroundAttachment?: string | null
  backgroundBlendMode?: string | null
  backgroundClip?: string | null
  backgroundColor?: string | null
  backgroundImage?: string | null
  backgroundOrigin?: string | null
  backgroundPosition?: string | null
  backgroundPositionX?: string | null
  backgroundPositionY?: string | null
  backgroundRepeat?: string | null
  backgroundSize?: string | null
  baselineShift?: string | null
  blockSize?: string | null
  border?: string | null
  borderBlock?: string | null
  borderBlockColor?: string | null
  borderBlockEnd?: string | null
  borderBlockEndColor?: string | null
  borderBlockEndStyle?: string | null
  borderBlockEndWidth?: string | null
  borderBlockStart?: string | null
  borderBlockStartColor?: string | null
  borderBlockStartStyle?: string | null
  borderBlockStartWidth?: string | null
  borderBlockStyle?: string | null
  borderBlockWidth?: string | null
  borderBottom?: string | null
  borderBottomColor?: string | null
  borderBottomLeftRadius?: string | null
  borderBottomRightRadius?: string | null
  borderBottomStyle?: string | null
  borderBottomWidth?: string | null
  borderCollapse?: string | null
  borderColor?: string | null
  borderEndEndRadius?: string | null
  borderEndStartRadius?: string | null
  borderImage?: string | null
  borderImageOutset?: string | null
  borderImageRepeat?: string | null
  borderImageSlice?: string | null
  borderImageSource?: string | null
  borderImageWidth?: string | null
  borderInline?: string | null
  borderInlineColor?: string | null
  borderInlineEnd?: string | null
  borderInlineEndColor?: string | null
  borderInlineEndStyle?: string | null
  borderInlineEndWidth?: string | null
  borderInlineStart?: string | null
  borderInlineStartColor?: string | null
  borderInlineStartStyle?: string | null
  borderInlineStartWidth?: string | null
  borderInlineStyle?: string | null
  borderInlineWidth?: string | null
  borderLeft?: string | null
  borderLeftColor?: string | null
  borderLeftStyle?: string | null
  borderLeftWidth?: string | null
  borderRadius?: string | null
  borderRight?: string | null
  borderRightColor?: string | null
  borderRightStyle?: string | null
  borderRightWidth?: string | null
  borderSpacing?: string | null
  borderStartEndRadius?: string | null
  borderStartStartRadius?: string | null
  borderStyle?: string | null
  borderTop?: string | null
  borderTopColor?: string | null
  borderTopLeftRadius?: string | null
  borderTopRightRadius?: string | null
  borderTopStyle?: string | null
  borderTopWidth?: string | null
  borderWidth?: string | null
  bottom?: string | null
  boxShadow?: string | null
  boxSizing?: string | null
  breakAfter?: string | null
  breakBefore?: string | null
  breakInside?: string | null
  captionSide?: string | null
  caretColor?: string | null
  clear?: string | null
  /** @deprecated */
  clip?: string | null
  clipPath?: string | null
  clipRule?: string | null
  color?: string | null
  colorInterpolation?: string | null
  colorInterpolationFilters?: string | null
  colorScheme?: string | null
  columnCount?: string | null
  columnFill?: string | null
  columnGap?: string | null
  columnRule?: string | null
  columnRuleColor?: string | null
  columnRuleStyle?: string | null
  columnRuleWidth?: string | null
  columnSpan?: string | null
  columnWidth?: string | null
  columns?: string | null
  contain?: string | null
  content?: string | null
  counterIncrement?: string | null
  counterReset?: string | null
  counterSet?: string | null
  cursor?: string | null
  direction?: string | null
  display?: string /*Display*/ | null
  dominantBaseline?: string | null
  emptyCells?: string | null
  fill?: string | null
  fillOpacity?: string | null
  fillRule?: string | null
  filter?: string | null
  flex?: string | null
  flexBasis?: string | null
  flexDirection?: string /*FlexDirection*/ | null
  flexFlow?: string | null
  flexGrow?: string | null
  flexShrink?: string | null
  flexWrap?: string | null
  float?: string | null
  floodColor?: string | null
  floodOpacity?: string | null
  font?: string | null
  fontFamily?: string | null
  fontFeatureSettings?: string | null
  fontKerning?: string | null
  fontOpticalSizing?: string | null
  fontSize?: string | null
  fontSizeAdjust?: string | null
  fontStretch?: string | null
  fontStyle?: string | null
  fontSynthesis?: string | null
  fontVariant?: string | null
  /** @deprecated */
  fontVariantAlternates?: string | null
  fontVariantCaps?: string | null
  fontVariantEastAsian?: string | null
  fontVariantLigatures?: string | null
  fontVariantNumeric?: string | null
  fontVariantPosition?: string | null
  fontVariationSettings?: string | null
  fontWeight?: string | null
  gap?: string | null
  grid?: string | null
  gridArea?: string | null
  gridAutoColumns?: string | null
  gridAutoFlow?: string | null
  gridAutoRows?: string | null
  gridColumn?: string | null
  gridColumnEnd?: string | null
  /** @deprecated This is a legacy alias of `columnGap`. */
  gridColumnGap?: string | null
  gridColumnStart?: string | null
  /** @deprecated This is a legacy alias of `gap`. */
  gridGap?: string | null
  gridRow?: string | null
  gridRowEnd?: string | null
  /** @deprecated This is a legacy alias of `rowGap`. */
  gridRowGap?: string | null
  gridRowStart?: string | null
  gridTemplate?: string | null
  gridTemplateAreas?: string | null
  gridTemplateColumns?: string | null
  gridTemplateRows?: string | null
  height?: string | null
  hyphens?: string | null
  /** @deprecated */
  imageOrientation?: string | null
  imageRendering?: string | null
  inlineSize?: string | null
  inset?: string | null
  insetBlock?: string | null
  insetBlockEnd?: string | null
  insetBlockStart?: string | null
  insetInline?: string | null
  insetInlineEnd?: string | null
  insetInlineStart?: string | null
  isolation?: string | null
  justifyContent?: string | null
  justifyItems?: string | null
  justifySelf?: string | null
  left?: string | null
  letterSpacing?: string | null
  lightingColor?: string | null
  lineBreak?: string | null
  lineHeight?: string | null
  listStyle?: string | null
  listStyleImage?: string | null
  listStylePosition?: string | null
  listStyleType?: string | null
  margin?: string | null
  marginBlock?: string | null
  marginBlockEnd?: string | null
  marginBlockStart?: string | null
  marginBottom?: string | null
  marginInline?: string | null
  marginInlineEnd?: string | null
  marginInlineStart?: string | null
  marginLeft?: string | null
  marginRight?: string | null
  marginTop?: string | null
  marker?: string | null
  markerEnd?: string | null
  markerMid?: string | null
  markerStart?: string | null
  mask?: string | null
  maskType?: string | null
  maxBlockSize?: string | null
  maxHeight?: string | null
  maxInlineSize?: string | null
  maxWidth?: string | null
  minBlockSize?: string | null
  minHeight?: string | null
  minInlineSize?: string | null
  minWidth?: string | null
  mixBlendMode?: string | null
  objectFit?: string | null
  objectPosition?: string | null
  offset?: string | null
  offsetAnchor?: string | null
  offsetDistance?: string | null
  offsetPath?: string | null
  offsetRotate?: string | null
  opacity?: string | null
  order?: string | null
  orphans?: string | null
  outline?: string | null
  outlineColor?: string | null
  outlineOffset?: string | null
  outlineStyle?: string | null
  outlineWidth?: string | null
  overflow?: string | null
  overflowAnchor?: string | null
  overflowWrap?: string | null
  overflowX?: string | null
  overflowY?: string | null
  overscrollBehavior?: string | null
  overscrollBehaviorBlock?: string | null
  overscrollBehaviorInline?: string | null
  overscrollBehaviorX?: string | null
  overscrollBehaviorY?: string | null
  padding?: string | null
  paddingBlock?: string | null
  paddingBlockEnd?: string | null
  paddingBlockStart?: string | null
  paddingBottom?: string | null
  paddingInline?: string | null
  paddingInlineEnd?: string | null
  paddingInlineStart?: string | null
  paddingLeft?: string | null
  paddingRight?: string | null
  paddingTop?: string | null
  pageBreakAfter?: string | null
  pageBreakBefore?: string | null
  pageBreakInside?: string | null
  paintOrder?: string | null
  perspective?: string | null
  perspectiveOrigin?: string | null
  placeContent?: string | null
  placeItems?: string | null
  placeSelf?: string | null
  pointerEvents?: string | null
  position?: string /*Position*/ | null
  quotes?: string | null
  resize?: string | null
  right?: string | null
  rotate?: string | null
  rowGap?: string | null
  rubyPosition?: string | null
  scale?: string | null
  scrollBehavior?: string | null
  scrollMargin?: string | null
  scrollMarginBlock?: string | null
  scrollMarginBlockEnd?: string | null
  scrollMarginBlockStart?: string | null
  scrollMarginBottom?: string | null
  scrollMarginInline?: string | null
  scrollMarginInlineEnd?: string | null
  scrollMarginInlineStart?: string | null
  scrollMarginLeft?: string | null
  scrollMarginRight?: string | null
  scrollMarginTop?: string | null
  scrollPadding?: string | null
  scrollPaddingBlock?: string | null
  scrollPaddingBlockEnd?: string | null
  scrollPaddingBlockStart?: string | null
  scrollPaddingBottom?: string | null
  scrollPaddingInline?: string | null
  scrollPaddingInlineEnd?: string | null
  scrollPaddingInlineStart?: string | null
  scrollPaddingLeft?: string | null
  scrollPaddingRight?: string | null
  scrollPaddingTop?: string | null
  scrollSnapAlign?: string | null
  scrollSnapStop?: string | null
  scrollSnapType?: string | null
  scrollbarGutter?: string | null
  shapeImageThreshold?: string | null
  shapeMargin?: string | null
  shapeOutside?: string | null
  shapeRendering?: string | null
  stopColor?: string | null
  stopOpacity?: string | null
  stroke?: string | null
  strokeDasharray?: string | null
  strokeDashoffset?: string | null
  strokeLinecap?: string | null
  strokeLinejoin?: string | null
  strokeMiterlimit?: string | null
  strokeOpacity?: string | null
  strokeWidth?: string | null
  tabSize?: string | null
  tableLayout?: string | null
  textAlign?: string | null
  textAlignLast?: string | null
  textAnchor?: string | null
  textCombineUpright?: string | null
  textDecoration?: string | null
  textDecorationColor?: string | null
  textDecorationLine?: string | null
  textDecorationSkipInk?: string | null
  textDecorationStyle?: string | null
  textDecorationThickness?: string | null
  textEmphasis?: string | null
  textEmphasisColor?: string | null
  textEmphasisPosition?: string | null
  textEmphasisStyle?: string | null
  textIndent?: string | null
  textOrientation?: string | null
  textOverflow?: string | null
  textRendering?: string | null
  textShadow?: string | null
  textTransform?: string | null
  textUnderlineOffset?: string | null
  textUnderlinePosition?: string | null
  top?: string | null
  touchAction?: string | null
  transform?: string | null
  transformBox?: string | null
  transformOrigin?: string | null
  transformStyle?: string | null
  transition?: string | null
  transitionDelay?: string | null
  transitionDuration?: string | null
  transitionProperty?: string | null
  transitionTimingFunction?: string | null
  translate?: string | null
  unicodeBidi?: string | null
  userSelect?: string | null
  verticalAlign?: string | null
  visibility?: string | null
  whiteSpace?: string | null
  widows?: string | null
  width?: string | null
  willChange?: string | null
  wordBreak?: string | null
  wordSpacing?: string | null
  /** @deprecated */
  wordWrap?: string | null
  writingMode?: string | null
  zIndex?: string | null
}

type CSSStylesDashed = {
  "accent-color"?: CSSStylesCamel["accentColor"]
  "align-content"?: CSSStylesCamel["alignContent"]
  "align-items"?: CSSStylesCamel["alignItems"]
  "align-self"?: CSSStylesCamel["alignSelf"]
  "alignment-baseline"?: CSSStylesCamel["alignmentBaseline"]
  "all"?: CSSStylesCamel["all"]
  "animation"?: CSSStylesCamel["animation"]
  "animation-delay"?: CSSStylesCamel["animationDelay"]
  "animation-direction"?: CSSStylesCamel["animationDirection"]
  "animation-duration"?: CSSStylesCamel["animationDuration"]
  "animation-fill-mode"?: CSSStylesCamel["animationFillMode"]
  "animation-iteration-count"?: CSSStylesCamel["animationIterationCount"]
  "animation-name"?: CSSStylesCamel["animationName"]
  "animation-play-state"?: CSSStylesCamel["animationPlayState"]
  "animation-timing-function"?: CSSStylesCamel["animationTimingFunction"]
  "appearance"?: CSSStylesCamel["appearance"]
  "aspect-ratio"?: CSSStylesCamel["aspectRatio"]
  "backface-visibility"?: CSSStylesCamel["backfaceVisibility"]
  "background"?: CSSStylesCamel["background"]
  "background-attachment"?: CSSStylesCamel["backgroundAttachment"]
  "background-blend-mode"?: CSSStylesCamel["backgroundBlendMode"]
  "background-clip"?: CSSStylesCamel["backgroundClip"]
  "background-color"?: CSSStylesCamel["backgroundColor"]
  "background-image"?: CSSStylesCamel["backgroundImage"]
  "background-origin"?: CSSStylesCamel["backgroundOrigin"]
  "background-position"?: CSSStylesCamel["backgroundPosition"]
  "background-position-x"?: CSSStylesCamel["backgroundPositionX"]
  "background-position-y"?: CSSStylesCamel["backgroundPositionY"]
  "background-repeat"?: CSSStylesCamel["backgroundRepeat"]
  "background-size"?: CSSStylesCamel["backgroundSize"]
  "baseline-shift"?: CSSStylesCamel["baselineShift"]
  "block-size"?: CSSStylesCamel["blockSize"]
  "border"?: CSSStylesCamel["border"]
  "border-block"?: CSSStylesCamel["borderBlock"]
  "border-block-color"?: CSSStylesCamel["borderBlockColor"]
  "border-block-end"?: CSSStylesCamel["borderBlockEnd"]
  "border-block-end-color"?: CSSStylesCamel["borderBlockEndColor"]
  "border-block-end-style"?: CSSStylesCamel["borderBlockEndStyle"]
  "border-block-end-width"?: CSSStylesCamel["borderBlockEndWidth"]
  "border-block-start"?: CSSStylesCamel["borderBlockStart"]
  "border-block-start-color"?: CSSStylesCamel["borderBlockStartColor"]
  "border-block-start-style"?: CSSStylesCamel["borderBlockStartStyle"]
  "border-block-start-width"?: CSSStylesCamel["borderBlockStartWidth"]
  "border-block-style"?: CSSStylesCamel["borderBlockStyle"]
  "border-block-width"?: CSSStylesCamel["borderBlockWidth"]
  "border-bottom"?: CSSStylesCamel["borderBottom"]
  "border-bottom-color"?: CSSStylesCamel["borderBottomColor"]
  "border-bottom-left-radius"?: CSSStylesCamel["borderBottomLeftRadius"]
  "border-bottom-right-radius"?: CSSStylesCamel["borderBottomRightRadius"]
  "border-bottom-style"?: CSSStylesCamel["borderBottomStyle"]
  "border-bottom-width"?: CSSStylesCamel["borderBottomWidth"]
  "border-collapse"?: CSSStylesCamel["borderCollapse"]
  "border-color"?: CSSStylesCamel["borderColor"]
  "border-end-end-radius"?: CSSStylesCamel["borderEndEndRadius"]
  "border-end-start-radius"?: CSSStylesCamel["borderEndStartRadius"]
  "border-image"?: CSSStylesCamel["borderImage"]
  "border-image-outset"?: CSSStylesCamel["borderImageOutset"]
  "border-image-repeat"?: CSSStylesCamel["borderImageRepeat"]
  "border-image-slice"?: CSSStylesCamel["borderImageSlice"]
  "border-image-source"?: CSSStylesCamel["borderImageSource"]
  "border-image-width"?: CSSStylesCamel["borderImageWidth"]
  "border-inline"?: CSSStylesCamel["borderInline"]
  "border-inline-color"?: CSSStylesCamel["borderInlineColor"]
  "border-inline-end"?: CSSStylesCamel["borderInlineEnd"]
  "border-inline-end-color"?: CSSStylesCamel["borderInlineEndColor"]
  "border-inline-end-style"?: CSSStylesCamel["borderInlineEndStyle"]
  "border-inline-end-width"?: CSSStylesCamel["borderInlineEndWidth"]
  "border-inline-start"?: CSSStylesCamel["borderInlineStart"]
  "border-inline-start-color"?: CSSStylesCamel["borderInlineStartColor"]
  "border-inline-start-style"?: CSSStylesCamel["borderInlineStartStyle"]
  "border-inline-start-width"?: CSSStylesCamel["borderInlineStartWidth"]
  "border-inline-style"?: CSSStylesCamel["borderInlineStyle"]
  "border-inline-width"?: CSSStylesCamel["borderInlineWidth"]
  "border-left"?: CSSStylesCamel["borderLeft"]
  "border-left-color"?: CSSStylesCamel["borderLeftColor"]
  "border-left-style"?: CSSStylesCamel["borderLeftStyle"]
  "border-left-width"?: CSSStylesCamel["borderLeftWidth"]
  "border-radius"?: CSSStylesCamel["borderRadius"]
  "border-right"?: CSSStylesCamel["borderRight"]
  "border-right-color"?: CSSStylesCamel["borderRightColor"]
  "border-right-style"?: CSSStylesCamel["borderRightStyle"]
  "border-right-width"?: CSSStylesCamel["borderRightWidth"]
  "border-spacing"?: CSSStylesCamel["borderSpacing"]
  "border-start-end-radius"?: CSSStylesCamel["borderStartEndRadius"]
  "border-start-start-radius"?: CSSStylesCamel["borderStartStartRadius"]
  "border-style"?: CSSStylesCamel["borderStyle"]
  "border-top"?: CSSStylesCamel["borderTop"]
  "border-top-color"?: CSSStylesCamel["borderTopColor"]
  "border-top-left-radius"?: CSSStylesCamel["borderTopLeftRadius"]
  "border-top-right-radius"?: CSSStylesCamel["borderTopRightRadius"]
  "border-top-style"?: CSSStylesCamel["borderTopStyle"]
  "border-top-width"?: CSSStylesCamel["borderTopWidth"]
  "border-width"?: CSSStylesCamel["borderWidth"]
  "bottom"?: CSSStylesCamel["bottom"]
  "box-shadow"?: CSSStylesCamel["boxShadow"]
  "box-sizing"?: CSSStylesCamel["boxSizing"]
  "break-after"?: CSSStylesCamel["breakAfter"]
  "break-before"?: CSSStylesCamel["breakBefore"]
  "break-inside"?: CSSStylesCamel["breakInside"]
  "caption-side"?: CSSStylesCamel["captionSide"]
  "caret-color"?: CSSStylesCamel["caretColor"]
  "clear"?: CSSStylesCamel["clear"]
  /** @deprecated */
  "clip"?: CSSStylesCamel["clip"]
  "clip-path"?: CSSStylesCamel["clipPath"]
  "clip-rule"?: CSSStylesCamel["clipRule"]
  "color"?: CSSStylesCamel["color"]
  "color-interpolation"?: CSSStylesCamel["colorInterpolation"]
  "color-interpolation-filters"?: CSSStylesCamel["colorInterpolationFilters"]
  "color-scheme"?: CSSStylesCamel["colorScheme"]
  "column-count"?: CSSStylesCamel["columnCount"]
  "column-fill"?: CSSStylesCamel["columnFill"]
  "column-gap"?: CSSStylesCamel["columnGap"]
  "column-rule"?: CSSStylesCamel["columnRule"]
  "column-rule-color"?: CSSStylesCamel["columnRuleColor"]
  "column-rule-style"?: CSSStylesCamel["columnRuleStyle"]
  "column-rule-width"?: CSSStylesCamel["columnRuleWidth"]
  "column-span"?: CSSStylesCamel["columnSpan"]
  "column-width"?: CSSStylesCamel["columnWidth"]
  "columns"?: CSSStylesCamel["columns"]
  "contain"?: CSSStylesCamel["contain"]
  "content"?: CSSStylesCamel["content"]
  "counter-increment"?: CSSStylesCamel["counterIncrement"]
  "counter-reset"?: CSSStylesCamel["counterReset"]
  "counter-set"?: CSSStylesCamel["counterSet"]
  "cursor"?: CSSStylesCamel["cursor"]
  "direction"?: CSSStylesCamel["direction"]
  "display"?: CSSStylesCamel["display"]
  "dominant-baseline"?: CSSStylesCamel["dominantBaseline"]
  "empty-cells"?: CSSStylesCamel["emptyCells"]
  "fill"?: CSSStylesCamel["fill"]
  "fill-opacity"?: CSSStylesCamel["fillOpacity"]
  "fill-rule"?: CSSStylesCamel["fillRule"]
  "filter"?: CSSStylesCamel["filter"]
  "flex"?: CSSStylesCamel["flex"]
  "flex-basis"?: CSSStylesCamel["flexBasis"]
  "flex-direction"?: CSSStylesCamel["flexDirection"]
  "flex-flow"?: CSSStylesCamel["flexFlow"]
  "flex-grow"?: CSSStylesCamel["flexGrow"]
  "flex-shrink"?: CSSStylesCamel["flexShrink"]
  "flex-wrap"?: CSSStylesCamel["flexWrap"]
  "float"?: CSSStylesCamel["float"]
  "flood-color"?: CSSStylesCamel["floodColor"]
  "flood-opacity"?: CSSStylesCamel["floodOpacity"]
  "font"?: CSSStylesCamel["font"]
  "font-family"?: CSSStylesCamel["fontFamily"]
  "font-feature-settings"?: CSSStylesCamel["fontFeatureSettings"]
  "font-kerning"?: CSSStylesCamel["fontKerning"]
  "font-optical-sizing"?: CSSStylesCamel["fontOpticalSizing"]
  "font-size"?: CSSStylesCamel["fontSize"]
  "font-size-adjust"?: CSSStylesCamel["fontSizeAdjust"]
  "font-stretch"?: CSSStylesCamel["fontStretch"]
  "font-style"?: CSSStylesCamel["fontStyle"]
  "font-synthesis"?: CSSStylesCamel["fontSynthesis"]
  "font-variant"?: CSSStylesCamel["fontVariant"]
  /** @deprecated */
  "font-variant-alternates"?: CSSStylesCamel["fontVariantAlternates"]
  "font-variant-caps"?: CSSStylesCamel["fontVariantCaps"]
  "font-variant-east-asian"?: CSSStylesCamel["fontVariantEastAsian"]
  "font-variant-ligatures"?: CSSStylesCamel["fontVariantLigatures"]
  "font-variant-numeric"?: CSSStylesCamel["fontVariantNumeric"]
  "font-variant-position"?: CSSStylesCamel["fontVariantPosition"]
  "font-variation-settings"?: CSSStylesCamel["fontVariationSettings"]
  "font-weight"?: CSSStylesCamel["fontWeight"]
  "gap"?: CSSStylesCamel["gap"]
  "grid"?: CSSStylesCamel["grid"]
  "grid-area"?: CSSStylesCamel["gridArea"]
  "grid-auto-columns"?: CSSStylesCamel["gridAutoColumns"]
  "grid-auto-flow"?: CSSStylesCamel["gridAutoFlow"]
  "grid-auto-rows"?: CSSStylesCamel["gridAutoRows"]
  "grid-column"?: CSSStylesCamel["gridColumn"]
  "grid-column-end"?: CSSStylesCamel["gridColumnEnd"]
  /** @deprecated This is a legacy alias of `column-gap`. */
  "grid-column-gap"?: CSSStylesCamel["gridColumnGap"]
  "grid-column-start"?: CSSStylesCamel["gridColumnStart"]
  /** @deprecated This is a legacy alias of `gap`. */
  "grid-gap"?: CSSStylesCamel["gridGap"]
  "grid-row"?: CSSStylesCamel["gridRow"]
  "grid-row-end"?: CSSStylesCamel["gridRowEnd"]
  /** @deprecated This is a legacy alias of `row-gap`. */
  "grid-row-gap"?: CSSStylesCamel["gridRowGap"]
  "grid-row-start"?: CSSStylesCamel["gridRowStart"]
  "grid-template"?: CSSStylesCamel["gridTemplate"]
  "grid-template-areas"?: CSSStylesCamel["gridTemplateAreas"]
  "grid-template-columns"?: CSSStylesCamel["gridTemplateColumns"]
  "grid-template-rows"?: CSSStylesCamel["gridTemplateRows"]
  "height"?: CSSStylesCamel["height"]
  "hyphens"?: CSSStylesCamel["hyphens"]
  /** @deprecated */
  "image-orientation"?: CSSStylesCamel["imageOrientation"]
  "image-rendering"?: CSSStylesCamel["imageRendering"]
  "inline-size"?: CSSStylesCamel["inlineSize"]
  "inset"?: CSSStylesCamel["inset"]
  "inset-block"?: CSSStylesCamel["insetBlock"]
  "inset-block-end"?: CSSStylesCamel["insetBlockEnd"]
  "inset-block-start"?: CSSStylesCamel["insetBlockStart"]
  "inset-inline"?: CSSStylesCamel["insetInline"]
  "inset-inline-end"?: CSSStylesCamel["insetInlineEnd"]
  "inset-inline-start"?: CSSStylesCamel["insetInlineStart"]
  "isolation"?: CSSStylesCamel["isolation"]
  "justify-content"?: CSSStylesCamel["justifyContent"]
  "justify-items"?: CSSStylesCamel["justifyItems"]
  "justify-self"?: CSSStylesCamel["justifySelf"]
  "left"?: CSSStylesCamel["left"]
  "letter-spacing"?: CSSStylesCamel["letterSpacing"]
  "lighting-color"?: CSSStylesCamel["lightingColor"]
  "line-break"?: CSSStylesCamel["lineBreak"]
  "line-height"?: CSSStylesCamel["lineHeight"]
  "list-style"?: CSSStylesCamel["listStyle"]
  "list-style-image"?: CSSStylesCamel["listStyleImage"]
  "list-style-position"?: CSSStylesCamel["listStylePosition"]
  "list-style-type"?: CSSStylesCamel["listStyleType"]
  "margin"?: CSSStylesCamel["margin"]
  "margin-block"?: CSSStylesCamel["marginBlock"]
  "margin-block-end"?: CSSStylesCamel["marginBlockEnd"]
  "margin-block-start"?: CSSStylesCamel["marginBlockStart"]
  "margin-bottom"?: CSSStylesCamel["marginBottom"]
  "margin-inline"?: CSSStylesCamel["marginInline"]
  "margin-inline-end"?: CSSStylesCamel["marginInlineEnd"]
  "margin-inline-start"?: CSSStylesCamel["marginInlineStart"]
  "margin-left"?: CSSStylesCamel["marginLeft"]
  "margin-right"?: CSSStylesCamel["marginRight"]
  "margin-top"?: CSSStylesCamel["marginTop"]
  "marker"?: CSSStylesCamel["marker"]
  "marker-end"?: CSSStylesCamel["markerEnd"]
  "marker-mid"?: CSSStylesCamel["markerMid"]
  "marker-start"?: CSSStylesCamel["markerStart"]
  "mask"?: CSSStylesCamel["mask"]
  "mask-type"?: CSSStylesCamel["maskType"]
  "max-block-size"?: CSSStylesCamel["maxBlockSize"]
  "max-height"?: CSSStylesCamel["maxHeight"]
  "max-inline-size"?: CSSStylesCamel["maxInlineSize"]
  "max-width"?: CSSStylesCamel["maxWidth"]
  "min-block-size"?: CSSStylesCamel["minBlockSize"]
  "min-height"?: CSSStylesCamel["minHeight"]
  "min-inline-size"?: CSSStylesCamel["minInlineSize"]
  "min-width"?: CSSStylesCamel["minWidth"]
  "mix-blend-mode"?: CSSStylesCamel["mixBlendMode"]
  "object-fit"?: CSSStylesCamel["objectFit"]
  "object-position"?: CSSStylesCamel["objectPosition"]
  "offset"?: CSSStylesCamel["offset"]
  "offset-anchor"?: CSSStylesCamel["offsetAnchor"]
  "offset-distance"?: CSSStylesCamel["offsetDistance"]
  "offset-path"?: CSSStylesCamel["offsetPath"]
  "offset-rotate"?: CSSStylesCamel["offsetRotate"]
  "opacity"?: CSSStylesCamel["opacity"]
  "order"?: CSSStylesCamel["order"]
  "orphans"?: CSSStylesCamel["orphans"]
  "outline"?: CSSStylesCamel["outline"]
  "outline-color"?: CSSStylesCamel["outlineColor"]
  "outline-offset"?: CSSStylesCamel["outlineOffset"]
  "outline-style"?: CSSStylesCamel["outlineStyle"]
  "outline-width"?: CSSStylesCamel["outlineWidth"]
  "overflow"?: CSSStylesCamel["overflow"]
  "overflow-anchor"?: CSSStylesCamel["overflowAnchor"]
  "overflow-wrap"?: CSSStylesCamel["overflowWrap"]
  "overflow-x"?: CSSStylesCamel["overflowX"]
  "overflow-y"?: CSSStylesCamel["overflowY"]
  "overscroll-behavior"?: CSSStylesCamel["overscrollBehavior"]
  "overscroll-behavior-block"?: CSSStylesCamel["overscrollBehaviorBlock"]
  "overscroll-behavior-inline"?: CSSStylesCamel["overscrollBehaviorInline"]
  "overscroll-behavior-x"?: CSSStylesCamel["overscrollBehaviorX"]
  "overscroll-behavior-y"?: CSSStylesCamel["overscrollBehaviorY"]
  "padding"?: CSSStylesCamel["padding"]
  "padding-block"?: CSSStylesCamel["paddingBlock"]
  "padding-block-end"?: CSSStylesCamel["paddingBlockEnd"]
  "padding-block-start"?: CSSStylesCamel["paddingBlockStart"]
  "padding-bottom"?: CSSStylesCamel["paddingBottom"]
  "padding-inline"?: CSSStylesCamel["paddingInline"]
  "padding-inline-end"?: CSSStylesCamel["paddingInlineEnd"]
  "padding-inline-start"?: CSSStylesCamel["paddingInlineStart"]
  "padding-left"?: CSSStylesCamel["paddingLeft"]
  "padding-right"?: CSSStylesCamel["paddingRight"]
  "padding-top"?: CSSStylesCamel["paddingTop"]
  "page-break-after"?: CSSStylesCamel["pageBreakAfter"]
  "page-break-before"?: CSSStylesCamel["pageBreakBefore"]
  "page-break-inside"?: CSSStylesCamel["pageBreakInside"]
  "paint-order"?: CSSStylesCamel["paintOrder"]
  "perspective"?: CSSStylesCamel["perspective"]
  "perspective-origin"?: CSSStylesCamel["perspectiveOrigin"]
  "place-content"?: CSSStylesCamel["placeContent"]
  "place-items"?: CSSStylesCamel["placeItems"]
  "place-self"?: CSSStylesCamel["placeSelf"]
  "pointer-events"?: CSSStylesCamel["pointerEvents"]
  "position"?: CSSStylesCamel["position"]
  "quotes"?: CSSStylesCamel["quotes"]
  "resize"?: CSSStylesCamel["resize"]
  "right"?: CSSStylesCamel["right"]
  "rotate"?: CSSStylesCamel["rotate"]
  "row-gap"?: CSSStylesCamel["rowGap"]
  "ruby-position"?: CSSStylesCamel["rubyPosition"]
  "scale"?: CSSStylesCamel["scale"]
  "scroll-behavior"?: CSSStylesCamel["scrollBehavior"]
  "scroll-margin"?: CSSStylesCamel["scrollMargin"]
  "scroll-margin-block"?: CSSStylesCamel["scrollMarginBlock"]
  "scroll-margin-block-end"?: CSSStylesCamel["scrollMarginBlockEnd"]
  "scroll-margin-block-start"?: CSSStylesCamel["scrollMarginBlockStart"]
  "scroll-margin-bottom"?: CSSStylesCamel["scrollMarginBottom"]
  "scroll-margin-inline"?: CSSStylesCamel["scrollMarginInline"]
  "scroll-margin-inline-end"?: CSSStylesCamel["scrollMarginInlineEnd"]
  "scroll-margin-inline-start"?: CSSStylesCamel["scrollMarginInlineStart"]
  "scroll-margin-left"?: CSSStylesCamel["scrollMarginLeft"]
  "scroll-margin-right"?: CSSStylesCamel["scrollMarginRight"]
  "scroll-margin-top"?: CSSStylesCamel["scrollMarginTop"]
  "scroll-padding"?: CSSStylesCamel["scrollPadding"]
  "scroll-padding-block"?: CSSStylesCamel["scrollPaddingBlock"]
  "scroll-padding-block-end"?: CSSStylesCamel["scrollPaddingBlockEnd"]
  "scroll-padding-block-start"?: CSSStylesCamel["scrollPaddingBlockStart"]
  "scroll-padding-bottom"?: CSSStylesCamel["scrollPaddingBottom"]
  "scroll-padding-inline"?: CSSStylesCamel["scrollPaddingInline"]
  "scroll-padding-inline-end"?: CSSStylesCamel["scrollPaddingInlineEnd"]
  "scroll-padding-inline-start"?: CSSStylesCamel["scrollPaddingInlineStart"]
  "scroll-padding-left"?: CSSStylesCamel["scrollPaddingLeft"]
  "scroll-padding-right"?: CSSStylesCamel["scrollPaddingRight"]
  "scroll-padding-top"?: CSSStylesCamel["scrollPaddingTop"]
  "scroll-snap-align"?: CSSStylesCamel["scrollSnapAlign"]
  "scroll-snap-stop"?: CSSStylesCamel["scrollSnapStop"]
  "scroll-snap-type"?: CSSStylesCamel["scrollSnapType"]
  "scrollbar-gutter"?: CSSStylesCamel["scrollbarGutter"]
  "shape-image-threshold"?: CSSStylesCamel["shapeImageThreshold"]
  "shape-margin"?: CSSStylesCamel["shapeMargin"]
  "shape-outside"?: CSSStylesCamel["shapeOutside"]
  "shape-rendering"?: CSSStylesCamel["shapeRendering"]
  "stop-color"?: CSSStylesCamel["stopColor"]
  "stop-opacity"?: CSSStylesCamel["stopOpacity"]
  "stroke"?: CSSStylesCamel["stroke"]
  "stroke-dasharray"?: CSSStylesCamel["strokeDasharray"]
  "stroke-dashoffset"?: CSSStylesCamel["strokeDashoffset"]
  "stroke-linecap"?: CSSStylesCamel["strokeLinecap"]
  "stroke-linejoin"?: CSSStylesCamel["strokeLinejoin"]
  "stroke-miterlimit"?: CSSStylesCamel["strokeMiterlimit"]
  "stroke-opacity"?: CSSStylesCamel["strokeOpacity"]
  "stroke-width"?: CSSStylesCamel["strokeWidth"]
  "tab-size"?: CSSStylesCamel["tabSize"]
  "table-layout"?: CSSStylesCamel["tableLayout"]
  "text-align"?: CSSStylesCamel["textAlign"]
  "text-align-last"?: CSSStylesCamel["textAlignLast"]
  "text-anchor"?: CSSStylesCamel["textAnchor"]
  "text-combine-upright"?: CSSStylesCamel["textCombineUpright"]
  "text-decoration"?: CSSStylesCamel["textDecoration"]
  "text-decoration-color"?: CSSStylesCamel["textDecorationColor"]
  "text-decoration-line"?: CSSStylesCamel["textDecorationLine"]
  "text-decoration-skip-ink"?: CSSStylesCamel["textDecorationSkipInk"]
  "text-decoration-style"?: CSSStylesCamel["textDecorationStyle"]
  "text-decoration-thickness"?: CSSStylesCamel["textDecorationThickness"]
  "text-emphasis"?: CSSStylesCamel["textEmphasis"]
  "text-emphasis-color"?: CSSStylesCamel["textEmphasisColor"]
  "text-emphasis-position"?: CSSStylesCamel["textEmphasisPosition"]
  "text-emphasis-style"?: CSSStylesCamel["textEmphasisStyle"]
  "text-indent"?: CSSStylesCamel["textIndent"]
  "text-orientation"?: CSSStylesCamel["textOrientation"]
  "text-overflow"?: CSSStylesCamel["textOverflow"]
  "text-rendering"?: CSSStylesCamel["textRendering"]
  "text-shadow"?: CSSStylesCamel["textShadow"]
  "text-transform"?: CSSStylesCamel["textTransform"]
  "text-underline-offset"?: CSSStylesCamel["textUnderlineOffset"]
  "text-underline-position"?: CSSStylesCamel["textUnderlinePosition"]
  "top"?: CSSStylesCamel["top"]
  "touch-action"?: CSSStylesCamel["touchAction"]
  "transform"?: CSSStylesCamel["transform"]
  "transform-box"?: CSSStylesCamel["transformBox"]
  "transform-origin"?: CSSStylesCamel["transformOrigin"]
  "transform-style"?: CSSStylesCamel["transformStyle"]
  "transition"?: CSSStylesCamel["transition"]
  "transition-delay"?: CSSStylesCamel["transitionDelay"]
  "transition-duration"?: CSSStylesCamel["transitionDuration"]
  "transition-property"?: CSSStylesCamel["transitionProperty"]
  "transition-timing-function"?: CSSStylesCamel["transitionTimingFunction"]
  "translate"?: CSSStylesCamel["translate"]
  "unicode-bidi"?: CSSStylesCamel["unicodeBidi"]
  "user-select"?: CSSStylesCamel["userSelect"]
  "vertical-align"?: CSSStylesCamel["verticalAlign"]
  "visibility"?: CSSStylesCamel["visibility"]
  "white-space"?: CSSStylesCamel["whiteSpace"]
  "widows"?: CSSStylesCamel["widows"]
  "width"?: CSSStylesCamel["width"]
  "will-change"?: CSSStylesCamel["willChange"]
  "word-break"?: CSSStylesCamel["wordBreak"]
  "word-spacing"?: CSSStylesCamel["wordSpacing"]
  /** @deprecated */
  "word-wrap"?: CSSStylesCamel["wordWrap"]
  "writing-mode"?: CSSStylesCamel["writingMode"]
  "z-index"?: CSSStylesCamel["zIndex"]
}

type CSSStylesSnake = {
  accent_color?: CSSStylesCamel["accentColor"]
  align_content?: CSSStylesCamel["alignContent"]
  align_items?: CSSStylesCamel["alignItems"]
  align_self?: CSSStylesCamel["alignSelf"]
  alignment_baseline?: CSSStylesCamel["alignmentBaseline"]
  all?: CSSStylesCamel["all"]
  animation?: CSSStylesCamel["animation"]
  animation_delay?: CSSStylesCamel["animationDelay"]
  animation_direction?: CSSStylesCamel["animationDirection"]
  animation_duration?: CSSStylesCamel["animationDuration"]
  animation_fill_mode?: CSSStylesCamel["animationFillMode"]
  animation_iteration_count?: CSSStylesCamel["animationIterationCount"]
  animation_name?: CSSStylesCamel["animationName"]
  animation_play_state?: CSSStylesCamel["animationPlayState"]
  animation_timing_function?: CSSStylesCamel["animationTimingFunction"]
  appearance?: CSSStylesCamel["appearance"]
  aspect_ratio?: CSSStylesCamel["aspectRatio"]
  backface_visibility?: CSSStylesCamel["backfaceVisibility"]
  background?: CSSStylesCamel["background"]
  background_attachment?: CSSStylesCamel["backgroundAttachment"]
  background_blend_mode?: CSSStylesCamel["backgroundBlendMode"]
  background_clip?: CSSStylesCamel["backgroundClip"]
  background_color?: CSSStylesCamel["backgroundColor"]
  background_image?: CSSStylesCamel["backgroundImage"]
  background_origin?: CSSStylesCamel["backgroundOrigin"]
  background_position?: CSSStylesCamel["backgroundPosition"]
  background_position_x?: CSSStylesCamel["backgroundPositionX"]
  background_position_y?: CSSStylesCamel["backgroundPositionY"]
  background_repeat?: CSSStylesCamel["backgroundRepeat"]
  background_size?: CSSStylesCamel["backgroundSize"]
  baseline_shift?: CSSStylesCamel["baselineShift"]
  block_size?: CSSStylesCamel["blockSize"]
  border?: CSSStylesCamel["border"]
  border_block?: CSSStylesCamel["borderBlock"]
  border_block_color?: CSSStylesCamel["borderBlockColor"]
  border_block_end?: CSSStylesCamel["borderBlockEnd"]
  border_block_end_color?: CSSStylesCamel["borderBlockEndColor"]
  border_block_end_style?: CSSStylesCamel["borderBlockEndStyle"]
  border_block_end_width?: CSSStylesCamel["borderBlockEndWidth"]
  border_block_start?: CSSStylesCamel["borderBlockStart"]
  border_block_start_color?: CSSStylesCamel["borderBlockStartColor"]
  border_block_start_style?: CSSStylesCamel["borderBlockStartStyle"]
  border_block_start_width?: CSSStylesCamel["borderBlockStartWidth"]
  border_block_style?: CSSStylesCamel["borderBlockStyle"]
  border_block_width?: CSSStylesCamel["borderBlockWidth"]
  border_bottom?: CSSStylesCamel["borderBottom"]
  border_bottom_color?: CSSStylesCamel["borderBottomColor"]
  border_bottom_left_radius?: CSSStylesCamel["borderBottomLeftRadius"]
  border_bottom_right_radius?: CSSStylesCamel["borderBottomRightRadius"]
  border_bottom_style?: CSSStylesCamel["borderBottomStyle"]
  border_bottom_width?: CSSStylesCamel["borderBottomWidth"]
  border_collapse?: CSSStylesCamel["borderCollapse"]
  border_color?: CSSStylesCamel["borderColor"]
  border_end_end_radius?: CSSStylesCamel["borderEndEndRadius"]
  border_end_start_radius?: CSSStylesCamel["borderEndStartRadius"]
  border_image?: CSSStylesCamel["borderImage"]
  border_image_outset?: CSSStylesCamel["borderImageOutset"]
  border_image_repeat?: CSSStylesCamel["borderImageRepeat"]
  border_image_slice?: CSSStylesCamel["borderImageSlice"]
  border_image_source?: CSSStylesCamel["borderImageSource"]
  border_image_width?: CSSStylesCamel["borderImageWidth"]
  border_inline?: CSSStylesCamel["borderInline"]
  border_inline_color?: CSSStylesCamel["borderInlineColor"]
  border_inline_end?: CSSStylesCamel["borderInlineEnd"]
  border_inline_end_color?: CSSStylesCamel["borderInlineEndColor"]
  border_inline_end_style?: CSSStylesCamel["borderInlineEndStyle"]
  border_inline_end_width?: CSSStylesCamel["borderInlineEndWidth"]
  border_inline_start?: CSSStylesCamel["borderInlineStart"]
  border_inline_start_color?: CSSStylesCamel["borderInlineStartColor"]
  border_inline_start_style?: CSSStylesCamel["borderInlineStartStyle"]
  border_inline_start_width?: CSSStylesCamel["borderInlineStartWidth"]
  border_inline_style?: CSSStylesCamel["borderInlineStyle"]
  border_inline_width?: CSSStylesCamel["borderInlineWidth"]
  border_left?: CSSStylesCamel["borderLeft"]
  border_left_color?: CSSStylesCamel["borderLeftColor"]
  border_left_style?: CSSStylesCamel["borderLeftStyle"]
  border_left_width?: CSSStylesCamel["borderLeftWidth"]
  border_radius?: CSSStylesCamel["borderRadius"]
  border_right?: CSSStylesCamel["borderRight"]
  border_right_color?: CSSStylesCamel["borderRightColor"]
  border_right_style?: CSSStylesCamel["borderRightStyle"]
  border_right_width?: CSSStylesCamel["borderRightWidth"]
  border_spacing?: CSSStylesCamel["borderSpacing"]
  border_start_end_radius?: CSSStylesCamel["borderStartEndRadius"]
  border_start_start_radius?: CSSStylesCamel["borderStartStartRadius"]
  border_style?: CSSStylesCamel["borderStyle"]
  border_top?: CSSStylesCamel["borderTop"]
  border_top_color?: CSSStylesCamel["borderTopColor"]
  border_top_left_radius?: CSSStylesCamel["borderTopLeftRadius"]
  border_top_right_radius?: CSSStylesCamel["borderTopRightRadius"]
  border_top_style?: CSSStylesCamel["borderTopStyle"]
  border_top_width?: CSSStylesCamel["borderTopWidth"]
  border_width?: CSSStylesCamel["borderWidth"]
  bottom?: CSSStylesCamel["bottom"]
  box_shadow?: CSSStylesCamel["boxShadow"]
  box_sizing?: CSSStylesCamel["boxSizing"]
  break_after?: CSSStylesCamel["breakAfter"]
  break_before?: CSSStylesCamel["breakBefore"]
  break_inside?: CSSStylesCamel["breakInside"]
  caption_side?: CSSStylesCamel["captionSide"]
  caret_color?: CSSStylesCamel["caretColor"]
  clear?: CSSStylesCamel["clear"]
  /** @deprecated */
  clip?: CSSStylesCamel["clip"]
  clip_path?: CSSStylesCamel["clipPath"]
  clip_rule?: CSSStylesCamel["clipRule"]
  color?: CSSStylesCamel["color"]
  color_interpolation?: CSSStylesCamel["colorInterpolation"]
  color_interpolation_filters?: CSSStylesCamel["colorInterpolationFilters"]
  color_scheme?: CSSStylesCamel["colorScheme"]
  column_count?: CSSStylesCamel["columnCount"]
  column_fill?: CSSStylesCamel["columnFill"]
  column_gap?: CSSStylesCamel["columnGap"]
  column_rule?: CSSStylesCamel["columnRule"]
  column_rule_color?: CSSStylesCamel["columnRuleColor"]
  column_rule_style?: CSSStylesCamel["columnRuleStyle"]
  column_rule_width?: CSSStylesCamel["columnRuleWidth"]
  column_span?: CSSStylesCamel["columnSpan"]
  column_width?: CSSStylesCamel["columnWidth"]
  columns?: CSSStylesCamel["columns"]
  contain?: CSSStylesCamel["contain"]
  content?: CSSStylesCamel["content"]
  counter_increment?: CSSStylesCamel["counterIncrement"]
  counter_reset?: CSSStylesCamel["counterReset"]
  counter_set?: CSSStylesCamel["counterSet"]
  cursor?: CSSStylesCamel["cursor"]
  direction?: CSSStylesCamel["direction"]
  display?: CSSStylesCamel["display"]
  dominant_baseline?: CSSStylesCamel["dominantBaseline"]
  empty_cells?: CSSStylesCamel["emptyCells"]
  fill?: CSSStylesCamel["fill"]
  fill_opacity?: CSSStylesCamel["fillOpacity"]
  fill_rule?: CSSStylesCamel["fillRule"]
  filter?: CSSStylesCamel["filter"]
  flex?: CSSStylesCamel["flex"]
  flex_basis?: CSSStylesCamel["flexBasis"]
  flex_direction?: CSSStylesCamel["flexDirection"]
  flex_flow?: CSSStylesCamel["flexFlow"]
  flex_grow?: CSSStylesCamel["flexGrow"]
  flex_shrink?: CSSStylesCamel["flexShrink"]
  flex_wrap?: CSSStylesCamel["flexWrap"]
  float?: CSSStylesCamel["float"]
  flood_color?: CSSStylesCamel["floodColor"]
  flood_opacity?: CSSStylesCamel["floodOpacity"]
  font?: CSSStylesCamel["font"]
  font_family?: CSSStylesCamel["fontFamily"]
  font_feature_settings?: CSSStylesCamel["fontFeatureSettings"]
  font_kerning?: CSSStylesCamel["fontKerning"]
  font_optical_sizing?: CSSStylesCamel["fontOpticalSizing"]
  font_size?: CSSStylesCamel["fontSize"]
  font_size_adjust?: CSSStylesCamel["fontSizeAdjust"]
  font_stretch?: CSSStylesCamel["fontStretch"]
  font_style?: CSSStylesCamel["fontStyle"]
  font_synthesis?: CSSStylesCamel["fontSynthesis"]
  font_variant?: CSSStylesCamel["fontVariant"]
  /** @deprecated */
  font_variant_alternates?: CSSStylesCamel["fontVariantAlternates"]
  font_variant_caps?: CSSStylesCamel["fontVariantCaps"]
  font_variant_east_asian?: CSSStylesCamel["fontVariantEastAsian"]
  font_variant_ligatures?: CSSStylesCamel["fontVariantLigatures"]
  font_variant_numeric?: CSSStylesCamel["fontVariantNumeric"]
  font_variant_position?: CSSStylesCamel["fontVariantPosition"]
  font_variation_settings?: CSSStylesCamel["fontVariationSettings"]
  font_weight?: CSSStylesCamel["fontWeight"]
  gap?: CSSStylesCamel["gap"]
  grid?: CSSStylesCamel["grid"]
  grid_area?: CSSStylesCamel["gridArea"]
  grid_auto_columns?: CSSStylesCamel["gridAutoColumns"]
  grid_auto_flow?: CSSStylesCamel["gridAutoFlow"]
  grid_auto_rows?: CSSStylesCamel["gridAutoRows"]
  grid_column?: CSSStylesCamel["gridColumn"]
  grid_column_end?: CSSStylesCamel["gridColumnEnd"]
  /** @deprecated This is a legacy alias of `column_gap`. */
  grid_column_gap?: CSSStylesCamel["gridColumnGap"]
  grid_column_start?: CSSStylesCamel["gridColumnStart"]
  /** @deprecated This is a legacy alias of `gap`. */
  grid_gap?: CSSStylesCamel["gridGap"]
  grid_row?: CSSStylesCamel["gridRow"]
  grid_row_end?: CSSStylesCamel["gridRowEnd"]
  /** @deprecated This is a legacy alias of `row_gap`. */
  grid_row_gap?: CSSStylesCamel["gridRowGap"]
  grid_row_start?: CSSStylesCamel["gridRowStart"]
  grid_template?: CSSStylesCamel["gridTemplate"]
  grid_template_areas?: CSSStylesCamel["gridTemplateAreas"]
  grid_template_columns?: CSSStylesCamel["gridTemplateColumns"]
  grid_template_rows?: CSSStylesCamel["gridTemplateRows"]
  height?: CSSStylesCamel["height"]
  hyphens?: CSSStylesCamel["hyphens"]
  /** @deprecated */
  image_orientation?: CSSStylesCamel["imageOrientation"]
  image_rendering?: CSSStylesCamel["imageRendering"]
  inline_size?: CSSStylesCamel["inlineSize"]
  inset?: CSSStylesCamel["inset"]
  inset_block?: CSSStylesCamel["insetBlock"]
  inset_block_end?: CSSStylesCamel["insetBlockEnd"]
  inset_block_start?: CSSStylesCamel["insetBlockStart"]
  inset_inline?: CSSStylesCamel["insetInline"]
  inset_inline_end?: CSSStylesCamel["insetInlineEnd"]
  inset_inline_start?: CSSStylesCamel["insetInlineStart"]
  isolation?: CSSStylesCamel["isolation"]
  justify_content?: CSSStylesCamel["justifyContent"]
  justify_items?: CSSStylesCamel["justifyItems"]
  justify_self?: CSSStylesCamel["justifySelf"]
  left?: CSSStylesCamel["left"]
  letter_spacing?: CSSStylesCamel["letterSpacing"]
  lighting_color?: CSSStylesCamel["lightingColor"]
  line_break?: CSSStylesCamel["lineBreak"]
  line_height?: CSSStylesCamel["lineHeight"]
  list_style?: CSSStylesCamel["listStyle"]
  list_style_image?: CSSStylesCamel["listStyleImage"]
  list_style_position?: CSSStylesCamel["listStylePosition"]
  list_style_type?: CSSStylesCamel["listStyleType"]
  margin?: CSSStylesCamel["margin"]
  margin_block?: CSSStylesCamel["marginBlock"]
  margin_block_end?: CSSStylesCamel["marginBlockEnd"]
  margin_block_start?: CSSStylesCamel["marginBlockStart"]
  margin_bottom?: CSSStylesCamel["marginBottom"]
  margin_inline?: CSSStylesCamel["marginInline"]
  margin_inline_end?: CSSStylesCamel["marginInlineEnd"]
  margin_inline_start?: CSSStylesCamel["marginInlineStart"]
  margin_left?: CSSStylesCamel["marginLeft"]
  margin_right?: CSSStylesCamel["marginRight"]
  margin_top?: CSSStylesCamel["marginTop"]
  marker?: CSSStylesCamel["marker"]
  marker_end?: CSSStylesCamel["markerEnd"]
  marker_mid?: CSSStylesCamel["markerMid"]
  marker_start?: CSSStylesCamel["markerStart"]
  mask?: CSSStylesCamel["mask"]
  mask_type?: CSSStylesCamel["maskType"]
  max_block_size?: CSSStylesCamel["maxBlockSize"]
  max_height?: CSSStylesCamel["maxHeight"]
  max_inline_size?: CSSStylesCamel["maxInlineSize"]
  max_width?: CSSStylesCamel["maxWidth"]
  min_block_size?: CSSStylesCamel["minBlockSize"]
  min_height?: CSSStylesCamel["minHeight"]
  min_inline_size?: CSSStylesCamel["minInlineSize"]
  min_width?: CSSStylesCamel["minWidth"]
  mix_blend_mode?: CSSStylesCamel["mixBlendMode"]
  object_fit?: CSSStylesCamel["objectFit"]
  object_position?: CSSStylesCamel["objectPosition"]
  offset?: CSSStylesCamel["offset"]
  offset_anchor?: CSSStylesCamel["offsetAnchor"]
  offset_distance?: CSSStylesCamel["offsetDistance"]
  offset_path?: CSSStylesCamel["offsetPath"]
  offset_rotate?: CSSStylesCamel["offsetRotate"]
  opacity?: CSSStylesCamel["opacity"]
  order?: CSSStylesCamel["order"]
  orphans?: CSSStylesCamel["orphans"]
  outline?: CSSStylesCamel["outline"]
  outline_color?: CSSStylesCamel["outlineColor"]
  outline_offset?: CSSStylesCamel["outlineOffset"]
  outline_style?: CSSStylesCamel["outlineStyle"]
  outline_width?: CSSStylesCamel["outlineWidth"]
  overflow?: CSSStylesCamel["overflow"]
  overflow_anchor?: CSSStylesCamel["overflowAnchor"]
  overflow_wrap?: CSSStylesCamel["overflowWrap"]
  overflow_x?: CSSStylesCamel["overflowX"]
  overflow_y?: CSSStylesCamel["overflowY"]
  overscroll_behavior?: CSSStylesCamel["overscrollBehavior"]
  overscroll_behavior_block?: CSSStylesCamel["overscrollBehaviorBlock"]
  overscroll_behavior_inline?: CSSStylesCamel["overscrollBehaviorInline"]
  overscroll_behavior_x?: CSSStylesCamel["overscrollBehaviorX"]
  overscroll_behavior_y?: CSSStylesCamel["overscrollBehaviorY"]
  padding?: CSSStylesCamel["padding"]
  padding_block?: CSSStylesCamel["paddingBlock"]
  padding_block_end?: CSSStylesCamel["paddingBlockEnd"]
  padding_block_start?: CSSStylesCamel["paddingBlockStart"]
  padding_bottom?: CSSStylesCamel["paddingBottom"]
  padding_inline?: CSSStylesCamel["paddingInline"]
  padding_inline_end?: CSSStylesCamel["paddingInlineEnd"]
  padding_inline_start?: CSSStylesCamel["paddingInlineStart"]
  padding_left?: CSSStylesCamel["paddingLeft"]
  padding_right?: CSSStylesCamel["paddingRight"]
  padding_top?: CSSStylesCamel["paddingTop"]
  page_break_after?: CSSStylesCamel["pageBreakAfter"]
  page_break_before?: CSSStylesCamel["pageBreakBefore"]
  page_break_inside?: CSSStylesCamel["pageBreakInside"]
  paint_order?: CSSStylesCamel["paintOrder"]
  perspective?: CSSStylesCamel["perspective"]
  perspective_origin?: CSSStylesCamel["perspectiveOrigin"]
  place_content?: CSSStylesCamel["placeContent"]
  place_items?: CSSStylesCamel["placeItems"]
  place_self?: CSSStylesCamel["placeSelf"]
  pointer_events?: CSSStylesCamel["pointerEvents"]
  position?: CSSStylesCamel["position"]
  quotes?: CSSStylesCamel["quotes"]
  resize?: CSSStylesCamel["resize"]
  right?: CSSStylesCamel["right"]
  rotate?: CSSStylesCamel["rotate"]
  row_gap?: CSSStylesCamel["rowGap"]
  ruby_position?: CSSStylesCamel["rubyPosition"]
  scale?: CSSStylesCamel["scale"]
  scroll_behavior?: CSSStylesCamel["scrollBehavior"]
  scroll_margin?: CSSStylesCamel["scrollMargin"]
  scroll_margin_block?: CSSStylesCamel["scrollMarginBlock"]
  scroll_margin_block_end?: CSSStylesCamel["scrollMarginBlockEnd"]
  scroll_margin_block_start?: CSSStylesCamel["scrollMarginBlockStart"]
  scroll_margin_bottom?: CSSStylesCamel["scrollMarginBottom"]
  scroll_margin_inline?: CSSStylesCamel["scrollMarginInline"]
  scroll_margin_inline_end?: CSSStylesCamel["scrollMarginInlineEnd"]
  scroll_margin_inline_start?: CSSStylesCamel["scrollMarginInlineStart"]
  scroll_margin_left?: CSSStylesCamel["scrollMarginLeft"]
  scroll_margin_right?: CSSStylesCamel["scrollMarginRight"]
  scroll_margin_top?: CSSStylesCamel["scrollMarginTop"]
  scroll_padding?: CSSStylesCamel["scrollPadding"]
  scroll_padding_block?: CSSStylesCamel["scrollPaddingBlock"]
  scroll_padding_block_end?: CSSStylesCamel["scrollPaddingBlockEnd"]
  scroll_padding_block_start?: CSSStylesCamel["scrollPaddingBlockStart"]
  scroll_padding_bottom?: CSSStylesCamel["scrollPaddingBottom"]
  scroll_padding_inline?: CSSStylesCamel["scrollPaddingInline"]
  scroll_padding_inline_end?: CSSStylesCamel["scrollPaddingInlineEnd"]
  scroll_padding_inline_start?: CSSStylesCamel["scrollPaddingInlineStart"]
  scroll_padding_left?: CSSStylesCamel["scrollPaddingLeft"]
  scroll_padding_right?: CSSStylesCamel["scrollPaddingRight"]
  scroll_padding_top?: CSSStylesCamel["scrollPaddingTop"]
  scroll_snap_align?: CSSStylesCamel["scrollSnapAlign"]
  scroll_snap_stop?: CSSStylesCamel["scrollSnapStop"]
  scroll_snap_type?: CSSStylesCamel["scrollSnapType"]
  scrollbar_gutter?: CSSStylesCamel["scrollbarGutter"]
  shape_image_threshold?: CSSStylesCamel["shapeImageThreshold"]
  shape_margin?: CSSStylesCamel["shapeMargin"]
  shape_outside?: CSSStylesCamel["shapeOutside"]
  shape_rendering?: CSSStylesCamel["shapeRendering"]
  stop_color?: CSSStylesCamel["stopColor"]
  stop_opacity?: CSSStylesCamel["stopOpacity"]
  stroke?: CSSStylesCamel["stroke"]
  stroke_dasharray?: CSSStylesCamel["strokeDasharray"]
  stroke_dashoffset?: CSSStylesCamel["strokeDashoffset"]
  stroke_linecap?: CSSStylesCamel["strokeLinecap"]
  stroke_linejoin?: CSSStylesCamel["strokeLinejoin"]
  stroke_miterlimit?: CSSStylesCamel["strokeMiterlimit"]
  stroke_opacity?: CSSStylesCamel["strokeOpacity"]
  stroke_width?: CSSStylesCamel["strokeWidth"]
  tab_size?: CSSStylesCamel["tabSize"]
  table_layout?: CSSStylesCamel["tableLayout"]
  text_align?: CSSStylesCamel["textAlign"]
  text_align_last?: CSSStylesCamel["textAlignLast"]
  text_anchor?: CSSStylesCamel["textAnchor"]
  text_combine_upright?: CSSStylesCamel["textCombineUpright"]
  text_decoration?: CSSStylesCamel["textDecoration"]
  text_decoration_color?: CSSStylesCamel["textDecorationColor"]
  text_decoration_line?: CSSStylesCamel["textDecorationLine"]
  text_decoration_skip_ink?: CSSStylesCamel["textDecorationSkipInk"]
  text_decoration_style?: CSSStylesCamel["textDecorationStyle"]
  text_decoration_thickness?: CSSStylesCamel["textDecorationThickness"]
  text_emphasis?: CSSStylesCamel["textEmphasis"]
  text_emphasis_color?: CSSStylesCamel["textEmphasisColor"]
  text_emphasis_position?: CSSStylesCamel["textEmphasisPosition"]
  text_emphasis_style?: CSSStylesCamel["textEmphasisStyle"]
  text_indent?: CSSStylesCamel["textIndent"]
  text_orientation?: CSSStylesCamel["textOrientation"]
  text_overflow?: CSSStylesCamel["textOverflow"]
  text_rendering?: CSSStylesCamel["textRendering"]
  text_shadow?: CSSStylesCamel["textShadow"]
  text_transform?: CSSStylesCamel["textTransform"]
  text_underline_offset?: CSSStylesCamel["textUnderlineOffset"]
  text_underline_position?: CSSStylesCamel["textUnderlinePosition"]
  top?: CSSStylesCamel["top"]
  touch_action?: CSSStylesCamel["touchAction"]
  transform?: CSSStylesCamel["transform"]
  transform_box?: CSSStylesCamel["transformBox"]
  transform_origin?: CSSStylesCamel["transformOrigin"]
  transform_style?: CSSStylesCamel["transformStyle"]
  transition?: CSSStylesCamel["transition"]
  transition_delay?: CSSStylesCamel["transitionDelay"]
  transition_duration?: CSSStylesCamel["transitionDuration"]
  transition_property?: CSSStylesCamel["transitionProperty"]
  transition_timing_function?: CSSStylesCamel["transitionTimingFunction"]
  translate?: CSSStylesCamel["translate"]
  unicode_bidi?: CSSStylesCamel["unicodeBidi"]
  user_select?: CSSStylesCamel["userSelect"]
  vertical_align?: CSSStylesCamel["verticalAlign"]
  visibility?: CSSStylesCamel["visibility"]
  white_space?: CSSStylesCamel["whiteSpace"]
  widows?: CSSStylesCamel["widows"]
  width?: CSSStylesCamel["width"]
  will_change?: CSSStylesCamel["willChange"]
  word_break?: CSSStylesCamel["wordBreak"]
  word_spacing?: CSSStylesCamel["wordSpacing"]
  /** @deprecated */
  word_wrap?: CSSStylesCamel["wordWrap"]
  writing_mode?: CSSStylesCamel["writingMode"]
  z_index?: CSSStylesCamel["zIndex"]
}

export type CSSVariables = {[key in `--${string}`]?: string | null}

export type CSSStyles = CSSStylesCamel & CSSStylesDashed & CSSStylesSnake & CSSVariables

export type CSSStylesLike = CSSStyles | Dict<string | null> | Styles

const _style_decl = document.createElement("div").style
function _css_name(attr: string): string | null {
  if (attr.startsWith("--")) {
    return attr
  }
  const name = attr.replaceAll(/_/g, "-").replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  // XXX hasOwnProperty() doesn't work for unknown reasons (e.g. in Firefox)
  if (name in _style_decl) {
    return name
  }
  const webkit_name = `-webkit-${name}`
  if (webkit_name in _style_decl) {
    return webkit_name
  }
  const moz_name = `-moz-${name}`
  if (moz_name in _style_decl) {
    return moz_name
  }
  logger.warn(`unknown CSS property '${attr}'`)
  return null
}

function* _iter_styles(styles: CSSStylesLike): Iterable<[string, unknown]> {
  if (isPlainObject(styles) || styles instanceof Map) {
    for (const [key, val] of entries(styles)) {
      const name = _css_name(key)
      if (name != null) {
        yield [name, val]
      }
    }
  } else {
    for (const prop of styles.own_properties()) {
      if (prop.dirty) {
        const name = _css_name(prop.attr)
        if (name != null) {
          yield [name, prop.get_value()]
        }
      }
    }
  }
}

export function apply_styles(declaration: CSSStyleDeclaration, styles: CSSStylesLike): void {
  for (const [name, value] of _iter_styles(styles)) {
    if (isString(value)) {
      declaration.setProperty(name, value)
    } else {
      declaration.removeProperty(name)
    }
  }
}

export type CSSStyleSheetDecl = Dict<CSSStylesLike>

export function compose_stylesheet(stylesheet: CSSStyleSheetDecl): string {
  const css = []

  for (const [selector, styles] of entries(stylesheet)) {
    css.push(`${selector} {`)

    for (const [name, value] of _iter_styles(styles)) {
      if (isString(value) && value.length != 0) {
        css.push(`  ${name}: ${value};`)
      }
    }

    css.push("}")
  }

  return css.join("\n")
}
