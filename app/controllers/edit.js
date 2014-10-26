angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("commentsURL", "https://bookreadings.firebaseio.com/comments")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("editCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath) {

      filepicker.setKey("AnUQHeKNRfmAfXkR3vaRpz");

    	//check if user is authorized -- otherwise forward to home page
        $scope.reading_id = $routeParams.id;
        $scope.reading_deleted = false;

        var readingFirebase = new Firebase(readingsURL + "/" + $scope.reading_id);
        $scope.readingRef = $firebase(readingFirebase);

        var readingRecord = $scope.readingRef.$asObject();
        readingRecord.$loaded().then(function() {

            if(readingRecord.deleted == true) {

                $location.path("/");

            } else {

              $scope.reading = readingRecord

              $scope.updateReading = {};
              $scope.updateReading.title = $scope.reading.title;
              $scope.updateReading.description = $scope.reading.description;
              $scope.updateReading.tags = $scope.reading.tags;
              $scope.updateReading.reading_cover_photo = $scope.reading.cover_image_url;
              $scope.updateReading.purchaseLink = $scope.reading.purchaseLink;

            }

        });

        $scope.upload_cover_image = function(updateReading){

          filepicker.pickAndStore(
            {
              extensions: ['.jpg, .png, .jpeg'],
            },
                {
                  location:"S3",
                  path: 'cover_images/',
                },
                function(InkBlobs){

                  var reading = updateReading

                  for(var i = 0; i < InkBlobs.length; i++) {

                    reading["cover_image_url"] = InkBlobs[i].url;
                    reading["cover_image_filename"] = InkBlobs[i].filename;
                    reading["cover_image_mimetype"] = InkBlobs[i].mimetype;
                    reading["cover_image_size"] = InkBlobs[i].size;
                    reading["cover_image_key"] = InkBlobs[i].key;

                    //var uploaded_file_ref = readingsRef.push();
                    //uploaded_file_ref.set(reading);
                    $scope.$apply(function(){

                      $scope.updateReading = reading
                      updateReading.reading_cover_photo = InkBlobs[i].url
                    });

                  }

          });
      }

 });

