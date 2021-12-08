function is_undefined(obj: unknown): obj is undefined {
  return typeof obj === "undefined"
}

function isNumber(obj: unknown): obj is number {
  return toString.call(obj) === "[object Number]"
}

function isString(obj: unknown): obj is string {
  return toString.call(obj) === "[object String]"
}

export class MathJaxCanvas {
  private paths: Record<string, string> = {}
  private initial_scale: [number, number]
  private initial_position: [number, number]

  constructor(readonly svg: SVGSVGElement, readonly ctx: CanvasRenderingContext2D, output_size: {width: number, height: number}) {
    const defs = svg.querySelector("defs")

    if (defs) {
      for (const kid of defs.children) {
        const path_id = kid.getAttribute("id")

        if (path_id == null)
          throw new Error(`expected id on ${kid.tagName} attributes.`)

        const data_c = path_id.split("-").pop()!
        this.paths[data_c] = kid.getAttribute("d")!
      }
    }

    const svg_viewbox = this.svg.getAttribute("viewBox")

    if (svg_viewbox == null)
      throw new Error("expected viewBox on SVG's attributes.")

    const [initial_x, initial_y, view_width, view_height] = svg_viewbox.split(" ")
    this.initial_position = [parseFloat(initial_x), parseFloat(initial_y)]

    this.initial_scale = [
      output_size.width / parseFloat(view_width),
      output_size.height / parseFloat(view_height),
    ]
  }

  draw() {
    this.ctx.save()
    this.ctx.scale(...this.initial_scale)
    const init_g = this.svg.querySelector("g")
    // mirror vertically
    this.transform(init_g?.getAttribute("transform"))
    // must be after initial scaling
    this.ctx.translate(...this.initial_position)
    this.walk(init_g?.firstElementChild)
    this.ctx.restore()
  }

  private walk(el?: Element | null) {
    if (el == null || is_undefined(el))
      return

    this.ctx.save()

    switch (el.tagName) {
      case "rect":
        this.draw_rect(el as SVGRectElement)
        break

      case "text":
        this.draw_text(el as SVGTextElement)
        break

      case "line":
        this.draw_line(el as SVGLineElement)
        break

      case "ellipse":
        this.draw_ellipse(el as SVGEllipseElement)
        break

      case "g":
        this.parse_container(el as SVGGElement)
        break

      case "use":
        this.use(el as SVGUseElement)
        break

      case "title":
        console.error(el.textContent)
        break

      case "svg":
        this.sub_svg(el as SVGSVGElement)
        break

      default:
        console.error(`element ${el.tagName} not supported`)
        break
    }

    for (const kid of el.children) {
      this.walk(kid)
    }

    this.ctx.restore()
  }

  private parse_svg_transform_params(val: string): [number, number] {
    const comma = val.trim().split(",")
    const space = val.trim().split(" ")

    if (comma.length == 2) return [parseFloat(comma[0]), parseFloat(comma[1])]
    if (space.length == 2) return [parseFloat(space[0]), parseFloat(space[1])]

    return [parseFloat(space[0]), parseFloat(space[0])]
  }

  private transform(
    transform_attr?: string | null,
  ) {
    if (is_undefined(transform_attr)  || transform_attr == null)
      return

    const regex_translate = /translate\((.*?)\)/
    const regex_scale = /scale\((.*?)\)/
    const regex_matrix = /matrix\((.*?)\)/

    const translate_match = regex_translate.exec(transform_attr)
    if (translate_match && translate_match[1]) {
      this.ctx.translate(
        ...this.parse_svg_transform_params(translate_match[1]),
      )
    }

    const scale_match = regex_scale.exec(transform_attr)
    if (scale_match && scale_match[1]) {
      this.ctx.scale(...this.parse_svg_transform_params(scale_match[1]))
    }

    const matrix_match = regex_matrix.exec(transform_attr)
    if (matrix_match && matrix_match[1]) {
      const matrix = matrix_match[1].split(" ").map((val) => parseFloat(val))
      this.ctx.setTransform(
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
      )
    }
  }

  private parse_numeric_attribute(el: Element, attr_name: string): number | null {
    const value = el.getAttribute(attr_name)

    if (value == null)
      return null

    return parseFloat(value)
  }

  private draw_rect(rect: SVGRectElement) {
    const x = this.parse_numeric_attribute(rect, "x")
    const y = this.parse_numeric_attribute(rect, "y")
    const width = this.parse_numeric_attribute(rect, "width")
    const height = this.parse_numeric_attribute(rect, "height")
    const stroke_thickness = this.parse_numeric_attribute(rect, "stroke-thickness")
    const stroke_dasharray = rect.getAttribute("stroke-dasharray")

    if (x == null || y == null || width == null || height == null) {
      throw new Error("unparseable rect")
    }

    if (isNumber(stroke_thickness) || isString(stroke_dasharray)) {
      this.ctx.save()

      if (stroke_thickness != null) {
        this.ctx.lineWidth = stroke_thickness
      }

      if (stroke_dasharray != null) {
        this.ctx.setLineDash(
          stroke_dasharray.split(" ").map((val) => parseFloat(val)),
        )
      }

      this.ctx.strokeRect(x, y, width, height)
      this.ctx.restore()
    } else {
      this.ctx.fillRect(x, y, width, height)
    }
  }

  private draw_line(line: SVGLineElement) {
    const x1 = this.parse_numeric_attribute(line, "x1")
    const y1 = this.parse_numeric_attribute(line, "y1")
    const x2 = this.parse_numeric_attribute(line, "x2")
    const y2 = this.parse_numeric_attribute(line, "y2")
    const stroke_thickness = this.parse_numeric_attribute(line, "stroke-thickness")
    const stroke_dasharray = line.getAttribute("stroke-dasharray")

    if (x1 == null || y1 == null || x2 == null || y2 == null) {
      throw new Error("unparseable line")
    }

    this.ctx.save()
    this.ctx.beginPath()

    if (stroke_thickness != null) {
      this.ctx.lineWidth = stroke_thickness
    }

    if (stroke_dasharray != null) {
      this.ctx.setLineDash(
        stroke_dasharray.split(" ").map((val) => parseFloat(val)),
      )
    }

    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.stroke()
    this.ctx.restore()
  }

  private draw_text(text: SVGTextElement) {
    this.ctx.save()
    this.transform(text.getAttribute("transform"))
    const font_size = text.getAttribute("font-size")
    this.ctx.font = `Bokeh ${font_size} normal`

    if (text.textContent != null)
      this.ctx.fillText(text.textContent, 0, 0)

    this.ctx.restore()
  }

  private draw_ellipse(
    ellipse: SVGEllipseElement,
  ) {
    const rx = this.parse_numeric_attribute(ellipse, "rx")
    const ry = this.parse_numeric_attribute(ellipse, "ry")
    const cx = this.parse_numeric_attribute(ellipse, "cx")
    const cy = this.parse_numeric_attribute(ellipse, "cy")
    const fill = ellipse.getAttribute("fill")
    const stroke_width = this.parse_numeric_attribute(ellipse, "stroke-width")

    if (rx == null || ry == null || cx == null || cy == null) {
      throw new Error("unparseable ellipse")
    }

    this.ctx.save()

    if (fill != null)
      this.ctx.fillStyle = fill

    if (stroke_width != null)
      this.ctx.lineWidth = stroke_width

    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
    this.ctx.stroke()
    this.ctx.restore()
  }

  private parse_container(g: SVGGElement) {
    const fill = g.getAttribute("fill")
    if (fill != null) {
      this.ctx.fillStyle = fill
    }

    const stroke = g.getAttribute("stroke")
    if (stroke != null) {
      this.ctx.strokeStyle = stroke
    }

    const transform_attr = g.getAttribute("transform")
    if (transform_attr != null) {
      this.transform(transform_attr)
    }
  }

  private use(el: SVGUseElement) {
    const transform_attr = el.getAttribute("transform")
    if (transform_attr != null) {
      this.transform(transform_attr)
    }

    const data_c = el.getAttribute("data-c")
    if (data_c != null) {
      const path = new Path2D(this.paths[data_c])
      path.toString = () => this.paths[data_c]
      this.ctx.fill(path)
    }
  }

  private sub_svg(el: SVGSVGElement) {
    const x = this.parse_numeric_attribute(el, "x")
    const y = this.parse_numeric_attribute(el, "y")

    if (x != null && y != null)
      this.ctx.translate(x, y)
  }
}
