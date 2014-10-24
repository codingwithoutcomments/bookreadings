angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("commentsURL", "https://bookreadings.firebaseio.com/comments")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("editCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath) {

    	//check if user is authorized -- otherwise forward to home page
        $scope.reading_id = $routeParams.id;
        $scope.reading_deleted = false;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        $scope.readingRef = $firebase(readingFirebase);

        var readingRecord = $scope.readingRef.$asObject();
        readingRecord.$loaded().then(function() {

            if(readingRecord.deleted == true) {

              $scope.reading_deleted = true;

            } else {

              $scope.reading = readingRecord

              $scope.updateReading = {};
              $scope.updateReading.title = $scope.reading.title;
              $scope.updateReading.description = $scope.reading.description;
              $scope.updateReading.tags = $scope.reading.tags;

            }

        });

       });

