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
            
            if($scope.readingLikesProperties[$scope.reading.$id] == null) {
              $scope.readingLikesProperties[$scope.reading.$id] = {};
            }
            $scope.readingLikesProperties[$scope.reading.$id].like_text = "Like";

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

            var time = moment(commentObject.created);
            var timeSince = time.fromNow();
            commentObject["timeSince"] = timeSince;

            $scope.comments.push(commentObject);
          });
        }

        $scope.$watch('loginObj.user', function(newValue, oldValue) {

          if($scope.loginObj.user){

            var readingLikesByUserRef = $scope.getFirebaseReadingLikesByUserReference(readingsURL, $scope.reading_id, $scope.loginObj.user.uid);
            var userRecord = readingLikesByUserRef.$asObject();
            userRecord.$loaded().then(function(data){

              if(data.like_name != null) {

                if($scope.readingLikesProperties[$scope.reading_id] == null) {
                  $scope.readingLikesProperties[$scope.reading_id] = {};
                }
                $scope.readingLikesProperties[$scope.reading_id].reading_liked = true;
                $scope.readingLikesProperties[$scope.reading_id].like_text = "Unlike"
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

    });
