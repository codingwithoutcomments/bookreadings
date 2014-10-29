angular.module("bookreadings")
    .constant("readingsByDateCreatedURL", "https://bookreadings.firebaseio.com/readingsByDateCreated")
    .constant("readingsByMostPlayedURL", "https://bookreadings.firebaseio.com/readingsByMostPlayed")
    .constant("readingsByFeaturedURL", "https://bookreadings.firebaseio.com/readingsByFeatured")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("mainPageController", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsByDateCreatedURL, readingsByFeaturedURL, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, readingsByMostPlayedURL, S3ReadingsPath) {

    	$scope.S3ReadingsPath = S3ReadingsPath;
        $scope.oldReadings = {};
        $scope.populatedLikes = {};

        var ref = new Firebase(readingsByFeaturedURL);
        $scope.filterBy ="featured";
        $scope.filterByIndex = 0;

        if($location.path() == "/popular/") {

            ref = new Firebase(readingsByMostPlayedURL)
            $scope.filterBy ="popular";
            $scope.filterByIndex = 1;

        }else if($location.path() == "/recent/") {

            ref = new Firebase(readingsByDateCreatedURL);
            $scope.filterBy ="recent";
            $scope.filterByIndex = 2;

        }

    	var count = 0, pageSize = 5;

        threeSixtyPlayer.init();

    	$scope.loadNextPage = function () {

			count += pageSize;
			var readings = $firebase(ref.startAt().limit( count )).$asArray();
            readings.$loaded(function(){

                if(!$scope.readings) {
                    $scope.readings = [];
                }

                for(var i = 0; i < readings.length; i++) {

                    var readingRef = new Firebase(readingsURL + "/" + readings[i].reading_id);
                    var _readingObject = $firebase(readingRef).$asObject();

                    if(!(_readingObject.$id in $scope.oldReadings)) {

                        console.log("Adding reading: " + _readingObject.$id);
                        console.log(_readingObject);
                        $scope.readings.push(_readingObject);
                        $scope.oldReadings[_readingObject.$id] = true;

                        calculateTheCreatedTimeForReading(_readingObject, readings[i], $scope.filterBy);


                    }

                }

                populateLikesOnPage();

            });

            console.log("load next page");

		};

		function calculateTheCreatedTimeForReading(reading, readingsByRef, filter) {

            //calculte the created time
            reading.$loaded().then(function() {

                if($scope.readingProperties[reading.$id] == null) {
                  $scope.readingProperties[reading.$id] = {};
                }

                var time;
                if(filter == "featured") {

                  time = moment(Math.abs(readingsByRef.$priority));

                } else {

	             time = moment(reading.created);
                 
                }
	            var timeSince = time.fromNow();
	            $scope.readingProperties[reading.$id].timesince = timeSince;

            });

		}

        $scope.$watch('loginObj.user', function(newValue, oldValue) {

        	populateLikesOnPage();

        });

        function populateLikesOnPage(){

          if($scope.loginObj.user && $scope.readings){

          	for(var i = 0; i < $scope.readings.length; i++) {

          		var reading = $scope.readings[i];

          		if(!(reading.$id in $scope.populatedLikes)) {

		            reading.$loaded().then(function(data){

		              if(reading.likes_by_user && $scope.loginObj.user.uid in reading.likes_by_user) {

		                if($scope.readingProperties[reading.$id] == null) {
		                  $scope.readingProperties[reading.$id] = {};
		                }

		                $scope.readingProperties[reading.$id].reading_liked = true;
		                $scope.readingProperties[reading.$id].like_text = "Unlike"
		                console.log("Like Exists");
		              }

		              $scope.populatedLikes[reading.$id] = true;

		            }, function(errorObject) {

		              console.log("Error retrieving like");

		            });
		        }
	        };

          }
        }

		$scope.loadNextPage();

	    $(window).scroll(function() {
			if (window.scrollY == document.body.scrollHeight - window.innerHeight) {
			  $scope.loadNextPage();
			}
		});

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


