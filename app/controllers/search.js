angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .controller("searchCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, S3ReadingsPath) {

    	$scope.searchObject = {}

        $scope.searchterm = $routeParams.searchterm;
        $scope.searchObject.searchterm = $scope.searchterm;
        $scope.$emit('clearHeaderSearch', null);
        $scope.readingResults = [];

		var queue = new Firebase('https://bookreadings.firebaseio.com/search');
	    function search(index, type, searchTerm, callback) {
	       // post search requests to https://<INSTANCE>.firebaseio.com/search/request
			var search_query = {"query": {
		        "query_string": {
		            "query": searchTerm,
		        }
		    }};

		    var requestFirebase = new Firebase('https://bookreadings.firebaseio.com/search/request/')
		    var requestRef = $firebase(requestFirebase);

	        requestRef.$push({ index: index, type: type, query: search_query}).then(function(ref){

	        	var request_name = ref.name();
			    var responseFirebase = new Firebase('https://bookreadings.firebaseio.com/search/response/' + request_name);
			    var responseRef = $firebase(responseFirebase);

			    var responseObject = responseRef.$asObject();
			    responseObject.$bindTo($scope, "data").then(function(){
			          if( $scope.data !== null ) {     // wait for data
			          	 var objectValue = $scope.data;
			             callback(objectValue);
			             $scope.data = {};
			          }
			    });

	       }, function(err) {
	       	   console.log(err);
			});
	    }
	    // invoke a search for *foo*
	    search('firebase', 'reading', $scope.searchterm, function(data) {
	    	$scope.number_of_results = data.total;
	        console.log('got back '+data.total+' hits');
	        if( data.hits ) {
	           data.hits.forEach(function(hit) {

			        var readingFirebase = new Firebase(readingsURL + "/" + hit._id);
			        var readingRef = $firebase(readingFirebase);

			        var readingRecord = readingRef.$asObject();
			        add_reading_to_page(readingRecord);

	           });
	        }
	    });

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
