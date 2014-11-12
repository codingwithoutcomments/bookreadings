angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("commentsURL", "https://bookreadings.firebaseio.com/comments")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .constant("CDNReadingsPathCF", "https://d3e04w4j2r2rn6.cloudfront.net/")
    .constant("CDNReadingsPathFP", "https://d1onveq9178bu8.cloudfront.net")
    .constant("readingsStatsURL", "https://bookreadings.firebaseio.com/readings_stats")
    .constant("tagsURL", "https://bookreadings.firebaseio.com/tagsURL")
    .controller("readingCtrl", function ($scope, $rootScope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, tagsURL, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath, CDNReadingsPathCF, CDNReadingsPathFP, readingsStatsURL) {

        threeSixtyPlayer.init();

        $scope.reading_id = $routeParams.id;
        $scope.reading_played = false;
        $scope.comments = []
        $scope.reading = null;
        $scope.reading_deleted = false;
        $scope.comment_properties = {};
        $scope.CDNReadingsPathCF = CDNReadingsPathCF;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        $scope.readingRef = $firebase(readingFirebase);

        var readingRecord = $scope.readingRef.$asObject();
        readingRecord.$loaded().then(function() {

            console.log(readingRecord);

            if(readingRecord.deleted == true) {

              var path = "reading/" + $scope.reading_id + "/" + readingRecord.slug + "/deleted";
              $location.path(path);

            } else {

              $scope.reading = readingRecord

              var time = moment($scope.reading.created);
              var timeSince = time.fromNow();
              $scope.reading["time_since"] = timeSince;

              if($scope.readingProperties[$scope.reading.$id] == null) {
                $scope.readingProperties[$scope.reading.$id] = {};
              }
              $scope.readingProperties[$scope.reading.$id].like_text = "Like";
              $scope.readingProperties[$scope.reading.$id].cover_image_url_converted = CDNReadingsPathFP + $scope.reading["cover_image_url"] + "/convert?w=950&height=950"

              //pull the reading stats 
              var readingStatsRef = new Firebase(readingsStatsURL + "/" + $scope.reading_id);
              var _readingStatsRef = $firebase(readingStatsRef);
              var reading_stats_record = _readingStatsRef.$asObject();
              reading_stats_record.$loaded().then(function(){

                 $scope.reading_stats = reading_stats_record;

              });


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
            $scope.comments.push(commentObject);
            addCommentTime(commentObject);
          }
        });

        function addCommentTime(commentObject) {

          commentObject.$loaded().then(function() {

            var time = moment(commentObject.created);
            var timeSince = time.fromNow();

            if($scope.comment_properties[commentObject.$id] == null) {
              $scope.comment_properties[commentObject.$id] = {};
            }

            $scope.comment_properties[commentObject.$id].timeSince = timeSince;

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

        function getFirebaseTagReadingReference(tagsURL, tag_name, reading_id) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name + "/" + reading_id);
          return $firebase(tagFirebase);

        }

        function getFirebaseReadingTagLocation(readingsURL,reading_id, tag_name) {

          var readingTagLocation = new Firebase(readingsURL + "/" + reading_id + "/tag_locations/" + tag_name);
          return $firebase(readingTagLocation)

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

                //delete tag locations and tags
                for(var key in $scope.reading.tag_locations) {

                  //remove from tags
                  var tagReadingRef = getFirebaseTagReadingReference(tagsURL, key, $scope.reading.tag_locations[key]);
                  tagReadingRef.$remove();

                  //remove from reading object tag locations
                  getFirebaseReadingTagLocation(readingsURL, $scope.reading.$id, key).$remove();

                }

                update_dictionary = {};
                update_dictionary["deleted"] = true;
                update_dictionary["modified"] = Firebase.ServerValue.TIMESTAMP;
                $scope.readingRef.$update(update_dictionary).then(function(){

                  //send the user to the home page
                  var path = "/";
                  $location.path(path);

                });

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

              var readingsByFeaturedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByFeatured");
              var _readingsByFeaturedRef = $firebase(readingsByFeaturedRef).$asArray();

              var data = {}
              var user = $scope.loginObj.user;
              data["created_by"] = user.uid
              data["reading_id"] = $scope.reading_id;
              data["$priority"] = Firebase.ServerValue.TIMESTAMP;

              _readingsByFeaturedRef.$add(data).then(function(ref) {

                var priorityFeatured = getFirebaseReadingsByFeaturedReference(ref.name()).$asObject();
                priorityFeatured.$loaded().then(function() {

                  priorityFeatured["$priority"] = -priorityFeatured.$priority;
                  priorityFeatured.$save();

                  update_dictionary = {};
                  update_dictionary["readingsByFeaturedId"] = ref.name();
                  $scope.readingRef.$update(update_dictionary).then(function(){

                      //display featured message
                      swal("Featured", "This reading has been featured", "success");   

                  });

              });

            });

        }

      }

        $scope.showTopCommentBox = function(){

          if($scope.loginObj.user && $scope.reading_stats){
            if($scope.reading_stats.comment_count <= 5) return true;
          }
          return false;
        }

        $scope.showBottomCommentBox = function(){

          if($scope.loginObj.user && $scope.reading_stats){
            if($scope.reading_stats.comment_count > 5) return true;
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

        function getFirebaseUserEventsReference(usersURL, user_id) {

          var usersEventsFirebase = new Firebase(usersURL + "/" + user_id + "/events/");
          return $firebase(usersEventsFirebase);

        }

        $scope.commentOnReading = function(comment, reading_id) {

          var commentsFirebase = new Firebase(commentsURL);
          var commentsRef = $firebase(commentsFirebase);

          var user = $scope.loginObj.user;
          var userObject = $rootScope.user;

          if(user) {

            var comment_object = {}
            comment_object["type"] = "reading";
            comment_object["created_by"] = $scope.loginObj.user.uid;
            comment_object["picture"] = "http://graph.facebook.com/" + user.id + "/picture";
            comment_object["display_name"] = userObject.displayName;
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

              //add comment event
              var commentReference = getFirebaseCommentReference(commentsURL, ref.name());
              var commentReferenceObject = commentReference.$asObject();
              commentReferenceObject.$loaded().then(function(){

                //add to a a general "user" events queue
                //sort by "newest"
                var event_object = {};
                event_object["event_type"] = "comment"
                event_object["object_id"] = ref.name();
                event_object["$priority"] = -commentReferenceObject.created;
                //set the priority to the negative timestamp
                var userEventsRef = getFirebaseUserEventsReference(usersURL, $scope.loginObj.user.uid).$asArray();
                userEventsRef.$add(event_object).then(function(ref){

                  var update_dict = {};
                  update_dict["event_id"] = ref.name();

                  //add event id to "like" object
                  commentReference.$update(update_dict);

                });

              });

              //increment counter
              var commentCount = getFirebaseReadingCommentCounterReference(readingsStatsURL, reading_id);
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
