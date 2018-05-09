// Keep this code as terse and as close to vanila JS as possible. If we
// arrived here, it means we should trust no one and need to act properly.

function _burst_into_flames(error: Error | string): void {
  // Make box
  const box = document.createElement("div")
  box.style.backgroundColor = "#f2dede"
  box.style.border = "1px solid #a94442"
  box.style.borderRadius = "4px"
  box.style.display = "inline-block"
  box.style.fontFamily = "sans-serif"
  box.style.marginTop = "5px"
  box.style.minWidth = "200px"
  box.style.padding = "5px 5px 5px 10px"
  box.classList.add("bokeh-error-box-into-flames")

  // Make button
  const button = document.createElement("span")
  button.style.backgroundColor = "#a94442"
  button.style.borderRadius = "0px 4px 0px 0px"
  button.style.color = "white"
  button.style.cursor = "pointer"
  button.style.cssFloat = "right"
  button.style.fontSize = "0.8em"
  button.style.margin = "-6px -6px 0px 0px"
  button.style.padding = "2px 5px 4px 5px"
  button.title = "close"
  button.setAttribute("aria-label", "close")
  button.appendChild(document.createTextNode("x"))
  button.addEventListener("click", () => body.removeChild(box))

  // Make title
  const title = document.createElement("h3")
  title.style.color = "#a94442"
  title.style.margin = "8px 0px 0px 0px"
  title.style.padding = "0px"
  title.appendChild(document.createTextNode("Bokeh Error"))

  // Make message
  const message = document.createElement("pre")
  message.style.whiteSpace = "unset"
  message.style.overflowX = "auto"
  const text = error instanceof Error ? error.message : error
  message.appendChild(document.createTextNode(text))

  // Add pieces to box
  box.appendChild(button)
  box.appendChild(title)
  box.appendChild(message)

  // Put box in doc
  const body = document.getElementsByTagName("body")[0]
  body.insertBefore(box, body.firstChild)
}

export function safely<T>(fn: () => T, silent: boolean = false): T | undefined {
  try {
    return fn()
  } catch (error) {
    _burst_into_flames(error)
    if (!silent)
      throw error
    else
      return
  }
}
