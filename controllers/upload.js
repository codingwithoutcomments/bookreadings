angular.module("bookreadings")
	.constant("readingsURL", "https://bookreadings.firebaseio.com/readings")
	.controller("uploadCtrl", function ($scope, $firebase, $http, $location, readingsURL) {

		filepicker.setKey("AnUQHeKNRfmAfXkR3vaRpz");

		$scope.readingsRef = new Firebase(readingsURL);

		$scope.upload_audio_file = function(readingsRef){

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
			        		"url" : InkBlobs[i].url,
			        		"filename" : InkBlobs[i].filename,
			        		"mimetype" : InkBlobs[i].mimetype,
			        		"size" : InkBlobs[i].size,
			        		"key" : InkBlobs[i].key
			        	}

			        	var uploaded_file_ref = readingsRef.push();
			        	uploaded_file_ref.set(reading);
			        	$scope.uploaded_file_ref = uploaded_file_ref
			        }

			});

		};

	});