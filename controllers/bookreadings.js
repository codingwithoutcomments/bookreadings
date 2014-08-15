angular.module("bookreadings")
	.constant("firebaseURL", "https://bookreadings.firebaseio.com")
	.constant("firebaseAuthenticatedURL", "https://bookreadings.firebaseio.com/.info/authenticated")
	.controller("bookreadingsCtrl", function ($scope, $firebase, $http, $location, firebaseURL, firebaseAuthenticatedURL) {

		var authRef = new Firebase(firebaseAuthenticatedURL);
			authRef.on("value", function(snap) {
			  if (snap.val() === true) {
			  	//if logged in, then silently log in the user via facebook

			  	
			  } else {
			  	$scope.user = null;
			  }
		});

		$scope.socialLogin = function() {

			var firebaseRef = new Firebase(firebaseURL);
			var auth = new FirebaseSimpleLogin(firebaseRef, function(error, user) {

			  if (error) {
			    // an error occurred while attempting login
			    console.log(error);

			  } else if (user) {

			  	this.user = user;
			    firebaseRef.child('users').child(user.uid).once('value', function(snapshot) {

			    	var user = this.user;

				    var userExists = (snapshot.val() !== null);
				    if(userExists) {

			    		console.log("Existing user logged in");

				    	//user exists
					    $scope.user = snapshot.val();
					    $scope.$digest();

				    } else {

				    	var newUser = {}
				    	newUser["displayName"] = user.displayName;
				    	newUser["provider"] = user.provider;
				    	newUser["provider_id"] = user.id;
				    	newUser["email"] = user.thirdPartyUserData.email;

				    	if(user.provider == "facebook") {
					    	var isSilouette = user.thirdPartyUserData.picture.data.is_silouette;
					    	if(isSilouette == false) {
					    		newUser["profile_picture"] = user.thirdPartyUserData.picture.data.url;
					    	}
					    }

					    this.newUser = newUser;
					    firebaseRef.child('users').child(user.uid).set(newUser, function(error){
					    	if(!error) {
					    		console.log("New User logged in using facebook");
							    $scope.user = newUser;
							    $scope.$digest();
					    	}
					    });
				    }
				});

			  } else {

			  	$scope.user = null;
			  	$scope.$digest();
			    // user is logged out
			  }
			});

			auth.login('facebook', {rememberMe: true, scope: 'email'});
		}

	});