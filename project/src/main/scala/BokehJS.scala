import sbt._
import Keys._

import com.untyped.sbtjs.Plugin.{JsKeys,jsSettings=>pluginJsSettings,CompilationLevel,VariableRenamingPolicy}

import LessPlugin.{LessKeys,lessSettings=>pluginLessSettings}
import EcoPlugin.{EcoKeys,ecoSettings=>pluginEcoSettings}

object BokehJS {
    object BokehJSKeys {
        val requirejs = taskKey[(File, File)]("Run RequireJS optimizer")
        val requirejsConfig = settingKey[RequireJSSettings]("RequireJS settings")

        val copyVendor = taskKey[Seq[File]]("Copy vendor/** from src to build")
        val copyCSS = taskKey[Seq[File]]("Generate bokeh.min.css")

        val build = taskKey[Unit]("Build CoffeeScript, LESS, ECO, etc.")
        val deploy = taskKey[Unit]("Generate bokeh(.min).{js,css}")
    }

    import BokehJSKeys._

    lazy val jsSettings = pluginJsSettings ++ Seq(
        sourceDirectory in (Compile, JsKeys.js) <<= (sourceDirectory in Compile)(_ / "coffee"),
        resourceManaged in (Compile, JsKeys.js) <<= (resourceManaged in Compile)(_ / "js"),
        compile in Compile <<= compile in Compile dependsOn (JsKeys.js in Compile),
        JsKeys.compilationLevel in (Compile, JsKeys.js) := CompilationLevel.WHITESPACE_ONLY,
        JsKeys.variableRenamingPolicy in (Compile, JsKeys.js) := VariableRenamingPolicy.OFF,
        JsKeys.prettyPrint in (Compile, JsKeys.js) := true)

    lazy val lessSettings = pluginLessSettings ++ Seq(
        sourceDirectory in (Compile, LessKeys.less) <<= (sourceDirectory in Compile)(_ / "less"),
        resourceManaged in (Compile, LessKeys.less) <<= (resourceManaged in Compile)(_ / "css"),
        compile in Compile <<= compile in Compile dependsOn (LessKeys.less in Compile),
        includeFilter in (Compile, LessKeys.less) := "bokeh.less")

    lazy val ecoSettings = pluginEcoSettings ++ Seq(
        sourceDirectory in (Compile, EcoKeys.eco) <<= (sourceDirectory in Compile)(_ / "coffee"),
        resourceManaged in (Compile, EcoKeys.eco) <<= (resourceManaged in Compile)(_ / "js"),
        compile in Compile <<= compile in Compile dependsOn (EcoKeys.eco in Compile))

    lazy val requirejsSettings = Seq(
        requirejsConfig in Compile := {
            val srcDir = sourceDirectory in Compile value;
            val jsDir = resourceManaged in (Compile, JsKeys.js) value;
            RequireJSSettings(
                logLevel       = 2,
                name           = "vendor/almond/almond",
                baseUrl        = jsDir,
                mainConfigFile = jsDir / "config.js",
                include        = List("main"),
                wrapShim       = true,
                wrap           = Some(RequireJSWrap(
                    startFile  = srcDir / "js" / "_start.js.frag",
                    endFile    = srcDir / "js" / "_end.js.frag"
                )),
                optimize       = "none",
                out            = jsDir / "bokeh.js")
        },
        requirejs in Compile <<= Def.task {
            val log = streams.value.log
            val settings = (requirejsConfig in Compile).value

            log.info(s"Optimizing and minifying sbt-requirejs source ${settings.out}")
            val rjs = new XRequireJS(streams.value.log, settings)
            val (opt, min) = rjs.optimizeAndMinify

            val optFile = settings.out
            val minFile = file(optFile.getPath.stripSuffix("js") + "min.js")

            IO.write(optFile, opt)
            IO.write(minFile, min)

            (optFile, minFile)
        } dependsOn (build in Compile))

    lazy val pluginSettings = jsSettings ++ lessSettings ++ ecoSettings ++ requirejsSettings

    lazy val bokehjsSettings = pluginSettings ++ Seq(
        sourceDirectory in Compile := baseDirectory.value / "src",
        copyVendor in Compile <<= Def.task {
            val srcDir = sourceDirectory in Compile value
            val resDir = resourceManaged in (Compile, JsKeys.js) value
            val source = srcDir / "vendor"
            val target = resDir / "vendor"
            val toCopy = (PathFinder(source) ***) pair Path.rebase(source, target)
            IO.copy(toCopy, overwrite=true).toSeq
        },
        copyCSS in Compile <<= Def.task {
            val cssDir = resourceManaged in (Compile, LessKeys.less) value
            val inFile = cssDir / "bokeh.css"
            val outFile = cssDir / "bokeh.min.css"
            IO.copyFile(inFile, outFile)
            Seq(outFile)
        } dependsOn (LessKeys.less in Compile),
        resourceGenerators in Compile <+= copyVendor in Compile,
        resourceGenerators in Compile <+= copyCSS in Compile,
        build in Compile <<= Def.task {} dependsOn (resources in Compile),
        deploy in Compile <<= Def.task {} dependsOn (requirejs in Compile))
}
