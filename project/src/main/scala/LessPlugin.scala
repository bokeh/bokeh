import sbt._
import Keys._

import com.untyped.sbtgraph.{Graph,Source,Descendents}

import org.mozilla.javascript.tools.shell.Global
import org.mozilla.javascript.{Context,Scriptable,ScriptableObject,Callable,JavaScriptException}

import scala.collection.JavaConverters._

object LessPlugin extends sbt.Plugin {
    case class LessSource(graph: LessGraph, src: File) extends Source with Rhino {
        type S = LessSource
        type G = LessGraph

        protected val importRegex = """^\s*@import\s*(?:\(([a-z]+)\))?\s*"([^"]+)";.*$""".r

        protected def parseImport(line: String): Option[String] = {
            line match {
                case importRegex(_, path) if path.endsWith(".less") && !path.contains("@{") => Some(path)
                case _                                                                      => None
            }
        }

        lazy val parents: List[LessSource] = {
            for {
                line <- IO.readLines(src).toList
                path <- parseImport(line)
            } yield graph.getSource(path, this)
        }

        def isTemplated: Boolean =
            src.getPath.contains(".template")

        val compileFunction: String =
            """
            |function loadFile(originalHref, currentFileInfo, callback, env, modifyVars) {
            |    var href = less.modules.path.join(currentFileInfo.rootpath, originalHref);
            |    var newFileInfo = {rootpath: less.modules.path.dirname(href)};
            |
            |    try {
            |        var data = readFile(href);
            |        callback(null, data, href, newFileInfo);
            |    } catch (e) {
            |        callback(e, null, href);
            |    }
            |}
            |
            |less.Parser.fileLoader = loadFile;
            |
            |function compile(code, rootDir) {
            |    var options = {rootpath: rootDir, paths: [rootDir]};
            |    var css = null;
            |
            |    new less.Parser(options).parse(code, function (e, root) {
            |        if (e) { throw e; }
            |        css = root.toCSS({ compress: false })
            |    });
            |
            |    return css;
            |}
            """.trim.stripMargin

        def lessScope(ctx: Context): Scriptable = {
            val global = new Global()
            global.init(ctx)

            val scope = ctx.initStandardObjects(global)

            val lessScript = "less-rhino-1.7.5.js"
            val lessReader = new java.io.InputStreamReader(getClass.getResourceAsStream(lessScript))

            ctx.evaluateReader(scope, lessReader, lessScript, 1, null)
            ctx.evaluateString(scope, compileFunction, "<sbt>", 1, null)

            scope
        }

        def compile: Option[File] = {
            des.map { des =>
                graph.log.info(s"Compiling ${graph.pluginName} source $des")
                withContext { ctx =>
                    val scope = lessScope(ctx)
                    val lessCompiler = scope.get("compile", scope).asInstanceOf[Callable]
                    val args = Array[AnyRef](IO.read(src), src.getParent)
                    val output = withError { lessCompiler.call(ctx, scope, scope, args) }.toString
                    IO.write(des, output)
                    des
                }
            }
        }

        def withError[T](block: => T): T = {
            try {
                block
            } catch {
                case exception: JavaScriptException =>
                    val error   = exception.getValue.asInstanceOf[Scriptable]
                    val line    = ScriptableObject.getProperty(error, "line"   ).asInstanceOf[Double].intValue
                    val column  = ScriptableObject.getProperty(error, "column" ).asInstanceOf[Double].intValue
                    val message = ScriptableObject.getProperty(error, "message").toString
                    sys.error("%s error: %s [%s,%s]: %s".format(graph.pluginName, src.getName, line, column, message))
            }
        }
    }

    case class LessGraph(log: Logger, sourceDirs: Seq[File], targetDir: File) extends Graph {
        type S = LessSource

        val pluginName = "sbt-less"

        val templateProperties = null
        val downloadDir        = null

        def createSource(src: File): LessSource =
            LessSource(this, src.getCanonicalFile)

        def srcFilenameToDesFilename(filename: String) =
            filename.stripSuffix("less") + "css"
    }

    object LessKeys {
        val less = taskKey[Seq[File]]("Compile Less templates")
        val lessGraph = taskKey[LessGraph]("Collection of Less templates")
    }

    import LessKeys._

    def lessGraphTask = Def.task {
        val graph = LessGraph(
            log        = streams.value.log,
            sourceDirs = (sourceDirectories in less).value,
            targetDir  = (resourceManaged in less).value)

        (unmanagedSources in less).value.foreach(graph += _)
        graph
    }

    def unmanagedSourcesTask = Def.task {
        val include = includeFilter in less value
        val exclude = excludeFilter in less value

        (sourceDirectories in less).value.foldLeft(Seq[File]()) {
            (acc, sourceDir) => acc ++ Descendents(sourceDir, include, exclude).get
        }
    }

    def watchSourcesTask = Def.task {
        val graph = (lessGraph in less).value
        graph.sources.map(_.src): Seq[File]
    }

    def compileTask = Def.task {
        val sources = (unmanagedSources in less).value
        val graph = (lessGraph in less).value
        graph.compileAll(sources)
    }

    def cleanTask = Def.task {
        val graph = (lessGraph in less).value
        graph.sources.foreach(_.clean())
    }

    def lessSettingsIn(conf: Configuration): Seq[Setting[_]] = {
        inConfig(conf)(Seq(
            includeFilter in less     :=  "*.less",
            excludeFilter in less     :=  (".*" - ".") || "_*" || HiddenFileFilter,
            sourceDirectory in less   <<= (sourceDirectory in conf),
            sourceDirectories in less <<= (sourceDirectory in (conf, less)) { Seq(_) },
            unmanagedSources in less  <<= unmanagedSourcesTask,
            resourceManaged in less   <<= resourceManaged in conf,
            sources in less           <<= watchSourcesTask,
            watchSources in less      <<= watchSourcesTask,
            clean in less             <<= cleanTask,
            lessGraph                 <<= lessGraphTask,
            less                      <<= compileTask
        )) ++ Seq(
            cleanFiles               <+=  resourceManaged in less in conf,
            watchSources             <++= watchSources in less in conf
        )
    }

    def lessSettings: Seq[Setting[_]] =
        lessSettingsIn(Compile) ++ lessSettingsIn(Test)
}
