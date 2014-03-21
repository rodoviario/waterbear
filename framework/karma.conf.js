// Karma configuration
// Generated on Thu Mar 06 2014 22:41:09 GMT-0500 (EST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',

    preprocessors: {
        'fixtures/**/*.html': ['html2js']
    },

    // frameworks to use
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [

        { pattern: 'fixtures/**/*.html', included: true },
      'waterbear.js',
      '../languages/javascript/asset_runtime.js',
      '../languages/javascript/canvas_runtime.js',
      //'../languages/javascript/geolocation_runtime.js',
      '../languages/javascript/image_runtime.js',
      '../languages/javascript/motion_runtime.js',
      '../languages/javascript/social_runtime.js',
      '../languages/javascript/javascript_runtime.js',
      '../languages/javascript/control_runtime.js',
      '../languages/javascript/datablock_runtime.js',
      '../languages/javascript/math_runtime.js',
      '../languages/javascript/random_runtime.js',
      '../languages/javascript/sprite_runtime.js',
      '../languages/javascript/string_runtime.js',
      '../languages/javascript/vector_runtime.js',
      '../languages/javascript/voice_runtime.js',
      'specs/*.js'
    ],


    // list of files to exclude
    exclude: [
      '**/*.swp'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome', 'Firefox'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};