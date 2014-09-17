angular.module("bookreadings")
	.constant("firebaseURL", "https://bookreadings.firebaseio.com")
	.constant("firebaseAuthenticatedURL", "https://bookreadings.firebaseio.com/.info/authenticated")
	.controller("bookreadingsCtrl", function ($scope, $rootScope, $firebase, $http, $location, $firebaseSimpleLogin, firebaseURL, firebaseAuthenticatedURL) {

		var firebaseRef = new Firebase(firebaseURL);
	    $scope.loginObj = $firebaseSimpleLogin(firebaseRef);

        $scope.loginObj.$getCurrentUser().then(function(user) {

        	if(user){

				var userFirebase = new Firebase(firebaseURL + "/users/" + user.uid);
		        var userRef = $firebase(userFirebase);

		        var userRecord = userRef.$asObject();
		        userRecord.$loaded().then(function () {

			    	//user exists
			    	setUser(userRecord);

				});

			} else {

		    	setUser(null);
			}
		});

		function setUser(user) {

			if(user) {

				//user exists
				$scope.user = user;
				$rootScope.user = user;
				$scope.firstName = user.displayName.split(' ')[0];
				$scope.profile_picture = "http://graph.facebook.com/" + $scope.user.provider_id + "/picture";

			} else {

				$scope.user = null;
				$rootScope.user = null;
				$scope.profile_picture = "";
			}

		}

		$scope.socialLogin = function() {

			$scope.loginObj.$login("facebook", {
				rememberMe: true, 
				scope: 'email'
			}).then(function(user) {

				var userFirebase = new Firebase(firebaseURL + "/users/" + user.uid);
		        var userRef = $firebase(userFirebase);

		        this.userRef = userRef;

		        var userRecord = userRef.$asObject();
		        userRecord.$loaded().then(function () {

		        	if(userRecord.displayName) {

				    	//user exists
				    	setUser(userRecord);

					 } else {

				    	var newUser = {}
				    	newUser["displayName"] = user.displayName;
				    	newUser["provider"] = user.provider;
				    	newUser["provider_id"] = user.id;
				    	newUser["email"] = user.thirdPartyUserData.email;

					    this.newUser = newUser;
					    this.userRef.$set(newUser).then(function(ref){

					    	setUser(userRecord);

					    });
					 }
				});
			});

		}

		$scope.logout = function() {
			$scope.loginObj.$logout();
			$location.path('/');
		}

		$scope.search = function(search){

			var path = "/search/" + search.searchterm;
        	$location.path(path);

		}

	});