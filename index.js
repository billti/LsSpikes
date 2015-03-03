var express = require('express');
var app = express();

// Serve 3rd party libraries directly from bower directory
app.use('/lib', express.static('bower_components'));

// Serve compiled files directly from the build folder
app.use('/build', express.static('build'));

// Serve everything else out of the site folder
app.use(express.static('site'));

var server = app.listen(3000, function () {
  console.log('Web server is listening at http://localhost:3000');
});
