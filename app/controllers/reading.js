angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("commentsURL", "https://bookreadings.firebaseio.com/comments")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("readingCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath) {

        threeSixtyPlayer.init();

        $scope.reading_id = $routeParams.id;
        $scope.like_text = "Like";
        $scope.reading_played = false;
        $scope.comments = []
        $scope.reading = null;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        var readingRef = $firebase(readingFirebase);

        var readingRecord = readingRef.$asObject();
        readingRecord.$loaded().then(function() {

            $scope.reading = readingRecord
            console.log($scope.reading);
            $scope.audio_link = S3ReadingsPath + $scope.reading.audio_key;
            $scope.reading["cover_image_url_converted"] = $scope.reading["cover_image_url"] + "/convert?w=950&height=950"

            var time = moment($scope.reading.created);
            var timeSince = time.fromNow();
            $scope.reading["time_since"] = timeSince;

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

        //populate the comments on the page
        var commentsArray = getFirebaseReadingComments(readingsURL, $scope.reading_id).$asArray();
        commentsArray.$watch(function(event){

          if(event.event == "child_added") {

            var commentObject = getFirebaseCommentReference(commentsURL, event.key).$asObject();
            addComment(commentObject);

          }

        });

        function addComment(commentObject) {

          commentObject.$loaded().then(function() {
            $scope.comments.push(commentObject);
          });
        }

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

        $scope.showTopCommentBox = function(){

          if($scope.loginObj.user && $scope.reading){
            if($scope.reading.comment_count <= 5) return true;
          }
          return false;
        }

        $scope.showBottomCommentBox = function(){

          if($scope.loginObj.user && $scope.reading){
            if($scope.reading.comment_count > 5) return true;
          }
          return false;
        }

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

        function getFirebaseReadingCommentCounterReference(readingsURL, reading_id) {

          var readingCommentCounterFirebase = new Firebase(readingsURL + "/" + reading_id + "/comment_count");
          return $firebase(readingCommentCounterFirebase);

        }

        function getFirebaseReadingCommentRefernece(readingsURL, reading_id, comment_name) {

          var readingCommentFirebase = new Firebase(readingsURL + "/" + reading_id + "/comments/" + comment_name);
          return $firebase(readingCommentFirebase);

        }

        function getFirebaseUserCommentReference(usersURL, user_id, comment_name) {

          var usersCommentFirebase = new Firebase(usersURL + "/" + user_id + "/comments/" + comment_name);
          return $firebase(usersCommentFirebase);

        }

        function getFirebaseReadingComments(readingsURL, reading_id) {

          var readingCommentsFirebase = new Firebase(readingsURL + "/" + reading_id + "/comments/");
          return $firebase(readingCommentsFirebase);

        }

        function getFirebaseCommentReference(commentsURL, comment_name) {

          var commentsFirebase = new Firebase(commentsURL + "/" + comment_name);
          return $firebase(commentsFirebase);

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

        $scope.commentOnReading = function(comment, reading_id) {

          var commentsFirebase = new Firebase(commentsURL);
          var commentsRef = $firebase(commentsFirebase);

          var user = $scope.loginObj.user;

          if(user) {

            var comment_object = {}
            comment_object["type"] = "reading";
            comment_object["created_by"] = $scope.loginObj.user.uid;
            comment_object["picture"] = "http://graph.facebook.com/" + user.id + "/picture";
            comment_object["display_name"] = user.displayName;
            comment_object["created"] = Firebase.ServerValue.TIMESTAMP;
            comment_object["object_id"] = reading_id;
            comment_object["content"] = comment.comment;
            commentsRef.$push(comment_object).then(function(ref){

              //clear commment
              $scope.comment = null;

              //add comment to reading
              var comment_name = ref.name();
              var reading_comment_ref = getFirebaseReadingCommentRefernece(readingsURL, reading_id, comment_name);
              reading_comment_ref.$set(true);

              //add comment to user
              var user_comment_ref = getFirebaseUserCommentReference(usersURL, $scope.loginObj.user.uid, comment_name);
              user_comment_ref.$set(true);

              //increment counter
              var commentCount = getFirebaseReadingCommentCounterReference(readingsURL, reading_id);
              commentCount.$transaction(function(currentCount) {
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
              console.log('Adding comment failed: ' + errorObject.code);
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
