import sbt._
import Keys._

import com.untyped.sbtgraph.{Graph,Source,Descendents}

import org.mozilla.javascript.tools.shell.Global
import org.mozilla.javascript.{Context,Scriptable,Callable}

import scala.collection.JavaConverters._
import java.nio.charset.Charset

object EcoPlugin extends sbt.Plugin {
    case class EcoSource(graph: EcoGraph, src: File) extends Source with Rhino {
        type S = EcoSource
        type G = EcoGraph

        val parents: List[EcoSource] = Nil

        def isTemplated: Boolean =
            src.getPath.contains(".template")

        val modules = List("eco", ".")

        def modulePaths: List[String] = {
            val baseUrl = getClass.getClassLoader.getResource("")
            val baseDir = file(baseUrl.getPath)
            modules.map(baseDir / _).map(_.toURI.toString)
        }

        def ecoScope(ctx: Context): Scriptable = {
            val global = new Global()
            global.init(ctx)

            val require = global.installRequire(ctx, modulePaths.asJava, false)
            require.requireMain(ctx, "compiler")
        }

        def compile: Option[File] = {
            des.map { des =>
                graph.log.info(s"Compiling ${graph.pluginName} source $des")
                withContext { ctx =>
                    val scope = ecoScope(ctx)
                    val ecoCompiler = scope.get("precompile", scope).asInstanceOf[Callable]
                    val args = Array[AnyRef](IO.read(src))
                    val output = ecoCompiler.call(ctx, scope, scope, args).asInstanceOf[String]
                    IO.write(des, output)
                    des
                }
            }
        }
    }

    case class EcoGraph(log: Logger, sourceDirs: Seq[File], targetDir: File) extends Graph {
        type S = EcoSource

        val pluginName = "sbt-eco"

        val templateProperties = null
        val downloadDir        = null

        def createSource(src: File): EcoSource =
            EcoSource(this, src.getCanonicalFile)

        def srcFilenameToDesFilename(filename: String) =
            filename.stripSuffix("eco") + "js"
    }

    object EcoKeys {
        val eco = taskKey[Seq[File]]("Compile ECO templates")
        val ecoGraph = taskKey[EcoGraph]("Collection of ECO templates")
    }

    import EcoKeys._

    def ecoGraphTask = Def.task {
        val graph = EcoGraph(
            log        = streams.value.log,
            sourceDirs = (sourceDirectories in eco).value,
            targetDir  = (resourceManaged in eco).value)

        (unmanagedSources in eco).value.foreach(graph += _)
        graph
    }

    def unmanagedSourcesTask = Def.task {
        val include = includeFilter in eco value
        val exclude = excludeFilter in eco value

        (sourceDirectories in eco).value.foldLeft(Seq[File]()) {
            (acc, sourceDir) => acc ++ Descendents(sourceDir, include, exclude).get
        }
    }

    def watchSourcesTask = Def.task {
        val graph = (ecoGraph in eco).value
        graph.sources.map(_.src): Seq[File]
    }

    def compileTask = Def.task {
        val sources = (unmanagedSources in eco).value
        val graph = (ecoGraph in eco).value
        graph.compileAll(sources)
    }

    def cleanTask = Def.task {
        val graph = (ecoGraph in eco).value
        graph.sources.foreach(_.clean())
    }

    def ecoSettingsIn(conf: Configuration): Seq[Setting[_]] = {
        inConfig(conf)(Seq(
            includeFilter in eco     :=  "*.eco",
            excludeFilter in eco     :=  (".*" - ".") || "_*" || HiddenFileFilter,
            sourceDirectory in eco   <<= (sourceDirectory in conf),
            sourceDirectories in eco <<= (sourceDirectory in (conf, eco)) { Seq(_) },
            unmanagedSources in eco  <<= unmanagedSourcesTask,
            resourceManaged in eco   <<= resourceManaged in conf,
            sources in eco           <<= watchSourcesTask,
            watchSources in eco      <<= watchSourcesTask,
            clean in eco             <<= cleanTask,
            ecoGraph                 <<= ecoGraphTask,
            eco                      <<= compileTask
        )) ++ Seq(
            cleanFiles               <+=  resourceManaged in eco in conf,
            watchSources             <++= watchSources in eco in conf
        )
    }

    def ecoSettings: Seq[Setting[_]] =
        ecoSettingsIn(Compile) ++ ecoSettingsIn(Test)
}
