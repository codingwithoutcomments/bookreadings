angular.module("bookreadings")
    .constant("readingsByDateCreatedURL", "/readingsByDateCreated")
    .constant("readingsByMostPlayedURL", "/readingsByMostPlayed")
    .constant("readingsByFeaturedURL", "/readingsByFeatured")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .constant("CDNReadingsPathCF", "https://d3e04w4j2r2rn6.cloudfront.net/")
    .constant("CDNReadingsPathFP", "https://d1onveq9178bu8.cloudfront.net")
    .constant("tagURL", "/tags")
    .controller("carouselController", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, tagURL, tagsByPopularityURL, readingsByDateCreatedURL, readingsByFeaturedURL, ENV, readingsURL, commentsURL, likesURL, usersURL, CDNReadingsPathFP, CDNReadingsPathCF, readingsByMostPlayedURL, S3ReadingsPath, readingsStatsURL) {

    	$scope.S3ReadingsPath = S3ReadingsPath;
        $scope.CDNReadingsPathCF = CDNReadingsPathCF;
        $scope.CDNReadingsPathFP = CDNReadingsPathFP;

        resize_graphics();

        var ref = new Firebase(ENV.firebase + readingsByFeaturedURL);
		var readings = $firebase(ref.startAt().limit( 3 )).$asArray();
        readings.$loaded(function(){

            if(!$scope.readings) {
                $scope.readings = [];
            }

            for(var i = 0; i < readings.length; i++) {

                var readingRef = new Firebase(ENV.firebase + readingsURL + "/" + readings[i].reading_id);
                var _readingObject = $firebase(readingRef).$asObject();

                $scope.readings.push(_readingObject);

            }

        });

        window.onresize = function(event) {

	        $scope.screen_width = $(window).width();
	        $scope.image_height = 290;
	        if($scope.screen_width > 1250) {
	        	$scope.screen_width = 1250;
	        }
	        if($scope.screen_width < 748) {
	        	$scope.image_height = $scope.screen_width;
	        }

	        $scope.$digest();

		};

		function resize_graphics(){

	        $scope.screen_width = $(window).width();
	        $scope.image_height = 290;
	        if($scope.screen_width > 1250) {
	        	$scope.screen_width = 1250;
	        }
	        if($scope.screen_width < 748) {
	        	$scope.image_height = $scope.screen_width;
	        }
		}

    });
