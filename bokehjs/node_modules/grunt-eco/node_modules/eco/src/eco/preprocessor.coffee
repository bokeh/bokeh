{Scanner} = require "./scanner"
{repeat}  = require "./util"
sys       = require "sys"

exports.preprocess = (source) ->
  preprocessor = new Preprocessor source
  preprocessor.preprocess()

exports.Preprocessor = class Preprocessor
  constructor: (source) ->
    @scanner  = new Scanner source
    @output   = ""
    @level    = 0
    @options  = {}
    @captures = []

  preprocess: ->
    until @scanner.done
      @scanner.scan (token) =>
        @[token[0]].apply @, token.slice 1
    @output

  record: (line) ->
    @output += repeat "  ", @level
    @output += line + "\n"

  printString: (string) ->
    if string.length
      @record "_print _safe #{sys.inspect string}"

  beginCode: (options) ->
    @options = options

  recordCode: (code) ->
    if code isnt "end"
      if @options.print
        if @options.safe
          @record "_print _safe #{code}"
        else
          @record "_print #{code}"
      else
        @record code

  indent: (capture) ->
    @level++
    if capture
      @record "_capture #{capture}"
      @captures.unshift @level
      @indent()

  dedent: ->
    @level--
    @fail "unexpected dedent" if @level < 0
    if @captures[0] is @level
      @captures.shift()
      @dedent()

  fail: (message) ->
    throw "Parse error on line #{@scanner.lineNo}: #{message}"
