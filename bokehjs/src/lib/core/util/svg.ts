/**
 * Based on https://github.com/gliffy/canvas2svg
 */

import {AffineTransform} from "./affine"
import {isString, isNumber} from "./types"
import {empty} from "../dom"

type KV<T> = {[key: string]: T}

type FontData = {
  style: string
  size: string
  family: string
  weight: string
  decoration: string
  href?: string
}

// helper function that generates a random string
function randomString(holder: KV<string>): string {
  if (!holder) {
    throw new Error("cannot create a random attribute name for an undefined object")
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
  let randomstring = ""
  do {
    randomstring = ""
    for (let i = 0; i < 12; i++) {
      randomstring += chars[Math.floor(Math.random() * chars.length)]
    }
  } while (holder[randomstring])
  return randomstring
}

// helper function to map named to numbered entities
function createNamedToNumberedLookup(input: string, radix: number): Map<string, string> {
  const lookup = new Map()
  const items = input.split(',')
  radix = radix || 10
  // Map from named to numbered entities.
  for (let i = 0; i < items.length; i += 2) {
    const entity = '&' + items[i + 1] + ';'
    const base10 = parseInt(items[i], radix)
    lookup.set(entity, '&#'+base10+';')
  }
  // FF and IE need to create a regex from hex values ie &nbsp; == \xa0
  lookup.set("\\xa0", '&#160;')
  return lookup
}

// helper function to map canvas-textAlign to svg-textAnchor
function getTextAnchor(textAlign: string): string {
  // TODO: support rtl languages
  const mapping: KV<string> = {left:"start", right:"end", center:"middle", start:"start", end:"end"}
  return mapping[textAlign] || mapping.start
}

// helper function to map canvas-textBaseline to svg-dominantBaseline
function getDominantBaseline(textBaseline: string): string {
  // INFO: not supported in all browsers
  const mapping: KV<string> = {alphabetic: "alphabetic", hanging: "hanging", top:"text-before-edge", bottom:"text-after-edge", middle:"central"}
  return mapping[textBaseline] || mapping.alphabetic
}

// Unpack entities lookup where the numbers are in radix 32 to reduce the size
// entity mapping courtesy of tinymce
const namedEntities = createNamedToNumberedLookup(
  '50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,' +
  '5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,' +
  '5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,' +
  '5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,' +
  '68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,' +
  '6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,' +
  '6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,' +
  '75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,' +
  '7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,' +
  '7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,' +
  'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,' +
  'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,' +
  't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,' +
  'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,' +
  'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,' +
  '81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,' +
  '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,' +
  '8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,' +
  '8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,' +
  '8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,' +
  'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,' +
  'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,' +
  'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,' +
  '80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,' +
  '811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro', 32)

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
  "textAlign" |
  "textBaseline" |
  "lineDash"

type StyleState = {[key in StyleAttr]: Style}

// Some basic mappings for attributes and default values.
const STYLES: StyleState = {
  strokeStyle:{
    svgAttr: "stroke", // corresponding svg attribute
    canvas: "#000000", // canvas default
    svg: "none",       // svg default
    apply: "stroke",   // apply on stroke() or fill()
  },
  fillStyle:{
    svgAttr: "fill",
    canvas: "#000000",
    svg: null, // svg default is black, but we need to special case this to handle canvas stroke without fill
    apply: "fill",
  },
  lineCap:{
    svgAttr: "stroke-linecap",
    canvas: "butt",
    svg: "butt",
    apply: "stroke",
  },
  lineJoin:{
    svgAttr: "stroke-linejoin",
    canvas: "miter",
    svg: "miter",
    apply: "stroke",
  },
  miterLimit:{
    svgAttr: "stroke-miterlimit",
    canvas: 10,
    svg: 4,
    apply: "stroke",
  },
  lineWidth:{
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
  font:{
    // font converts to multiple svg attributes, there is custom logic for this
    canvas: "10px sans-serif",
  },
  shadowColor:{
    canvas: "#000000",
  },
  shadowOffsetX:{
    canvas: 0,
  },
  shadowOffsetY:{
    canvas: 0,
  },
  shadowBlur:{
    canvas: 0,
  },
  textAlign:{
    canvas: "start",
  },
  textBaseline:{
    canvas: "alphabetic",
  },
  lineDash: {
    svgAttr: "stroke-dasharray",
    canvas: [],
    svg: null,
    apply: "stroke",
  },
}

class CanvasGradient {
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

class CanvasPattern {
  __root: SVGPatternElement
  __ctx: SVGRenderingContext2D

  constructor(pattern: SVGPatternElement, ctx: SVGRenderingContext2D) {
    this.__root = pattern
    this.__ctx = ctx
  }
}

type Options = {
  width?: number
  height?: number
  document?: Document
  ctx?: CanvasRenderingContext2D
}

type Path = string

type CanvasState = {
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
export class SVGRenderingContext2D /*implements CanvasRenderingContext2D*/ {
  __canvas: HTMLCanvasElement
  __ctx: CanvasRenderingContext2D

  __root: SVGSVGElement
  __ids: KV<string>
  __defs: SVGElement
  __stack: CanvasState[]
  __document: Document
  __currentElement: SVGElement // null?
  __currentDefaultPath: string
  __currentPosition: {x: number, y: number} | null = null
  __currentElementsToStyle: {element: SVGElement, children: SVGElement[]} | null = null
  __fontUnderline?: string
  __fontHref?: string

  get canvas(): this {
    // XXX: point back to this instance
    return this
  }

  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  miterLimit: number
  lineWidth: number
  globalAlpha: number
  font: string
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  lineDash: string | number[] | null

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
    if (options?.ctx) {
      this.__ctx = options.ctx
    } else {
      this.__canvas = this.__document.createElement("canvas")
      this.__ctx = this.__canvas.getContext("2d")!
    }

    this.__setDefaultStyles()
    this.__stack = []

    // the root svg element
    this.__root = this.__document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.__root.setAttribute("version", "1.1")
    this.__root.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    this.__root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")

    this.width = options?.width ?? 500
    this.height = options?.height ?? 500

    // make sure we don't generate the same ids in defs
    this.__ids = {}

    // defs tag
    this.__defs = this.__document.createElementNS("http://www.w3.org/2000/svg", "defs")
    this.__root.appendChild(this.__defs)
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
    let currentElement = this.__currentElement
    const currentStyleGroup = this.__currentElementsToStyle
    if (currentStyleGroup != null) {
      currentElement.setAttribute(type, "")
      currentElement = currentStyleGroup.element
      for (const node of currentStyleGroup.children) {
        node.setAttribute(type, "")
      }
    }

    const keys = Object.keys(STYLES) as StyleAttr[]
    for (let i = 0; i < keys.length; i++) {
      const style = STYLES[keys[i]]
      const value = this[keys[i]]
      if (style.apply) {
        if (value instanceof CanvasPattern) {
          for (const def of [...value.__ctx.__defs.childNodes]) {
            if (def instanceof Element) {
              const id = def.getAttribute("id")!
              this.__ids[id] = id
              this.__defs.appendChild(def)
            }
          }
          const id = value.__root.getAttribute("id")
          currentElement.setAttribute(style.apply, `url(#${id})`)
        } else if (value instanceof CanvasGradient) {
          const id = value.__root.getAttribute("id")
          currentElement.setAttribute(style.apply, `url(#${id})`)
        } else if (style.apply.indexOf(type) !== -1 && style.svg !== value) {
          if ((style.svgAttr === "stroke" || style.svgAttr === "fill") && isString(value) && value.indexOf("rgba") !== -1) {
            // separate alpha value, since illustrator can't handle it
            const regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi
            const matches = regex.exec(value)!
            const [, r, g, b, a] = matches
            currentElement.setAttribute(style.svgAttr, `rgb(${r},${g},${b})`)
            // should take globalAlpha here
            let opacity = parseFloat(a)
            const globalAlpha = this.globalAlpha
            if (globalAlpha != null) {
              opacity *= globalAlpha
            }
            currentElement.setAttribute(style.svgAttr+"-opacity", `${opacity}`)
          } else {
            let attr = style.svgAttr!
            if (keys[i] === 'globalAlpha') {
              attr = type+'-'+style.svgAttr
              if (currentElement.getAttribute(attr)) {
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

    // IE search for a duplicate xmnls because they didn't implement setAttributeNS correctly
    const xmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg".+xmlns="http:\/\/www\.w3\.org\/2000\/svg/gi
    if (xmlns.test(serialized)) {
      serialized = serialized.replace('xmlns="http://www.w3.org/2000/svg', 'xmlns:xlink="http://www.w3.org/1999/xlink')
    }

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
    const separator = !this.__currentDefaultPath ? "" : " "
    this.__currentDefaultPath += separator + path
    this.__currentPosition = {x, y}
  }

  get _hasCurrentDefaultPath(): boolean {
    return !!this.__currentDefaultPath
  }

  /**
    * Adds the move command to the current path element,
    * if the currentPathElement is not empty create a new path element
    */
  moveTo(x: number, y: number): void {
    if (!isFinite(x + y))
      return

    if (this.__currentElement.nodeName !== "path") {
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
      throw new Error("IndexSizeError: The radius provided (" + radius + ") is negative.")
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
  fill(): void {
    if (this.__currentElement.nodeName === "path") {
      this.__currentElement.setAttribute("paint-order", "stroke")
    }
    this.__applyCurrentDefaultPath()
    this.__applyStyleToCurrentElement("fill")
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
    if (this.__currentElement.nodeName !== "path") {
      this.beginPath()
    }
    this.moveTo(x, y)
    this.lineTo(x+width, y)
    this.lineTo(x+width, y+height)
    this.lineTo(x, y+height)
    this.lineTo(x, y)
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
      id: randomString(this.__ids),
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
  createRadialGradient(x0: number, y0: number, _r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    if (!isFinite(x0 + y0 + _r0 + x1 + y1 + r1))
      throw new Error("The provided double value is non-finite")
    const [tx0, ty0] = this._transform.apply(x0, y0)
    const [tx1, ty1] = this._transform.apply(x1, y1)
    const grad = this.__createElement("radialGradient", {
      id: randomString(this.__ids),
      cx: `${tx1}px`,
      cy: `${ty1}px`,
      r : `${r1}px`,
      fx: `${tx0}px`,
      fy: `${ty0}px`,
      gradientUnits: "userSpaceOnUse",
    }, false)
    this.__defs.appendChild(grad)
    return new CanvasGradient(grad, this)

  }

  /**
    * Parses the font string and returns svg mapping
    */
  __parseFont(): FontData {
    const regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\'\"\sa-z0-9]+?)\s*$/i
    const fontPart = regex.exec(this.font)!
    const data: FontData = {
      style: fontPart[1] || 'normal',
      size: fontPart[4] || '10px',
      family: fontPart[6] || 'sans-serif',
      weight: fontPart[3] || 'normal',
      decoration: fontPart[2] || 'normal',
    }

    // canvas doesn't support underline natively, but we can pass this attribute
    if (this.__fontUnderline === "underline") {
      data.decoration = "underline"
    }

    // canvas also doesn't support linking, but we can pass this as well
    if (this.__fontHref != null) {
      data.href = this.__fontHref
    }

    return data
  }

  /**
    * Helper to link text fragments
    */
  __wrapTextLink(font: FontData, element: SVGElement): Element {
    if (font.href) {
      const a = this.__createElement("a")
      a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", font.href)
      a.appendChild(element)
      return a
    }
    return element
  }

  /**
    * Fills or strokes text
    */
  __applyText(text: string, x: number, y: number, action: "fill" | "stroke"): void {
    const font = this.__parseFont()
    const textElement = this.__createElement("text", {
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

    textElement.appendChild(this.__document.createTextNode(text))
    this._apply_transform(textElement)
    this.__currentElement = textElement
    this.__applyStyleToCurrentElement(action)
    this.__root.appendChild(this.__wrapTextLink(font, textElement))
  }

  /**
    * Creates a text element
    */
  fillText(text: string, x: number, y: number): void {
    if (text == null || !isFinite(x + y))
      return
    this.__applyText(text, x, y, "fill")
  }

  /**
    * Strokes text
    */
  strokeText(text: string, x: number, y: number): void {
    if (text == null || !isFinite(x + y))
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

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise: boolean = false): void {
    if (!isFinite(x + y + radius + startAngle + endAngle))
      return
    // in canvas no circle is drawn if no angle is provided.
    if (startAngle === endAngle) {
      return
    }
    startAngle = startAngle % (2*Math.PI)
    endAngle = endAngle % (2*Math.PI)
    if (startAngle === endAngle) {
      // circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
      endAngle = ((endAngle + (2*Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2*Math.PI)
    }
    const endX = x+radius*Math.cos(endAngle)
    const endY = y+radius*Math.sin(endAngle)
    const startX = x+radius*Math.cos(startAngle)
    const startY = y+radius*Math.sin(startAngle)
    const sweepFlag = counterClockwise ? 0 : 1
    let largeArcFlag = 0
    let diff = endAngle - startAngle

    // https://github.com/gliffy/canvas2svg/issues/4
    if (diff < 0) {
      diff += 2*Math.PI
    }

    if (counterClockwise) {
      largeArcFlag = diff > Math.PI ? 0 : 1
    } else {
      largeArcFlag = diff > Math.PI ? 1 : 0
    }

    this.lineTo(startX, startY)
    const rx = radius
    const ry = radius
    const xAxisRotation = 0
    const [tendX, tendY] = this._transform.apply(endX, endY)
    this.__addPathCommand(tendX, tendY, `A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${tendX} ${tendY}`)
  }

  private _clip_path: Path | null = null

  /**
    * Generates a ClipPath from the clip command.
    */
  clip(): void {
    const clip_path = this.__createElement("clipPath")
    const id = randomString(this.__ids)

    this.__applyCurrentDefaultPath()
    clip_path.setAttribute("id", id)
    clip_path.appendChild(this.__currentElement)

    this.__defs.appendChild(clip_path)
    this._clip_path = `url(#${id})`
  }

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
      sw = image.width as number
      sh = image.height as number
      dw = sw
      dh = sh
    } else if (args.length == 4) {
      [dx, dy, dw, dh] = args
      if (!isFinite(dx + dy + dw + dh))
        return
      sx = 0
      sy = 0
      sw = image.width as number
      sh = image.height as number
    } else if (args.length === 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args
      if (!isFinite(sx + sy + sw + sh + dx + dy + dw + dh))
        return
    } else {
      throw new Error(`Inavlid number of arguments passed to drawImage: ${arguments.length}`)
    }

    // parent, svg, defs, group, currentElement, svgImage, canvas, context, id
    const parent = this.__root
    const translateDirective = "translate(" + dx + ", " + dy + ")"
    const transform = this._transform.clone().translate(dx, dy)
    if (image instanceof SVGRenderingContext2D || image instanceof SVGSVGElement) {
      // In the future we may want to clone nodes instead.
      // also I'm currently ignoring dw, dh, sw, sh, sx, sy for a mock context.
      const svg_node = image instanceof SVGSVGElement ? image : image.get_svg()
      const svg = svg_node.cloneNode(true) as SVGElement
      let scope: SVGElement
      if (transform.is_identity)
        scope = parent
      else {
        scope = this.__createElement("g")
        this._apply_transform(scope, transform)
        parent.appendChild(scope)
      }
      for (const child of [...svg.childNodes]) {
        if (child instanceof SVGDefsElement) {
          for (const def of [...child.childNodes]) {
            if (def instanceof Element) {
              const id = def.getAttribute("id")!
              this.__ids[id] = id
              this.__defs.appendChild(def)
            }
          }
        } else {
          scope.appendChild(child)
        }
      }
    } else if (image instanceof HTMLImageElement || image instanceof SVGImageElement) {
      const svgImage = this.__createElement("image")
      svgImage.setAttribute("width", `${dw}`)
      svgImage.setAttribute("height", `${dh}`)
      svgImage.setAttribute("preserveAspectRatio", "none")

      if (sx || sy || sw !== image.width || sh !== image.height) {
        // crop the image using a temporary canvas
        const canvas = this.__document.createElement("canvas")
        canvas.width = dw
        canvas.height = dh
        const context = canvas.getContext("2d")!
        context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)
        image = canvas
      }
      svgImage.setAttribute("transform", translateDirective)
      const url = image instanceof HTMLCanvasElement ? image.toDataURL() : image.getAttribute("src")!
      svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url)
      parent.appendChild(svgImage)
    } else if (image instanceof HTMLCanvasElement) {
      const svgImage = this.__createElement("image")
      svgImage.setAttribute("width", `${dw}`)
      svgImage.setAttribute("height", `${dh}`)
      svgImage.setAttribute("preserveAspectRatio", "none")

      // draw canvas onto temporary canvas so that smoothing can be handled
      const canvas = this.__document.createElement("canvas")
      canvas.width = dw
      canvas.height = dh
      const context = canvas.getContext("2d")!
      context.imageSmoothingEnabled = false
      context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)
      image = canvas

      svgImage.setAttribute("transform", translateDirective)
      svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", image.toDataURL())
      parent.appendChild(svgImage)
    }
  }

  /**
    * Generates a pattern tag
    */
  createPattern(image: CanvasImageSource, _repetition: string): CanvasPattern {
    const pattern = this.__document.createElementNS("http://www.w3.org/2000/svg", "pattern")
    const id = randomString(this.__ids)
    pattern.setAttribute("id", id)
    pattern.setAttribute("width", `${this._to_number(image.width)}`)
    pattern.setAttribute("height", `${this._to_number(image.height)}`)
    pattern.setAttribute("patternUnits", "userSpaceOnUse")
    if (image instanceof HTMLCanvasElement || image instanceof HTMLImageElement || image instanceof SVGImageElement) {
      const img = this.__document.createElementNS("http://www.w3.org/2000/svg", "image")
      const url = image instanceof HTMLCanvasElement ? image.toDataURL() : image.getAttribute("src")!
      img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url)
      pattern.appendChild(img)
      this.__defs.appendChild(pattern)
    } else if (image instanceof SVGRenderingContext2D) {
      for (const child of [...image.__root.childNodes]) {
        if (!(child instanceof SVGDefsElement)) {
          pattern.appendChild(child)
        }
      }
      //pattern.appendChild(image.__root.childNodes[1])
      this.__defs.appendChild(pattern)
    } else if (image instanceof SVGSVGElement) {
      for (const child of [...image.childNodes]) {
        if (!(child instanceof SVGDefsElement)) {
          pattern.appendChild(child)
        }
      }
      //pattern.appendChild(image.__root.childNodes[1])
      this.__defs.appendChild(pattern)
    } else {
      throw new Error("unsupported")
    }
    return new CanvasPattern(pattern, this)
  }

  setLineDash(dashArray: number[]): void {
    if (dashArray && dashArray.length > 0) {
      this.lineDash = dashArray.join(",")
    } else {
      this.lineDash = null
    }
  }

  private _to_number(val: number | SVGAnimatedLength): number {
    return isNumber(val) ? val : val.baseVal.value
  }
}
