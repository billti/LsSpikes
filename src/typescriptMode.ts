/// <reference path="codemirror.d.ts"/>
/// <reference path="../TypeScript/built/local/typescriptServices.d.ts"/>

declare var myChart;

module tsls {
    export var version = "0.1";

    CodeMirror.defineMode("typescript", function (config, modeConfig) {
        var classMapping = {
            "text": null,
            "keyword": "keyword",
            "punctuation": "punctuation",
            "operator": "operator",
            "number": "number",
            "string": "string",
            "interface name": "variable",
            "type parameter name": "meta",
            "comment": "comment",
            "class name": "def",
            "module name": "def",
            "enum name": "def"
        };

        var modeObject = {
            startState: function () {
                return { lastToken: "SOF", currLine: -1 };
            },
            token: function (stream, state) {
                // Return a style string.  Use the standard style theme names (without 'cm-' prefix)
                // See codemirror.css @ 95 for the list of classes.
                // This function is called to parse whole lines impacted when a change occurs

                // Use following to get char index from line/col: myEditor.getDoc().indexFromPos({line: 0, ch: 2})

                if (!indexFromPos || !classifications) {
                    // Can't get classifications until this is initialized
                    stream.skipToEnd();
                    return null;
                }

                var result = null;
                while (!stream.eol()) {
                    if (stream.sol()) state.currLine++;

                    var index = indexFromPos(state.currLine, stream.pos);
                    var eolIndex = index + stream.string.length - stream.pos;
                    var nextToken = getNextClassification(index);

                    // Is the next token beyond this line?
                    if (!nextToken || nextToken && nextToken.textSpan.start > eolIndex) {
                        stream.skipToEnd();
                        return null;
                    }

                    // Advance past next token
                    stream.pos += nextToken.textSpan.start + nextToken.textSpan.length - index;
                    if (stream.pos > stream.string.length) {
                        stream.skipToEnd();
                    }

                    //console.log("From " + index + " to " + stream.pos + " found next token " + JSON.stringify(nextToken));
                    if (!(nextToken.classificationType in classMapping)) {
                        console.log("Need to add mapping for " + nextToken.classificationType);

                    }
                    return classMapping[nextToken.classificationType];
                }
            },
            blankLine: function (state) {
                state.currLine++;
            }
        };
        return modeObject;
    });

    var elemTypeDOM;
    var elemDescDOM;

    CodeMirror.registerHelper("hint", "typescript", function (editor, options) {
        var cur = editor.getCursor();
        var token = editor.getTokenAt(cur);
        var index = editor.indexFromPos(cur);

        var entries = service.getCompletionsAtPosition(docName, index);
        options.completeSingle = false;
        var completions = {
            list: entries.entries.map( (elem) => elem.name),
            from: CodeMirror.Pos(cur.line, token.string === "." ? token.start + 1 : token.start),
            to: CodeMirror.Pos(cur.line, token.end)
        };
        CodeMirror.on(completions, 'select', (completion, elem) => {
            var details = service.getCompletionEntryDetails(docName, index, completion);

            var elemType = details.displayParts.reduce( (prev, curr) => { return prev + curr.text}, "");
            var elemDesc = details.documentation.length > 0 ? details.documentation[0].text : completion;
            elemTypeDOM.textContent = elemType;
            elemDescDOM.textContent = elemDesc;
        });
        CodeMirror.on(completions, 'close', () => {
            elemTypeDOM.textContent = "";
            elemDescDOM.textContent = "";
        });

        return completions;
    });

    var compilerOptions = ts.getDefaultCompilerOptions();
    var docName = "sample.ts";
    var docText = "class Foo { \n\
  public age = 42;\n\
    constructor(public name: string){\n\
    }\n\
}\n\
    \n\
function foo() {\n\
    if (true) {\n\
        let x = null;\n\
    }\n\
    var y = function () {\n\
        const name = \"test\";\n\
    }\n\
}";
    var docVersion = "1";

    var defaultLibName = "/TypeScript/lib.d.ts"
    var defaultLibText = "";

    var IScriptSnapshot: ts.IScriptSnapshot = {
        getText: function (start, end) { return docText.substring(start, end); },
        getLength: function () { return docText.length; },
        getChangeRange: function () { return undefined; }
    };

    var libtsSnapshot: ts.IScriptSnapshot = {
        getText: (start, end) => defaultLibText,
        getLength: () => defaultLibText.length,
        getChangeRange: () => undefined
    }

    var host: ts.LanguageServiceHost = {
        getCompilationSettings: () => compilerOptions,
        getNewLine: () => "\n",
        getScriptFileNames: () => [defaultLibName, docName],
        getScriptVersion: (fileName) => fileName === defaultLibName ? "1" : docVersion,
        getScriptSnapshot: (fileName) => fileName === defaultLibName ? libtsSnapshot : IScriptSnapshot,
        getCurrentDirectory: () => "/",
        getDefaultLibFileName: () => defaultLibName
    };

    var docRegistry = ts.createDocumentRegistry();
    var docSourceFile = docRegistry.acquireDocument(docName, compilerOptions, IScriptSnapshot, docVersion);
    var libtsFile: ts.SourceFile = undefined;

    var libtsRequest = new XMLHttpRequest();
    libtsRequest.onreadystatechange = function(){
        if(libtsRequest.readyState === 4 /* done */){
            if(libtsRequest.status === 200){
                defaultLibText = libtsRequest.responseText;
                libtsFile = docRegistry.acquireDocument(defaultLibName, compilerOptions, libtsSnapshot, "1");
            } else {
                throw "Failed to load lib.ts";
            }
        }
    };
    libtsRequest.open('get', defaultLibName, true);
    libtsRequest.send();

    var service = ts.createLanguageService(host, docRegistry);
    var classifications: ts.ClassifiedSpan[];

    var updateDoc = function (newText: string) {
        docVersion = (parseInt(docVersion) + 1).toString();
        docText = newText;
        docSourceFile = docRegistry.updateDocument(docName, compilerOptions, IScriptSnapshot, docVersion);

        // classifications is an array of { classificationType: string; textSpan: {start: number; length: number;};}, using 0 based char offsets
        classifications = service.getSyntacticClassifications(docName, { start: 0, length: IScriptSnapshot.getLength() });
    };

    function getNextClassification(index: number) {
        if (!classifications) return null;

        // Assume the list is sorted, and find the first token that ends on or after the index given
        // Needs to end, and not start, after current point, due to multi-line tokens (e.g. comments)
        var result: ts.ClassifiedSpan = null;
        classifications.some(function (elem) {
            if (elem.textSpan.start + elem.textSpan.length > index) {
                result = elem;
                return true;
            } else {
                return false;
            }
        });
        return result;
    }

    var indexFromPos: (line: number, ch: number) => number;
    export function bindEditor(editor: CodeMirror.Editor) {
        elemTypeDOM = document.getElementById('elemType');
        elemDescDOM = document.getElementById('elemDesc');
        var doc = editor.getDoc();

        function onChange(editor, change) {
            // Don't worry about incremental for now.  Just do a full update
            // Called on every key press when typing
            var docText = doc.getValue();
            updateDoc(docText);	

            var graph = buildTree(docSourceFile);
            myChart(graph, true /* recalc */);

            var astGraph = buildAstFromNode(docSourceFile);
        }

        indexFromPos = function (line, ch) { return doc.indexFromPos({ line: line, ch: ch }); }
        editor.on('change', onChange);
        doc.setValue(docText);
    }
}