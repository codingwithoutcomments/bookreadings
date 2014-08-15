angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $http, $location, $routeParams, readingsURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        var reading_id = $routeParams.id;

        var readingFirebase = new Firebase(readingsURL + "/" + reading_id);
        var readingRef = $firebase(readingFirebase);

        var readingRecord = readingRef.$asObject();
        readingRecord.$loaded().then(function () {

            $scope.reading = readingRecord
            $scope.audio_link = S3ReadingsPath + $scope.reading.audio_key;
            $scope.reading["cover_image_url_converted"] = $scope.reading["cover_image_url"] + "/convert?w=950&height=950"

            $scope.$watch('reading', function(newValue, oldValue){

              soundManager.setup({
                url: 'sfw/',
                onready: function() {
                  threeSixtyPlayer.init();
                },
                ontimeout: function() {
                  // Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
                }
              });
              
            });

        }, function (errorObject) {
          console.log('The read failed: ' + errorObject.code);
        });

    });
