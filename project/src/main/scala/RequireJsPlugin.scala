import sbt._

import org.mozilla.javascript.tools.shell.{Global}
import org.mozilla.javascript.{Context,Scriptable,ScriptableObject,Callable,NativeObject}

import ScriptableObject.READONLY

import scala.io.Source
import scala.collection.mutable
import scala.collection.JavaConverters._

import com.google.javascript.jscomp.{Compiler,CompilerOptions,SourceFile,VariableRenamingPolicy,NodeTraversal}
import com.google.javascript.rhino.Node

import org.jgrapht.experimental.dag.DirectedAcyclicGraph
import org.jgrapht.graph.DefaultEdge

class XRequireJS(log: Logger, settings: RequireJSSettings) {

    case class Shim(deps: List[String], exports: Option[String])
    case class Config(paths: Map[String, String], shim: Map[String, Shim])

    val config = Config(
        Map(
            ("jquery",            "vendor/jquery/jquery"),
            ("jquery_ui",         "vendor/jquery-ui-amd/jquery-ui-1.10.0/jqueryui"),
            ("jquery_mousewheel", "vendor/jquery-mousewheel/jquery.mousewheel"),
            ("jqrangeslider",     "vendor/jqrangeslider/jQAllRangeSliders-withRuler-min"),
            ("handsontable",      "vendor/handsontable/jquery.handsontable"),
            ("numeral",           "vendor/numeral/numeral"),
            ("underscore",        "vendor/underscore-amd/underscore"),
            ("backbone",          "vendor/backbone-amd/backbone"),
            ("bootstrap",         "vendor/bootstrap-3.1.1/js"),
            ("timezone",          "vendor/timezone/src/timezone"),
            ("sprintf",           "vendor/sprintf/src/sprintf"),
            ("rbush",             "vendor/rbush/rbush"),
            ("jstree",            "vendor/jstree/dist/jstree"),
            ("gear_utils",        "vendor/gear-utils/gear-utils")
        ),
        Map(
            ("sprintf", Shim(Nil, Some("sprintf"))),
            ("handsontable", Shim(List("numeral"), Some("$.fn.handsontable"))),
            ("jqrangeslider", Shim(List("jquery_ui/core", "jquery_ui/widget", "jquery_ui/mouse", "jquery_mousewheel"), Some("$.fn.rangeSlider")))
        )
    )

    lazy val shim = config.shim.map { case (name, Shim(deps, _)) =>
        (canonicalName(name), deps.map(canonicalName).toSet)
    }

    def getFile(name: String): File = new File(settings.baseUrl, name + ".js")

    def readFile(file: File): String = Source.fromFile(file).mkString

    def readModule(name: String): String = readFile(getFile(name))

    def readResource(path: String): String = {
        val resource = getClass.getClassLoader.getResourceAsStream(path)
        Source.fromInputStream(resource).mkString
    }

    def canonicalName(name: String): String = canonicalName(name, None)

    def canonicalName(name: String, parent: Option[String]): String = {
        val nameParts = name.split("/").toList

        val here = name.startsWith("./")
        val back = name.startsWith("../")
        val relative = here || back

        val parts = (parent, relative) match {
            case (None,         true) =>
                sys.error(s"Relative module $name is not allowed in this context")
            case (Some(parent), true) =>
                val parentParts = parent.split("/").toList
                if (here) parentParts.init      ++ nameParts.tail
                else      parentParts.init.init ++ nameParts.tail
            case _ =>
                config.paths.get(nameParts.head).map(_ :: nameParts.tail).getOrElse(nameParts)
        }

        val canonical = parts.mkString("/")
        val file = getFile(canonical)

        if (file.exists) canonical
        else sys.error(s"Not found: ${file.getPath} (requested from $parent)")
    }

    class ModuleCollector(moduleName: String) extends NodeTraversal.Callback {
        private var defineNode: Option[Node] = None

        val names = mutable.Set[String]()

        def shouldTraverse(traversal: NodeTraversal, node: Node, parent: Node) = true

        def visit(traversal: NodeTraversal, node: Node, parent: Node) {
            if (node.isCall) {
                val children = node.children.asScala.toList

                val fn = children.head.getQualifiedName
                val args = children.tail

                def suspiciousCall() {
                    log.warn(s"$moduleName#${node.getLineno}: suspicious call to $fn()")
                }

                fn match {
                    case "require" =>
                        args match {
                            case name :: Nil if name.isString =>
                                names += name.getString
                            case _ =>
                                suspiciousCall()
                        }
                    case "define" =>
                        def getNames(array: Node) = {
                            array.children.asScala.filter(_.isString).map(_.getString)
                        }

                        def updateDefine() {
                            defineNode match {
                                case Some(_) =>
                                    sys.error(s"$moduleName defines multiple anonymous modules")
                                case None =>
                                    val moduleNode = Node.newString(moduleName)
                                    node.addChildAfter(moduleNode, children.head)
                                    defineNode = Some(node)
                            }
                        }

                        args match {
                            case name :: deps :: _ :: Nil if name.isString && deps.isArrayLit =>
                                names ++= getNames(deps)
                            case deps :: _ :: Nil if deps.isArrayLit =>
                                updateDefine()
                                names ++= getNames(deps)
                            case name :: _ :: Nil if name.isString =>
                                ()
                            case name :: Nil if name.isString =>
                                ()
                            case _ :: Nil =>
                                updateDefine()
                            case _ =>
                                suspiciousCall()
                        }
                    case _ =>
                }
            }
        }
    }

    val reservedNames = List("require", "module", "exports")

    def collectDependencies(name: String): (String, Set[String]) = {
        val options = new CompilerOptions
        options.setLanguageIn(CompilerOptions.LanguageMode.ECMASCRIPT5)
        options.prettyPrint = true

        val compiler = new Compiler
        compiler.initOptions(options)

        log.debug(s"Parsing module $name")
        val input = SourceFile.fromFile(getFile(name))
        val root = compiler.parse(input)

        val collector = new ModuleCollector(name)
        val traversal = new NodeTraversal(compiler, collector)
        traversal.traverse(root)

        val deps = shim.get(name).map(_.toSet) getOrElse {
            collector.names
                .filterNot(reservedNames contains _)
                .map(canonicalName(_, Some(name)))
                .toSet
        }

        val source = {
            val cb = new Compiler.CodeBuilder()
            compiler.toSource(cb, 1, root)
            cb.toString
        }

        (source, deps)
    }

    case class Module(name: String, dependencies: List[String], source: String) {
        def annotatedSource: String = {
            s"// module: $name\n$source"
        }
    }

    def collectModules(): List[Module] = {
        val include = settings.include.map(canonicalName)

        val visited = mutable.Set[String]()
        val pending = mutable.Set[String](include: _*)
        val modules = mutable.ListBuffer[Module]()

        while (pending.nonEmpty) {
            val name = pending.head
            pending.remove(name)
            val (source, deps) = collectDependencies(name)
            visited += name
            modules += Module(name, deps.toList.sorted, source)
            pending ++= deps -- visited
        }

        modules.toList
    }

    def sortModules(modules: List[Module]): List[Module] = {
        val graph = new DirectedAcyclicGraph[String, DefaultEdge](classOf[DefaultEdge])
        modules.map(_.name).foreach(graph.addVertex)

        for {
            module <- modules
            dependency <- module.dependencies
        } try {
            graph.addEdge(dependency, module.name)
        } catch {
            case _: IllegalArgumentException =>
                log.warn(s"${module.name} depending on $dependency introduces a cycle")
        }

        val modulesMap = modules.map(module => (module.name, module)).toMap
        graph.iterator.asScala.toList.map(modulesMap(_))
    }

    def minify(input: String): String = {
        val compiler = new Compiler
        val externs = Nil: List[SourceFile]
        val sources = SourceFile.fromCode(settings.baseUrl.getPath, input) :: Nil
        val options = new CompilerOptions
        options.setLanguageIn(CompilerOptions.LanguageMode.ECMASCRIPT5)
        options.variableRenaming = VariableRenamingPolicy.ALL
        options.prettyPrint = false
        val result = compiler.compile(externs.asJava, sources.asJava, options)
        if (result.errors.nonEmpty) {
            result.errors.foreach(error => log.error(error.toString))
            sys.error(s"${result.errors.length} errors found")
        } else {
            compiler.toSource
        }
    }

    def wrap(input: String): String = {
        settings.wrap.map { case RequireJSWrap(start, end) =>
            List(readFile(start), input, readFile(end)).mkString("\n")
        } getOrElse input
    }

    def moduleLoader: Module = {
        val source = readModule(settings.name)
        val define = s"define('${settings.name}', function(){});"
        Module(settings.name, Nil, s"$source\n$define")
    }

    def optimize: String = {
        val modules = sortModules(collectModules)
        val contents = (moduleLoader :: modules).map(_.annotatedSource)
        log.info(s"Collected ${modules.length+1} requirejs modules")
        wrap(contents mkString "\n")
    }

    def optimizeAndMinify: (String, String) = {
        val output = optimize
        (output, output) // TODO: minify(output))
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

case class RequireJSSettings(
    logLevel: Int,
    baseUrl: File,
    mainConfigFile: File,
    name: String,
    include: List[String],
    wrapShim: Boolean,
    wrap: Option[RequireJSWrap],
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
        ScriptableObject.defineProperty(obj, "wrapShim", wrapShim, READONLY)
        wrap.foreach { wrap => ScriptableObject.defineProperty(obj, "wrap", wrap.toJsObject(scope), READONLY) }
        ScriptableObject.defineProperty(obj, "optimize", optimize, READONLY)
        ScriptableObject.defineProperty(obj, "out", out.getPath, READONLY)
        obj
    }
}

class RequireJS(log: Logger) extends Rhino {

    def rjsScope(ctx: Context): Scriptable = {
        val global = new Global()
        global.init(ctx)

        val scope = ctx.initStandardObjects(global, true)

        val arguments = ctx.newArray(scope, Array[AnyRef]())
        scope.defineProperty("arguments", arguments, ScriptableObject.DONTENUM)
        scope.defineProperty("requirejsAsLib", true, ScriptableObject.DONTENUM)

        val rjs = new java.io.InputStreamReader(
            getClass.getClassLoader.getResourceAsStream("r.js"))

        ctx.evaluateReader(scope, rjs, "r.js", 1, null)
        scope
    }

    def optimize(settings: RequireJSSettings): (File, File) = {
        withContext { ctx =>
            log.info(s"Optimizing and minifying sbt-requirejs source ${settings.out}")
            val scope = rjsScope(ctx)
            val require = scope.get("require", scope).asInstanceOf[Scriptable]
            val optimize = require.get("optimize", scope).asInstanceOf[Callable]
            val args = Array[AnyRef](settings.toJsObject(scope))
            optimize.call(ctx, scope, scope, args)
            val output = settings.out
            val outputMin = file(output.getPath.stripSuffix("js") + "min.js")
            IO.copyFile(output, outputMin)
            // val outputMin = minify(output)
            (output, outputMin)
        }
    }

    def minify(input: File): File = {
        val output = file(input.getPath.stripSuffix("js") + "min.js")
        val compiler = new Compiler
        val externs = Nil: List[SourceFile]
        val sources = SourceFile.fromFile(input) :: Nil
        val options = new CompilerOptions
        options.setLanguageIn(CompilerOptions.LanguageMode.ECMASCRIPT5)
        options.variableRenaming = VariableRenamingPolicy.ALL
        options.prettyPrint = false
        val result = compiler.compile(externs.asJava, sources.asJava, options)
        if (result.errors.nonEmpty) {
            result.errors.foreach(error => log.error(error.toString))
            sys.error(s"${result.errors.length} errors compiling $input")
        } else {
            // val warnings = result.warnings.filter(_.getType().key != "JSC_BAD_JSDOC_ANNOTATION")
            // warnings.foreach(warning => log.warn(warning.toString))
            IO.write(output, compiler.toSource)
            output
        }
    }
}
