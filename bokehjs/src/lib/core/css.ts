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
  display?: Display | null
  dominantBaseline?: string | null
  emptyCells?: string | null
  fill?: string | null
  fillOpacity?: string | null
  fillRule?: string | null
  filter?: string | null
  flex?: string | null
  flexBasis?: string | null
  flexDirection?: FlexDirection | null
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
  position?: Position | null
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
  "accent-color"?: string | null
  "align-content"?: string | null
  "align-items"?: string | null
  "align-self"?: string | null
  "alignment-baseline"?: string | null
  "all"?: string | null
  "animation"?: string | null
  "animation-delay"?: string | null
  "animation-direction"?: string | null
  "animation-duration"?: string | null
  "animation-fill-mode"?: string | null
  "animation-iteration-count"?: string | null
  "animation-name"?: string | null
  "animation-play-state"?: string | null
  "animation-timing-function"?: string | null
  "appearance"?: string | null
  "aspect-ratio"?: string | null
  "backface-visibility"?: string | null
  "background"?: string | null
  "background-attachment"?: string | null
  "background-blend-mode"?: string | null
  "background-clip"?: string | null
  "background-color"?: string | null
  "background-image"?: string | null
  "background-origin"?: string | null
  "background-position"?: string | null
  "background-position-x"?: string | null
  "background-position-y"?: string | null
  "background-repeat"?: string | null
  "background-size"?: string | null
  "baseline-shift"?: string | null
  "block-size"?: string | null
  "border"?: string | null
  "border-block"?: string | null
  "border-block-color"?: string | null
  "border-block-end"?: string | null
  "border-block-end-color"?: string | null
  "border-block-end-style"?: string | null
  "border-block-end-width"?: string | null
  "border-block-start"?: string | null
  "border-block-start-color"?: string | null
  "border-block-start-style"?: string | null
  "border-block-start-width"?: string | null
  "border-block-style"?: string | null
  "border-block-width"?: string | null
  "border-bottom"?: string | null
  "border-bottom-color"?: string | null
  "border-bottom-left-radius"?: string | null
  "border-bottom-right-radius"?: string | null
  "border-bottom-style"?: string | null
  "border-bottom-width"?: string | null
  "border-collapse"?: string | null
  "border-color"?: string | null
  "border-end-end-radius"?: string | null
  "border-end-start-radius"?: string | null
  "border-image"?: string | null
  "border-image-outset"?: string | null
  "border-image-repeat"?: string | null
  "border-image-slice"?: string | null
  "border-image-source"?: string | null
  "border-image-width"?: string | null
  "border-inline"?: string | null
  "border-inline-color"?: string | null
  "border-inline-end"?: string | null
  "border-inline-end-color"?: string | null
  "border-inline-end-style"?: string | null
  "border-inline-end-width"?: string | null
  "border-inline-start"?: string | null
  "border-inline-start-color"?: string | null
  "border-inline-start-style"?: string | null
  "border-inline-start-width"?: string | null
  "border-inline-style"?: string | null
  "border-inline-width"?: string | null
  "border-left"?: string | null
  "border-left-color"?: string | null
  "border-left-style"?: string | null
  "border-left-width"?: string | null
  "border-radius"?: string | null
  "border-right"?: string | null
  "border-right-color"?: string | null
  "border-right-style"?: string | null
  "border-right-width"?: string | null
  "border-spacing"?: string | null
  "border-start-end-radius"?: string | null
  "border-start-start-radius"?: string | null
  "border-style"?: string | null
  "border-top"?: string | null
  "border-top-color"?: string | null
  "border-top-left-radius"?: string | null
  "border-top-right-radius"?: string | null
  "border-top-style"?: string | null
  "border-top-width"?: string | null
  "border-width"?: string | null
  "bottom"?: string | null
  "box-shadow"?: string | null
  "box-sizing"?: string | null
  "break-after"?: string | null
  "break-before"?: string | null
  "break-inside"?: string | null
  "caption-side"?: string | null
  "caret-color"?: string | null
  "clear"?: string | null
  /** @deprecated */
  "clip"?: string | null
  "clip-path"?: string | null
  "clip-rule"?: string | null
  "color"?: string | null
  "color-interpolation"?: string | null
  "color-interpolation-filters"?: string | null
  "color-scheme"?: string | null
  "column-count"?: string | null
  "column-fill"?: string | null
  "column-gap"?: string | null
  "column-rule"?: string | null
  "column-rule-color"?: string | null
  "column-rule-style"?: string | null
  "column-rule-width"?: string | null
  "column-span"?: string | null
  "column-width"?: string | null
  "columns"?: string | null
  "contain"?: string | null
  "content"?: string | null
  "counter-increment"?: string | null
  "counter-reset"?: string | null
  "counter-set"?: string | null
  "cursor"?: string | null
  "direction"?: string | null
  "display"?: Display | null
  "dominant-baseline"?: string | null
  "empty-cells"?: string | null
  "fill"?: string | null
  "fill-opacity"?: string | null
  "fill-rule"?: string | null
  "filter"?: string | null
  "flex"?: string | null
  "flex-basis"?: string | null
  "flex-direction"?: FlexDirection | null
  "flex-flow"?: string | null
  "flex-grow"?: string | null
  "flex-shrink"?: string | null
  "flex-wrap"?: string | null
  "float"?: string | null
  "flood-color"?: string | null
  "flood-opacity"?: string | null
  "font"?: string | null
  "font-family"?: string | null
  "font-feature-settings"?: string | null
  "font-kerning"?: string | null
  "font-optical-sizing"?: string | null
  "font-size"?: string | null
  "font-size-adjust"?: string | null
  "font-stretch"?: string | null
  "font-style"?: string | null
  "font-synthesis"?: string | null
  "font-variant"?: string | null
  /** @deprecated */
  "font-variant-alternates"?: string | null
  "font-variant-caps"?: string | null
  "font-variant-east-asian"?: string | null
  "font-variant-ligatures"?: string | null
  "font-variant-numeric"?: string | null
  "font-variant-position"?: string | null
  "font-variation-settings"?: string | null
  "font-weight"?: string | null
  "gap"?: string | null
  "grid"?: string | null
  "grid-area"?: string | null
  "grid-auto-columns"?: string | null
  "grid-auto-flow"?: string | null
  "grid-auto-rows"?: string | null
  "grid-column"?: string | null
  "grid-column-end"?: string | null
  /** @deprecated This is a legacy alias of `column-gap`. */
  "grid-column-gap"?: string | null
  "grid-column-start"?: string | null
  /** @deprecated This is a legacy alias of `gap`. */
  "grid-gap"?: string | null
  "grid-row"?: string | null
  "grid-row-end"?: string | null
  /** @deprecated This is a legacy alias of `row-gap`. */
  "grid-row-gap"?: string | null
  "grid-row-start"?: string | null
  "grid-template"?: string | null
  "grid-template-areas"?: string | null
  "grid-template-columns"?: string | null
  "grid-template-rows"?: string | null
  "height"?: string | null
  "hyphens"?: string | null
  /** @deprecated */
  "image-orientation"?: string | null
  "image-rendering"?: string | null
  "inline-size"?: string | null
  "inset"?: string | null
  "inset-block"?: string | null
  "inset-block-end"?: string | null
  "inset-block-start"?: string | null
  "inset-inline"?: string | null
  "inset-inline-end"?: string | null
  "inset-inline-start"?: string | null
  "isolation"?: string | null
  "justify-content"?: string | null
  "justify-items"?: string | null
  "justify-self"?: string | null
  "left"?: string | null
  "letter-spacing"?: string | null
  "lighting-color"?: string | null
  "line-break"?: string | null
  "line-height"?: string | null
  "list-style"?: string | null
  "list-style-image"?: string | null
  "list-style-position"?: string | null
  "list-style-type"?: string | null
  "margin"?: string | null
  "margin-block"?: string | null
  "margin-block-end"?: string | null
  "margin-block-start"?: string | null
  "margin-bottom"?: string | null
  "margin-inline"?: string | null
  "margin-inline-end"?: string | null
  "margin-inline-start"?: string | null
  "margin-left"?: string | null
  "margin-right"?: string | null
  "margin-top"?: string | null
  "marker"?: string | null
  "marker-end"?: string | null
  "marker-mid"?: string | null
  "marker-start"?: string | null
  "mask"?: string | null
  "mask-type"?: string | null
  "max-block-size"?: string | null
  "max-height"?: string | null
  "max-inline-size"?: string | null
  "max-width"?: string | null
  "min-block-size"?: string | null
  "min-height"?: string | null
  "min-inline-size"?: string | null
  "min-width"?: string | null
  "mix-blend-mode"?: string | null
  "object-fit"?: string | null
  "object-position"?: string | null
  "offset"?: string | null
  "offset-anchor"?: string | null
  "offset-distance"?: string | null
  "offset-path"?: string | null
  "offset-rotate"?: string | null
  "opacity"?: string | null
  "order"?: string | null
  "orphans"?: string | null
  "outline"?: string | null
  "outline-color"?: string | null
  "outline-offset"?: string | null
  "outline-style"?: string | null
  "outline-width"?: string | null
  "overflow"?: string | null
  "overflow-anchor"?: string | null
  "overflow-wrap"?: string | null
  "overflow-x"?: string | null
  "overflow-y"?: string | null
  "overscroll-behavior"?: string | null
  "overscroll-behavior-block"?: string | null
  "overscroll-behavior-inline"?: string | null
  "overscroll-behavior-x"?: string | null
  "overscroll-behavior-y"?: string | null
  "padding"?: string | null
  "padding-block"?: string | null
  "padding-block-end"?: string | null
  "padding-block-start"?: string | null
  "padding-bottom"?: string | null
  "padding-inline"?: string | null
  "padding-inline-end"?: string | null
  "padding-inline-start"?: string | null
  "padding-left"?: string | null
  "padding-right"?: string | null
  "padding-top"?: string | null
  "page-break-after"?: string | null
  "page-break-before"?: string | null
  "page-break-inside"?: string | null
  "paint-order"?: string | null
  "perspective"?: string | null
  "perspective-origin"?: string | null
  "place-content"?: string | null
  "place-items"?: string | null
  "place-self"?: string | null
  "pointer-events"?: string | null
  "position"?: Position | null
  "quotes"?: string | null
  "resize"?: string | null
  "right"?: string | null
  "rotate"?: string | null
  "row-gap"?: string | null
  "ruby-position"?: string | null
  "scale"?: string | null
  "scroll-behavior"?: string | null
  "scroll-margin"?: string | null
  "scroll-margin-block"?: string | null
  "scroll-margin-block-end"?: string | null
  "scroll-margin-block-start"?: string | null
  "scroll-margin-bottom"?: string | null
  "scroll-margin-inline"?: string | null
  "scroll-margin-inline-end"?: string | null
  "scroll-margin-inline-start"?: string | null
  "scroll-margin-left"?: string | null
  "scroll-margin-right"?: string | null
  "scroll-margin-top"?: string | null
  "scroll-padding"?: string | null
  "scroll-padding-block"?: string | null
  "scroll-padding-block-end"?: string | null
  "scroll-padding-block-start"?: string | null
  "scroll-padding-bottom"?: string | null
  "scroll-padding-inline"?: string | null
  "scroll-padding-inline-end"?: string | null
  "scroll-padding-inline-start"?: string | null
  "scroll-padding-left"?: string | null
  "scroll-padding-right"?: string | null
  "scroll-padding-top"?: string | null
  "scroll-snap-align"?: string | null
  "scroll-snap-stop"?: string | null
  "scroll-snap-type"?: string | null
  "scrollbar-gutter"?: string | null
  "shape-image-threshold"?: string | null
  "shape-margin"?: string | null
  "shape-outside"?: string | null
  "shape-rendering"?: string | null
  "stop-color"?: string | null
  "stop-opacity"?: string | null
  "stroke"?: string | null
  "stroke-dasharray"?: string | null
  "stroke-dashoffset"?: string | null
  "stroke-linecap"?: string | null
  "stroke-linejoin"?: string | null
  "stroke-miterlimit"?: string | null
  "stroke-opacity"?: string | null
  "stroke-width"?: string | null
  "tab-size"?: string | null
  "table-layout"?: string | null
  "text-align"?: string | null
  "text-align-last"?: string | null
  "text-anchor"?: string | null
  "text-combine-upright"?: string | null
  "text-decoration"?: string | null
  "text-decoration-color"?: string | null
  "text-decoration-line"?: string | null
  "text-decoration-skip-ink"?: string | null
  "text-decoration-style"?: string | null
  "text-decoration-thickness"?: string | null
  "text-emphasis"?: string | null
  "text-emphasis-color"?: string | null
  "text-emphasis-position"?: string | null
  "text-emphasis-style"?: string | null
  "text-indent"?: string | null
  "text-orientation"?: string | null
  "text-overflow"?: string | null
  "text-rendering"?: string | null
  "text-shadow"?: string | null
  "text-transform"?: string | null
  "text-underline-offset"?: string | null
  "text-underline-position"?: string | null
  "top"?: string | null
  "touch-action"?: string | null
  "transform"?: string | null
  "transform-box"?: string | null
  "transform-origin"?: string | null
  "transform-style"?: string | null
  "transition"?: string | null
  "transition-delay"?: string | null
  "transition-duration"?: string | null
  "transition-property"?: string | null
  "transition-timing-function"?: string | null
  "translate"?: string | null
  "unicode-bidi"?: string | null
  "user-select"?: string | null
  "vertical-align"?: string | null
  "visibility"?: string | null
  "white-space"?: string | null
  "widows"?: string | null
  "width"?: string | null
  "will-change"?: string | null
  "word-break"?: string | null
  "word-spacing"?: string | null
  /** @deprecated */
  "word-wrap"?: string | null
  "writing-mode"?: string | null
  "z-index"?: string | null
}

type CSSStylesSnake = {
  accent_color?: string | null
  align_content?: string | null
  align_items?: string | null
  align_self?: string | null
  alignment_baseline?: string | null
  all?: string | null
  animation?: string | null
  animation_delay?: string | null
  animation_direction?: string | null
  animation_duration?: string | null
  animation_fill_mode?: string | null
  animation_iteration_count?: string | null
  animation_name?: string | null
  animation_play_state?: string | null
  animation_timing_function?: string | null
  appearance?: string | null
  aspect_ratio?: string | null
  backface_visibility?: string | null
  background?: string | null
  background_attachment?: string | null
  background_blend_mode?: string | null
  background_clip?: string | null
  background_color?: string | null
  background_image?: string | null
  background_origin?: string | null
  background_position?: string | null
  background_position_x?: string | null
  background_position_y?: string | null
  background_repeat?: string | null
  background_size?: string | null
  baseline_shift?: string | null
  block_size?: string | null
  border?: string | null
  border_block?: string | null
  border_block_color?: string | null
  border_block_end?: string | null
  border_block_end_color?: string | null
  border_block_end_style?: string | null
  border_block_end_width?: string | null
  border_block_start?: string | null
  border_block_start_color?: string | null
  border_block_start_style?: string | null
  border_block_start_width?: string | null
  border_block_style?: string | null
  border_block_width?: string | null
  border_bottom?: string | null
  border_bottom_color?: string | null
  border_bottom_left_radius?: string | null
  border_bottom_right_radius?: string | null
  border_bottom_style?: string | null
  border_bottom_width?: string | null
  border_collapse?: string | null
  border_color?: string | null
  border_end_end_radius?: string | null
  border_end_start_radius?: string | null
  border_image?: string | null
  border_image_outset?: string | null
  border_image_repeat?: string | null
  border_image_slice?: string | null
  border_image_source?: string | null
  border_image_width?: string | null
  border_inline?: string | null
  border_inline_color?: string | null
  border_inline_end?: string | null
  border_inline_end_color?: string | null
  border_inline_end_style?: string | null
  border_inline_end_width?: string | null
  border_inline_start?: string | null
  border_inline_start_color?: string | null
  border_inline_start_style?: string | null
  border_inline_start_width?: string | null
  border_inline_style?: string | null
  border_inline_width?: string | null
  border_left?: string | null
  border_left_color?: string | null
  border_left_style?: string | null
  border_left_width?: string | null
  border_radius?: string | null
  border_right?: string | null
  border_right_color?: string | null
  border_right_style?: string | null
  border_right_width?: string | null
  border_spacing?: string | null
  border_start_end_radius?: string | null
  border_start_start_radius?: string | null
  border_style?: string | null
  border_top?: string | null
  border_top_color?: string | null
  border_top_left_radius?: string | null
  border_top_right_radius?: string | null
  border_top_style?: string | null
  border_top_width?: string | null
  border_width?: string | null
  bottom?: string | null
  box_shadow?: string | null
  box_sizing?: string | null
  break_after?: string | null
  break_before?: string | null
  break_inside?: string | null
  caption_side?: string | null
  caret_color?: string | null
  clear?: string | null
  /** @deprecated */
  clip?: string | null
  clip_path?: string | null
  clip_rule?: string | null
  color?: string | null
  color_interpolation?: string | null
  color_interpolation_filters?: string | null
  color_scheme?: string | null
  column_count?: string | null
  column_fill?: string | null
  column_gap?: string | null
  column_rule?: string | null
  column_rule_color?: string | null
  column_rule_style?: string | null
  column_rule_width?: string | null
  column_span?: string | null
  column_width?: string | null
  columns?: string | null
  contain?: string | null
  content?: string | null
  counter_increment?: string | null
  counter_reset?: string | null
  counter_set?: string | null
  cursor?: string | null
  direction?: string | null
  display?: Display | null
  dominant_baseline?: string | null
  empty_cells?: string | null
  fill?: string | null
  fill_opacity?: string | null
  fill_rule?: string | null
  filter?: string | null
  flex?: string | null
  flex_basis?: string | null
  flex_direction?: FlexDirection | null
  flex_flow?: string | null
  flex_grow?: string | null
  flex_shrink?: string | null
  flex_wrap?: string | null
  float?: string | null
  flood_color?: string | null
  flood_opacity?: string | null
  font?: string | null
  font_family?: string | null
  font_feature_settings?: string | null
  font_kerning?: string | null
  font_optical_sizing?: string | null
  font_size?: string | null
  font_size_adjust?: string | null
  font_stretch?: string | null
  font_style?: string | null
  font_synthesis?: string | null
  font_variant?: string | null
  /** @deprecated */
  font_variant_alternates?: string | null
  font_variant_caps?: string | null
  font_variant_east_asian?: string | null
  font_variant_ligatures?: string | null
  font_variant_numeric?: string | null
  font_variant_position?: string | null
  font_variation_settings?: string | null
  font_weight?: string | null
  gap?: string | null
  grid?: string | null
  grid_area?: string | null
  grid_auto_columns?: string | null
  grid_auto_flow?: string | null
  grid_auto_rows?: string | null
  grid_column?: string | null
  grid_column_end?: string | null
  /** @deprecated This is a legacy alias of `column_gap`. */
  grid_column_gap?: string | null
  grid_column_start?: string | null
  /** @deprecated This is a legacy alias of `gap`. */
  grid_gap?: string | null
  grid_row?: string | null
  grid_row_end?: string | null
  /** @deprecated This is a legacy alias of `row_gap`. */
  grid_row_gap?: string | null
  grid_row_start?: string | null
  grid_template?: string | null
  grid_template_areas?: string | null
  grid_template_columns?: string | null
  grid_template_rows?: string | null
  height?: string | null
  hyphens?: string | null
  /** @deprecated */
  image_orientation?: string | null
  image_rendering?: string | null
  inline_size?: string | null
  inset?: string | null
  inset_block?: string | null
  inset_block_end?: string | null
  inset_block_start?: string | null
  inset_inline?: string | null
  inset_inline_end?: string | null
  inset_inline_start?: string | null
  isolation?: string | null
  justify_content?: string | null
  justify_items?: string | null
  justify_self?: string | null
  left?: string | null
  letter_spacing?: string | null
  lighting_color?: string | null
  line_break?: string | null
  line_height?: string | null
  list_style?: string | null
  list_style_image?: string | null
  list_style_position?: string | null
  list_style_type?: string | null
  margin?: string | null
  margin_block?: string | null
  margin_block_end?: string | null
  margin_block_start?: string | null
  margin_bottom?: string | null
  margin_inline?: string | null
  margin_inline_end?: string | null
  margin_inline_start?: string | null
  margin_left?: string | null
  margin_right?: string | null
  margin_top?: string | null
  marker?: string | null
  marker_end?: string | null
  marker_mid?: string | null
  marker_start?: string | null
  mask?: string | null
  mask_type?: string | null
  max_block_size?: string | null
  max_height?: string | null
  max_inline_size?: string | null
  max_width?: string | null
  min_block_size?: string | null
  min_height?: string | null
  min_inline_size?: string | null
  min_width?: string | null
  mix_blend_mode?: string | null
  object_fit?: string | null
  object_position?: string | null
  offset?: string | null
  offset_anchor?: string | null
  offset_distance?: string | null
  offset_path?: string | null
  offset_rotate?: string | null
  opacity?: string | null
  order?: string | null
  orphans?: string | null
  outline?: string | null
  outline_color?: string | null
  outline_offset?: string | null
  outline_style?: string | null
  outline_width?: string | null
  overflow?: string | null
  overflow_anchor?: string | null
  overflow_wrap?: string | null
  overflow_x?: string | null
  overflow_y?: string | null
  overscroll_behavior?: string | null
  overscroll_behavior_block?: string | null
  overscroll_behavior_inline?: string | null
  overscroll_behavior_x?: string | null
  overscroll_behavior_y?: string | null
  padding?: string | null
  padding_block?: string | null
  padding_block_end?: string | null
  padding_block_start?: string | null
  padding_bottom?: string | null
  padding_inline?: string | null
  padding_inline_end?: string | null
  padding_inline_start?: string | null
  padding_left?: string | null
  padding_right?: string | null
  padding_top?: string | null
  page_break_after?: string | null
  page_break_before?: string | null
  page_break_inside?: string | null
  paint_order?: string | null
  perspective?: string | null
  perspective_origin?: string | null
  place_content?: string | null
  place_items?: string | null
  place_self?: string | null
  pointer_events?: string | null
  position?: Position | null
  quotes?: string | null
  resize?: string | null
  right?: string | null
  rotate?: string | null
  row_gap?: string | null
  ruby_position?: string | null
  scale?: string | null
  scroll_behavior?: string | null
  scroll_margin?: string | null
  scroll_margin_block?: string | null
  scroll_margin_block_end?: string | null
  scroll_margin_block_start?: string | null
  scroll_margin_bottom?: string | null
  scroll_margin_inline?: string | null
  scroll_margin_inline_end?: string | null
  scroll_margin_inline_start?: string | null
  scroll_margin_left?: string | null
  scroll_margin_right?: string | null
  scroll_margin_top?: string | null
  scroll_padding?: string | null
  scroll_padding_block?: string | null
  scroll_padding_block_end?: string | null
  scroll_padding_block_start?: string | null
  scroll_padding_bottom?: string | null
  scroll_padding_inline?: string | null
  scroll_padding_inline_end?: string | null
  scroll_padding_inline_start?: string | null
  scroll_padding_left?: string | null
  scroll_padding_right?: string | null
  scroll_padding_top?: string | null
  scroll_snap_align?: string | null
  scroll_snap_stop?: string | null
  scroll_snap_type?: string | null
  scrollbar_gutter?: string | null
  shape_image_threshold?: string | null
  shape_margin?: string | null
  shape_outside?: string | null
  shape_rendering?: string | null
  stop_color?: string | null
  stop_opacity?: string | null
  stroke?: string | null
  stroke_dasharray?: string | null
  stroke_dashoffset?: string | null
  stroke_linecap?: string | null
  stroke_linejoin?: string | null
  stroke_miterlimit?: string | null
  stroke_opacity?: string | null
  stroke_width?: string | null
  tab_size?: string | null
  table_layout?: string | null
  text_align?: string | null
  text_align_last?: string | null
  text_anchor?: string | null
  text_combine_upright?: string | null
  text_decoration?: string | null
  text_decoration_color?: string | null
  text_decoration_line?: string | null
  text_decoration_skip_ink?: string | null
  text_decoration_style?: string | null
  text_decoration_thickness?: string | null
  text_emphasis?: string | null
  text_emphasis_color?: string | null
  text_emphasis_position?: string | null
  text_emphasis_style?: string | null
  text_indent?: string | null
  text_orientation?: string | null
  text_overflow?: string | null
  text_rendering?: string | null
  text_shadow?: string | null
  text_transform?: string | null
  text_underline_offset?: string | null
  text_underline_position?: string | null
  top?: string | null
  touch_action?: string | null
  transform?: string | null
  transform_box?: string | null
  transform_origin?: string | null
  transform_style?: string | null
  transition?: string | null
  transition_delay?: string | null
  transition_duration?: string | null
  transition_property?: string | null
  transition_timing_function?: string | null
  translate?: string | null
  unicode_bidi?: string | null
  user_select?: string | null
  vertical_align?: string | null
  visibility?: string | null
  white_space?: string | null
  widows?: string | null
  width?: string | null
  will_change?: string | null
  word_break?: string | null
  word_spacing?: string | null
  /** @deprecated */
  word_wrap?: string | null
  writing_mode?: string | null
  z_index?: string | null
}

export type CSSStylesNative = CSSStylesCamel & CSSStylesDashed

export type CSSOurStyles = CSSStylesDashed & CSSStylesSnake

export type CSSStyles = CSSStylesNative & CSSStylesSnake
