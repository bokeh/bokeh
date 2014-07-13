import sbt._

import scala.io.Source
import scala.collection.mutable
import scala.collection.JavaConverters._

import com.google.javascript.jscomp.{Compiler,CompilerOptions,SourceFile,VariableRenamingPolicy,NodeTraversal}
import com.google.javascript.rhino.Node

import org.jgrapht.experimental.dag.DirectedAcyclicGraph
import org.jgrapht.graph.DefaultEdge

object AST {
    object Call {
        def unapply(node: Node): Option[(String, List[Node])] = {
            if (node.isCall) {
                val fn :: args = node.children.asScala.toList
                Some((fn.getQualifiedName, args))
            } else
                None
        }
    }

    object Obj {
        def unapply(node: Node): Option[List[(String, Node)]] = {
            if (node.isObjectLit) {
                val keys = node.children().asScala.toList
                Some(keys.map { key =>
                    key.getString -> key.getFirstChild
                })
            } else
                None
        }
    }

    object Arr {
        def unapply(node: Node): Option[List[Node]] = {
            if (node.isArrayLit)
                Some(node.children().asScala.toList)
            else
                None
        }
    }

    object Str {
        def unapply(node: Node): Option[String] = {
            if (node.isString) Some(node.getString) else None
        }
    }
}

case class RequireJSSettings(
    baseUrl: File,
    mainConfigFile: File,
    name: String,
    include: List[String],
    wrapShim: Boolean,
    wrap: Option[(File, File)],
    out: File)

class RequireJS(log: Logger, settings: RequireJSSettings) {

    case class Config(paths: Map[String, String], shim: Map[String, List[String]])

    class ConfigReader extends NodeTraversal.Callback {
        val paths = mutable.Map.empty[String, String]
        val shim = mutable.Map.empty[String, List[String]]

        def shouldTraverse(traversal: NodeTraversal, node: Node, parent: Node) = true

        def visit(traversal: NodeTraversal, node: Node, parent: Node) {
            import AST._
            node match {
                case Call("require.config", Obj(keys) :: Nil) =>
                    keys.foreach {
                        case ("paths", Obj(keys)) =>
                            paths ++= keys.collect {
                                case (name, Str(path)) => name -> path
                            }
                        case ("shim", Obj(keys)) =>
                            shim ++= keys.collect {
                                case (name, Obj(keys)) =>
                                    name -> (keys.collect {
                                        case ("deps", Arr(items)) =>
                                            items.collect { case Str(item) => item }
                                    }).flatten
                            }
                        case _ =>
                    }
                case _ =>
            }
        }
    }

    def readConfig: Config = {
        val compiler = new Compiler

        val input = SourceFile.fromFile(settings.mainConfigFile)
        val root = compiler.parse(input)

        val reader = new ConfigReader()
        val traversal = new NodeTraversal(compiler, reader)
        traversal.traverse(root)

        Config(reader.paths.toMap, reader.shim.toMap)
    }

    val config = readConfig

    def readFile(file: File): String = Source.fromFile(file).mkString

    def readResource(path: String): String = {
        val resource = getClass.getClassLoader.getResourceAsStream(path)
        Source.fromInputStream(resource).mkString
    }

    def getModule(name: String): File = {
        val path = name.split("/").toList match {
            case prefix :: suffix =>
                val canonicalPrefix = config.paths.get(prefix) getOrElse prefix
                canonicalPrefix :: suffix mkString("/")
            case _ =>
                name
        }

        new File(settings.baseUrl, path + ".js")
    }

    def readModule(name: String): String = readFile(getModule(name))

    def canonicalName(name: String, origin: String): String = {
        val nameParts = name.split("/").toList
        val parentParts = origin.split("/").toList.init

        val parts = if (name.startsWith("./")) {
            parentParts ++ nameParts.tail
        } else if (name.startsWith("../")) {
            if (parentParts.isEmpty) {
                sys.error(s"Can't reference $name from $origin")
            } else {
                parentParts.init ++ nameParts.tail
            }
        } else {
            nameParts
        }

        val canonicalName = parts.mkString("/")
        val moduleFile = getModule(canonicalName)

        if (moduleFile.exists) canonicalName
        else sys.error(s"Not found: ${moduleFile.getPath} (requested from $origin)")
    }

    class ModuleCollector(moduleName: String) extends NodeTraversal.Callback {
        import AST._

        val names = mutable.Set[String]()

        private var defineNode: Option[Node] = None

        private def updateDefine(node: Node) {
            if (defineNode.isDefined)
                sys.error(s"$moduleName defines multiple anonymous modules")
            else {
                val moduleNode = Node.newString(moduleName)
                node.addChildAfter(moduleNode, node.getFirstChild)
                defineNode = Some(node)
            }
        }

        private def suspiciousCall(node: Node) {
            val Call(name, _) = node
            log.warn(s"$moduleName#${node.getLineno}: suspicious call to $name()")
        }

        def shouldTraverse(traversal: NodeTraversal, node: Node, parent: Node) = true

        def visit(traversal: NodeTraversal, node: Node, parent: Node) {
            node match {
                case Call("require", args) => args match {
                    case Str(name) :: Nil =>
                        names += name
                    case _ =>
                        suspiciousCall(node)
                }
                case Call("define", args) => args match {
                    case Str(_) :: Arr(deps) :: _ :: Nil =>
                        names ++= deps.collect { case Str(name) => name }
                    case Arr(deps) :: _ :: Nil =>
                        updateDefine(node)
                        names ++= deps.collect { case Str(name) => name }
                    case Str(_) :: _ :: Nil =>
                        ()
                    case Str(_) :: Nil =>
                        ()
                    case _ :: Nil =>
                        updateDefine(node)
                    case _ =>
                        suspiciousCall(node)
                }
                case _ =>
            }
        }
    }

    case class Module(name: String, deps: Set[String], source: String) {
        def annotatedSource: String = {
            s"// module: $name\n${shimmedSource}"
        }

        def shimmedSource: String = {
            if (config.shim contains name) {
                // TODO: exports
                val deps = this.deps.map(dep => s"'$dep'").mkString(", ")
                if (settings.wrapShim)
                    s"""
                    |(function(root) {
                    |    define("$name", [$deps], function() {
                    |        return (function() {
                    |            $source
                    |        }).apply(root, arguments);
                    |    });
                    |}(this));
                    """.stripMargin.trim
                else
                    s"define('$name', [$deps], function() {\n$source\n});"
            } else
                source
        }
    }

    val reservedNames = List("require", "module", "exports")

    def collectDependencies(name: String): Module = {
        val options = new CompilerOptions
        options.setLanguageIn(CompilerOptions.LanguageMode.ECMASCRIPT5)
        options.prettyPrint = true

        val compiler = new Compiler
        compiler.initOptions(options)

        log.debug(s"Parsing module $name")
        val input = SourceFile.fromFile(getModule(name))
        val root = compiler.parse(input)

        val collector = new ModuleCollector(name)
        val traversal = new NodeTraversal(compiler, collector)
        traversal.traverse(root)

        val deps = config.shim.get(name).map(_.toSet) getOrElse {
            collector.names
                .filterNot(reservedNames contains _)
                .map(canonicalName(_, name))
                .toSet
        }

        val source = {
            val cb = new Compiler.CodeBuilder()
            compiler.toSource(cb, 1, root)
            cb.toString
        }

        Module(name, deps, source)
    }

    def collectModules(): List[Module] = {
        val visited = mutable.Set[String]()
        val pending = mutable.Set[String](settings.include: _*)
        val modules = mutable.ListBuffer[Module]()

        while (pending.nonEmpty) {
            val name = pending.head
            pending.remove(name)
            val module = collectDependencies(name)
            visited += name
            modules += module
            pending ++= module.deps -- visited
        }

        modules.toList
    }

    def sortModules(modules: List[Module]): List[Module] = {
        val graph = new DirectedAcyclicGraph[String, DefaultEdge](classOf[DefaultEdge])
        modules.map(_.name).foreach(graph.addVertex)

        for {
            module <- modules
            dependency <- module.deps
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
        settings.wrap.map { case (start, end) =>
            List(readFile(start), input, readFile(end)).mkString("\n")
        } getOrElse input
    }

    def moduleLoader: Module = {
        val source = readModule(settings.name)
        val define = s"define('${settings.name}', function(){});"
        Module(settings.name, Set.empty, s"$source\n$define")
    }

    def optimize: String = {
        val modules = sortModules(collectModules)
        val contents = (moduleLoader :: modules).map(_.annotatedSource)
        log.info(s"Collected ${modules.length+1} requirejs modules")
        wrap(contents mkString "\n")
    }

    def optimizeAndMinify: (String, String) = {
        val output = optimize
        (output, minify(output))
    }
}
