import sbt._
import Keys._

import com.untyped.sbtjs.Plugin.{JsKeys,jsSettings=>pluginJsSettings,CompilationLevel,VariableRenamingPolicy}
import com.untyped.sbtless.Plugin.{LessKeys,lessSettings=>pluginLessSettings}

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

    lazy val jsSettings = pluginJsSettings ++ Seq(
        sourceDirectory in (Compile, JsKeys.js) <<= (sourceDirectory in Compile)(_ / "coffee"),
        resourceManaged in (Compile, JsKeys.js) <<= (resourceManaged in Compile)(_ / "js"),
        compile in Compile <<= compile in Compile dependsOn (JsKeys.js in Compile),
        JsKeys.compilationLevel in (Compile, JsKeys.js) := CompilationLevel.WHITESPACE_ONLY,
        JsKeys.variableRenamingPolicy in (Compile, JsKeys.js) := VariableRenamingPolicy.OFF,
        JsKeys.prettyPrint in (Compile, JsKeys.js) := true)

    lazy val lessSettings = pluginLessSettings ++ Seq(
        sourceDirectory in (Compile, LessKeys.less) <<= (sourceDirectory in Compile)(_ / "less"),
        resourceManaged in (Compile, LessKeys.less) <<= (resourceManaged in Compile)(_ / "less"),
        compile in Compile <<= compile in Compile dependsOn (LessKeys.less in Compile),
        LessKeys.prettyPrint in (Compile, LessKeys.less) := true)

    lazy val bokehjsSettings = Project.defaultSettings ++ Seq(
        sourceDirectory in Compile := baseDirectory.value / "src",
        resourceManaged in Compile := baseDirectory.value / "build"
    ) ++ jsSettings ++ lessSettings

    lazy val bokeh = project in file(".") aggregate(bokehjs)
    lazy val bokehjs = project in file("bokehjs") settings(bokehjsSettings: _*)

    override def projects = Seq(bokeh, bokehjs)
}
