angular.module("bookreadings")
    .constant("likesURL", "/likes")
    .constant("readingsURL", "/readings")
    .constant("usersURL", "/users")
    .constant("readingsStatsURL", "/readings_stats")
    .constant("readingsByMostPlayedURL", "/readingsByMostPlayed")
    .constant("readingsByDateCreatedURL", "/readingsByDateCreated")
    .constant("readingsByFeaturedURL", "/readingsByFeatured")
    .constant("tagsByPopularityURL", "/tags_by_popularity")
    .constant("tagsURL", "/tags")
    .directive('focusOn', function() {
       return function(scope, elem, attr) {
          scope.$on('focusOn', function(e, name) {
            if(name === attr.focusOn) {
              elem[0].focus();
            }
          });
         };
    })
    .factory('focus', function ($rootScope, $timeout) {
      return function(name) {
        $timeout(function (){
          $rootScope.$broadcast('focusOn', name);
        });
      }
    })
	.controller("bookreadingsCtrl", function ($scope, $rootScope, $firebase, $http, $location, $firebaseSimpleLogin, focus, tagsByPopularityURL, likesURL, tagsURL, readingsURL, usersURL, readingsStatsURL, ENV, readingsByDateCreatedURL, readingsByMostPlayedURL, readingsByFeaturedURL) {

    if($location.path() == "" || $location.path() == "/featured/") {

        $scope.filterByIndex = 0;

    }else if($location.path() == "/popular/") {

        $scope.filterByIndex = 1;

    }else if($location.path() == "/recent/") {

        $scope.filterByIndex = 2;

    }else if($location.path().substring(0, 8) == "/search/") {

        $scope.filterByIndex = 3;

    }

    $scope.search_shown = false;

    //dictionary for holding reading like information: like_text and reading_liked
    //can't add directly to reading because it's synced to the server
    $scope.readingProperties = {};
    $scope.randomAudioPlayerValue = 0;

		var firebaseRef = new Firebase(ENV.firebase);
	    $scope.loginObj = $firebaseSimpleLogin(firebaseRef);

        $scope.loginObj.$getCurrentUser().then(function(user) {

        	if(user){

				var userFirebase = new Firebase(ENV.firebase + "/users/" + user.uid);
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

    $scope.showSearch = function() {

      $scope.search_shown = true;

      // launch focus in the search bar
      focus('focusMe');
    }

    $scope.hideSearch = function() {

      $scope.search_shown = false;

    }

    $scope.changeFilterByIndex = function(index) {

      $scope.filterByIndex = index;

      //collapse menu
      $("#example-navbar-collapse").collapse('hide');

    }

    $scope.collapseNavbar = function(){

      //collapse menu
      $("#example-navbar-collapse").collapse('hide');

    }

		$scope.socialLogin = function() {

			$scope.loginObj.$login("facebook", {
				rememberMe: true,
				scope: 'email'
			}).then(function(user) {

    				var userFirebase = new Firebase(env.firebase + "/users/" + user.uid);
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
                var userInfoFirebase = new Firebase(env.firebase + "/user_info/" + user.uid);
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

      $scope.search_shown = false;

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

          var likesFirebase = new Firebase(ENV.firebase + likesURL + "/" + like_name);
          return $firebase(likesFirebase);

        }

        function getFirebaseReadingLikeCounterReference(readingsURL, reading_id) {

          var readingLikeLikeCounterFirebase = new Firebase(readingsURL + "/" + reading_id + "/like_count");
          return $firebase(readingLikeLikeCounterFirebase);

        }

        $scope.likeReading = function(reading_id) {

          var likesFirebase = new Firebase(ENV.firebase + likesURL);
          var likesRef = $firebase(likesFirebase);

          var user = $scope.loginObj.user;

	        if($scope.readingProperties[reading_id] == null) {
	          $scope.readingProperties[reading_id] = {};
	        }

          if(user) {

            //make sure like doesn't already exist
            //if already exists then remove like
            var readingLikesByUserRef = $scope.getFirebaseReadingLikesByUserReference(ENV.firebase + readingsURL, reading_id, user.uid);

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

                  var specificEventReference = getFirebaseUserSpecificEventsReference(ENV.firebase + usersURL, created_by, event_id);
                  specificEventReference.$remove();

                  //remove like
                  likeReference.$remove();
                });

                $scope.getFirebaseReadingLikesByUserReference(ENV.firebase + readingsURL, reading_id, user.uid).$remove();
                getFirebaseReadingLikeRef(ENV.firebase + readingsURL, reading_id, like_name).$remove();

                //decrement counter
                var likeCount = getFirebaseReadingLikeCounterReference(ENV.firebase + readingsStatsURL, reading_id);
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
                  var readingLikeRef = getFirebaseReadingLikeRef(ENV.firebase + readingsURL, reading_id, likeName);
                  readingLikeRef.$set(true)

                  //add like by user to reading object
                  //so that we can easily look up if the user already liked the reading
                  var readingLikesByUserRef = $scope.getFirebaseReadingLikesByUserReference(ENV.firebase + readingsURL, reading_id, $scope.loginObj.user.uid);
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
                    var userEventsRef = getFirebaseUserEventsReference(ENV.firebase + usersURL, $scope.loginObj.user.uid).$asArray();
                    userEventsRef.$add(event_object).then(function(ref){

                      var update_dict = {};
                      update_dict["event_id"] = ref.name();

                      //add event id to "like" object
                      likeReference.$update(update_dict);

                    });

                  });

                  //increment counter
                  var likeCount = getFirebaseReadingLikeCounterReference(ENV.firebase + readingsStatsURL, reading_id);
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

            var readingPlayCounterFirebase = new Firebase(ENV.firebase + readingsStatsURL + "/" + reading_id + "/play_count");
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
        				var readingsByMostPlayedRef = new Firebase(ENV.firebase + readingsByMostPlayedURL + "/" + readingsByMostPlayedId + "/");
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

        $scope.getFirebaseTagNameListReference = function(tagsURL, tag_name) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name + "/readings");
          return $firebase(tagFirebase);

        }

        $scope.getFirebaseTagCountReference = function(tagsURL, tag_name) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name + "/tag_count");
          return $firebase(tagFirebase);

        }

        $scope.getFirebaseTagsByPopularityReference = function(tagsURL, tag_name) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name + "/tags_by_popularity_location");
          return $firebase(tagFirebase);

        }

        $scope.getFirebaseTagsByTagNameReference = function(tagsURL, tag_name) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name);
          return $firebase(tagFirebase);

        }

        $scope.getFirebaseTagsByPopularityObjectReference = function(tagsByPopularityURL, tag_location) {

          var tagFirebase = new Firebase(tagsByPopularityURL + "/" + tag_location);
          return $firebase(tagFirebase);

        }

      $scope.add_tags_to_tag_specific_section = function(tagsRef, reading_id, user_id, reading_priority, number_of_tags, tag_name, reading_slug, processed_tags) {

        var data = {};
        data["created_by"] = user_id;
        data["reading_id"] = reading_id;
        data["$priority"] = reading_priority;

        var tagsRefArray = tagsRef.$asArray();

        //save tag to list under /readings
          //set the priority  
        tagsRefArray.$add(data).then(function(ref){

          //save the id back to reading
          var singleReadingTagRef = new Firebase(ENV.firebase + readingsURL + "/" + reading_id + "/" + "tag_locations");
          var _singleReadingTagRef = $firebase(singleReadingTagRef);

          _singleReadingTagRef.$set(tag_name, ref.name()).then(function(){

            //increment the tag count
            var tagCount = $scope.getFirebaseTagCountReference(ENV.firebase + tagsURL, tag_name);
                    tagCount.$transaction(function(currentCount) {

                      if (!currentCount) return 1;   // Initial value for counter.
                      if (currentCount < 0) return;  // Return undefined to abort transaction.
                      return currentCount + 1;       // Decrement the current counter by 1

                    }).then(function(snapshot) {

                      if (!snapshot) {
                        // Handle aborted transaction.

                      } else {

                        //see if tags by popularity exists
                        var _tags_by_popularity_location_object = $scope.getFirebaseTagsByPopularityReference(ENV.firebase + tagsURL, tag_name).$asObject();
                        _tags_by_popularity_location_object.$loaded(function(){

                          var tags_by_popularity_location = _tags_by_popularity_location_object.$value;

                          if(tags_by_popularity_location != null) {

                            //if it does, go to the object and increment the count and the priority
                            var tagsByPopularityObject = $scope.getFirebaseTagsByPopularityObjectReference(ENV.firebase + tagsByPopularityURL, tags_by_popularity_location).$asObject();
                            tagsByPopularityObject.$loaded(function(){

                              var new_count = tagsByPopularityObject["count"] + 1;
                              tagsByPopularityObject["count"] = tagsByPopularityObject["count"] + 1;
                              tagsByPopularityObject["$priority"] = -new_count;
                              tagsByPopularityObject.$save();

                              //at the end, load new page
                              add_tags_to_processed_load_reading_page(tag_name, number_of_tags, reading_slug, processed_tags, reading_id);


                            });


                          } else {

                            var tagsByPopularity =  new Firebase(ENV.firebase + tagsByPopularityURL);
                            var tagsByPopularityArray = $firebase(tagsByPopularity).$asArray();

                            //if it doesn't exist, create new object to push onto tags_by_popularity with tag name, count of 1, and priority of -1
                            var popularity_object = {};
                            popularity_object["count"] = 1;
                            popularity_object["tag_name"] = tag_name;
                            popularity_object["$priority"] = -1;
                            tagsByPopularityArray.$add(popularity_object).then(function(ref){

                              var location = ref.name();

                              //update the popularity location  
                              var tag_name_reference = $scope.getFirebaseTagsByTagNameReference(ENV.firebase + tagsURL, tag_name).$asObject();
                              tag_name_reference.$loaded().then(function(){

                                tag_name_reference["tags_by_popularity_location"] = location;
                                tag_name_reference.$save().then(function(){

                                  add_tags_to_processed_load_reading_page(tag_name, number_of_tags, reading_slug, processed_tags, reading_id);

                                });

                              });

                            });
                          }

                       });

                      }
                    }, function(err) {
                      // Handle the error condition.
                    });


          });


        });

      }

      function add_tags_to_processed_load_reading_page(tag_name, number_of_tags, reading_slug, processed_tags, reading_id) {

        processed_tags.push(tag_name);
        if(processed_tags.length == number_of_tags) {

              var path = "reading/" + reading_id + "/" + reading_slug;
              $location.path(path);
            }

      }

	});