module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-ng-constant');

  // Project configuration.
  grunt.initConfig({
    ngconstant: {
    options: {
      name: 'config',
      dest: 'app/script/config.js',
      //constants: {
      //  package: grunt.file.readJSON('package.json')
      //},
      //values: {
      //  debug: true
      //}
    },
    development: {
        constants: {
            ENV: {
            name: 'development',
            firebase: 'https://bookreadings-staging.firebaseio.com',
            html5routing: 'false'
          }
        }
    },
    production: {
        constants: {
            ENV: {
            name: 'production',
            firebase: 'https://bookreadings.firebaseio.com',
            html5routing: 'true'
          }
        }
    }

  },
  });

  grunt.registerTask('default', function (target) {

    grunt.task.run([
      'ngconstant:development',
    ]);

  });

  grunt.registerTask('release', function (target) {

    grunt.task.run([
      'ngconstant:production', // ADD THIS
    ]);
  });

};