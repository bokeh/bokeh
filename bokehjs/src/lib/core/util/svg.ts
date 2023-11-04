/**
 * Based on https://github.com/gliffy/canvas2svg
 */

import {AffineTransform} from "./affine"
import {isString, isNumber} from "./types"
import type {Random} from "./random"
import {random} from "./random"
import {float32_epsilon} from "./math"
import {empty} from "../dom"

type KV<T> = {[key: string]: T}

type FontData = {
  style: string
  size: string
  family: string
  weight: string
  decoration: string
}

// helper function to map named to numbered entities
function createNamedToNumberedLookup(input: string, radix?: number): Map<string, string> {
  const lookup = new Map()
  const items = input.split(",")
  radix = radix ?? 10
  // Map from named to numbered entities.
  for (let i = 0; i < items.length; i += 2) {
    const entity = `&${items[i + 1]};`
    const base10 = parseInt(items[i], radix)
    lookup.set(entity, `&#${base10};`)
  }
  // FF and IE need to create a regex from hex values ie &nbsp; == \xa0
  lookup.set("\\xa0", "&#160;")
  return lookup
}

// helper function to map canvas-textAlign to svg-textAnchor
function getTextAnchor(textAlign: string): string {
  // TODO: support rtl languages
  const mapping: KV<string> = {left: "start", right: "end", center: "middle", start: "start", end: "end"}
  return textAlign in mapping ? mapping[textAlign] : mapping.start
}

// helper function to map canvas-textBaseline to svg-dominantBaseline
function getDominantBaseline(textBaseline: string): string {
  // INFO: not supported in all browsers
  const mapping: KV<string> = {alphabetic: "alphabetic", hanging: "hanging", top: "text-before-edge", bottom: "text-after-edge", middle: "central"}
  return textBaseline in mapping ? mapping[textBaseline] : mapping.alphabetic
}

// Unpack entities lookup where the numbers are in radix 32 to reduce the size
// entity mapping courtesy of tinymce
const namedEntities = createNamedToNumberedLookup(
  "50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy," +
  "5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute," +
  "5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34," +
  "5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil," +
  "68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde," +
  "6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute," +
  "6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml," +
  "75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc," +
  "7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash," +
  "7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta," +
  "sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu," +
  "st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi," +
  "t9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota," +
  "tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau," +
  "u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip," +
  "81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym," +
  "8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr," +
  "8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod," +
  "8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup," +
  "8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4," +
  "nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob," +
  "rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0," +
  "Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm," +
  "80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger," +
  "811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro", 32)

type Style = {
  svgAttr?: string
  canvas: unknown
  svg?: unknown
  apply?: string
}

type StyleAttr =
  "strokeStyle" |
  "fillStyle" |
  "lineCap" |
  "lineJoin" |
  "miterLimit" |
  "lineWidth" |
  "globalAlpha" |
  "font" |
  "shadowColor" |
  "shadowOffsetX" |
  "shadowOffsetY" |
  "shadowBlur" |
  "fontKerning" |
  "textAlign" |
  "textBaseline" |
  "lineDash" |
  "lineDashOffset"

type StyleState = {[key in StyleAttr]: Style}

// Some basic mappings for attributes and default values.
const STYLES: StyleState = {
  strokeStyle: {
    svgAttr: "stroke", // corresponding svg attribute
    canvas: "#000000", // canvas default
    svg: "none",       // svg default
    apply: "stroke",   // apply on stroke() or fill()
  },
  fillStyle: {
    svgAttr: "fill",
    canvas: "#000000",
    svg: null, // svg default is black, but we need to special case this to handle canvas stroke without fill
    apply: "fill",
  },
  lineCap: {
    svgAttr: "stroke-linecap",
    canvas: "butt",
    svg: "butt",
    apply: "stroke",
  },
  lineJoin: {
    svgAttr: "stroke-linejoin",
    canvas: "miter",
    svg: "miter",
    apply: "stroke",
  },
  miterLimit: {
    svgAttr: "stroke-miterlimit",
    canvas: 10,
    svg: 4,
    apply: "stroke",
  },
  lineWidth: {
    svgAttr: "stroke-width",
    canvas: 1,
    svg: 1,
    apply: "stroke",
  },
  globalAlpha: {
    svgAttr: "opacity",
    canvas: 1,
    svg: 1,
    apply: "fill stroke",
  },
  font: {
    // font converts to multiple svg attributes, there is custom logic for this
    canvas: "10px sans-serif",
  },
  shadowColor: {
    canvas: "#000000",
  },
  shadowOffsetX: {
    canvas: 0,
  },
  shadowOffsetY: {
    canvas: 0,
  },
  shadowBlur: {
    canvas: 0,
  },
  fontKerning: {
    canvas: "auto",
  },
  textAlign: {
    canvas: "start",
  },
  textBaseline: {
    canvas: "alphabetic",
  },
  lineDash: {
    svgAttr: "stroke-dasharray",
    canvas: [],
    svg: null,
    apply: "stroke",
  },
  lineDashOffset: {
    svgAttr: "stroke-dashoffset",
    canvas: 0,
    svg: 0,
    apply: "stroke",
  },
}

function is_VideoFrame(image: CanvasImageSource): image is VideoFrame {
  return typeof VideoFrame !== "undefined" && image instanceof VideoFrame
}

function width_height(image: CanvasImageSource): [number, number] {
  if (is_VideoFrame(image)) {
    return [image.codedWidth, image.codedHeight] // TODO not sure if this makes any sense
  } else {
    function to_number(val: number | SVGAnimatedLength): number {
      return isNumber(val) ? val : val.baseVal.value
    }
    const {width, height} = image
    return [to_number(width), to_number(height)]
  }
}

class CanvasGradient implements globalThis.CanvasGradient {
  __root: SVGElement
  __ctx: SVGRenderingContext2D

  constructor(gradientNode: SVGElement, ctx: SVGRenderingContext2D) {
    this.__root = gradientNode
    this.__ctx = ctx
  }

  /**
   * Adds a color stop to the gradient root
   */
  addColorStop(offset: number, color: string): void {
    if (
      this.__root.nodeName === "linearGradient" &&
      this.__root.getAttribute("x1") === this.__root.getAttribute("x2") &&
      this.__root.getAttribute("y1") === this.__root.getAttribute("y2")
    ) return

    if (
      this.__root.nodeName === "radialGradient" &&
      this.__root.getAttribute("cx") === this.__root.getAttribute("fx") &&
      this.__root.getAttribute("cy") === this.__root.getAttribute("fy") &&
      this.__root.getAttribute("r") === this.__root.getAttribute("r0")
    ) return

    const stop = this.__ctx.__createElement("stop")
    stop.setAttribute("offset", `${offset}`)
    if (color.indexOf("rgba") !== -1) {
      // separate alpha value, since webkit can't handle it
      const regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi
      const matches = regex.exec(color)
      const [, r, g, b, a] = matches!
      stop.setAttribute("stop-color", `rgb(${r},${g},${b})`)
      stop.setAttribute("stop-opacity", a)
    } else {
      stop.setAttribute("stop-color", color)
    }
    this.__root.appendChild(stop)
  }
}

class CanvasPattern implements globalThis.CanvasPattern {
  __root: SVGPatternElement
  __ctx: SVGRenderingContext2D

  constructor(pattern: SVGPatternElement, ctx: SVGRenderingContext2D) {
    this.__root = pattern
    this.__ctx = ctx
  }

  setTransform(_transform?: DOMMatrix2DInit): void {
    throw new Error("not implemented")
  }
}

type Options = {
  width?: number
  height?: number
  document?: Document
  ctx?: CanvasRenderingContext2D
}

type Path = string

type SVGCanvasState = {
  transform: AffineTransform
  clip_path: Path | null
  attributes: StyleState
}

/**
 * The mock canvas context
 * @param o - options include:
 * ctx - existing Context2D to wrap around
 * width - width of your canvas (defaults to 500)
 * height - height of your canvas (defaults to 500)
 * document - the document object (defaults to the current document)
 */

type BaseCanvasRenderingContext2D =
  CanvasCompositing &
  CanvasDrawImage &
  CanvasDrawPath &
  CanvasFillStrokeStyles &
  CanvasFilters &
  CanvasImageData &
  CanvasImageSmoothing &
  CanvasPath &
  CanvasPathDrawingStyles &
  CanvasRect &
  CanvasShadowStyles &
  CanvasState &
  CanvasText &
  CanvasTextDrawingStyles &
  CanvasTransform &
  CanvasUserInterface

export class SVGRenderingContext2D implements BaseCanvasRenderingContext2D {
  __canvas: HTMLCanvasElement
  __ctx: CanvasRenderingContext2D

  __root: SVGSVGElement
  __ids: Set<string>
  __defs: SVGElement
  __stack: SVGCanvasState[]
  __document: Document
  __currentElement: SVGElement
  __currentDefaultPath: string = ""
  __currentPosition: {x: number, y: number} | null = null
  //__currentElementsToStyle: {element: SVGElement, children: SVGElement[]} | null = null

  static __random: Random = random

  get canvas(): SVGRenderingContext2D {
    // XXX: point back to this instance
    return this
  }

  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  miterLimit: number
  lineWidth: number
  globalAlpha: number = 1.0
  globalCompositeOperation: GlobalCompositeOperation // TODO: implement
  font: string
  direction: CanvasDirection // TODO: implement
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  fontKerning: CanvasFontKerning
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  lineDash: string | number[] | null
  lineDashOffset: number
  filter: string // TODO: implement
  imageSmoothingEnabled: boolean // TODO: implement
  imageSmoothingQuality: ImageSmoothingQuality // TODO: implement

  private _width: number
  private _height: number

  get width(): number {
    return this._width
  }
  set width(width: number) {
    this._width = width
    this.__root.setAttribute("width", `${width}`)
  }
  get height(): number {
    return this._height
  }
  set height(height: number) {
    this._height = height
    this.__root.setAttribute("height", `${height}`)
  }

  private _transform = new AffineTransform()

  constructor(options?: Options) {
    this.__document = options?.document ?? document

    // allow passing in an existing context to wrap around
    // if a context is passed in, we know a canvas already exist
    if (options?.ctx != null) {
      this.__ctx = options.ctx
    } else {
      this.__canvas = this.__document.createElement("canvas")
      this.__ctx = this.__canvas.getContext("2d")!
    }

    this.reset()

    // the root svg element
    this.__root = this.__document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.__root.setAttribute("version", "1.1")
    this.__root.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    this.__currentElement = this.__root

    this.width = options?.width ?? 500
    this.height = options?.height ?? 500

    // make sure we don't generate the same ids in defs
    this.__ids = new Set()

    // defs tag
    this.__defs = this.__document.createElementNS("http://www.w3.org/2000/svg", "defs")
    this.__root.appendChild(this.__defs)
  }

  // helper function that generates a random string
  protected _random_string(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
    let str: string
    do {
      str = SVGRenderingContext2D.__random.choices(12, chars).join("")
    } while (this.__ids.has(str))
    return str
  }

  /**
   * Creates the specified svg element
   */
  __createElement(elementName: string, properties: KV<string | number> = {}, resetFill: boolean = false): SVGElement {
    const element = this.__document.createElementNS("http://www.w3.org/2000/svg", elementName)
    if (resetFill) {
      // if fill or stroke is not specified, the svg element should not display. By default SVG's fill is black.
      element.setAttribute("fill", "none")
      element.setAttribute("stroke", "none")
    }
    const keys = Object.keys(properties)
    for (const key of keys) {
      element.setAttribute(key, `${properties[key]}`)
    }
    return element
  }

  /**
   * Applies default canvas styles to the context
   */
  __setDefaultStyles(): void {
    // default 2d canvas context properties see:http://www.w3.org/TR/2dcontext/
    const keys = Object.keys(STYLES) as StyleAttr[]
    const self = this as any
    for (let i=0; i<keys.length; i++) {
      const key = keys[i]
      self[key] = STYLES[key].canvas
    }
  }

  /**
   * Applies styles on restore
   */
  __applyStyleState(styleState: StyleState): void {
    const keys = Object.keys(styleState) as StyleAttr[]
    const self = this as any
    for (let i=0; i<keys.length; i++) {
      const key = keys[i]
      self[key] = styleState[key]
    }
  }

  /**
   * Gets the current style state
   */
  __getStyleState(): StyleState {
    const keys = Object.keys(STYLES) as StyleAttr[]
    const styleState = {} as any
    for (let i=0; i<keys.length; i++) {
      const key = keys[i]
      styleState[key] = this[key]
    }
    return styleState
  }

  /**
   * Apples the current styles to the current SVG element. On "ctx.fill" or "ctx.stroke"
   */
  __applyStyleToCurrentElement(type: string): void {
    const currentElement = this.__currentElement
    /*
    const currentStyleGroup = this.__currentElementsToStyle
    if (currentStyleGroup != null) {
      currentElement.setAttribute(type, "")
      currentElement = currentStyleGroup.element
      for (const node of currentStyleGroup.children) {
        node.setAttribute(type, "")
      }
    }
    */

    const keys = Object.keys(STYLES) as StyleAttr[]
    for (let i = 0; i < keys.length; i++) {
      const style = STYLES[keys[i]]
      const value = this[keys[i]]
      if (style.apply != null && style.apply.includes(type)) {
        if (value instanceof CanvasPattern) {
          for (const def of [...value.__ctx.__defs.childNodes]) {
            if (def instanceof Element) {
              const id = def.getAttribute("id")!
              this.__ids.add(id)
              this.__defs.appendChild(def)
            }
          }
          const id = value.__root.getAttribute("id")
          currentElement.setAttribute(style.apply, `url(#${id})`)
        } else if (value instanceof CanvasGradient) {
          const id = value.__root.getAttribute("id")
          currentElement.setAttribute(style.apply, `url(#${id})`)
        } else if (style.svg !== value) {
          if ((style.svgAttr === "stroke" || style.svgAttr === "fill") && isString(value) && value.indexOf("rgba") !== -1) {
            // separate alpha value, since illustrator can't handle it
            const regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi
            const matches = regex.exec(value)!
            const [, r, g, b, a] = matches
            currentElement.setAttribute(style.svgAttr, `rgb(${r},${g},${b})`)
            const opacity = parseFloat(a)*this.globalAlpha
            currentElement.setAttribute(`${style.svgAttr}-opacity`, `${opacity}`)
          } else {
            let attr = style.svgAttr!
            if (keys[i] === "globalAlpha") {
              attr = `${type}-${style.svgAttr}`
              if (currentElement.getAttribute(attr) != null) {
                // fill-opacity or stroke-opacity has already been set by stroke or fill.
                continue
              }
            }
            // otherwise only update attribute if right type, and not svg default
            currentElement.setAttribute(attr, `${value}`)
          }
        }
      }
    }
  }

  /**
    * Returns the serialized value of the svg so far
    * @param fixNamedEntities - Standalone SVG doesn't support named entities, which document.createTextNode encodes.
    *                           If true, we attempt to find all named entities and encode it as a numeric entity.
    * @return serialized svg
    */
  get_serialized_svg(fixNamedEntities: boolean = false): string {
    let serialized = new XMLSerializer().serializeToString(this.__root)

    if (fixNamedEntities) {
      // loop over each named entity and replace with the proper equivalent.
      for (const [key, value] of namedEntities) {
        const regexp = new RegExp(key, "gi")
        if (regexp.test(serialized)) {
          serialized = serialized.replace(regexp, value)
        }
      }
    }

    return serialized
  }

  get_svg(): SVGSVGElement {
    return this.__root
  }

  /**
    * Will generate a group tag.
    */
  save(): void {
    this.__stack.push({
      transform: this._transform,
      clip_path: this._clip_path,
      attributes: this.__getStyleState(),
    })

    this._transform = this._transform.clone()
  }

  /**
    * Sets current element to parent, or just root if already root
    */
  restore(): void {
    if (this.__stack.length == 0)
      return

    const {transform, clip_path, attributes} = this.__stack.pop()!

    this._transform = transform
    this._clip_path = clip_path
    this.__applyStyleState(attributes)
  }

  reset(): void {
    this.__setDefaultStyles()
    this.__stack = []
  }

  private _apply_transform(element: Element, transform: AffineTransform = this._transform) {
    if (!transform.is_identity) {
      element.setAttribute("transform", transform.toString())
    }
  }

  /**
    *  scales the current element
    */
  scale(x: number, y?: number): void {
    if (!isFinite(x) || (y != null && !isFinite(y)))
      return
    this._transform.scale(x, y ?? x)
  }

  /**
    * rotates the current element
    */
  rotate(angle: number): void {
    if (!isFinite(angle))
      return
    this._transform.rotate(angle)
  }

  /**
    * translates the current element
    */
  translate(x: number, y: number): void {
    if (!isFinite(x + y))
      return
    this._transform.translate(x, y)
  }

  /**
    * applies a transform to the current element
    */
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    if (!isFinite(a + b + c + d + e + f))
      return
    this._transform.transform(a, b, c, d, e, f)
  }

  /**
    * Create a new Path Element
    */
  beginPath(): void {
    // Note that there is only one current default path, it is not part of the drawing state.
    // See also: https://html.spec.whatwg.org/multipage/scripting.html#current-default-path
    this.__currentDefaultPath = ""
    this.__currentPosition = null
    this.__init_element()
  }

  protected __init_element(): void {
    const path = this.__createElement("path", {}, true)
    this.__root.appendChild(path)
    this.__currentElement = path
  }

  /**
    * Helper function to apply currentDefaultPath to current path element
    */
  __applyCurrentDefaultPath(): void {
    const currentElement = this.__currentElement
    if (currentElement.nodeName === "path") {
      currentElement.setAttribute("d", this.__currentDefaultPath)
    } else {
      console.error("Attempted to apply path command to node", currentElement.nodeName)
    }
  }

  /**
    * Helper function to add path command
    */
  __addPathCommand(x: number, y: number, path: string): void {
    const separator = this.__currentDefaultPath == "" ? "" : " "
    this.__currentDefaultPath += separator + path
    this.__currentPosition = {x, y}
  }

  get _hasCurrentDefaultPath(): boolean {
    return this.__currentDefaultPath != ""
  }

  /**
    * Adds the move command to the current path element,
    * if the currentPathElement is not empty create a new path element
    */
  moveTo(x: number, y: number): void {
    if (!isFinite(x + y))
      return

    const currentElement = this.__currentElement
    if (currentElement.nodeName !== "path") {
      this.beginPath()
    }

    // creates a new subpath with the given point
    const [tx, ty] = this._transform.apply(x, y)
    this.__addPathCommand(tx, ty, `M ${tx} ${ty}`)
  }

  /**
    * Closes the current path
    */
  closePath(): void {
    if (this._hasCurrentDefaultPath) {
      this.__addPathCommand(NaN, NaN, "Z")
    }
  }

  /**
    * Adds a line to command
    */
  lineTo(x: number, y: number): void {
    if (!isFinite(x + y))
      return
    if (!this._hasCurrentDefaultPath)
      this.moveTo(x, y)
    else {
      const [tx, ty] = this._transform.apply(x, y)
      this.__addPathCommand(tx, ty, `L ${tx} ${ty}`)
    }
  }

  /**
    * Add a bezier command
    */
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    if (!isFinite(cp1x + cp1y + cp2x + cp2y + x + y))
      return
    const [tx, ty] = this._transform.apply(x, y)
    const [tcp1x, tcp1y] = this._transform.apply(cp1x, cp1y)
    const [tcp2x, tcp2y] = this._transform.apply(cp2x, cp2y)
    this.__addPathCommand(tx, ty, `C ${tcp1x} ${tcp1y} ${tcp2x} ${tcp2y} ${tx} ${ty}`)
  }

  /**
    * Adds a quadratic curve to command
    */
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    if (!isFinite(cpx + cpy + x + y))
      return
    const [tx, ty] = this._transform.apply(x, y)
    const [tcpx, tcpy] = this._transform.apply(cpx, cpy)
    this.__addPathCommand(tx, ty, `Q ${tcpx} ${tcpy} ${tx} ${ty}`)
  }

  /**
    * Adds the arcTo to the current path
    *
    * @see http://www.w3.org/TR/2015/WD-2dcontext-20150514/#dom-context-2d-arcto
    */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    if (!isFinite(x1 + y1 + x2 + y2 + radius))
      return
    // Let the point (x0, y0) be the last point in the subpath.
    if (this.__currentPosition == null)
      return

    const x0 = this.__currentPosition.x
    const y0 = this.__currentPosition.y

    // Negative values for radius must cause the implementation to throw an IndexSizeError exception.
    if (radius < 0) {
      throw new Error(`IndexSizeError: The radius provided (${radius}) is negative.`)
    }

    // If the point (x0, y0) is equal to the point (x1, y1),
    // or if the point (x1, y1) is equal to the point (x2, y2),
    // or if the radius radius is zero,
    // then the method must add the point (x1, y1) to the subpath,
    // and connect that point to the previous point (x0, y0) by a straight line.
    if (((x0 === x1) && (y0 === y1)) || ((x1 === x2) && (y1 === y2)) || (radius === 0)) {
      this.lineTo(x1, y1)
      return
    }

    function normalize([x, y]: [number, number]): [number, number] {
      const len = Math.sqrt(x**2 + y**2)
      return [x/len, y/len]
    }

    // Otherwise, if the points (x0, y0), (x1, y1), and (x2, y2) all lie on a single straight line,
    // then the method must add the point (x1, y1) to the subpath,
    // and connect that point to the previous point (x0, y0) by a straight line.
    const unit_vec_p1_p0 = normalize([x0 - x1, y0 - y1])
    const unit_vec_p1_p2 = normalize([x2 - x1, y2 - y1])
    if (unit_vec_p1_p0[0] * unit_vec_p1_p2[1] === unit_vec_p1_p0[1] * unit_vec_p1_p2[0]) {
      this.lineTo(x1, y1)
      return
    }

    // Otherwise, let The Arc be the shortest arc given by circumference of the circle that has radius radius,
    // and that has one point tangent to the half-infinite line that crosses the point (x0, y0) and ends at the point (x1, y1),
    // and that has a different point tangent to the half-infinite line that ends at the point (x1, y1), and crosses the point (x2, y2).
    // The points at which this circle touches these two lines are called the start and end tangent points respectively.

    // note that both vectors are unit vectors, so the length is 1
    const cos = (unit_vec_p1_p0[0] * unit_vec_p1_p2[0] + unit_vec_p1_p0[1] * unit_vec_p1_p2[1])
    const theta = Math.acos(Math.abs(cos))

    // Calculate origin
    const unit_vec_p1_origin = normalize([
      unit_vec_p1_p0[0] + unit_vec_p1_p2[0],
      unit_vec_p1_p0[1] + unit_vec_p1_p2[1],
    ])
    const len_p1_origin = radius / Math.sin(theta / 2)
    const x = x1 + len_p1_origin * unit_vec_p1_origin[0]
    const y = y1 + len_p1_origin * unit_vec_p1_origin[1]

    // Calculate start angle and end angle
    // rotate 90deg clockwise (note that y axis points to its down)
    const unit_vec_origin_start_tangent: [number, number] = [
      -unit_vec_p1_p0[1],
      unit_vec_p1_p0[0],
    ]
    // rotate 90deg counter clockwise (note that y axis points to its down)
    const unit_vec_origin_end_tangent: [number, number] = [
      unit_vec_p1_p2[1],
      -unit_vec_p1_p2[0],
    ]
    function getAngle(vector: [number, number]): number {
      // get angle (clockwise) between vector and (1, 0)
      const x = vector[0]
      const y = vector[1]
      if (y >= 0) { // note that y axis points to its down
        return Math.acos(x)
      } else {
        return -Math.acos(x)
      }
    }
    const startAngle = getAngle(unit_vec_origin_start_tangent)
    const endAngle = getAngle(unit_vec_origin_end_tangent)

    // Connect the point (x0, y0) to the start tangent point by a straight line
    this.lineTo(
      x + unit_vec_origin_start_tangent[0] * radius,
      y + unit_vec_origin_start_tangent[1] * radius,
    )

    // Connect the start tangent point to the end tangent point by arc
    // and adding the end tangent point to the subpath.
    this.arc(x, y, radius, startAngle, endAngle)
  }

  /**
    * Sets the stroke property on the current element
    */
  stroke(): void {
    if (this.__currentElement.nodeName === "path") {
      this.__currentElement.setAttribute("paint-order", "fill")
    }
    this.__applyCurrentDefaultPath()
    this.__applyStyleToCurrentElement("stroke")
    if (this._clip_path != null) {
      this.__currentElement.setAttribute("clip-path", this._clip_path)
    }
  }

  /**
    * Sets fill properties on the current element
    */
  fill(fill_rule?: CanvasFillRule): void
  fill(path: Path2D, fill_rule?: CanvasFillRule): void

  fill(path_or_fill_rule?: Path2D | CanvasFillRule, fill_rule?: CanvasFillRule): void {
    let path: Path2D | null = null
    if (path_or_fill_rule instanceof Path2D)
      path = path_or_fill_rule
    else if (fill_rule == null)
      fill_rule = path_or_fill_rule
    else
      throw new Error("invalid arguments")

    if (path != null) {
      throw new Error("not implemented")
    }

    // XXX: hack (?) to allow fill and hatch visuals on same canvas path
    if (this.__currentElement.getAttribute("fill") != "none") {
      this.__init_element()
    }
    if (this.__currentElement.nodeName === "path") {
      this.__currentElement.setAttribute("paint-order", "stroke")
    }
    this.__applyCurrentDefaultPath()
    this.__applyStyleToCurrentElement("fill")
    if (fill_rule != null) {
      this.__currentElement.setAttribute("fill-rule", fill_rule)
    }
    if (this._clip_path != null) {
      this.__currentElement.setAttribute("clip-path", this._clip_path)
    }
  }

  /**
    *  Adds a rectangle to the path.
    */
  rect(x: number, y: number, width: number, height: number): void {
    if (!isFinite(x + y + width + height))
      return
    this.moveTo(x, y)
    this.lineTo(x + width, y)
    this.lineTo(x + width, y + height)
    this.lineTo(x, y + height)
    this.lineTo(x, y)
    this.closePath()
  }

  /**
    * adds a rectangle element
    */
  fillRect(x: number, y: number, width: number, height: number): void {
    if (!isFinite(x + y + width + height))
      return
    this.beginPath()
    this.rect(x, y, width, height)
    this.fill()
  }

  /**
    * Draws a rectangle with no fill
    * @param x
    * @param y
    * @param width
    * @param height
    */
  strokeRect(x: number, y: number, width: number, height: number): void {
    if (!isFinite(x + y + width + height))
      return
    this.beginPath()
    this.rect(x, y, width, height)
    this.stroke()
  }

  /**
    * Clear entire canvas:
    * 1. save current transforms
    * 2. remove all the childNodes of the root g element
    */
  __clearCanvas(): void {
    empty(this.__defs)
    empty(this.__root)
    this.__root.appendChild(this.__defs)
    this.__currentElement = this.__root
  }

  /**
    * "Clears" a canvas by just drawing a white rectangle in the current group.
    */
  clearRect(x: number, y: number, width: number, height: number): void {
    if (!isFinite(x + y + width + height))
      return
    if (x === 0 && y === 0 && width === this.width && height === this.height) {
      this.__clearCanvas()
      return
    }
    const rect = this.__createElement("rect", {x, y, width, height, fill: "#FFFFFF"}, true)
    this._apply_transform(rect)
    this.__root.appendChild(rect)
  }

  roundRect(_x: number, _y: number, _w: number, _h: number, _radii?: number | DOMPointInit | Iterable<number | DOMPointInit>): void {
    throw new Error("not implemented")
  }

  /**
    * Adds a linear gradient to a defs tag.
    * Returns a canvas gradient object that has a reference to it's parent def
    */
  createLinearGradient(x1: number, y1: number, x2: number, y2: number): CanvasGradient {
    if (!isFinite(x1 + y1 + x2 + y2))
      throw new Error("The provided double value is non-finite")
    const [tx1, ty1] = this._transform.apply(x1, y1)
    const [tx2, ty2] = this._transform.apply(x2, y2)
    const grad = this.__createElement("linearGradient", {
      id: this._random_string(),
      x1: `${tx1}px`,
      x2: `${tx2}px`,
      y1: `${ty1}px`,
      y2: `${ty2}px`,
      gradientUnits: "userSpaceOnUse",
    }, false)
    this.__defs.appendChild(grad)
    return new CanvasGradient(grad, this)
  }

  /**
    * Adds a radial gradient to a defs tag.
    * Returns a canvas gradient object that has a reference to it's parent def
    */
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    if (!isFinite(x0 + y0 + r0 + x1 + y1 + r1))
      throw new Error("The provided double value is non-finite")
    const [tx0, ty0] = this._transform.apply(x0, y0)
    const [tx1, ty1] = this._transform.apply(x1, y1)
    const grad = this.__createElement("radialGradient", {
      id: this._random_string(),
      cx: `${tx1}px`,
      cy: `${ty1}px`,
      r: `${r1}px`,
      r0: `${r0}px`,
      fx: `${tx0}px`,
      fy: `${ty0}px`,
      gradientUnits: "userSpaceOnUse",
    }, false)
    this.__defs.appendChild(grad)
    return new CanvasGradient(grad, this)
  }

  createConicGradient(_start_angle: number, _x: number, _y: number): CanvasGradient {
    throw Error("not implemented")
  }

  /**
    * Parses the font string and returns svg mapping
    */
  __parseFont(): FontData {
    const regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\'\"\sa-z0-9]+?)\s*$/i
    const [, style, decoration, weight, size,, family] = regex.exec(this.font)! as (string | undefined)[] // XXX: RegExpExecArray is incorrecdt
    const data: FontData = {
      style: style ?? "normal",
      size: size ?? "10px",
      family: family ?? "sans-serif",
      weight: weight ?? "normal",
      decoration: decoration ?? "normal",
    }

    return data
  }

  /**
    * Fills or strokes text
    */
  __applyText(text: string, x: number, y: number, action: "fill" | "stroke"): void {
    const font = this.__parseFont()

    const text_el = this.__createElement("text", {
      "font-family": font.family,
      "font-size": font.size,
      "font-style": font.style,
      "font-weight": font.weight,
      "text-decoration": font.decoration,
      x,
      y,
      "text-anchor": getTextAnchor(this.textAlign),
      "dominant-baseline": getDominantBaseline(this.textBaseline),
    }, true)

    text_el.appendChild(this.__document.createTextNode(text))
    this._apply_transform(text_el)
    this.__currentElement = text_el
    this.__applyStyleToCurrentElement(action)

    const el = (() => {
      if (this._clip_path != null) {
        const g = this.__createElement("g")
        g.setAttribute("clip-path", this._clip_path)
        g.appendChild(text_el)
        return g
      } else
        return text_el
    })()
    this.__root.appendChild(el)
  }

  /**
    * Creates a text element, in position x,y
    */
  fillText(text: string, x: number, y: number): void {
    if (!isFinite(x + y))
      return
    this.__applyText(text, x, y, "fill")
  }

  /**
    * Strokes text
    */
  strokeText(text: string, x: number, y: number): void {
    if (!isFinite(x + y))
      return
    this.__applyText(text, x, y, "stroke")
  }

  /**
    * No need to implement this for svg.
    */
  measureText(text: string): TextMetrics {
    this.__ctx.font = this.font
    return this.__ctx.measureText(text)
  }

  arc(x: number, y: number, radius: number, start_angle: number, end_angle: number, counterclockwise: boolean = false): void {
    this.ellipse(x, y, radius, radius, 0, start_angle, end_angle, counterclockwise)
  }

  ellipse(x: number, y: number, radius_x: number, radius_y: number, rotation: number, start_angle: number, end_angle: number, counterclockwise: boolean = false): void {
    if (!isFinite(x + y + radius_x + radius_y + rotation + start_angle + end_angle))
      return

    if (radius_x < 0 || radius_y < 0)
      throw new DOMException("IndexSizeError, radius can't be negative")

    const initial_diff = counterclockwise ? end_angle - start_angle : start_angle - end_angle

    start_angle = start_angle % (2 * Math.PI)
    end_angle = end_angle % (2 * Math.PI)

    const transform = new AffineTransform().translate(x, y).rotate(rotation)
    const dx = radius_x*Math.cos(start_angle)
    const dy = radius_y*Math.sin(start_angle)
    const [start_x, start_y] = transform.apply(dx, dy)
    this.lineTo(start_x, start_y)

    // Canvas ellipse defines rotation in radians and SVG elliptical arc is defined in degrees
    const rotation_in_degrees = rotation * 180 / Math.PI

    const sweep_flag = counterclockwise ? 0 : 1

    /**
     * Check if need to draw full ellipse (issue #11475). When testing if angular difference is
     * equal to an integer multiple of 2*pi radians, need to account for float64 to float32 rounding
     * error on both the start and end angles, hence the factor of 2. Do not assume full circle if
     * start and end angles are close, but test here depends on combination of sign of angular
     * difference and wedge direction (clockwise/counterclockwise) to obtain the same results as on
     * canvas.
     */
    if (Math.abs(start_angle - end_angle) < 2*float32_epsilon &&
        !(Math.abs(initial_diff) < 2*float32_epsilon && initial_diff < 0)) {

      // Draw full ellipse. SVG elliptical arc cannot do this, so instead use two semi ellipses.
      const [tstart_x, tstart_y] = this._transform.apply(start_x, start_y)

      const dx = radius_x*Math.cos(start_angle + Math.PI)
      const dy = radius_y*Math.sin(start_angle + Math.PI)
      const [mid_x, mid_y] = transform.apply(dx, dy)
      const [tmid_x, tmid_y] = this._transform.apply(mid_x, mid_y)

      this.__addPathCommand(tstart_x, tstart_y, `A ${radius_x} ${radius_y} ${rotation_in_degrees} 0 ${sweep_flag} ${tmid_x} ${tmid_y} A ${radius_x} ${radius_y} ${rotation_in_degrees} 0 ${sweep_flag} ${tstart_x} ${tstart_y}`)
    } else {
      // Draw partial ellipse only.
      const dx = radius_x*Math.cos(end_angle)
      const dy = radius_y*Math.sin(end_angle)
      const [end_x, end_y] = transform.apply(dx, dy)

      let diff = end_angle - start_angle

      // https://github.com/gliffy/canvas2svg/issues/4
      if (diff < 0) {
        diff += 2 * Math.PI
      }

      const large_arc_flag = (counterclockwise !== diff > Math.PI) ? 1 : 0  // imitation xor

      const [tend_x, tend_y] = this._transform.apply(end_x, end_y)

      this.__addPathCommand(tend_x, tend_y, `A ${radius_x} ${radius_y} ${rotation_in_degrees} ${large_arc_flag} ${sweep_flag} ${tend_x} ${tend_y}`)
    }
  }

  private _clip_path: Path | null = null

  /**
    * Generates a ClipPath from the clip command.
    */
  clip(fill_rule?: CanvasFillRule): void
  clip(path: Path2D, fill_rule?: CanvasFillRule): void

  clip(path_or_fill_rule?: Path2D | CanvasFillRule, fill_rule?: CanvasFillRule): void {
    let path: Path2D | null = null
    if (path_or_fill_rule instanceof Path2D)
      path = path_or_fill_rule
    else if (fill_rule == null)
      fill_rule = path_or_fill_rule
    else
      throw new Error("invalid arguments")

    if (path != null) {
      throw new Error("not implemented")
    }

    const clip_path = this.__createElement("clipPath")
    const id = this._random_string()

    this.__applyCurrentDefaultPath()
    if (fill_rule != null) {
      this.__currentElement.setAttribute("clip-rule", fill_rule)
    }

    clip_path.setAttribute("id", id)
    clip_path.appendChild(this.__currentElement)

    this.__defs.appendChild(clip_path)
    this._clip_path = `url(#${id})`
  }

  drawImage(image: CanvasImageSource, dx: number, dy: number): void
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
  drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void
  /**
    * Draws a canvas, image or mock context to this canvas.
    * Note that all svg dom manipulation uses node.childNodes rather than node.children for IE support.
    * http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
    */
  drawImage(image: CanvasImageSource, ...args: number[]): void {
    let dx: number, dy: number
    let dw: number, dh: number
    let sx: number, sy: number
    let sw: number, sh: number

    if (args.length == 2) {
      [dx, dy] = args
      if (!isFinite(dx + dy))
        return
      sx = 0
      sy = 0
      const [w, h] = width_height(image)
      dw = sw = w
      dh = sh = h
    } else if (args.length == 4) {
      [dx, dy, dw, dh] = args
      if (!isFinite(dx + dy + dw + dh))
        return
      sx = 0
      sy = 0
      const [w, h] = width_height(image)
      sw = w
      sh = h
    } else if (args.length === 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args
      if (!isFinite(sx + sy + sw + sh + dx + dy + dw + dh))
        return
    } else {
      throw new Error(`Inavlid number of arguments passed to drawImage: ${arguments.length}`)
    }

    // parent, svg, defs, group, currentElement, svgImage, canvas, context, id
    const parent = this.__root
    const transform = this._transform.clone().translate(dx, dy)
    if (image instanceof SVGRenderingContext2D || image instanceof SVGSVGElement) {
      // In the future we may want to clone nodes instead.
      // also I'm currently ignoring dw, dh, sw, sh, sx, sy for a mock context.
      const svg_node = image instanceof SVGSVGElement ? image : image.get_svg()
      const svg = svg_node.cloneNode(true) as SVGElement
      let scope: SVGElement
      if (transform.is_identity && this.globalAlpha == 1.0 && this._clip_path == null)
        scope = parent
      else {
        scope = this.__createElement("g")
        if (!transform.is_identity)
          this._apply_transform(scope, transform)
        if (this.globalAlpha != 1.0)
          scope.setAttribute("opacity", `${this.globalAlpha}`)
        if (this._clip_path != null)
          scope.setAttribute("clip-path", this._clip_path)
        parent.appendChild(scope)
      }
      for (const child of [...svg.childNodes]) {
        if (child instanceof SVGDefsElement) {
          for (const def of [...child.childNodes]) {
            if (def instanceof Element) {
              const id = def.getAttribute("id")!
              this.__ids.add(id)
              this.__defs.appendChild(def.cloneNode(true))
            }
          }
        } else {
          scope.appendChild(child.cloneNode(true))
        }
      }
    } else if (image instanceof HTMLImageElement || image instanceof SVGImageElement) {
      const svgImage = this.__createElement("image")
      svgImage.setAttribute("width", `${dw}`)
      svgImage.setAttribute("height", `${dh}`)
      svgImage.setAttribute("preserveAspectRatio", "none")
      if (this.globalAlpha != 1.0)
        svgImage.setAttribute("opacity", `${this.globalAlpha}`)

      if (sx != 0 || sy != 0 || sw !== image.width || sh !== image.height) {
        // crop the image using a temporary canvas
        const canvas = this.__document.createElement("canvas")
        canvas.width = dw
        canvas.height = dh
        const context = canvas.getContext("2d")!
        context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)
        image = canvas
      }
      this._apply_transform(svgImage, transform)
      const url = image instanceof HTMLCanvasElement ? image.toDataURL() : image.getAttribute("src")!
      svgImage.setAttribute("href", url)

      if (this._clip_path != null) {
        const scope = this.__createElement("g")
        scope.setAttribute("clip-path", this._clip_path)
        scope.appendChild(svgImage)
        parent.appendChild(scope)
      } else
        parent.appendChild(svgImage)
    } else if (image instanceof HTMLCanvasElement) {
      const svgImage = this.__createElement("image")
      svgImage.setAttribute("width", `${dw}`)
      svgImage.setAttribute("height", `${dh}`)
      svgImage.setAttribute("preserveAspectRatio", "none")
      if (this.globalAlpha != 1.0)
        svgImage.setAttribute("opacity", `${this.globalAlpha}`)

      // draw canvas onto temporary canvas so that smoothing can be handled
      const canvas = this.__document.createElement("canvas")
      canvas.width = dw
      canvas.height = dh
      const context = canvas.getContext("2d")!
      context.imageSmoothingEnabled = false
      context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)
      image = canvas

      this._apply_transform(svgImage, transform)
      svgImage.setAttribute("href", image.toDataURL())

      if (this._clip_path != null) {
        const scope = this.__createElement("g")
        scope.setAttribute("clip-path", this._clip_path)
        scope.appendChild(svgImage)
        parent.appendChild(scope)
      } else
        parent.appendChild(svgImage)
    }
  }

  /**
    * Generates a pattern tag
    */
  createPattern(image: CanvasImageSource, _repetition: string | null): CanvasPattern | null {
    const pattern = this.__document.createElementNS("http://www.w3.org/2000/svg", "pattern")
    const id = this._random_string()
    const [width, height] = width_height(image)
    pattern.setAttribute("id", id)
    pattern.setAttribute("width", `${width}`)
    pattern.setAttribute("height", `${height}`)
    pattern.setAttribute("patternUnits", "userSpaceOnUse")
    if (image instanceof HTMLCanvasElement || image instanceof HTMLImageElement || image instanceof SVGImageElement) {
      const img = this.__document.createElementNS("http://www.w3.org/2000/svg", "image")
      const url = image instanceof HTMLCanvasElement ? image.toDataURL() : image.getAttribute("src")!
      img.setAttribute("href", url)
      pattern.appendChild(img)
      this.__defs.appendChild(pattern)
    } else if (image instanceof SVGRenderingContext2D) {
      for (const child of [...image.__root.childNodes]) {
        if (!(child instanceof SVGDefsElement)) {
          pattern.appendChild(child.cloneNode(true))
        }
      }
      //pattern.appendChild(image.__root.childNodes[1])
      this.__defs.appendChild(pattern)
    } else if (image instanceof SVGSVGElement) {
      for (const child of [...image.childNodes]) {
        if (!(child instanceof SVGDefsElement)) {
          pattern.appendChild(child.cloneNode(true))
        }
      }
      //pattern.appendChild(image.__root.childNodes[1])
      this.__defs.appendChild(pattern)
    } else {
      throw new Error("unsupported")
    }
    return new CanvasPattern(pattern, this)
  }

  getLineDash(): number[] {
    const {lineDash} = this
    if (isString(lineDash))
      return lineDash.split(",").map((v) => parseInt(v))
    else if (lineDash == null)
      return []
    else
      return lineDash
  }

  setLineDash(segments: number[]): void {
    if (segments.length > 0)
      this.lineDash = segments.join(",")
    else
      this.lineDash = null
  }

  getTransform(): DOMMatrix {
    return this._transform.to_DOMMatrix()
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
  setTransform(transform?: DOMMatrix2DInit): void
  setTransform(matrix: DOMMatrix): void

  setTransform(...args: [DOMMatrix2DInit?] | [DOMMatrix] | [number, number, number, number, number, number]): void {
    let matrix: DOMMatrix

    if (isNumber(args[0]))
      matrix = new DOMMatrix(args as number[])
    else if (args[0] instanceof DOMMatrix)
      matrix = args[0]
    else
      matrix = new DOMMatrix(Object.values(args[0] == null))

    this._transform = AffineTransform.from_DOMMatrix(matrix)
  }

  resetTransform(): void {
    this._transform = new AffineTransform()
  }

  isPointInPath(x: number, y: number, fill_rule?: CanvasFillRule): boolean
  isPointInPath(path: Path2D, x: number, y: number, fill_rule?: CanvasFillRule): boolean

  isPointInPath(..._args: any[]): boolean {
    throw new Error("not implemented")
  }

  isPointInStroke(x: number, y: number): boolean
  isPointInStroke(path: Path2D, x: number, y: number): boolean

  isPointInStroke(..._args: any[]): boolean {
    throw new Error("not implemented")
  }

  createImageData(sw: number, sh: number): ImageData
  createImageData(imagedata: ImageData): ImageData

  createImageData(..._args: any[]): ImageData {
    throw new Error("not implemented")
  }

  getImageData(_sx: number, _sy: number, _sw: number, _sh: number): ImageData {
    throw new Error("not implemented")
  }

  putImageData(imagedata: ImageData, dx: number, dy: number): void
  putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void

  putImageData(..._args: any[]): void {
    throw new Error("not implemented")
  }

  drawFocusIfNeeded(element: Element): void
  drawFocusIfNeeded(path: Path2D, element: Element): void

  drawFocusIfNeeded(..._args: any[]): void {
    throw new Error("not implemented")
  }

  scrollPathIntoView(): void
  scrollPathIntoView(path: Path2D): void

  scrollPathIntoView(..._args: any[]): void {
    throw new Error("not implemented")
  }
}
