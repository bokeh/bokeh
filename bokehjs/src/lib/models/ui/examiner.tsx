import {UIElement, UIElementView} from "./ui_element"
import * as p from "core/properties"
import {HasProps} from "core/has_props"
import type {StyleSheetLike} from "core/dom"
import {isArray} from "core/util/types"
import {keys} from "core/util/object"
import {receivers_for_sender} from "core/signaling"
import {diagnostics} from "core/diagnostics"
import {ValuePrinter, KindPrinter, OpaqueKindPrinter} from "./printers"

import examiner_css from "styles/examiner.css"
import pretty_css from "styles/pretty.css"
import icons_css from "styles/icons.css"

import {render, Component} from "preact"
import type {VNode} from "preact"
import {signal, computed} from "@preact/signals"

import type {Kind} from "core/kinds"
import {Kinds} from "core/kinds"

function highlight(el: Element): void {
  for (const animation of el.getAnimations()) {
    animation.cancel()
  }
  el.animate([
    {backgroundColor: "#def189"},
    {backgroundColor: "initial"},
  ], {duration: 2000})
}

function emphasize(text: string, pattern: string): VNode<HTMLElement> {
  const i = text.indexOf(pattern)
  if (i == -1) {
    return <span>{text}</span>
  } else {
    const j = i + pattern.length
    const prefix = text.substring(0, i)
    const infix = text.substring(i, j)
    const suffix = text.substring(j)
    return (
      <>
        <span>{prefix}</span>
        <span class="underline">{infix}</span>
        <span>{suffix}</span>
      </>
    )
  }
}

type Attrs = [typeof HasProps, p.Property[]]

function compute_attrs(model: HasProps): Attrs[] {
  const bases: [typeof HasProps, string[]][] = []
  let proto = Object.getPrototypeOf(model)

  do {
    bases.push([proto.constructor, keys(proto._props)])
    proto = Object.getPrototypeOf(proto)
  } while (proto.constructor != HasProps)

  bases.reverse()

  const cumulative: string[] = []
  for (const [, attrs] of bases) {
    attrs.splice(0, cumulative.length)
    cumulative.push(...attrs)
  }

  return bases.map(([base, attrs]) => [base, attrs.map((attr) => model.property(attr))])
}

export class ExaminerView extends UIElementView {
  declare model: Examiner

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), pretty_css, examiner_css, icons_css]
  }

  override render(): void {
    super.render()

    const models_filter = signal("")
    const props_filter = signal("")
    const watches_filter = signal("")
    const group_props = signal(true)
    const show_initial = signal(true)
    const show_internal = signal(true)
    const opaque_types = signal(false)
    const watched_props = signal(new Set<p.Property>())

    type CSSClass = string | null | undefined
    function cls(...classes: (CSSClass | CSSClass[])[]): string {
      const transformed = classes
        .flatMap((cls) => isArray(cls) ? cls : [cls])
        .filter((cls) => cls != null)
        .map((cls) => cls.trim())
        .filter((cls) => cls.length != 0)
      return [...new Set(transformed)].join(" ")
    }

    function click(obj: unknown) {
      if (obj instanceof HasProps) {
        current_model.value = obj
      }
    }

    function to_html(obj: unknown) {
      const printer = new ValuePrinter(click)
      return printer.to_html(obj)
    }

    type ModelItemProps = {model: HasProps}
    class ModelItem extends Component<ModelItemProps> {
      constructor(props: ModelItemProps) {
        super(props)
        this.state = {
          value_changed: new Date(),
        }
      }

      protected _model_el: HTMLElement | null = null

      readonly listener = ((obj: unknown): void => {
        if (!(obj instanceof p.Property && this._model_el != null)) {
          return
        }
        const {model} = this.props
        for (const prop of model) {
          if (prop == obj) {
            this.setState({value_changed: new Date()})
            highlight(this._model_el)
          }
        }
      }).bind(this)

      override componentDidMount(): void {
        diagnostics.connect(this.listener)
      }

      override componentWillUnmount(): void {
        diagnostics.disconnect(this.listener)
      }

      render(): VNode<HTMLElement> {
        const {model} = this.props
        const root = model.is_root ? <span class="tag">root</span> : null
        const key_down = (event: KeyboardEvent) => {
          if (event.key == "Enter") {
            click(model)
          }
        }
        const active = current_model.value == model ? "active" : null
        return (
          <span class={cls("model-ref", active)} tabIndex={0} onKeyDown={key_down} ref={(el) => { this._model_el = el }}>
            {to_html(model)}{root}
          </span>
        )
      }
    }

    class ModelsToolbar extends Component {
      render(): VNode<HTMLElement> {
        const key_up = (event: KeyboardEvent) => {
          if (event.currentTarget instanceof HTMLInputElement) {
            models_filter.value = event.currentTarget.value
          }
        }
        return (
          <div class="toolbar">
            <input class="filter" type="text" placeholder="Filter" onKeyUp={key_up}></input>
          </div>
        )
      }
    }

    class PropsToolbar extends Component {
      render(): VNode<HTMLElement> {
        const key_up = (event: KeyboardEvent) => {
          if (event.currentTarget instanceof HTMLInputElement) {
            props_filter.value = event.currentTarget.value
          }
        }
        return (
          <div class="toolbar">
            <input class="filter" type="text" placeholder="Filter" onKeyUp={key_up}></input>
            <span class="checkbox">
              <input type="checkbox" checked={group_props.value}
                onChange={(event) => group_props.value = event.currentTarget.checked}></input>
              <span>Group</span>
            </span>
            <span class="checkbox">
              <input type="checkbox" checked={show_initial.value}
                onChange={(event) => show_initial.value = event.currentTarget.checked}></input>
              <span>Show initial</span>
            </span>
            <span class="checkbox">
              <input type="checkbox" checked={show_internal.value}
                onChange={(event) => show_internal.value = event.currentTarget.checked}></input>
              <span>Show internal</span>
            </span>
            <span class="checkbox">
              <input type="checkbox" checked={opaque_types.value}
                onChange={(event) => opaque_types.value = event.currentTarget.checked}></input>
              <span>Opaque types</span>
            </span>
          </div>
        )
      }
    }

    type ModelsListProps = {models: HasProps[]}
    class ModelsList extends Component<ModelsListProps, {}> {
      constructor(props: ModelsListProps) {
        super(props)
      }
      readonly models_list = computed(() => {
        const pattern = models_filter.value
        return this.props.models.filter((model) => model.constructor.__qualified__.includes(pattern))
      })
      render(): VNode<HTMLElement> {
        return (
          <div class="models-panel">
            <ModelsToolbar></ModelsToolbar>
            <div class="models-list">{
              this.models_list.value.map((model) => <ModelItem model={model}></ModelItem>)
            }</div>
          </div>
        )
      }
    }

    type PropEditorProps = {prop: p.Property}
    class PropEditor extends Component<PropEditorProps> {
      constructor(props: PropEditorProps) {
        super(props)
      }

      editors(kind: Kind<unknown>): VNode<HTMLElement> {
        if (kind instanceof Kinds.Int) {
          return <input type="number" step="1"></input>
        } else if (kind instanceof Kinds.Float) {
          return <input type="number"></input>
        } else if (kind instanceof Kinds.Str) {
          return <input type="text"></input>
        } else if (kind instanceof Kinds.Enum) {
          return <select>
            {[...kind.values].map((value) => <option>{value}</option>)}
          </select>
        } else if (kind instanceof Kinds.Nullable) {
          return (
            <div class="col">
              {this.editors(kind.base_type)}
              <label><input type="radio"></input>null</label>
            </div>
          )
        } else {
          return <div>Not supported</div>
        }
      }

      protected _editor_el: HTMLElement | null = null

      render(): VNode<HTMLElement> {
        const {prop} = this.props
        return (
          <div popover ref={(el) =>{ this._editor_el = el }} onToggle={() => console.log("XXX")}>
            <div>Editing {to_html(prop)}</div>
            {this.editors(prop.kind)}
          </div>
        )
      }

      override componentDidMount(): void {
        this._editor_el?.showPopover()
      }
    }

    type PropValueProps = {prop: p.Property}
    class PropValue extends Component<PropValueProps> {
      constructor(props: PropValueProps) {
        super(props)
        this.state = {
          value_changed: new Date(),
        }
      }

      protected _value_el: HTMLElement | null = null

      readonly listener = ((obj: unknown): void => {
        if (obj === this.props.prop && this._value_el != null) {
          this.setState({value_changed: new Date()})
          highlight(this._value_el)
        }
      }).bind(this)

      override componentDidMount(): void {
        diagnostics.connect(this.listener)
      }

      override componentWillUnmount(): void {
        diagnostics.disconnect(this.listener)
      }

      render(): VNode<HTMLElement> {
        const {prop} = this.props
        return (
          <span class="value" ref={(el) => { this._value_el = el }}>
            {prop.is_unset ? <span>unset</span> : to_html(prop.get_value())}
          </span>
        )
      }
    }

    type PropItemProps = {prop: p.Property}
    class PropItem extends Component<PropItemProps, {editing: boolean}> {
      protected _editor_el: VNode<HTMLElement> | null = null

      constructor(props: PropItemProps) {
        super(props)
        this.state = {editing: false}
      }

      edit_value(): void {
        this.setState({editing: true})
      }

      render(): VNode<HTMLElement> {
        const {prop} = this.props
        const connections = receivers_for_sender.get(prop.obj) ?? []

        const listeners = connections.filter((connection) => connection.signal == prop.change).length

        const watched = watched_props.value.has(prop)
        const watch_el = <input type="checkbox" checked={watched} onChange={(event) => {
          const {checked} = event.currentTarget
          const watched = watched_props.value
          watched[checked ? "add" : "delete"](prop)
          watched_props.value = new Set(watched)
        }}></input>

        const dirty = prop.dirty ? "dirty" : null
        const internal = prop.internal ? "internal" : null
        const hidden = !prop.dirty && !show_initial.value || prop.internal && !show_internal.value ? "hidden" : null

        const pattern = props_filter.value
        const {attr} = prop

        const kind_printer = opaque_types.value ? new OpaqueKindPrinter() : new KindPrinter()

        return (
          <div class={cls("prop", dirty, internal, hidden)}>
            <div class="prop-attr" tabIndex={0}>
              {watch_el}
              {emphasize(attr, pattern)}
              {prop.internal ? <span class="tag">internal</span> : null}
            </div>
            <div class="prop-conns">
              {listeners != 0 ? <span class="tag">{`${listeners}`}</span> : null}
            </div>
            <div class="prop-kind">
              {kind_printer.to_html(prop.kind)}
            </div>
            <div class="prop-value">
              <PropValue prop={prop}></PropValue>
              <div class="btn btn-edit" onClick={() => this.edit_value()}></div>
              {this.state.editing ? <PropEditor prop={prop}></PropEditor> : null}
            </div>
          </div>
        )
      }
    }

    type BaseItemProps = {base: typeof HasProps, props: p.Property[]}
    class BaseItem extends Component<BaseItemProps> {
      readonly collapsed = signal(false)
      render(): VNode<HTMLElement> {
        const toggle = () => {
          this.collapsed.value = !this.collapsed.value
        }
        const {base, props} = this.props
        const items = props.map((prop) => <PropItem prop={prop}></PropItem>)
        if (group_props.value) {
          return (
            <div class={cls("branch", this.collapsed.value ? "collapsed" : null)}>
              <div class="base" onClick={toggle}>
                <span class="expander"></span>inherited from <span class="monospace">{base.__qualified__}</span>
              </div>
              {items}
            </div>
          )
        } else {
          return <>{items}</>
        }
      }
    }

    type PropsListProps = {}
    class PropsList extends Component<PropsListProps> {
      constructor(props: PropsListProps) {
        super(props)
      }
      readonly model_props = computed(() => {
        const model = current_model.value
        return model != null ? compute_attrs(model) : []
      })
      readonly props_list = computed(() => {
        const text = props_filter.value
        return this.model_props.value.map(([base, props]) => [base, props.filter((prop) => prop.attr.includes(text))] as const)
      })
      render(): VNode<HTMLElement> {
        return (
          <div class="props-list">
            {this.props_list.value.map(([base, props]) => <BaseItem base={base} props={props}></BaseItem>)}
          </div>
        )
      }
    }

    type PropsPanelProps = {}
    class PropsPanel extends Component<PropsPanelProps> {
      constructor(props: PropsPanelProps) {
        super(props)
      }
      render(): VNode<HTMLElement> {
        return (
          <div class="props-panel">
            <PropsToolbar></PropsToolbar>
            <PropsList></PropsList>
          </div>
        )
      }
    }

    class WatchesToolbar extends Component {
      render(): VNode<HTMLElement> {
        const key_up = (event: KeyboardEvent) => {
          if (event.currentTarget instanceof HTMLInputElement) {
            watches_filter.value = event.currentTarget.value
          }
        }
        return (
          <div class="toolbar">
            <input class="filter" type="text" placeholder="Filter" onKeyUp={key_up}></input>
          </div>
        )
      }
    }

    type WatchesListProps = {}
    class WatchesList extends Component<WatchesListProps> {
      remove_watch(prop: p.Property): void {
        const watched = watched_props.value
        watched.delete(prop)
        watched_props.value = new Set(watched)
      }

      render(): VNode<HTMLElement> {
        const props = [...watched_props.value]
        const entries = (() => {
          if (props.length == 0) {
            return <div class="nothing">No watched properties</div>
          } else {
            return props.map((prop) => (
              <div class={cls("prop", prop.dirty ? "dirty" : null)}>
                <div>{to_html(prop)}</div>
                <div><PropValue prop={prop}></PropValue></div>
                <div class="btn btn-delete" onClick={() => this.remove_watch(prop)}></div>
              </div>
            ))
          }
        })()
        return <div class="watches-list">{entries}</div>
      }
    }

    class WatchesPanel extends Component {
      render(): VNode<HTMLElement> {
        return (
          <div class="watches-panel">
            <WatchesToolbar></WatchesToolbar>
            <WatchesList></WatchesList>
          </div>
        )
      }
    }

    class ExaminerPanel extends Component {
      render(): VNode<HTMLElement> {
        return (
          <div class="examiner">
            <ModelsList models={[...models]}></ModelsList>
            <div class="col" style={{width: "100%"}}>
              <WatchesPanel></WatchesPanel>
              <PropsPanel></PropsPanel>
            </div>
          </div>
        )
      }
    }

    const {target} = this.model
    const models = (() => {
      if (target != null) {
        return target.references()
      } else {
        return this.model.document?.all_models ?? new Set()
      }
    })()

    const current_model = signal<HasProps | null>([...models][0])

    const examiner = <ExaminerPanel></ExaminerPanel>
    render(examiner, this.shadow_el)
  }
}

export namespace Examiner {
  export type Attrs = p.AttrsOf<Props>
  export type Props = UIElement.Props & {
    target: p.Property<HasProps | null>
  }
}

export interface Examiner extends Examiner.Attrs {}

export class Examiner extends UIElement {
  declare properties: Examiner.Props
  declare __view_type__: ExaminerView

  constructor(attrs?: Partial<Examiner.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ExaminerView

    this.define<Examiner.Props>(({Ref, Nullable}) => ({
      target: [ Nullable(Ref(HasProps)), null ],
    }))
  }
}
