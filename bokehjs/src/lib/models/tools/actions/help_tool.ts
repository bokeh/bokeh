import {ActionTool, ActionToolView} from "./action_tool"
import type {InternalKeyBinding} from "core/keyboard"
import type * as p from "core/properties"
import {tool_icon_help} from "styles/icons.css"
import type {DialogView} from "../../ui/dialog"
import {Dialog} from "../../ui/dialog"
import {HTML} from "../../dom/html"
import {Pane} from "../../ui/pane"
import {Tabs} from "../../layouts/tabs"
import {TabPanel} from "../../layouts/tab_panel"
import type {View} from "core/build_views"
import {build_view} from "core/build_views"
import {div, a} from "core/dom"
import {version} from "version"
import {KeyboardShortcuts} from "models/ui/keyboard_shortcuts"
import * as logo_css from "styles/logo.css"

export class HelpToolView extends ActionToolView {
  declare model: HelpTool

  protected _dialog: DialogView

  override children_views(): View[] {
    return [...super.children_views(), this._dialog]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const tabs = [
      new TabPanel({
        title: "About Bokeh",
        child: new Pane({
          elements: [
            // TODO redirect
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
        title: "Keyboard Shortcuts",
        child: new KeyboardShortcuts({source: this.parent.model}),
      }),
    ]

    const dialog = new Dialog({
      title: "Help",
      content: new Tabs({tabs, sizing_mode: "stretch_both"}),
      visible: false,
      close_action: "hide",
    })
    this._dialog = await build_view(dialog, {parent: this.parent})
  }

  override connect_signals(): void {
    super.connect_signals()
    this._dialog.displayed.connect((visible) => this.model.active = visible)
  }

  doit(): void {
    this._dialog.toggle()
  }

  override key_bindings(): InternalKeyBinding[] {
    return [
      ...super.key_bindings(),
      {description: "Open help dialog", keys: ["H"], command: "help", action: () => this.doit(), origin: this.model},
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
