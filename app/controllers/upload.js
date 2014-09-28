var app = angular.module("bookreadings")
	.constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
	.constant("tagsURL", "https://bookreadings.firebaseio.com/tags")
	.controller("uploadCtrl", function ($scope, $firebase, $http, $location, readingsURL, tagsURL, string_manipulation) {

		$("#tags").tagsinput('items');

		filepicker.setKey("AnUQHeKNRfmAfXkR3vaRpz");

		$scope.reading_cover_photo = "http://placehold.it/950/950"

		$scope.addReading = function(newReading, reading) {

			this.reading["title"] = newReading.title
			this.reading["slug"] = string_manipulation.slugify(newReading.title)

			var description = null;
			if(newReading.description) {
				description = newReading.description
			}
			this.reading["description"] = description;

			var purchaseLink = null;
			if(newReading.purchaseLink) {
				purchaseLink = newReading.purchaseLink
			}
			this.reading["purchaseLink"] = purchaseLink;

			var tag_string = $("#tags").val();
			var tag_array = null;
			if(tag_string.length > 0) {
				tag_array = tag_string.split(',');
			}
			this.reading["tags"] = tag_array

			this.reading["created"] = Firebase.ServerValue.TIMESTAMP;
			this.reading["modified"] = Firebase.ServerValue.TIMESTAMP;

			var user = $scope.loginObj.user;
			this.reading["created_by"] = user.uid;
			this.reading["created_by_id"] = user.id;
			this.reading["created_by_name"] = user.displayName;

			//add counts
			this.reading["like_count"] = 0
			this.reading["play_count"] = 0
			this.reading["comment_count"] = 0
			this.reading["$priority"] = Firebase.ServerValue.TIMESTAMP


			var readingsRef = new Firebase(readingsURL);
			var _readingRef = $firebase(readingsRef).$asArray();
			_readingRef.$add(reading).then(function(ref){

				var singleReadingRef = new Firebase(readingsURL + "/" + ref.name());
				var _singleReadingRef = $firebase(singleReadingRef).$asObject();
				_singleReadingRef.$loaded().then(function() {

					var readingsByDateCreatedRef = new Firebase("https://bookreadings.firebaseio.com/readingsByDateCreated");
					var _readingsByDateCreatedRef = $firebase(readingsByDateCreatedRef).$asArray();

					var data = {}
					data["reading_id"] = ref.name();
					data["$priority"] = -_singleReadingRef.$priority;

					this.reading_id = ref.name();

					_readingsByDateCreatedRef.$add(data).then(function(ref) {

			        	var path = "reading/" + this.reading_id + "/" + reading.slug;
			        	$location.path(path);

					});

		        });

			});
		}

        function getFirebaseTagReference(tagsURL, tag_name, tag_id) {

          var tagFirebase = new Firebase(tagsURL + "/" + tag_name + "/" + tag_id);
          return $firebase(tagFirebase);

        }

		$scope.upload_audio_file = function(){

			filepicker.pickAndStore(
				{
					extension: '.mp3',
				},
		        {
		        	location:"S3",
		        	path: 'readings/',
		        },
		        function(InkBlobs){

		        	for(var i = 0; i < InkBlobs.length; i++) {

			        	reading = {
			        		"audio_url" : InkBlobs[i].url,
			        		"audio_filename" : InkBlobs[i].filename,
			        		"audio_mimetype" : InkBlobs[i].mimetype,
			        		"audio_size" : InkBlobs[i].size,
			        		"audio_key" : encodeURIComponent(InkBlobs[i].key)
			        	}

			        	//var uploaded_file_ref = readingsRef.push();
			        	//uploaded_file_ref.set(reading);
			        	$scope.$apply(function(){

				        	$scope.reading = reading

				        	$scope.data = {}
				        	$scope.data.audioUploaded = true;
				        	$scope.newReading = {}
				        	var audio_filename = reading.audio_filename;
				        	audio_filename = audio_filename.replace(/_/g, " ");
				        	audio_filename = audio_filename.replace(/\.[^/.]+$/, "");
				        	$scope.newReading.title = audio_filename;

			        	});

			        }

			});

		};

		$scope.upload_cover_image = function(reading){

			this.reading = reading

			filepicker.pickAndStore(
				{
					extensions: ['.jpg, .png, .jpeg'],
				},
		        {
		        	location:"S3",
		        	path: 'cover_images/',
		        },
		        function(InkBlobs){

		        	var reading = this.reading

		        	for(var i = 0; i < InkBlobs.length; i++) {

			        	reading["cover_image_url"] = InkBlobs[i].url;
			        	reading["cover_image_filename"] = InkBlobs[i].filename;
			        	reading["cover_image_mimetype"] = InkBlobs[i].mimetype;
			        	reading["cover_image_size"] = InkBlobs[i].size;
			        	reading["cover_image_key"] = InkBlobs[i].key;

			        	//var uploaded_file_ref = readingsRef.push();
			        	//uploaded_file_ref.set(reading);
			        	$scope.$apply(function(){

				        	$scope.reading = reading
				        	var filepicker = "https://www.filepicker.io/api/file/" + InkBlobs[i].key + "/convert?w=950&height=950"
				        	$scope.reading_cover_photo = InkBlobs[i].url
				        	$scope.reading_cover_photo_uploaded = true;
			        	});

			        }

			});

		};

	});
