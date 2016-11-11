import {isBoolean, isString, isArray, flatten} from "underscore";

export function createElement(type: string, props: { [name: string]: any },
    ...children: Array<string | HTMLElement | Array<string | HTMLElement>>): HTMLElement {
  let elem;
  if (type === "fragment") {
    elem = document.createDocumentFragment();
  } else {
    elem = document.createElement(type);
    for (let k in props) {
      let v = props[k];
      if (k === "className")
        k = "class";
      if (k === "class" && isArray(v))
        v = v.filter(c => c != null).join(" ");
      if (v == null || isBoolean(v) && !v)
        continue
      elem.setAttribute(k, v);
    }
  }

  for (const v of flatten(children, true)) {
    if (v instanceof HTMLElement)
      elem.appendChild(v);
    else if (isString(v))
      elem.appendChild(document.createTextNode(v))
  }

  return elem;
}
