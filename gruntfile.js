module.exports = function(grunt) {

    // configure the tasks
    grunt.initConfig({

        clean: {
            dist: {
                src: [ 'build' ]
            },
        },

        coffee : {
            dist : {
                files : {
                    'build/script/background.js' : 'src/script/background/*.coffee',
                    'build/script/popup.js' : 'src/script/popup/*.coffee'
                }
            }
        },

        sass : {
            dist : {
                options : {
                    style : 'nested',
                    precision : 5,

                },
                files : {
                    'build/style/style.css' : 'src/style/style.scss',
                    'build/style/info.css' : 'src/style/info.css'
                }
            }
        },

        htmlmin : {
            dist : {
                options : {
                    removeComments : true,
                    collapseWhitespace : true,
                },
                files : {
                    'build/layout/popup.html' : 'src/layout/popup.html',
                    'src/layout/info.html' : 'src/layout/info.html'
                }
            }
        },

        watch : {
            style : {
                files : ['src/style/style.scss'],
                tasks : ['sass']
            },
            script : {
                files : ['src/script/**/.coffee']
                tasks : ['coffee']
            },
            layout : {
                files : ['src/layout/*.html']
                tasks : ['html']
            }
        }
    });

    // load the tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    // define the tasks
    grunt.registerTask('default', ['clean', 'coffee', 'sass', 'htmlmin', 'watch'])
};
