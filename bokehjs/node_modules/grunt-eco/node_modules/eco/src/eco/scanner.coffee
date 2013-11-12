{StringScanner} = require "strscan"
{trim}          = require "./util"

exports.scan = (source) ->
  tokens  = []
  scanner = new Scanner source
  until scanner.done
    scanner.scan (token) -> tokens.push token
  tokens

exports.Scanner = class Scanner
  @modePatterns: {
    data: /(.*?)(<%(([=-])?)|\n|$)/
    code: /(.*?)(((:|(->|=>))\s*)?%>|\n|$)/
  }

  @dedentablePattern: /^(end|when|else|catch|finally)(?:\W|$)/

  constructor: (source) ->
    @source  = source.replace /\r\n?/g, "\n"
    @scanner = new StringScanner @source
    @mode    = "data"
    @buffer  = ""
    @lineNo  = 1
    @done    = no

  scan: (callback) ->
    if @done
      callback()

    else if @scanner.hasTerminated()
      @done = yes
      switch @mode
        when "data"
          callback ["printString", @flush()]
        when "code"
          callback ["fail", "unexpected end of template"]

    else
      @advance()
      switch @mode
        when "data"
          @scanData callback
        when "code"
          @scanCode callback

  advance: ->
    @scanner.scanUntil Scanner.modePatterns[@mode]
    @buffer   += @scanner.getCapture 0
    @tail      = @scanner.getCapture 1
    @directive = @scanner.getCapture 3
    @arrow     = @scanner.getCapture 4

  scanData: (callback) ->
    if @tail is "\n"
      @buffer += @tail
      @lineNo++
      @scan callback

    else if @tail
      @mode = "code"
      callback ["printString", @flush()]
      callback ["beginCode", print: @directive?, safe: @directive is "-"]

  scanCode: (callback) ->
    if @tail is "\n"
      callback ["fail", "unexpected newline in code block"]

    else if @tail
      @mode = "data"
      code  = trim @flush()
      code += " #{@arrow}" if @arrow

      callback ["dedent"] if @isDedentable code
      callback ["recordCode", code]
      callback ["indent", @arrow] if @directive

  flush: ->
    buffer  = @buffer
    @buffer = ""
    buffer

  isDedentable: (code) ->
    code.match Scanner.dedentablePattern

