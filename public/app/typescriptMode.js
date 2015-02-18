CodeMirror.defineMode("typescript", function(config, modeConfig) {
	var modeObject = {
		startState: function(){
			return { state: "comment"};
		},
		token: function(stream, state) {
			// Return a style string.  Use the standard style theme names (without 'cm-' prefix)
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