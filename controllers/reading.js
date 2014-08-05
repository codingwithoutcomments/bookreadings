angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $http, $location, $routeParams, readingsURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        var reading_id = $routeParams.id;

        var readingRef = new Firebase(readingsURL + "/" + reading_id);

        readingRef.on('value', function (snapshot) {
          console.log(snapshot.val());

            $scope.audio_link = S3ReadingsPath + snapshot.val().audio_key;
            $scope.$digest();

            soundManager.setup({
              url: 'sfw/',
              onready: function() {
                threeSixtyPlayer.init();
                /*var mySound = soundManager.createSound({
                  id: 'aSound',
                  url: 'https://s3-us-west-2.amazonaws.com/bookreadings/readings/1QSZm7KnTsKHxiZZFIrp_track12.mp3'
                });
                mySound.play(); */
              },
              ontimeout: function() {
                // Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
              }
            });

        }, function (errorObject) {
          console.log('The read failed: ' + errorObject.code);
        });

    });
