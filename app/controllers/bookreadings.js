angular.module("bookreadings")
	.constant("firebaseURL", "https://bookreadings.firebaseio.com")
	.constant("firebaseAuthenticatedURL", "https://bookreadings.firebaseio.com/.info/authenticated")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("readingsStatsURL", "https://bookreadings.firebaseio.com/readings_stats")
	.controller("bookreadingsCtrl", function ($scope, $rootScope, $firebase, $http, $location, $firebaseSimpleLogin, firebaseURL, firebaseAuthenticatedURL, likesURL, readingsURL, usersURL, readingsStatsURL) {


        //dictionary for holding reading like information: like_text and reading_liked
        //can't add directly to reading because it's synced to the server
        $scope.readingProperties = {};
        $scope.randomAudioPlayerValue = 0;

		var firebaseRef = new Firebase(firebaseURL);
	    $scope.loginObj = $firebaseSimpleLogin(firebaseRef);

        $scope.loginObj.$getCurrentUser().then(function(user) {

        	if(user){

				var userFirebase = new Firebase(firebaseURL + "/users/" + user.uid);
		        var userRef = $firebase(userFirebase);

		        var userRecord = userRef.$asObject();
		        userRecord.$loaded().then(function () {

			    	//user exists
			    	setUser(userRecord);

				});

			} else {

		    	setUser(null);
			}
		});

		function setUser(user) {

			if(user) {

				//user exists
				$scope.user = user;
				$rootScope.user = user;
				$scope.firstName = user.displayName.split(' ')[0];
        $scope.provider_id = user.$id.split(':')[1];
				$scope.profile_picture = "https://graph.facebook.com/" + $scope.provider_id + "/picture";

			} else {

				$scope.user = null;
				$rootScope.user = null;
				$scope.profile_picture = "";
			}

		}

		$scope.socialLogin = function() {

			$scope.loginObj.$login("facebook", {
				rememberMe: true,
				scope: 'email'
			}).then(function(user) {

    				var userFirebase = new Firebase(firebaseURL + "/users/" + user.uid);
		        var userRef = $firebase(userFirebase);

		        this.userRef = userRef;

		        var userRecord = userRef.$asObject();
		        userRecord.$loaded().then(function () {

		        	if(userRecord.displayName) {

				    	//user exists
				    	setUser(userRecord);

           //new user
					 } else {

				    	var newUser = {}
				    	newUser["displayName"] = user.displayName;

					    this.newUser = newUser;
					    this.userRef.$set(newUser).then(function(ref){

					    	setUser(userRecord);

                var newUserInfo = {};
                newUserInfo["email"] = user.thirdPartyUserData.email;
                var userInfoFirebase = new Firebase(firebaseURL + "/user_info/" + user.uid);
                var userInfoRef = $firebase(userInfoFirebase);
                userInfoRef.$set(newUserInfo);


					    });
					 }
				});
			});

		}

    $scope.userIsAdmin = function() {

      if($scope.loginObj.user) {

        if($scope.user.admin) {
          return true;
        }

      }

      return false;

    }

    $scope.userIsAdminOrReadingIsCreatedByLoggedInUser = function(reading_created_by){

        if($scope.loginObj.user) {

          if(reading_created_by == $scope.loginObj.user.id || $scope.user.admin) {

            return true;
          }
        }

        return false;

    }

		$scope.logout = function() {
			$scope.loginObj.$logout();
			$location.path('/');
		}

		$scope.search = function(search){

			if(search && search.hasOwnProperty("searchterm")){
				 if(search.searchterm.length > 0) {
					var path = "/search/" + search.searchterm;
		        	$location.path(path);
		        }
	        }

		}

		$scope.$on('clearHeaderSearch', function(event, data) { $scope.searchPageObject = null; });

        $scope.getFirebaseReadingLikesByUserReference = function(readingsURL, reading_id, user_id) {

          var readingLikesByUserFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes_by_user/" + user_id);
          return $firebase(readingLikesByUserFirebase);

        }

        function getFirebaseReadingLikeRef(readingsURL, reading_id, like_name) {

          var readingFirebase = new Firebase(readingsURL + "/" + reading_id + "/likes/" + like_name);
          return $firebase(readingFirebase);

        }

        function getFirebaseUserLikesReference(usersURL, user_id, like_name) {

          var usersLikesFirebase = new Firebase(usersURL + "/" + user_id + "/likes/" + like_name);
          return $firebase(usersLikesFirebase);

        }

        function getFirebaseUserEventsReference(usersURL, user_id) {

          var usersEventsFirebase = new Firebase(usersURL + "/" + user_id + "/events/");
          return $firebase(usersEventsFirebase);

        }

        function getFirebaseUserSpecificEventsReference(usersURL, user_id, event_id) {

          var usersEventsFirebase = new Firebase(usersURL + "/" + user_id + "/events/" + event_id);
          return $firebase(usersEventsFirebase);

        }

        function getFirebaseLikesReference(like_name) {

          var likesFirebase = new Firebase(likesURL + "/" + like_name);
          return $firebase(likesFirebase);

        }

        function getFirebaseReadingLikeCounterReference(readingsURL, reading_id) {

          var readingLikeLikeCounterFirebase = new Firebase(readingsURL + "/" + reading_id + "/like_count");
          return $firebase(readingLikeLikeCounterFirebase);

        }

        $scope.likeReading = function(reading_id) {

          var likesFirebase = new Firebase(likesURL);
          var likesRef = $firebase(likesFirebase);

          var user = $scope.loginObj.user;

	        if($scope.readingProperties[reading_id] == null) {
	          $scope.readingProperties[reading_id] = {};
	        }

          if(user) {

            //make sure like doesn't already exist
            //if already exists then remove like
            var readingLikesByUserRef = $scope.getFirebaseReadingLikesByUserReference(readingsURL, reading_id, user.uid);

            var userRecord = readingLikesByUserRef.$asObject();
            userRecord.$loaded().then(function(data){

              var like_name = data.like_name;
              if(like_name != null) {

                $scope.readingProperties[reading_id].reading_liked = false;
                $scope.readingProperties[reading_id].like_text = "Like"

                var user = $scope.loginObj.user;

                var likeReference = getFirebaseLikesReference(like_name);
                var likeReferenceObject = likeReference.$asObject();
                likeReferenceObject.$loaded().then(function(){

                  //remove event from user
                  var created_by = likeReferenceObject.created_by;
                  var event_id = likeReferenceObject.event_id;

                  var specificEventReference = getFirebaseUserSpecificEventsReference(usersURL, created_by, event_id);
                  specificEventReference.$remove();

                  //remove like
                  likeReference.$remove();
                });

                $scope.getFirebaseReadingLikesByUserReference(readingsURL, reading_id, user.uid).$remove();
                getFirebaseReadingLikeRef(readingsURL, reading_id, like_name).$remove();

                //decrement counter
                var likeCount = getFirebaseReadingLikeCounterReference(readingsStatsURL, reading_id);
                likeCount.$transaction(function(currentCount) {
                  if (!currentCount) return 1;   // Initial value for counter.
                  if (currentCount < 0) return;  // Return undefined to abort transaction.
                  return currentCount - 1;       // Decrement the current counter by 1
                }).then(function(snapshot) {
                  if (!snapshot) {
                    // Handle aborted transaction.
                  } else {
                      $scope.readingProperties[reading_id].like_count = snapshot.val();
                  }
                }, function(err) {
                  // Handle the error condition.
                });

              } else {

                $scope.readingProperties[reading_id].reading_liked = true;
                $scope.readingProperties[reading_id].like_text = "Unlike"

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
                  var readingLikesByUserRef = $scope.getFirebaseReadingLikesByUserReference(readingsURL, reading_id, $scope.loginObj.user.uid);
                  var dict = {};
                  dict["like_name"] = likeName;
                  readingLikesByUserRef.$set(dict);

                  var likeReference = getFirebaseLikesReference(ref.name());
                  var likeReferenceObject = likeReference.$asObject();
                  likeReferenceObject.$loaded().then(function(){

                    //add to a a general "user" events queue
                    //sort by "newest"
                    var event_object = {};
                    event_object["event_type"] = "like"
                    event_object["object_id"] = ref.name();
                    event_object["$priority"] = -likeReferenceObject.created;
                    //set the priority to the negative timestamp
                    var userEventsRef = getFirebaseUserEventsReference(usersURL, $scope.loginObj.user.uid).$asArray();
                    userEventsRef.$add(event_object).then(function(ref){

                      var update_dict = {};
                      update_dict["event_id"] = ref.name();

                      //add event id to "like" object
                      likeReference.$update(update_dict);

                    });

                  });

                  //increment counter
                  var likeCount = getFirebaseReadingLikeCounterReference(readingsStatsURL, reading_id);
                  likeCount.$transaction(function(currentCount) {
                    if (!currentCount) return 1;   // Initial value for counter.
                    if (currentCount < 0) return;  // Return undefined to abort transaction.
                    return currentCount + 1;       // Increment the count by 1.
                  }).then(function(snapshot) {
                    if (!snapshot) {
                      // Handle aborted transaction.
                    } else {
                      $scope.readingProperties[reading_id].like_count = snapshot.val();
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

        $scope.readingPlayed = function(reading_id, readingsByMostPlayedId) {

	        if($scope.readingProperties[reading_id] == null) {
	          $scope.readingProperties[reading_id] = {};
	        }

          if(!($scope.readingProperties[reading_id].reading_played == true)) {

            $scope.readingProperties[reading_id].reading_played = true;

            var readingPlayCounterFirebase = new Firebase(readingsStatsURL + "/" + reading_id + "/play_count");
            var play_count = $firebase(readingPlayCounterFirebase);

            play_count.$transaction(function(currentCount) {
              if (!currentCount) return 1;   // Initial value for counter.
              if (currentCount < 0) return;  // Return undefined to abort transaction.
              return currentCount + 1;       // Increment the count by 1.
            }, false).then(function(snapshot) {
              if (!snapshot) {
                // Handle aborted transaction.
              } else {

                //increment priority of readings by most played
        				var readingsByMostPlayedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByMostPlayed/" + readingsByMostPlayedId + "/");
        				_readingByMostPlayedRef = $firebase(readingsByMostPlayedRef).$asObject();
        				_readingByMostPlayedRef.$loaded().then(function(){

        					console.log(_readingByMostPlayedRef);

        					_readingByMostPlayedRef["$priority"] = -snapshot.val();
        					_readingByMostPlayedRef.$save();

        				});

                $scope.readingProperties[reading_id].play_count = snapshot.val();


              }
            }, function(err) {
              // Handle the error condition.
            });

          }

        }

        function makeid()
		{
		    var text = "";
		    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		    for( var i=0; i < 5; i++ )
		        text += possible.charAt(Math.floor(Math.random() * possible.length));

		    return text;
		}

        $scope.$on('$routeChangeSuccess', function(next, current) {
        	$scope.randomAudioPlayerValue = makeid();
		 });

	});