var express = require('express');
var app = express();

// Serve 3rd party libraries directly from bower directory
app.use('/lib', express.static('node_modules'));

// Serve compiled files directly from the build folder
app.use('/build', express.static('build'));

// Serve source files for debugging
app.use('/src', express.static('src'));

// Serve TypeScript files directly from the local submodule build
app.use('/typescript', express.static('TypeScript/built/local'));

// Serve everything else out of the site folder
app.use(express.static('site'));

var server = app.listen(3000, function () {
  console.log('Web server is listening at http://localhost:3000');
});
