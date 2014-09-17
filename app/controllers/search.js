angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .controller("searchCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, S3ReadingsPath) {

        $scope.searchterm = $routeParams.searchterm;

		var queue = new Firebase('https://bookreadings.firebaseio.com/search');
	    function search(index, type, searchTerm, callback) {
	       // post search requests to https://<INSTANCE>.firebaseio.com/search/request
			var search_query = {"query": {
		        "query_string": {
		            "query": searchTerm,
		        }
		    }};

	       var reqRef = queue.child('request').push({ index: index, type: type, query: search_query});
	       // read the replies from https://bookreadings.firebaseio.com/search/response
	       queue.child('response/'+reqRef.name()).on('value', function fn(snap) {
	          if( snap.val() !== null ) {     // wait for data
	             snap.ref().off('value', fn); // stop listening
	             snap.ref().remove();         // clear the queue
	             callback(snap.val());
	          }
	       });
	    }
	    // invoke a search for *foo*
	    search('firebase', 'reading', $scope.searchterm, function(data) {
	        console.log('got back '+data.total+' hits');
	        if( data.hits ) {
	           data.hits.forEach(function(hit) {
	              console.log(hit);
	           });
	        }
	    });

    });
