import type {CSSProps} from "./css"
import {ToolIcon} from "./enums"
import type {StyleSheet} from "./stylesheets"
import {isArray, isPlainObject} from "./util/types"
import {omit} from "./util/object"
import type {IconLike} from "../models/common/kinds"
import type {DOMView} from "./dom_view"
import * as core_css from "styles/core.css"

import type {Signalish, SignalLike} from "preact"
import type {VNode, HTMLAttributes, ContainerNode, ComponentChildren} from "preact"
import {Component, render} from "preact"

export type {VNode, TargetedEvent} from "preact"

export function is_SignalLike<T>(obj: Signalish<T>): obj is SignalLike<T> {
  return isPlainObject(obj) && "value" in obj
}

export type CSSClass = string | null | undefined
export type CSSClasses = Signalish<CSSClass> | Signalish<CSSClass>[]

/**
 * Manage CSS classes of a VDOM node.
 */
export function cls(...classes: CSSClasses[]): string | undefined {
  const transformed_classes = classes
    .flatMap((cls) => isArray(cls) ? cls : [cls])
    .map((cls) => is_SignalLike(cls) ? cls.value : cls)
    .filter((cls) => cls != null)
    .flatMap((cls) => cls.split(/\s+/))
    .filter((cls) => cls.length != 0)

  const new_classes = new Set(transformed_classes)
  if (new_classes.size == 0) {
    return undefined
  } else {
    return [...new_classes].join(" ")
  }
}

type DivAttributes = HTMLAttributes<HTMLDivElement>

export type PortalProps = {
  container: Element
  children?: ComponentChildren
}

/**
 * Renders its children into `container`, which may be outside of the
 * containing vDOM tree (e.g. `document.head`).
 *
 * Children are rendered into a fake root, which manages only its own subset
 * of container's children, so that other children of the container are left
 * intact. This is similar to `createPortal()` from `preact/compat`, which we
 * don't use, because importing `preact/compat` alters behavior of preact
 * globally (e.g. it turns `onChange` of text inputs into `onInput`).
 */
export class Portal extends Component<PortalProps> {
  protected _root: ContainerNode | null = null
  protected _container: Element | null = null

  protected _create_root(container: Element): ContainerNode {
    const child_nodes: ChildNode[] = []
    const root = {
      nodeType: 1,
      parentNode: container,
      namespaceURI: container.namespaceURI,
      ownerDocument: container.ownerDocument,
      childNodes: child_nodes,
      firstChild: null,
      contains: (node: Node | null) => node != null && container.contains(node),
      insertBefore(node: ChildNode, before: ChildNode | null): ChildNode {
        if (!child_nodes.includes(node)) {
          child_nodes.push(node)
        }
        return container.insertBefore(node, before)
      },
      appendChild(node: ChildNode): ChildNode {
        return root.insertBefore(node, null)
      },
      removeChild(node: ChildNode): ChildNode {
        const i = child_nodes.indexOf(node)
        if (i != -1) {
          child_nodes.splice(i, 1)
        }
        return container.removeChild(node)
      },
    }
    return root
  }

  protected _unmount(): void {
    const {_root} = this
    if (_root != null) {
      this._root = null
      this._container = null
      render(null, _root)
    }
  }

  protected _render(): void {
    const {container, children} = this.props
    if (this._container !== container) {
      this._unmount()
    }
    if (this._root == null) {
      this._root = this._create_root(container)
      this._container = container
    }
    render(<>{children}</>, this._root)
  }

  override componentDidMount(): void {
    this._render()
  }

  override componentDidUpdate(): void {
    this._render()
  }

  override componentWillUnmount(): void {
    this._unmount()
  }

  render(): null {
    return null
  }
}

export type ShadowComponentProps = DivAttributes & {
  stylesheets?: StyleSheet[]
}
export class ShadowComponent extends Component<ShadowComponentProps> {
  protected _shadow_el: ShadowRoot | null = null

  override componentWillUnmount(): void {
    // Contents of the shadow root are a separate vDOM tree, so unmount it as well.
    const {_shadow_el} = this
    if (_shadow_el != null) {
      this._shadow_el = null
      render(null, _shadow_el)
    }
  }

  render(): VNode {
    const attach_shadow = (el: HTMLElement | null): void => {
      if (el != null) {
        const shadow_el = el.shadowRoot ?? el.attachShadow({mode: "open"})
        this._shadow_el = shadow_el
        const {stylesheets=[]} = this.props
        const adopted: CSSStyleSheet[] = []
        const links: VNode[] = []
        const global: VNode[] = []
        for (const stylesheet of stylesheets) {
          if (!stylesheet.is_global) {
            if (stylesheet.is_inline) {
              adopted.push(stylesheet.to_native())
            } else {
              links.push(stylesheet.to_vdom())
            }
          } else {
            global.push(stylesheet.to_vdom())
          }
        }
        shadow_el.adoptedStyleSheets = adopted
        const contents = (
          <>
            <Portal container={document.head}>{global}</Portal>
            {...links}
            {this.props.children}
          </>
        )
        render(contents, shadow_el)
      }
    }

    const props = omit(this.props, ["stylesheets", "children"])
    return <div {...props} ref={attach_shadow}></div>
  }
}

export type UIComponentProps = DivAttributes & {
  parent: /* ShadowComponentProps & */ {
    stylesheets?: StyleSheet[]
    classes?: CSSClasses[]
    style?: DivAttributes["style"]
  }
}
export class UIComponent extends Component<UIComponentProps> {
  render(): VNode {
    const {parent} = this.props

    const {stylesheets=[], classes=[], style={}} = parent

    const props = {
      ...omit(this.props, ["parent", "class"]),
      stylesheets,
      class: cls(...classes, this.props.class),
      style,
    }

    return <ShadowComponent {...props}></ShadowComponent>
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

export type ViewSlotProps = {
  view: DOMView
}

/**
 * Hosts a child view, i.e. renders its element as a child of this element.
 *
 * Child views own their elements (`view.el`), which can't be adopted by preact,
 * so this renders an element (a slot), which doesn't affect the layout (it uses
 * `display: contents`), and moves child view's element into it.
 *
 * This is transitional, until child views are rendered directly with preact.
 */
export class ViewSlot extends Component<ViewSlotProps> {
  protected _el: HTMLElement | null = null

  // A stable ref, so that preact doesn't call it on every render.
  protected readonly _ref = (el: HTMLElement | null): void => {
    this._el = el
    this._mount()
  }

  protected _mount(): void {
    const {_el} = this
    if (_el != null) {
      const {view} = this.props
      if (view.el.parentNode !== _el) {
        view.render_to(_el)
      }
    }
  }

  override componentDidUpdate(prev: ViewSlotProps): void {
    if (prev.view !== this.props.view) {
      this._mount()
    }
  }

  render(): VNode {
    return <div class={core_css.slot} ref={this._ref}/>
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
