angular.module("bookreadings")
    .constant("readingsByDateCreatedURL", "/readingsByDateCreated")
    .constant("readingsByMostPlayedURL", "/readingsByMostPlayed")
    .constant("readingsByFeaturedURL", "/readingsByFeatured")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .constant("CDNReadingsPathCF", "https://d3e04w4j2r2rn6.cloudfront.net/")
    .constant("CDNReadingsPathFP", "https://d1onveq9178bu8.cloudfront.net")
    .constant("tagURL", "/tags")
    .controller("mainPageController", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, tagURL, tagsByPopularityURL, readingsByDateCreatedURL, readingsByFeaturedURL, ENV, readingsURL, commentsURL, likesURL, usersURL, CDNReadingsPathFP, CDNReadingsPathCF, readingsByMostPlayedURL, S3ReadingsPath, readingsStatsURL) {

    	$scope.S3ReadingsPath = S3ReadingsPath;
        $scope.oldReadings = {};
        $scope.populatedLikes = {};
        $scope.CDNReadingsPathCF = CDNReadingsPathCF;
        $scope.CDNReadingsPathFP = CDNReadingsPathFP;
        $scope.loading = false;

        $scope.tag_name = $routeParams.tagname;

        var ref = new Firebase(ENV.firebase + readingsByFeaturedURL);
        $scope.filterBy ="featured";
        $scope.filterByIndex = 0;

        if($scope.tag_name) {

            ref = new Firebase(ENV.firebase + tagURL + "/" + $scope.tag_name + "/readings");
            //ref = new Firebase(ENV.firebase + tagURL + "/" + $scope.tag_name);
            $scope.filterBy = "";
            $scope.filterByIndex = -1;

        }else if($location.path() == "/popular/") {

            ref = new Firebase(ENV.firebase + readingsByMostPlayedURL)
            $scope.filterBy ="popular";
            $scope.filterByIndex = 1;

        }else if($location.path() == "/recent/") {

            ref = new Firebase(ENV.firebase + readingsByDateCreatedURL);
            $scope.filterBy ="recent";
            $scope.filterByIndex = 2;

        }

    	var count = 0, pageSize = 5;

        threeSixtyPlayer.init();

        //load tag counts
        var tags_by_popularity_ref = new Firebase(ENV.firebase + tagsByPopularityURL);
        var tags_by_popularity = $firebase(tags_by_popularity_ref.startAt().limit(10));
        $scope.tags_by_popularity = tags_by_popularity.$asArray();

    	$scope.loadNextPage = function () {

			count += pageSize;
			var readings = $firebase(ref.startAt().limit( count )).$asArray();
            readings.$loaded(function(){

                if(!$scope.readings) {
                    $scope.readings = [];
                }

                for(var i = 0; i < readings.length; i++) {

                    var readingRef = new Firebase(ENV.firebase + readingsURL + "/" + readings[i].reading_id);
                    var _readingObject = $firebase(readingRef).$asObject();
                    console.log(_readingObject);

                    if(!(_readingObject.$id in $scope.oldReadings)) {

                        $scope.readings.push(_readingObject);
                        $scope.oldReadings[_readingObject.$id] = true;

                        calculateTheCreatedTimeForReading(_readingObject, readings[i], $scope.filterBy);

                        var readingStatsRef = new Firebase(ENV.firebase + readingsStatsURL + "/" + readings[i].reading_id);
                        var _readingStatsObject = $firebase(readingStatsRef).$asObject();

                        getLikePlayCommentCounts(_readingObject, _readingStatsObject);


                    }

                }

                $scope.loading = false;

                populateLikesOnPage();

            });

		};

        function getLikePlayCommentCounts(reading, readingStatsObject) {

            if(readingStatsObject) {

                readingStatsObject.$loaded().then(function(){

                    $scope.readingProperties[reading.$id].comment_count = readingStatsObject.comment_count;
                    $scope.readingProperties[reading.$id].like_count = readingStatsObject.like_count;
                    $scope.readingProperties[reading.$id].play_count = readingStatsObject.play_count;

                });
            }

        }

		function calculateTheCreatedTimeForReading(reading, readingsByRef, filter) {

            //calculte the created time
            reading.$loaded().then(function() {

                if($scope.readingProperties[reading.$id] == null) {
                  $scope.readingProperties[reading.$id] = {};
                }

                var time;
                if(filter.toLowerCase() == "featured") {

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
              if($scope.loading == false) {
                  $scope.loading = true;
    			  $scope.loadNextPage();
              }
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


