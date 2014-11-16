define ["underscore", "jquery"], (_, $) ->

  waitForElement = (el, fn) ->
    handler = () =>
      if $.contains(document.documentElement, el)
        clearInterval(interval)
        fn()
    interval = setInterval(handler, 50)

  return {
    waitForElement: waitForElement
  }
