CodeMirror.defineMode("typescript", function(config, modeConfig) {
	var modeObject = {
		startState: function(){
			return { state: "comment"};
		},
		token: function(stream, state) {
			// Return a style string.  Use the standard style theme names (without 'cm-' prefix)
			// See codemirror.css @ 95 for the list of classes.
			var result = null;
			while(!stream.eol()){
				var nextChar = stream.next();
				if(nextChar == ' ') break;

				// Simply alternate for basic test
				result = state.state === 'comment' ? 'variable' : 'comment';
			}
			state.state = state.state === 'comment' ? 'variable' : 'comment';
			return result;
		}
	};
	return modeObject;
});

CodeMirror.registerHelper("hint", "typescript", function(editor, options){
	var cur = editor.getCursor();
	var token = editor.getTokenAt(cur);

	return {list: ["sausages","eggs","beans","tea","toast"],
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end)};
});

// Minimal hack for now to understand the LS API plumbing basics
var tsls = {};
tsls.compilerOptions = ts.getDefaultCompilerOptions();
tsls.docName = "sample.ts";
tsls.docText = "class Foo { public age = 42 }";
tsls.docVersion = "1";
tsls.IScriptSnapshot = {
	getText: function(start, end) { return tsls.docText.substring(start, end); },
	getLength: function() { return tsls.docText.length; },
	getChangeRange: function() { return undefined; }
};
tsls.host = {
	    getCompilationSettings: function (){ return tsls.compilerOptions; },
        getNewLine: function (){ return "\n"; },
        getScriptFileNames: function (){ return [tsls.docName]; },
        getScriptVersion: function (fileName) { return tsls.docVersion; },
        getScriptSnapshot: function (fileName) { return tsls.IScriptSnapshot; },
        getCurrentDirectory: function() { return "/"; },
        getDefaultLibFileName: function (options) { return "lib.d.ts"; },
        //getLocalizedDiagnosticMessages?(): any;
        //getCancellationToken?(): CancellationToken;
        //log?(s: string): void;
        //trace?(s: string): void;
        //error?(s: string): void;
};
tsls.docRegistry = ts.createDocumentRegistry();
tsls.service = ts.createLanguageService(tsls.host, tsls.docRegistry);
tsls.docRegistry.acquireDocument(tsls.docName, tsls.compilerOptions, tsls.IScriptSnapshot, tsls.docVersion);

tsls.classifications = tsls.service.getSyntacticClassifications("sample.ts", {start: 0, length: tsls.IScriptSnapshot.getLength() });

/* TODO
1. Wire up the editor change events to update the document.
2. Wire up the typescript mode token function to use the syntactic classifications.
3. Encapsulate all this (and the script in index.html) nicely.
*/