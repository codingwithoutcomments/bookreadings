module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-ng-constant');

  // Project configuration.
  grunt.initConfig({
    ngconstant: {
    options: {
      name: 'config',
      dest: 'config.js',
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
            apiEndpoint: 'https://bookreadings-staging.firebaseio.com'
          }
        }
    },
    production: {
        constants: {
            ENV: {
            name: 'production',
            apiEndpoint: 'https://bookreadings.firebaseio.com'
          }
        }
    }

  },
  });

  grunt.task.run([
    'ngconstant:development',
  ]);

};