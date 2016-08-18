# Keep this code as terse and as close to vanila JS as possible. If we
# arrived here, it means we should trust no one and need to act properly.

_burst_into_flames = (error) ->
  # Make box
  box = document.createElement("div")
  box.style["background-color"] = "#f2dede"
  box.style["border"] = "1px solid #a94442"
  box.style["border-radius"] = "4px"
  box.style["font-family"] = "sans-serif"
  box.style["margin-top"] = "5px"
  box.style["padding"] = "5px 5px 5px 10px"

  # Make button
  button = document.createElement("span")
  button.style["background-color"] = "#a94442"
  button.style["border-radius"] = "0px 4px 0px 0px"
  button.style["color"] = "white"
  button.style["cursor"] = "pointer"
  button.style["float"] = "right"
  button.style["font-size"] = "0.8em"
  button.style["margin"] = "-6px -6px 0px 0px"
  button.style["padding"] = "2px 5px 4px 5px"
  button.title = "close"
  button.setAttribute("aria-label", "close")
  button.appendChild(document.createTextNode("x"))
  button.addEventListener("click", () -> body.removeChild(box))

  # Make title
  title = document.createElement("h3")
  title.style["color"] = "#a94442"
  title.style["margin"] = "8px 0px 0px 0px"
  title.style["padding"] = "0px"
  title.appendChild(document.createTextNode("Bokeh Error"))

  # Make message
  message = document.createElement("pre")
  message.appendChild(document.createTextNode(error.message ? error))

  # Add pieces to box
  box.appendChild(button)
  box.appendChild(title)
  box.appendChild(message)

  # Put box in doc
  body = document.getElementsByTagName("body")[0]
  body.insertBefore(box, body.firstChild)


safely = (fn, silent=false) ->
  try
    return fn()
  catch error
    _burst_into_flames(error)
    if not silent
      throw error

module.exports = safely
