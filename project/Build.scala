import sbt._
import Keys._

import com.lihaoyi.workbench.{Plugin=>Workbench}

import com.untyped.sbtjs.Plugin.{JsKeys,jsSettings=>pluginJsSettings,CompilationLevel,VariableRenamingPolicy}
import com.untyped.sbtless.Plugin.{LessKeys,lessSettings=>pluginLessSettings}

import EcoPlugin.{EcoKeys,ecoSettings=>pluginEcoSettings}

object ProjectBuild extends Build {
    override lazy val settings = super.settings ++ Seq(
        organization := "org.continuumio",
        version := "0.4.2-SNAPSHOT",
        description := "Bokeh plotting library",
        homepage := Some(url("http://bokeh.pydata.org")),
        licenses := Seq("BSD-style" -> url("http://www.opensource.org/licenses/bsd-license.php")),
        scalaVersion := "2.10.3",
        scalacOptions ++= Seq("-Xlint", "-deprecation", "-unchecked", "-feature"),
        shellPrompt := { state =>
            "continuum (%s)> ".format(Project.extract(state).currentProject.id)
        },
        cancelable := true,
        resolvers ++= Seq(
            Resolver.sonatypeRepo("releases"),
            Resolver.sonatypeRepo("snapshots"),
            Resolver.typesafeRepo("releases"),
            Resolver.typesafeRepo("snapshots"))
    )

    val eco = taskKey[Seq[File]]("Compile ECO templates")

    val requirejs = taskKey[File]("Run RequireJS optimizer")
    val requirejsConfig = settingKey[RequireJSConfig]("RequireJS configuration")

    val build = taskKey[Unit]("Build CoffeeScript, LESS, ECO, etc.")
    val deploy = taskKey[Unit]("Generate bokeh(.min).{js,css}")

    lazy val workbenchSettings = Workbench.workbenchSettings ++ Seq(
        Workbench.refreshBrowsers <<= Workbench.refreshBrowsers triggeredBy (compile in Compile),
        Workbench.localUrl := "localhost" -> 50060,
        Workbench.bootSnippet := "",
        resourceGenerators in Compile <+= Def.task {
            val stream = getClass.getClassLoader.getResourceAsStream("workbench_template.ts")
            val template = try { IO.readStream(stream) } finally { stream.close() }
            val script = template
                  .replace("<host>",        Workbench.localUrl.value._1)
                  .replace("<port>",        Workbench.localUrl.value._2.toString)
                  .replace("<bootSnippet>", Workbench.bootSnippet.value)
            val resDir = resourceManaged in (Compile, JsKeys.js) value
            val output = resDir / "workbench.js"
            IO.write(output, script)
            Seq(output)
        })

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
        LessKeys.prettyPrint in (Compile, LessKeys.less) := true)

    lazy val ecoSettings = pluginEcoSettings ++ Seq(
        sourceDirectory in (Compile, EcoKeys.eco) <<= (sourceDirectory in Compile)(_ / "coffee"),
        resourceManaged in (Compile, EcoKeys.eco) <<= (resourceManaged in Compile)(_ / "js"),
        compile in Compile <<= compile in Compile dependsOn (EcoKeys.eco in Compile))

    lazy val requirejsSettings = Seq(
        requirejsConfig in Compile := {
            val srcDir = sourceDirectory in Compile value;
            val jsDir = resourceManaged in (Compile, JsKeys.js) value;
            RequireJSConfig(
                logLevel       = 2,
                name           = "vendor/almond/almond",
                baseUrl        = jsDir,
                mainConfigFile = jsDir / "config.js",
                include        = List("underscore", "main"),
                wrap           = RequireJSWrap(
                    startFile  = srcDir / "js" / "_start.js.frag",
                    endFile    = srcDir / "js" / "_end.js.frag"
                ),
                optimize       = "none",
                out            = jsDir / "bokeh.js")
        },
        requirejs in Compile <<= Def.task {
            val rjs = new RequireJS(file("project/js"))
            rjs.optimize(requirejsConfig in Compile value)
        } dependsOn (resources in Compile))

    lazy val pluginSettings = /*workbenchSettings ++*/ jsSettings ++ lessSettings ++ ecoSettings ++ requirejsSettings

    lazy val bokehjsSettings = Project.defaultSettings ++ pluginSettings ++ Seq(
        sourceDirectory in Compile := baseDirectory.value / "src",
        resourceManaged in Compile := baseDirectory.value / "build",
        resourceGenerators in Compile <+= Def.task {
            val srcDir = sourceDirectory in Compile value
            val resDir = resourceManaged in (Compile, JsKeys.js) value
            val source = srcDir / "vendor"
            val target = resDir / "vendor"
            val toCopy = (PathFinder(source) ***) pair Path.rebase(source, target)
            IO.copy(toCopy, overwrite=true).toSeq
        },
        build <<= Def.task {} dependsOn (resources in Compile),
        deploy <<= Def.task {} dependsOn (requirejs in Compile))

    lazy val bokeh = project in file(".") aggregate(bokehjs)
    lazy val bokehjs = project in file("bokehjs") settings(bokehjsSettings: _*)

    override def projects = Seq(bokeh, bokehjs)
}
