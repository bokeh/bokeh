define ["underscore", "jquery"], (_, $) ->

  wait_for_element = (el, fn) ->
    handler = () =>
      if $.contains(document.documentElement, el)
        clearInterval(interval)
        fn()
    interval = setInterval(handler, 50)

  return {
    wait_for_element: wait_for_element
  }
