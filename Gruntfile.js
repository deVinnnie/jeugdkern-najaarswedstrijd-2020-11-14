module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pug: {
            compile: {
                options: {
                  client: false,
                  pretty: true,
                  data: function(dest, src) {
                    return require('./game.json');
                  }
                },
                files: [ {
                  src: "index.pug",
                  dest: "./",
                  expand: true,
                  ext: ".html"
                } ]
            }
        },

        less: {
            all:{
                files: {
                    "css/main.css": "less/main.less"
                },
              options: {
                javascriptEnabled: true
              }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-contrib-less');

    // Default task(s).
    grunt.registerTask('default', 'pug');
};
