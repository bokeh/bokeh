import * as _ from "underscore";

export function createElement(type: string, props: { [name: string]: any }, ...children: (string | HTMLElement)[]): HTMLElement {
  const elem = document.createElement(type);
  for (let k in props) {
    let v = props[k];
    if (k === "className")
      k = "class";
    if (k === "class" && _.isArray(v))
      v = v.filter(c => c != null).join(" ");
    elem.setAttribute(k, v);
  }
  for (const v of children) {
    if (v instanceof HTMLElement) elem.appendChild(v);
    else elem.insertAdjacentText("beforeend", v);
  }
  return elem;
}
