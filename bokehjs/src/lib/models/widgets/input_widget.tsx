import {Widget, WidgetView} from "./widget"
import {Tooltip} from "../ui/tooltip"
import {HTML} from "../dom/html"
import {build_view} from "core/build_views"
import type {StyleSheetLike} from "core/dom"
import type {ViewOf} from "core/build_views"
import {View} from "core/view"
import type {ChildView} from "core/view"
import type * as p from "core/properties"
import type * as kinds from "core/kinds"
import {bind} from "core/class"
import {isString} from "core/util/types"
import type {VNode} from "core/vdom"
import {ViewSlot, cls} from "core/vdom"
import {server_event, ModelEvent} from "core/bokeh_events"
import * as inputs_css from "styles/widgets/inputs.css"

import {createRef} from "preact"
import {signal, effect} from "@preact/signals"

@server_event("clear_input")
export class ClearInput extends ModelEvent {
  constructor(readonly model: InputWidget) {
    super()
    this.origin = model
  }

  static override from_values(values: object): ClearInput {
    const {model} = values as {model: InputWidget}
    return new ClearInput(model)
  }
}

export abstract class InputWidgetView extends WidgetView {
  declare readonly model: InputWidget
  declare readonly signals: p.SignalsOf<InputWidget.Props>
  declare readonly values: InputWidget.Attrs

  /**
   * The `id` of the primary input element, to be referenced by title's `<label for>`.
   */
  protected readonly input_id = "input"

  override _children_views(): ChildView[] {
    const title = this.computed_title.value
    const description = this.computed_description.value
    const title_view = title instanceof View ? [title] : []
    const description_view = description instanceof View ? [description] : []
    return [...super._children_views(), ...title_view, ...description_view]
  }

  readonly computed_title = signal<ViewOf<HTML> | string | null>(null)
  readonly computed_description = signal<ViewOf<Tooltip> | string | null>(null)

  /**
   * Whether description's tooltip was pinned (by clicking on description's icon).
   */
  protected readonly _description_pinned = signal<boolean>(false)

  protected readonly _description_el = createRef<HTMLDivElement>()

  /**
   * The element hosting description's icon, if any.
   */
  get desc_el(): HTMLElement | null {
    return this._description_el.current
  }

  private _built_title: InputWidget.Attrs["title"] | undefined = undefined
  private _built_description: InputWidget.Attrs["description"] | undefined = undefined

  private readonly _disposers: (() => void)[] = []

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    await this._build_title(this.model.title)
    await this._build_description(this.model.description)
  }

  override connect_signals(): void {
    super.connect_signals()

    this._disposers.push(
      effect(() => {
        const {title} = this.values
        if (title !== this._built_title) {
          this.schedule(() => this._build_title(title))
        }
      }),
      effect(() => {
        const {description} = this.values
        if (description !== this._built_description) {
          this.schedule(() => this._build_description(description))
        }
      }),
      effect(() => {
        // Unpin when the tooltip was closed by other means (e.g. its close button).
        const description = this.computed_description.value
        if (description instanceof View && !description.values.visible) {
          this._description_pinned.value = false
        }
      }),
    )

    document.addEventListener("mousedown", (event) => {
      const description = this.computed_description.peek()
      if (description instanceof View) {
        const path = event.composedPath()
        const description_el = this._description_el.current
        if (path.includes(description.el)) {
          return
        } else if (description_el != null && path.includes(description_el)) {
          this._toggle_description(!this._description_pinned.peek(), true)
        } else {
          this._toggle_description(false, true)
        }
      }
    }, {signal: this.abort_signal})

    window.addEventListener("blur", () => {
      if (this.computed_description.peek() instanceof View) {
        this._toggle_description(false, true)
      }
    }, {signal: this.abort_signal})
  }

  override disconnect_signals(): void {
    for (const dispose of this._disposers.splice(0)) {
      dispose()
    }
    super.disconnect_signals()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), inputs_css.default]
  }

  /**
   * Shows or hides description's tooltip. If `pin` is set, then
   * the tooltip will be pinned or unpinned, respectively.
   */
  protected _toggle_description(visible: boolean, pin: boolean = false): void {
    const description = this.computed_description.peek()
    if (description instanceof View) {
      if (pin) {
        this._description_pinned.value = visible
      }
      const closable = this._description_pinned.peek()
      description.model.setv({visible, closable})
    }
  }

  @bind
  protected _on_description_enter(): void {
    this._toggle_description(true)
  }

  @bind
  protected _on_description_leave(): void {
    if (!this._description_pinned.peek()) {
      this._toggle_description(false)
    }
  }

  @bind
  protected _description_ref(el: HTMLDivElement | null): void {
    this._description_el.current = el
    const description = this.computed_description.peek()
    if (description instanceof View && description.model.target == "auto") {
      description.target_override.value = el
    }
  }

  protected _description_icon(): VNode | null {
    const description = this.computed_description.value
    if (description == null) {
      return null
    } else if (isString(description)) {
      return (
        <div class={inputs_css.description} ref={this._description_ref} title={description}>
          <div class={inputs_css.icon}/>
        </div>
      )
    } else {
      const opaque = description.values.visible && this._description_pinned.value
      return (
        <div
          key={description.model.id}
          class={inputs_css.description}
          ref={this._description_ref}
          onMouseEnter={this._on_description_enter}
          onMouseLeave={this._on_description_leave}
        >
          <div class={cls(inputs_css.icon, opaque ? inputs_css.opaque : null)}/>
        </div>
      )
    }
  }

  @bind
  protected _title_el(): VNode | null {
    const title = this.computed_title.value
    const description_el = this._description_icon()
    if (title != null || description_el != null) {
      const title_el = title instanceof View ? <ViewSlot view={title}/> : title
      return <label for={this.input_id}>{title_el}{description_el}</label>
    } else {
      return null
    }
  }

  protected async _build_title(title: InputWidget.Attrs["title"]): Promise<void> {
    this._built_title = title
    const computed_title = await (async () => {
      if (title instanceof HTML) {
        return await build_view(title, {parent: this})
      } else if (title == "") {
        return null
      } else {
        return title
      }
    })()
    if (this._built_title !== title || this.abort_signal.aborted) {
      // superseded by a newer title or the view was removed while building
      if (computed_title instanceof View) {
        computed_title.remove()
      }
      return
    }
    const old_title = this.computed_title.peek()
    this.computed_title.value = computed_title
    if (old_title instanceof View) {
      old_title.remove()
    }
  }

  protected async _build_description(description: InputWidget.Attrs["description"]): Promise<void> {
    this._built_description = description
    const computed_description = await (async () => {
      if (description instanceof Tooltip) {
        return await build_view(description, {parent: this})
      } else {
        return description
      }
    })()
    if (this._built_description !== description || this.abort_signal.aborted) {
      // superseded by a newer description or the view was removed while building
      if (computed_description instanceof View) {
        computed_description.remove()
      }
      return
    }
    const old_description = this.computed_description.peek()
    this._description_pinned.value = false
    this.computed_description.value = computed_description
    if (old_description instanceof View) {
      old_description.remove()
    }
  }

  change_input(): void {}
}

/**
 * Common properties of input widgets that allow a prefix and a suffix,
 * i.e. `PrefixSuffixCommon` mixin in Python. Render them with `<Prefix>`
 * and `<Suffix>` components, around the inner element of an input.
 */
export namespace PrefixSuffixCommon {
  export type Attrs = p.AttrsOf<Props>

  export type Props = {
    prefix: p.Property<string | null>
    suffix: p.Property<string | null>
  }

  export function define({Str, Nullable}: typeof kinds): p.DefineOf<Props> {
    return {
      prefix: [ Nullable(Str), null ],
      suffix: [ Nullable(Str), null ],
    }
  }
}

export function Prefix({text}: {text: string | null}): VNode | null {
  return text != null ? <div class={inputs_css.prefix}>{text}</div> : null
}

export function Suffix({text}: {text: string | null}): VNode | null {
  return text != null ? <div class={inputs_css.suffix}>{text}</div> : null
}

export namespace InputWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    title: p.Property<string | HTML>
    description: p.Property<string | Tooltip | null>
  }
}

export interface InputWidget extends InputWidget.Attrs {}

export abstract class InputWidget extends Widget {
  declare properties: InputWidget.Props
  declare __view_type__: InputWidgetView

  static {
    this.define<InputWidget.Props>(({Str, Nullable, Or, Ref}) => ({
      title: [ Or(Str, Ref(HTML)), "" ],
      description: [ Nullable(Or(Str, Ref(Tooltip))), null ],
    }))
  }
}
