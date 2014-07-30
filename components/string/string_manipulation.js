angular.module("string_manipulation", [])
.factory("string_manipulation", function() {

	return {
		slugify: function(Text)
		{
		    return Text
		        .toLowerCase()
		        .replace(/[^\w ]+/g,'')
		        .replace(/ +/g,'-')
		        ;
		}
	}
})