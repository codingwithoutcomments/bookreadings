angular.module("bookreadings")
    .constant("CDNReadingsPath", "https://d1onveq9178bu8.cloudfront.net")
	.controller("uploadCtrl", function ($scope, $rootScope, $firebase, $http, $location, ENV, readingsURL, tagsURL, string_manipulation, CDNReadingsPath, readingsStatsURL, readingsByDateCreatedURL, readingsByMostPlayedURL, tagsByPopularityURL) {

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
				purchaseLink = getPathFromUrl(newReading.purchaseLink);
			}
			this.reading["purchaseLink"] = purchaseLink;

			//TODO format tags correctly
			var tags = newReading.tags;
			var tag_array = [];
			for(var i = 0; i < tags.length; i++) {
				var tag_text = tags[i].text.replace('.', '').replace('#', '').replace('$', '').replace('[', '').replace(']', '');
				tag_array.push(tag_text);
			}

	          //remove non-unique names
	          var uniqueNames = [];
	          $.each(tag_array, function(i, el){
	              if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
	          });

	          tag_array = uniqueNames;
	          
			this.reading["tags"] = tag_array

			this.reading["created"] = Firebase.ServerValue.TIMESTAMP;
			this.reading["modified"] = Firebase.ServerValue.TIMESTAMP;

			var user = $scope.loginObj.user;
			var userObject = $rootScope.user;
			this.reading["created_by"] = user.uid;
			this.reading["created_by_id"] = user.id;
			this.reading["created_by_name"] = userObject.displayName;
			this.reading["align"] = "center";

			this.reading["$priority"] = Firebase.ServerValue.TIMESTAMP


			var readingsRef = new Firebase(ENV.firebase + readingsURL);
			var _readingRef = $firebase(readingsRef).$asArray();
			_readingRef.$add(reading).then(function(ref){

				//add counts to reading_stats
				reading_stats = {};
				reading_stats["like_count"] = 0
				reading_stats["play_count"] = 0
				reading_stats["comment_count"] = 0
				var readingStatsRef = new Firebase(ENV.firebase + readingsStatsURL);
				var _readingStatsRef = $firebase(readingStatsRef);
				_readingStatsRef.$set(ref.name(), reading_stats);

				//update created by 
				var singleReadingRef = new Firebase(ENV.firebase + readingsURL + "/" + ref.name());
				var _singleReadingRef = $firebase(singleReadingRef).$asObject();
				_singleReadingRef.$loaded().then(function() {

					var readingsByDateCreatedRef = new Firebase(ENV.firebase + readingsByDateCreatedURL);
					var _readingsByDateCreatedRef = $firebase(readingsByDateCreatedRef).$asArray();

					var data = {}
					var user = $scope.loginObj.user;
					data["created_by"] = user.uid
					data["reading_id"] = ref.name();
					data["$priority"] = -_singleReadingRef.$priority;

					this.reading_id = ref.name();
					this.reading_priority = -_singleReadingRef.$priority;
					this.reading_tags = _singleReadingRef.tags;

					_readingsByDateCreatedRef.$add(data).then(function(ref) {

						this.readingsByDateCreatedId = ref.name();

						var readingsByMostPlayedRef = new Firebase(ENV.firebase + readingsByMostPlayedURL);
						var _readingsByMostPlayedRef = $firebase(readingsByMostPlayedRef).$asArray();

						var data = {}
						var user = $scope.loginObj.user;
						data["created_by"] = user.uid
						data["reading_id"] = this.reading_id;
						data["$priority"] = 0;

						this.reading_id = this.reading_id;
						this.reading_priority = this.reading_priority;
						this.reading_tags = this.reading_tags;

						_readingsByMostPlayedRef.$add(data).then(function(ref) {

							this.readingByMostPlayedId = ref.name();

							update_dictionary = {};
							update_dictionary["readingsByDateCreatedId"]= readingsByDateCreatedId;
							update_dictionary["readingsByMostPlayedId"] = readingByMostPlayedId;
							$firebase(singleReadingRef).$update(update_dictionary).then(function(){

								var processed_tags = [];
								var user = $scope.loginObj.user;
								if(this.reading_tags) {

									for(var i = 0; i < this.reading_tags.length; i++) {

										//add tags to tag specific section
										var tagsRef = $scope.getFirebaseTagNameListReference(ENV.firebase + tagsURL, this.reading_tags[i]);
										$scope.add_tags_to_tag_specific_section(tagsRef, this.reading_id, user.uid, this.reading_priority, this.reading.tags.length, this.reading_tags[i], reading.slug, processed_tags);

									}

								} else {

						        	var path = "reading/" + this.reading_id + "/" + reading.slug;
						        	$location.path(path);

								}

							});

				        });

					});

		        });

			});
		}
		

		function getPathFromUrl(url) {
		  return url.split("?")[0];
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
			        		"audio_url" : InkBlobs[i].url.replace("https://www.filepicker.io", ""),
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

		$scope.upload_cover_image = function(reading, newReading){

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

			        	reading["cover_image_url"] = InkBlobs[i].url.replace("https://www.filepicker.io", "");
			        	reading["cover_image_filename"] = InkBlobs[i].filename;
			        	reading["cover_image_mimetype"] = InkBlobs[i].mimetype;
			        	reading["cover_image_size"] = InkBlobs[i].size;
			        	reading["cover_image_key"] = InkBlobs[i].key;

			        	//var uploaded_file_ref = readingsRef.push();
			        	//uploaded_file_ref.set(reading);
			        	$scope.$apply(function(){

				        	$scope.reading = reading
				        	var filepicker = "https://www.filepicker.io/api/file/" + InkBlobs[i].key + "/convert?w=950&height=950"
				        	$scope.reading_cover_photo = CDNReadingsPath + reading.cover_image_url;
				        	$scope.reading_cover_photo_uploaded = true;
				        	$scope.newReading.has_cover_photo = true;
			        	});

			        }

			});

		};

	});
