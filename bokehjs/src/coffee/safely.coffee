# Keep this code as terse and as close to vanila JS as possible. If we
# arrived here, it means we should trust no one and need to act properly.

_burst_into_flames = (error) ->
  box = document.createElement("div")
  box.style.textAlign = "center"

  title = document.createElement("b")
  title.appendChild(document.createTextNode("bokeh error"))

  message = document.createElement("div")
  message.style.display = "inline-block"
  message.style.textAlign = "center"
  message.style.padding = ".8em 1.6em"
  message.style.border = "3px solid #dd0000"
  message.style.backgroundColor = "#fff8f8"
  message.style.color = "#aa0000"
  message.style.fontSize = "small"
  message.style.width = "auto"

  button = document.createElement("span")
  button.appendChild(document.createTextNode("Hide this message"))
  button.addEventListener("click", () -> body.removeChild(box))
  button.style.display = "inline-block"
  button.style.margin = ".8em 0 0 0"
  button.style.padding = "0px 5px 2px 5px"
  button.style.border = "2px outset"
  button.style.backgroundColor = "#e8e8e8"
  button.style.color = "black"
  button.style.fontSize = "80%"
  button.style.width = "auto"
  button.style.cursor = "pointer"

  rule = document.createElement("hr")

  message.appendChild(title)
  message.appendChild(document.createTextNode(" \u2014 #{error.message ? error}"))
  message.appendChild(document.createElement("br"))
  message.appendChild(button)
  box.appendChild(message)
  box.appendChild(rule)

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
