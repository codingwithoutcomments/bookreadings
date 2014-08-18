angular.module("bookreadings")
	.constant("firebaseURL", "https://bookreadings.firebaseio.com")
	.constant("firebaseAuthenticatedURL", "https://bookreadings.firebaseio.com/.info/authenticated")
	.controller("bookreadingsCtrl", function ($scope, $firebase, $http, $location, $firebaseSimpleLogin, firebaseURL, firebaseAuthenticatedURL) {

		var firebaseRef = new Firebase(firebaseURL);
	    $scope.loginObj = $firebaseSimpleLogin(firebaseRef);

		var authRef = new Firebase(firebaseAuthenticatedURL);
			authRef.on("value", function(snap) {
			  if (snap.val() === true) {
			  	//if logged in, then silently log in the user via facebook


			  } else {
			  }
		});

		$scope.socialLogin = function() {

			$scope.loginObj.$login("facebook", {
				rememberMe: true, 
				scope: 'email'
			}).then(function(user) {

				var userFirebase = new Firebase(firebaseURL + "/users/" + user.uid);
		        var userRef = $firebase(userFirebase);

		        var userRecord = userRef.$asObject();
		        userRecord.$loaded().then(function () {

		        	if(userRecord.displayName) {

				    	//user exists
					    $scope.user = userRecord;

					 } else {

				    	var newUser = {}
				    	newUser["displayName"] = user.displayName;
				    	newUser["provider"] = user.provider;
				    	newUser["provider_id"] = user.id;
				    	newUser["email"] = user.thirdPartyUserData.email;

				    	if(user.provider == "facebook") {
					    	var isSilhouette = user.thirdPartyUserData.picture.data.is_silhouette;
					    	if(isSilhouette == false) {
					    		newUser["profile_picture"] = user.thirdPartyUserData.picture.data.url;
					    	}
					    }

					    this.newUser = newUser;
					    firebaseRef.child('users').child(user.uid).set(newUser, function(error){
					    	if(!error) {
					    		console.log("New User logged in using facebook");
							    $scope.user = newUser;
					    	}
					    });
					 }
				});
			});

		}

	});