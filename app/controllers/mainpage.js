angular.module("bookreadings")
    .constant("readingsByDateCreatedURL", "https://bookreadings.firebaseio.com/readingsByDateCreated")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("mainPageController", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsByDateCreatedURL, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath) {

    	$scope.S3ReadingsPath = S3ReadingsPath;
        $scope.oldReadings = {};
        $scope.populatedLikes = {};

    	var ref = new Firebase(readingsByDateCreatedURL);
    	var count = 0, pageSize = 5;

        threeSixtyPlayer.init();

    	$scope.loadNextPage = function () {

			count += pageSize;
			var readingsByCreated = $firebase(ref.startAt().limit( count )).$asArray();
            readingsByCreated.$loaded(function(){

                if(!$scope.readings) {
                    $scope.readings = [];
                }

                for(var i = 0; i < readingsByCreated.length; i++) {

                    var readingRef = new Firebase(readingsURL + "/" + readingsByCreated[i].reading_id);
                    var _readingObject = $firebase(readingRef).$asObject();

                    if(!(_readingObject.$id in $scope.oldReadings)) {

                        console.log("Adding reading: " + _readingObject.$id);
                        console.log(_readingObject);
                        $scope.readings.push(_readingObject);
                        $scope.oldReadings[_readingObject.$id] = true;

                    }

                }

                populateLikesOnPage();

            });

            console.log("load next page");

		};

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

		                reading.reading_liked = true;
		                reading.like_text = "Unlike"
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


