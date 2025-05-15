import {ActionTool, ActionToolView} from "./action_tool"
import type {KeyBinding} from "core/keyboard"
import {parse, is_upper_like} from "core/keyboard"
import type * as p from "core/properties"
import {tool_icon_help} from "styles/icons.css"
import type {DialogView} from "../../ui/dialog"
import {Dialog} from "../../ui/dialog"
import {HTML} from "../../dom/html"
import {Pane} from "../../ui/pane"
import {Tabs} from "../../layouts/tabs"
import {TabPanel} from "../../layouts/tab_panel"
import type {IterViews} from "core/build_views"
import {build_view} from "core/build_views"
import type {PlotView} from "../../plots/plot_canvas"
import {div, span, table, tr, td, th, a} from "core/dom"
import {version} from "version"
import * as help_css from "styles/help.css"
import * as logo_css from "styles/logo.css"

export class HelpToolView extends ActionToolView {
  declare model: HelpTool

  dialog: DialogView
  readonly bindings = new HTML({html: ""})

  override *children(): IterViews {
    yield* super.children()
    yield this.dialog
  }

  protected _render_key_bindings(): HTMLElement {
    const plot_view = this.parent as PlotView // TODO
    const bindings = plot_view.canvas.ui_event_bus.key_bindings

    const elements = bindings.map(({description, keys, command}) => {
      const seq = keys.map((key_combination) => {
        const {key, modifiers} = parse(key_combination)

        const repr: (string | HTMLElement)[] = []
        if (modifiers.ctrl) {
          repr.push(span({class: help_css.key}, "Ctrl"), span("+"))
        }
        if (modifiers.shift && !is_upper_like(key)) {
          repr.push(span({class: help_css.key}, "Shift"), span("+"))
        }
        if (modifiers.alt) {
          repr.push(span({class: help_css.key}, "Alt"), span("+"))
        }
        repr.push(span({class: help_css.key}, key))

        return div({class: help_css.key_combination}, repr)
      })

      return tr({class: help_css.key_binding},
        td({class: help_css.description}, description),
        td({class: help_css.key_sequence}, seq),
        td({class: help_css.command}, command != null ? `:${command}` : ""),
      )
    })

    const header = tr({class: help_css.key_binding},
      th("Description"),
      th("Key binding"),
      th("Command"),
    )

    return table({class: help_css.key_bindings}, header, elements)
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const tabs = [
      new TabPanel({
        title: "Information",
        child: new Pane({
          elements: [
            new HTML({
              html: div({style: {display: "flex", align_items: "center"}},
                a({href: "https://bokeh.org/", target: "_blank", class: [logo_css.logo, logo_css.logo_small]}),
                `Bokeh ${version}`,
              ),
            }),
          ],
          stylesheets: [logo_css.default],
        }),
      }),
      new TabPanel({
        title: "Keyboard",
        child: new Pane({
          elements: [
            new HTML({html: `<input type="text" class=${help_css.search} placeholder="Type to search for key bindings">`}),
            this.bindings,
          ],
          stylesheets: [help_css.default],
        }),
      }),
    ]

    const dialog = new Dialog({
      stylesheets: [],
      title: "Help",
      content: new Tabs({tabs, sizing_mode: "stretch_both"}),
      visible: false,
      close_action: "hide",
    })
    this.dialog = await build_view(dialog, {parent: this.parent})
  }

  override connect_signals(): void {
    super.connect_signals()
    this.dialog.displayed.connect((visible) => this.model.active = visible)
  }

  doit(): void {
    if (this.dialog.toggle()) {
      this.bindings.html = this._render_key_bindings()
    }
  }

  /*
  doit(): void {
    window.open(this.model.redirect)
  }
  */

  override key_bindings(): KeyBinding[] {
    return [
      ...super.key_bindings(),
      {description: "Open help dialog", keys: ["H"], command: ":help", action: () => this.doit()},
    ]
  }
}

export namespace HelpTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    redirect: p.Property<string>
  }
}

export interface HelpTool extends HelpTool.Attrs {}

export class HelpTool extends ActionTool {
  declare properties: HelpTool.Props
  declare __view_type__: HelpToolView

  constructor(attrs?: Partial<HelpTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HelpToolView

    this.define<HelpTool.Props>(({Str}) => ({
      redirect: [ Str, "https://docs.bokeh.org/en/latest/docs/user_guide/interaction/tools.html"],
    }))

    this.override<HelpTool.Props>({
      description: "Click the question mark to learn more about Bokeh plot tools.",
    })

    this.register_alias("help", () => new HelpTool())
  }

  override tool_name = "Help"
  override tool_icon = tool_icon_help
}
