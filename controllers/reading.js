angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        $scope.reading_id = $routeParams.id;
        $scope.like_text = "Like";
        $scope.reading_played = false;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        var readingRef = $firebase(readingFirebase);

        var readingRecord = readingRef.$asObject();
        readingRecord.$loaded().then(function () {

            $scope.reading = readingRecord
            console.log($scope.reading);
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

        $scope.$watch('loginObj.user', function(newValue, oldValue) {

          if($scope.loginObj.user){

            var readingLikesByUserRef = getFirebaseReadingLikesByUserReference(readingsURL, $scope.reading_id, $scope.loginObj.user.uid);
            var userRecord = readingLikesByUserRef.$asObject();
            userRecord.$loaded().then(function(data){

              if(data.like_name != null) {

                $scope.reading_liked = true;
                $scope.like_text = "Unlike"
                console.log("Like Exists");
              }

            }, function(errorObject) {

              console.log("Error retrieving like");

            });
          };

        });

        function getFirebaseReadingLikeRef(readingsURL, reading_id, like_name) {

          var readingFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes/" + like_name);
          return $firebase(readingFirebase);

        }

        function getFirebaseReadingLikesByUserReference(readingsURL, reading_id, user_id) {

          var readingLikesByUserFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes_by_user/" + user_id);
          return $firebase(readingLikesByUserFirebase);

        }

        function getFirebaseUserLikesReference(usersURL, user_id, like_name) {

          var usersLikesFirebase = new Firebase(usersURL + "/" + user_id + "/likes/" + like_name);
          return $firebase(usersLikesFirebase);

        }

        function getFirebaseLikesReference(like_name) {

          var likesFirebase = new Firebase(likesURL + "/" + like_name);
          return $firebase(likesFirebase);

        }

        function getFirebaseReadingLikeCounterReference(readingsURL, reading_id) {

          var readingLikeLikeCounterFirebase = new Firebase(readingsURL + "/" + reading_id + "/like_count");
          return $firebase(readingLikeLikeCounterFirebase);

        }

        $scope.readingPlayed = function(reading_id) {

          if(!$scope.reading_played) {
            
            $scope.reading_played = true;

            var readingPlayCounterFirebase = new Firebase(readingsURL + "/" + reading_id + "/play_count");
            var play_count = $firebase(readingPlayCounterFirebase);

            play_count.$transaction(function(currentCount) {
              if (!currentCount) return 1;   // Initial value for counter.
              if (currentCount < 0) return;  // Return undefined to abort transaction.
              return currentCount + 1;       // Increment the count by 1.
            }).then(function(snapshot) {
              if (!snapshot) {
                // Handle aborted transaction.
              } else {
                // Do something.
              }
            }, function(err) {
              // Handle the error condition.
            });

          }

        }

        $scope.likeReading = function(reading_id) {

          var likesFirebase = new Firebase(likesURL);
          var likesRef = $firebase(likesFirebase);

          var user = $scope.loginObj.user;

          if(user) {

            //make sure like doesn't already exist
            //if already exists then remove like
            var readingLikesByUserRef = getFirebaseReadingLikesByUserReference(readingsURL, reading_id, user.uid);

            var userRecord = readingLikesByUserRef.$asObject();
            userRecord.$loaded().then(function(data){


              var like_name = data.like_name;
              if(like_name != null) {

                $scope.reading_liked = false;
                $scope.like_text = "Like"

                //remove like
                var user = $scope.loginObj.user;
                getFirebaseLikesReference(like_name).$remove();
                getFirebaseUserLikesReference(usersURL, user.uid, like_name).$remove();
                getFirebaseReadingLikesByUserReference(readingsURL, reading_id, user.uid).$remove();
                getFirebaseReadingLikeRef(readingsURL, reading_id, like_name).$remove();

                //decrement counter
                var likeCount = getFirebaseReadingLikeCounterReference(readingsURL, reading_id);
                likeCount.$transaction(function(currentCount) {
                  if (!currentCount) return 1;   // Initial value for counter.
                  if (currentCount < 0) return;  // Return undefined to abort transaction.
                  return currentCount - 1;       // Increment the count by 1.
                }).then(function(snapshot) {
                  if (!snapshot) {
                    // Handle aborted transaction.
                  } else {
                    // Do something.
                  }
                }, function(err) {
                  // Handle the error condition.
                });

              } else {

                $scope.reading_liked = true;
                $scope.like_text = "Unlike"

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
                  //for the ability to list out all the likes for the reading
                  var likeName = ref.name();
                  var readingLikeRef = getFirebaseReadingLikeRef(readingsURL, reading_id, likeName);
                  readingLikeRef.$set(true)

                  //add like by user to reading object
                  //so that we can easily look up if the user already liked the reading
                  var readingLikesByUserRef = getFirebaseReadingLikesByUserReference(readingsURL, reading_id, $scope.loginObj.user.uid);
                  var dict = {};
                  dict["like_name"] = likeName;
                  readingLikesByUserRef.$set(dict);

                  //add likes to user
                  //so that on user page, one can print out what they have liked
                  var usersLikesRef = getFirebaseUserLikesReference(usersURL, $scope.loginObj.user.uid, likeName );
                  usersLikesRef.$set(true)

                  //increment counter
                  var likeCount = getFirebaseReadingLikeCounterReference(readingsURL, reading_id);
                  likeCount.$transaction(function(currentCount) {
                    if (!currentCount) return 1;   // Initial value for counter.
                    if (currentCount < 0) return;  // Return undefined to abort transaction.
                    return currentCount + 1;       // Increment the count by 1.
                  }).then(function(snapshot) {
                    if (!snapshot) {
                      // Handle aborted transaction.
                    } else {
                      // Do something.
                    }
                  }, function(err) {
                    // Handle the error condition.
                  });

                }, function (errorObject) {
                  console.log('Adding like failed: ' + errorObject.code);
                });

              }

            }, function(errorObject) {

              console.log("Error retrieving like");

            });

            //imcrement total amount of likes in the denomalized counter

          }
        }

    });
