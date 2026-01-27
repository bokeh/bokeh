import type {CSSProps} from "./css"
import {ToolIcon} from "./enums"
import {isArray, isPlainObject} from "./util/types"
import {omit} from "./util/object"
import type {IconLike} from "../models/common/kinds"

import type {Signalish, SignalLike} from "preact"
import type {VNode, HTMLAttributes} from "preact"
import {Component, render} from "preact"

export function is_SignalLike<T>(obj: Signalish<T>): obj is SignalLike<T> {
  return isPlainObject(obj) && "value" in obj
}

export type CSSClass = string | null | undefined
export type CSSClasses = Signalish<CSSClass> | Signalish<CSSClass>[]

/**
 * Manage CSS classes of a VDOM node.
 */
export function cls(...classes: CSSClasses[]): string {
  const transformed = classes
    .flatMap((cls) => isArray(cls) ? cls : [cls])
    .map((cls) => is_SignalLike(cls) ? cls.value : cls)
    .filter((cls) => cls != null)
    .flatMap((cls) => cls.split(/\s+/))
    .filter((cls) => cls.length != 0)
  return [...new Set(transformed)].join(" ")
}

export type ShadowComponentProps = HTMLAttributes<HTMLDivElement> & {
  //component: string
  stylesheets?: CSSStyleSheet[]
}
export class ShadowComponent extends Component<ShadowComponentProps> {
  render(): VNode {
    const attach_shadow = (el: HTMLElement | null): void => {
      if (el != null) {
        const shadow_el = el.shadowRoot ?? el.attachShadow({mode: "open"})
        shadow_el.adoptedStyleSheets = this.props.stylesheets ?? []
        render(this.props.children, shadow_el)
      }
    }
    //const classes = cls(`bk-${this.props.component}`, this.props.class)
    //const props = omit(this.props, ["class", "component", "stylesheets"])
    //return <div class={classes} {...props} ref={attach_shadow}></div>
    const props = omit(this.props, ["stylesheets", "children"])
    return <div {...props} ref={attach_shadow}></div>
  }
}

export type IconProps = {
  icon: IconLike
  classes?: string | string[]
}
export class Icon extends Component<IconProps> {
  render(): VNode {
    const {icon, classes} = this.props
    const style: CSSProps = {}
    let icon_class: string | null = null
    if (icon.startsWith("data:image")) {
      style.backgroundImage = `url("${encodeURI(icon)}")`
    } else if (icon.startsWith("--")) {
      style.backgroundImage = `var(${icon})`
    } else if (icon.startsWith(".")) {
      icon_class = icon.substring(1)
    } else if (ToolIcon.valid(icon)) {
      icon_class = `bk-tool-icon-${icon.replace(/_/g, "-")}`
    }
    return <div role="img" class={cls(classes, icon_class)} style={style}></div>
  }
}
