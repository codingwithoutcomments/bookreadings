angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $http, $location, $routeParams, readingsURL, likesURL, usersURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        $scope.reading_id = $routeParams.id;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
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

        //see if logged in user
        //if yes, then see if user liked the reading
        if($scope.loginObj.user) {
          var usersFirebase = new Firebase(usersURL + "/" + $scope.loginObj.user.uid + "/likes/" + likeName);
          var usersRef = $firebase(usersFirebase);

        }

        $scope.likeReading = function(reading_id) {

          var likesFirebase = new Firebase(likesURL);
          var likesRef = $firebase(likesFirebase);

          if($scope.loginObj.user) {

            //make sure like doesn't already exist
            //if already exists then remove like

            //if doesn't exist
            //add like to general like object
            var like_object = {}
            like_object["type"] = "reading";
            like_object["created_by"] = $scope.loginObj.user.uid;
            like_object["created"] = Firebase.ServerValue.TIMESTAMP;
            like_object["object_id"] = reading_id;
            like_object["value"] = 1;
            likesRef.$push(like_object).then(function(ref){

              //add like to reading object
              var likeName = ref.name();
              var readingFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes/" + likeName);
              var readingRef = $firebase(readingFirebase);
              readingRef.$set(true)

              var readingLikesByUserFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes_by_user/" + $scope.loginObj.user.uid);
              var readingLikesByUserRef = $firebase(readingLikesByUserFirebase);
              readingLikesByUserRef.$set(true)

            });

            //imcrement total amount of likes in the denomalized counter

          }
        }

    });
