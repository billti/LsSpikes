CodeMirror.defineMode("typescript", function(config, modeConfig) {
	var classMapping = {
		"keyword": "keyword",
		"class name": "",
		"punctuation": "punctuation",
		"text": null,
		"operator": "operator",
		"number": "number",
		"string": "string",
		"interface name": "variable",
		"parameter name": "variable"
	};
	var modeObject = {
		startState: function(){
			return { lastToken: "SOF", currLine: -1};
		},
		token: function(stream, state) {
			// Return a style string.  Use the standard style theme names (without 'cm-' prefix)
			// See codemirror.css @ 95 for the list of classes.
			// This function is called to parse whole lines impacted when a change occurs

			// Use following to get char index from line/col: myEditor.getDoc().indexFromPos({line: 0, ch: 2})

			if(!tsls.indexFromPos || !tsls.classifications){
				// Can't get classifications until this is initialized
				stream.skipToEnd();
				return null;
			}

			var result = null;
			while(!stream.eol()){
				if(stream.sol()) state.currLine++;

				var index = tsls.indexFromPos(state.currLine, stream.pos);
				var eolIndex = index + stream.string.length - stream.pos;
				var nextToken = tsls.getNextClassification(index);

				// Is the next token beyond this line?
				if(!nextToken || (nextToken && nextToken.textSpan.start > eolIndex)){
					stream.skipToEnd();
					return null;
				}

				// Advance past next token
				stream.pos += nextToken.textSpan.start + nextToken.textSpan.length - index;
				if(stream.pos > stream.string.length) stream.skipToEnd();

				//console.log("From " + index + " to " + stream.pos + " found next token " + JSON.stringify(nextToken));
				if(!(nextToken.classificationType in classMapping)){
					console.log("Need to add mapping for " + nextToken.classificationType);

				}
				return classMapping[nextToken.classificationType];
			}
		},
		blankLine: function(state){
			state.currLine++;
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
tsls.docSourceFile = tsls.docRegistry.acquireDocument(tsls.docName, tsls.compilerOptions, tsls.IScriptSnapshot, tsls.docVersion);
tsls.service = ts.createLanguageService(tsls.host, tsls.docRegistry);

tsls.updateDoc = function(docText){
	tsls.docVersion = (Number.parseInt(tsls.docVersion) + 1).toString();
	tsls.docText = docText;
	tsls.docSourceFile = tsls.docRegistry.updateDocument(tsls.docSourceFile, tsls.docName, tsls.compilerOptions, tsls.IScriptSnapshot, tsls.docVersion, undefined);

	// classifications is an array of { classificationType: string; textSpan: {start: number; length: number;};}, using 0 based char offsets
	tsls.classifications = tsls.service.getSyntacticClassifications(tsls.docName, {start: 0, length: tsls.IScriptSnapshot.getLength() });
};

tsls.getNextClassification = function(index){
	if(!tsls.classifications) return null;

	// Assume the list is sorted, and find the first token that start on or after the index given
	var result = null;
	tsls.classifications.some(function(elem){
		if(elem.textSpan.start >= index){
			result = elem;
			return true;
		} else {
			return false;
		}
	});
	return result;
}

tsls.bindEditor = function(editor){
	var doc = editor.getDoc();
	function onChange(editor, change){
		// Don't worry about incremental for now.  Just do a full update
		// Called on every key press when typing
		var docText = doc.getValue();
		tsls.updateDoc(docText);	
		//console.log("onChange");
	}
	tsls.indexFromPos = function(line, ch){ return doc.indexFromPos({line: line, ch: ch}); }
	editor.on('change', onChange);
	doc.setValue(tsls.docText);
}

/* TODO
1. Wire up the editor change events to update the document.
2. Wire up the typescript mode token function to use the syntactic classifications.
3. Encapsulate all this (and the script in index.html) nicely.
*/
