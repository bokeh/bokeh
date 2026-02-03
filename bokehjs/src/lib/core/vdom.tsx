import type {CSSProps} from "./css"
import {ToolIcon} from "./enums"
import type {StyleSheet} from "./stylesheets"
import {isArray, isPlainObject} from "./util/types"
import {omit} from "./util/object"
import type {IconLike} from "../models/common/kinds"

import type {Signalish, SignalLike} from "preact"
import type {VNode, HTMLAttributes, ContainerNode} from "preact"
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
  stylesheets?: StyleSheet[]
}
export class ShadowComponent extends Component<ShadowComponentProps> {
  render(): VNode {
    const attach_shadow = (el: HTMLElement | null): void => {
      if (el != null) {
        const shadow_el = el.shadowRoot ?? el.attachShadow({mode: "open"})
        const {stylesheets=[]} = this.props
        const contents = (
          <>
            {stylesheets.map((sheet) => sheet.to_vdom())}
            {this.props.children}
          </>
        )
        render(contents, shadow_el)
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

type InternalContainerNode = ContainerNode & {
  readonly ownerDocument: Document
  readonly nextSibling: ContainerNode | null
}

/**
 * This is inspired by create-root-fragment library.
 */
export function create_root_fragment(parent: ContainerNode, replace_node: ContainerNode, ...replace_nodes: ContainerNode[]): ContainerNode {
  replace_nodes = [replace_node, ...replace_nodes]

  const sibling = (replace_nodes.at(-1) as InternalContainerNode).nextSibling
  const node: InternalContainerNode = {
    nodeType: 1,
    parentNode: parent,
    firstChild: replace_nodes[0],
    childNodes: replace_nodes,
    nextSibling: sibling,
    ownerDocument: (parent as InternalContainerNode).ownerDocument,
    insertBefore(c: ContainerNode, r: ContainerNode | null): ContainerNode {
      return parent.insertBefore(c, r ?? sibling)
    },
    appendChild(c: ContainerNode) {
      return parent.appendChild(c)
    },
    removeChild(c: ContainerNode) {
      return parent.removeChild(c)
    },
    contains(c: ContainerNode) {
      return parent.contains(c)
    },
  }

  return (parent as any).__k = node
}
