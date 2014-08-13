angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $http, $location, $routeParams, readingsURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        var reading_id = $routeParams.id;

        var readingRef = new Firebase(readingsURL + "/" + reading_id);

        readingRef.on('value', function (snapshot) {

            console.log(snapshot.val());
            $scope.reading = snapshot.val()
            $scope.audio_link = S3ReadingsPath + snapshot.val().audio_key;
            $scope.$digest();

            soundManager.setup({
              url: 'sfw/',
              onready: function() {
                threeSixtyPlayer.init();
              },
              ontimeout: function() {
                // Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
              }
            });

        }, function (errorObject) {
          console.log('The read failed: ' + errorObject.code);
        });

    });
