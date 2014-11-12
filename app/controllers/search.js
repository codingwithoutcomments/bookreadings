angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("CDNReadingsPathCF", "https://d3e04w4j2r2rn6.cloudfront.net/")
    .constant("CDNReadingsPathFP", "https://d1onveq9178bu8.cloudfront.net")
    .constant("readingsStatsURL", "https://bookreadings.firebaseio.com/readings_stats")
    .controller("searchCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsStatsURL, readingsURL, S3ReadingsPath, CDNReadingsPathCF, CDNReadingsPathFP) {

    	$scope.searchObject = {}

        $scope.searchterm = $routeParams.searchterm;
        $scope.searchObject.searchterm = $scope.searchterm;
        $scope.$emit('clearHeaderSearch', null);
        $scope.readingResults = [];
        $scope.last_response_key = null;

        $scope.from = 0;
        $scope.hide_more_results_button = true;
        $scope.size = 10;
        $scope.number_of_results_shown = 0;

        $scope.CDNReadingsPathFP = CDNReadingsPathFP;

		var queue = new Firebase('https://bookreadings.firebaseio.com/search');
	    function search(index, type, searchTerm, from, size, callback) {

	       // post search requests to https://<INSTANCE>.firebaseio.com/search/request
			var search_query = {
				"sort" : [
			        "_score"
			    ],
				"query": {
			        "query_string": {
			            "query": searchTerm,
			        },
			    },
			    "size": size,
			    "from": from,
			};

		    var requestFirebase = new Firebase('https://bookreadings.firebaseio.com/search/request/')
		    var requestRef = $firebase(requestFirebase);

	        requestRef.$push({ index: index, type: type, query: search_query}).then(function(ref){

	        	var request_name = ref.name();
			    var responseFirebase = new Firebase('https://bookreadings.firebaseio.com/search/response/' + request_name);
			    var responseRef = $firebase(responseFirebase);

			    var responseObject = responseRef.$asObject();
			    var unwatch = responseObject.$watch(function(data){
		          if( data !== null ) {     // wait for data
			    	 load_response_object(responseObject, callback, unwatch);
		          }

			    });

	       }, function(err) {
	       	   console.log(err);
			});
	    }

	    function load_response_object(responseObject, callback, unwatch) {

	    	responseObject.$loaded().then(function(){
	    		console.log(responseObject);
	    		if(responseObject.total != null) {
	    			unwatch();
	    			callback(responseObject);
	    		}
	    	});

	    }

	    $scope.show_more_results = function() {

		    // invoke a search for *foo*
		    $scope.from = $scope.from + $scope.size;

		    search('firebase', 'reading', $scope.searchterm, $scope.from, $scope.size, parse_results);

	    }

	    // invoke a search for *foo*
	    search('firebase', 'reading', $scope.searchterm, $scope.from, $scope.size, parse_results);

	    function parse_results(data) {

	    	if(data.$id != $scope.last_response_key && data.hits && data.hits.length > 0) {

		    	$scope.last_response_key = data.$id;
		    	$scope.number_of_results = data.total;

		    	$scope.number_of_results_shown = $scope.number_of_results_shown + data.hits.length
		    	if($scope.number_of_results_shown == $scope.number_of_results) {
		    		$scope.hide_more_results_button = true;
		    	} else {
		    		$scope.hide_more_results_button = false;
		    	}

		        console.log('got back '+data.total+' hits');
		        if( data.hits ) {
		           data.hits.forEach(function(hit) {

				        var readingFirebase = new Firebase(readingsURL + "/" + hit._id);
				        var readingRef = $firebase(readingFirebase);

				        var readingRecord = readingRef.$asObject();
				        add_reading_to_page(readingRecord);

                        var readingStatsRef = new Firebase(readingsStatsURL + "/" + readingRecord.$id);
                        var _readingStatsObject = $firebase(readingStatsRef).$asObject();

                        getLikePlayCommmentCounts(readingRecord, _readingStatsObject);

		           });
		        }
		     } else {

		     	$scope.number_of_results = 0;

		     }

	    };

        function getLikePlayCommmentCounts(reading, readingStatsObject) {

            if(readingStatsObject) {

                readingStatsObject.$loaded().then(function(){

		              if($scope.readingProperties[reading.$id] == null) {
		                $scope.readingProperties[reading.$id] = {};
		              }

                    $scope.readingProperties[reading.$id].comment_count = readingStatsObject.comment_count;
                    $scope.readingProperties[reading.$id].like_count = readingStatsObject.like_count;
                    $scope.readingProperties[reading.$id].play_count = readingStatsObject.play_count;

                });
            }

        }

	    function add_reading_to_page(readingRecord) {

	        readingRecord.$loaded().then(function() {

	            var time = moment(readingRecord.created);
	            var timeSince = time.fromNow();
	            readingRecord["timeSince"] = timeSince;

	        	console.log(readingRecord);

	        	$scope.readingResults.push(readingRecord);

	        });
		}

    });
