import sbt._

import scala.collection.JavaConverters._

import org.mozilla.javascript.tools.shell.{Global}
import org.mozilla.javascript.{Context,Scriptable,ScriptableObject,Callable,NativeObject}

import ScriptableObject.READONLY

trait Rhino {
    def withContext[T](fn: Context => T): T = {
        val ctx = Context.enter()
        try {
            ctx.setOptimizationLevel(-1)
            ctx.setLanguageVersion(Context.VERSION_1_8)
            fn(ctx)
        } finally {
            Context.exit()
        }
    }
}

case class RequireJSWrap(startFile: File, endFile: File) {
    def toJsObject(scope: Scriptable): Scriptable = {
        val ctx = Context.getCurrentContext()
        val obj = ctx.newObject(scope)
        ScriptableObject.defineProperty(obj, "startFile", startFile.getPath, READONLY)
        ScriptableObject.defineProperty(obj, "endFile", endFile.getPath, READONLY)
        obj
    }
}

case class RequireJSConfig(
    logLevel: Int,
    baseUrl: File,
    mainConfigFile: File,
    name: String,
    include: List[String],
    wrap: RequireJSWrap,
    optimize: String,
    out: File) {

    def toJsObject(scope: Scriptable): Scriptable = {
        val ctx = Context.getCurrentContext()
        val obj = ctx.newObject(scope)
        val include = ctx.newArray(scope, this.include.toArray: Array[AnyRef])
        ScriptableObject.defineProperty(obj, "logLevel", logLevel, READONLY)
        ScriptableObject.defineProperty(obj, "baseUrl", baseUrl.getPath, READONLY)
        ScriptableObject.defineProperty(obj, "mainConfigFile", mainConfigFile.getPath, READONLY)
        ScriptableObject.defineProperty(obj, "name", name, READONLY)
        ScriptableObject.defineProperty(obj, "include", include, READONLY)
        ScriptableObject.defineProperty(obj, "wrap", wrap.toJsObject(scope), READONLY)
        ScriptableObject.defineProperty(obj, "optimize", optimize, READONLY)
        ScriptableObject.defineProperty(obj, "out", out.getPath, READONLY)
        obj
    }
}

class RequireJS(jsPath: File) extends Rhino {

    def rjsScope(ctx: Context): Scriptable = {
        val global = new Global()
        global.init(ctx)

        val scope = ctx.initStandardObjects(global, true)

        val arguments = ctx.newArray(scope, Array[AnyRef]())
        scope.defineProperty("arguments", arguments, ScriptableObject.DONTENUM)
        scope.defineProperty("requirejsAsLib", true, ScriptableObject.DONTENUM)

        val rjs = new java.io.FileReader(jsPath / "r.js")
        ctx.evaluateReader(scope, rjs, "r.js", 1, null)

        scope
    }

    def optimize(config: RequireJSConfig): File = {
        withContext { ctx =>
            val scope = rjsScope(ctx)
            val require = scope.get("require", scope).asInstanceOf[Scriptable]
            val optimize = require.get("optimize", scope).asInstanceOf[Callable]
            val args = Array[AnyRef](config.toJsObject(scope))
            optimize.call(ctx, scope, scope, args)
            config.out
        }
    }
}
