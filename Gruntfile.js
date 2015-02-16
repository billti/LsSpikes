module.exports = function(grunt){
	grunt.initConfig({
		copy: {
			main:{
				files: [{
					src: 'bower_components/codemirror/lib/codemirror.js',
					dest: 'public/scripts/codemirror.js'
				}, {
					src: 'bower_components/codemirror/lib/codemirror.css',
					dest: 'public/css/codemirror.css'
				}, {
					src: 'bower_components/typescriptServices/index.js',
					dest: 'public/scripts/typescriptServices.js'
				}, {
					src: 'bower_components/jasmine/lib/jasmine-core/jasmine.css',
					dest: 'public/css/jasmine.css'
				}, {
					src: 'bower_components/jasmine/lib/jasmine-core/jasmine.js',
					dest: 'public/scripts/jasmine.js'
				}, {
					src: 'bower_components/jasmine/lib/jasmine-core/jasmine-html.js',
					dest: 'public/scripts/jasmine-html.js'
				}, {
					src: 'bower_components/jasmine/lib/jasmine-core/boot.js',
					dest: 'public/scripts/boot.js'
				}]			
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['copy']);
}