/* XXX: partial */
import {Annotation, AnnotationView} from "./annotation";
import {TooltipAttachment} from "core/enums"
import {div, show, hide, empty} from "core/dom";
import * as p from "core/properties"

export const compute_side = function(attachment, sx, sy, hcenter, vcenter) {
  let side;
  switch (attachment) {
    case "horizontal":
      side = sx < hcenter ? 'right' : 'left';
      break;
    case "vertical":
      side = sy < vcenter ? 'below' : 'above';
      break;
    default:
      side = attachment;
  }
  return side;
};

export class TooltipView extends AnnotationView {
  model: Tooltip

  initialize(options: any): void {
    super.initialize(options);
    // TODO (bev) really probably need multiple divs
    this.plot_view.canvas_overlays.appendChild(this.el);
    this.el.style.zIndex = 1010;
    hide(this.el);
  }

  connect_signals(): void {
    super.connect_signals();
    this.connect(this.model.properties.data.change, () => this._draw_tips())
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-tooltip")
  }

  render() {
    if (!this.model.visible) {
      return;
    }
    return this._draw_tips();
  }

  _draw_tips() {
    let left, sx, sy, top;
    const { data } = this.model;
    empty(this.el);
    hide(this.el);

    if (this.model.custom) {
      this.el.classList.add("bk-tooltip-custom");
    } else {
      this.el.classList.remove("bk-tooltip-custom");
    }

    if (data.length === 0) {
      return;
    }

    const { frame } = this.plot_view;

    for (const val of data) {
      let content;
      [sx, sy, content] = val;
      if (this.model.inner_only && !frame.bbox.contains(sx, sy)) {
          continue;
        }
      const tip = div({}, content);
      this.el.appendChild(tip);
    }

    const side = compute_side(this.model.attachment, sx, sy, frame._hcenter.value, frame._vcenter.value);

    this.el.classList.remove("bk-right");
    this.el.classList.remove("bk-left");
    this.el.classList.remove("bk-above");
    this.el.classList.remove("bk-below");

    const arrow_size = 10; // XXX: keep in sync with less

    show(this.el); // XXX: {offset,client}Width() gives 0 when display="none"

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class "bk-left" is relative to the tooltip itself
    switch (side) {
      case "right":
        this.el.classList.add("bk-left");
        left = sx + (this.el.offsetWidth - this.el.clientWidth) + arrow_size;
        top = sy - (this.el.offsetHeight/2);
        break;
      case "left":
        this.el.classList.add("bk-right");
        left = sx - this.el.offsetWidth - arrow_size;
        top = sy - (this.el.offsetHeight/2);
        break;
      case "below":
        this.el.classList.add("bk-above");
        top = sy + (this.el.offsetHeight - this.el.clientHeight) + arrow_size;
        left = Math.round(sx - (this.el.offsetWidth/2));
        break;
      case "above":
        this.el.classList.add("bk-below");
        top = sy - this.el.offsetHeight - arrow_size;
        left = Math.round(sx - (this.el.offsetWidth/2));
        break;
    }

    if (this.model.show_arrow) {
        this.el.classList.add("bk-tooltip-arrow");
      }

    // TODO (bev) this is not currently bulletproof. If there are
    // two hits, not colocated and one is off the screen, that can
    // be problematic
    if (this.el.childNodes.length > 0) {
      this.el.style.top = `${top}px`;
      return this.el.style.left = `${left}px`;
    } else {
      return hide(this.el);
    }
  }
}

export namespace Tooltip {
  export interface Attrs extends Annotation.Attrs {
    attachment: TooltipAttachment
    inner_only: boolean
    show_arrow: boolean
    data: [number, number, HTMLElement][]
    custom: boolean
  }
}

export interface Tooltip extends Tooltip.Attrs {}

export class Tooltip extends Annotation {

  constructor(attrs?: Partial<Tooltip.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Tooltip';
    this.prototype.default_view = TooltipView;

    this.define({
      attachment: [ p.String, 'horizontal' ], // TODO enum: "horizontal" | "vertical" | "left" | "right" | "above" | "below"
      inner_only: [ p.Bool,   true         ],
      show_arrow: [ p.Bool,   true         ],
    });

    this.override({
      level: 'overlay',
    });

    this.internal({
      data:   [ p.Any, [] ],
      custom: [ p.Any     ],
    });
  }

  clear(): void {
    this.data = [];
  }

  add(sx, sy, content): void {
    const { data } = this;
    data.push([sx, sy, content]);
    this.data = data;

    // TODO (bev) not sure why this is now necessary
    this.properties.data.change.emit();
  }
}
Tooltip.initClass();
