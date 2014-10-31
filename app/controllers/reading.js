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
        $scope.reading_deleted = false;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        $scope.readingRef = $firebase(readingFirebase);

        var readingRecord = $scope.readingRef.$asObject();
        readingRecord.$loaded().then(function() {

            console.log(readingRecord);

            if(readingRecord.deleted == true) {

              $scope.reading_deleted = true;

            } else {

              $scope.reading = readingRecord

              $scope.audio_link = S3ReadingsPath + $scope.reading.audio_key;

              var time = moment($scope.reading.created);
              var timeSince = time.fromNow();
              $scope.reading["time_since"] = timeSince;

              if($scope.readingProperties[$scope.reading.$id] == null) {
                $scope.readingProperties[$scope.reading.$id] = {};
              }
              $scope.readingProperties[$scope.reading.$id].like_text = "Like";
              $scope.readingProperties[$scope.reading.$id].cover_image_url_converted = $scope.reading["cover_image_url"] + "/convert?w=950&height=950"

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
            }

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

                if($scope.readingProperties[$scope.reading_id] == null) {
                  $scope.readingProperties[$scope.reading_id] = {};
                }
                $scope.readingProperties[$scope.reading_id].reading_liked = true;
                $scope.readingProperties[$scope.reading_id].like_text = "Unlike"
                console.log("Like Exists");
              }

              //check to see if user created the reading
              if($scope.reading) {

                if($scope.readingCreatedByLoggedInUser()) {

                  $scope.readingProperties[$scope.reading_id].reading_created_by_logged_in_user = true;
                }

              }


            }, function(errorObject) {

              console.log("Error retrieving like");

            });
          };

        });

        $scope.readingCreatedByLoggedInUser = function(){

            if($scope.reading.created_by_id == $scope.loginObj.user.id) {

              return true;
            }

            return false;

        }

        $scope.delete = function(){

          if($scope.userIsAdminOrReadingIsCreatedByLoggedInUser($scope.reading.created_by_id)){

          swal({   
            title: "Are you sure?",   
            text: "Your will not be able to recover this reading!",  
            type: "warning",   
            showCancelButton: true,   
            confirmButtonColor: "#DD6B55",   
            confirmButtonText: "Yes, delete it!",   
            cancelButtonText: "No, cancel! ",   
            closeOnConfirm: true,   
            closeOnCancel: false }, 
            function(isConfirm){   

              if (!isConfirm) {     
                swal("Cancelled", "Your reading is safe :)", "error");   

              } else {

                //delete all the instances of the reading 

                var readingsByDateCreatedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByDateCreated/" + $scope.reading.readingsByDateCreatedId);
                $firebase(readingsByDateCreatedRef).$remove();

                var readingsByMostPlayedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByMostPlayed/" + $scope.reading.readingsByMostPlayedId);
                $firebase(readingsByMostPlayedRef).$remove();

                getFirebaseReadingsByFeaturedReference($scope.reading.readingsByFeaturedId).$remove();

                var readingRecord = $scope.readingRef.$asObject();
                readingRecord.$loaded().then(function() {

                  readingRecord.deleted = true;
                  readingRecord.$save();

                });

                //send the user to the home page
                var path = "/";
                $location.path(path);

              }

            });

          }

        };

        $scope.edit = function(){

          if($scope.userIsAdminOrReadingIsCreatedByLoggedInUser($scope.reading.created_by_id)) {

            var path = "reading/" + $scope.reading_id + "/" + $scope.reading.slug + "/edit/";
            $location.path(path);

          }

        }

        $scope.feature = function(){

          if($scope.userIsAdmin()) {

            //set the priority to the current timestamp
            //then reverse that timestamp
            var readingsByFeatured = getFirebaseReadingsByFeaturedReference($scope.reading.readingsByFeaturedId).$asObject();
            readingsByFeatured.$loaded().then(function() {

               readingsByFeatured["$priority"] = Firebase.ServerValue.TIMESTAMP;
               readingsByFeatured.$save().then(function(ref){

                var priorityFeatured = getFirebaseReadingsByFeaturedReference(ref.name()).$asObject();
                priorityFeatured.$loaded().then(function() {

                  priorityFeatured["$priority"] = -priorityFeatured.$priority;
                  priorityFeatured.$save();

                  //display featured message
                  swal("Featured", "This reading has been featured", "success");   


               });

            });

          });

        }

      }

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

        function getFirebaseReadingsByFeaturedReference(id) {

            var readingsByFeaturedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByFeatured/" + id);
            return $firebase(readingsByFeaturedRef);

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

        var hasRegistered = false;
        $scope.$watch(function() {
          if (hasRegistered) return;
          hasRegistered = true
          // Note that we're using a private Angular method here (for now)
          $scope.$$postDigest(function() {
            hasRegistered = false;

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
        });


    });
