/// <reference path="codemirror.d.ts"/>
/// <reference path="../public/scripts/typescriptServices.d.ts"/>

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
                    if (!nextToken || (nextToken && nextToken.textSpan.start > eolIndex)) {
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

    CodeMirror.registerHelper("hint", "typescript", function (editor, options) {
        var cur = editor.getCursor();
        var token = editor.getTokenAt(cur);

        return {
            list: ["sausages", "eggs", "beans", "tea", "toast"],
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)
        };
    });

    var compilerOptions = ts.getDefaultCompilerOptions();
    var docName = "sample.ts";
    var docText = "class Foo { public age = 42 }";
    var docVersion = "1";
    var IScriptSnapshot = {
        getText: function (start, end) { return docText.substring(start, end); },
        getLength: function () { return docText.length; },
        getChangeRange: function () { return undefined; }
    };
    var host: ts.LanguageServiceHost = {
        getCompilationSettings: function () { return compilerOptions; },
        getNewLine: function () { return "\n"; },
        getScriptFileNames: function () { return [docName]; },
        getScriptVersion: function (fileName) { return docVersion; },
        getScriptSnapshot: function (fileName) { return IScriptSnapshot; },
        getCurrentDirectory: function () { return "/"; },
        getDefaultLibFileName: function (options) { return "lib.d.ts"; },
        //getLocalizedDiagnosticMessages?(): any;
        //getCancellationToken?(): CancellationToken;
        //log?(s: string): void;
        //trace?(s: string): void;
        //error?(s: string): void;
    };

    var docRegistry = ts.createDocumentRegistry();
    var docSourceFile = docRegistry.acquireDocument(docName, compilerOptions, IScriptSnapshot, docVersion);
    var service = ts.createLanguageService(host, docRegistry);
    var classifications: ts.ClassifiedSpan[];

    var updateDoc = function (docText) {
        docVersion = (parseInt(docVersion) + 1).toString();
        docText = docText;
        docSourceFile = docRegistry.updateDocument(docSourceFile, docName, compilerOptions, IScriptSnapshot, docVersion, undefined);

        // classifications is an array of { classificationType: string; textSpan: {start: number; length: number;};}, using 0 based char offsets
        classifications = service.getSyntacticClassifications(docName, { start: 0, length: IScriptSnapshot.getLength() });
    };

    function getNextClassification(index) {
        if (!classifications) return null;

        // Assume the list is sorted, and find the first token that ends on or after the index given
        // Needs to end, and not start, after current point, due to multi-line tokens (e.g. comments)
        var result = null;
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
    export function bindEditor(editor) {
        var doc = editor.getDoc();
        function onChange(editor, change) {
            // Don't worry about incremental for now.  Just do a full update
            // Called on every key press when typing
            var docText = doc.getValue();
            updateDoc(docText);	
        }
        indexFromPos = function (line, ch) { return doc.indexFromPos({ line: line, ch: ch }); }
        editor.on('change', onChange);
        doc.setValue(docText);
    }
}