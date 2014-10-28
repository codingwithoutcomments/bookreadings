angular.module("bookreadings")
    .constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
    .constant("commentsURL", "https://bookreadings.firebaseio.com/comments")
    .constant("likesURL", "https://bookreadings.firebaseio.com/likes")
    .constant("usersURL", "https://bookreadings.firebaseio.com/users")
    .constant("firebaseURL", "https://bookreadings.firebaseio.com")
    .constant("S3ReadingsPath", "https://s3-us-west-2.amazonaws.com/bookreadings/")
    .controller("editCtrl", function ($scope, $firebase, $firebaseSimpleLogin, $http, $location, $routeParams, readingsURL, commentsURL, likesURL, usersURL, firebaseURL, S3ReadingsPath, string_manipulation) {

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
              $scope.updateReading.cover_image_url = $scope.reading.cover_image_url;
              $scope.updateReading.cover_image_filename = $scope.reading.cover_image_filename;
              $scope.updateReading.cover_image_mimetype = $scope.reading.cover_image_mimetype;
              $scope.updateReading.cover_image_size = $scope.reading.cover_image_size;
              $scope.updateReading.cover_image_key = $scope.reading.cover_image_key;

            }

        });

        $scope.cancelEdit = function(){
        	window.history.back();
        }


        $scope.updateReadingInformation = function(updateReading, readingRef) {

          var tags = updateReading.tags;
          var tag_array = [];
          for(var i = 0; i < tags.length; i++) {
            tag_array.push(tags[i].text);
          }

          var slug = string_manipulation.slugify(updateReading.title);
          var modified = Firebase.ServerValue.TIMESTAMP;

          var update_dictionary = {

            "cover_image_url": updateReading.cover_image_url,
            "cover_image_filename" : updateReading.cover_image_filename,
            "cover_image_mimetype" : updateReading.cover_image_mimetype,
            "cover_image_size" : updateReading.cover_image_size,
            "cover_image_key" : updateReading.cover_image_key,
            "title"  : updateReading.title,
            "modified" : modified,
            "tags" : tag_array,
            "slug" : slug,
          }

          if(updateReading.description) {
            update_dictionary["description"] = updateReading.description;
          }

          if(updateReading.purchaseLink) {
            update_dictionary["purchaseLink"] = updateReading.purchaseLink;
          }

          readingRef.$update(update_dictionary).then(function(ref){

              var path = "reading/" + ref.name() + "/" + slug;
              $location.path(path);

          });

        }

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

