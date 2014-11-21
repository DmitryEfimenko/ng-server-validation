ng-server-validation
====================

Provides easy hooks for server side validation on AngularJs apps.

Set of directives to ease up displaying of the server side validation errors to the user.

Originally built to handle bad response from the ASP.NET MVC API assuming that the ModelState object was passed.

Though it can be adopted in any server side technology given that the bad validation response will return an object of the same structure as MVC's ModelState object.

In case server adds a ModelState error with a property name that does not have a corresponding input, the error will be placed under `formName.$serverErrors.propertyName` (see example below)

Installation:
-------------
*Reference module in your app*
```
angular.module('app', ['server-validate']);
```

Example:
-------------

**ASP.NET MVC API Action Result:**
```
// 1-st parameter: the name of the input that is being invalidated
// 2-nd parameter: the name of the error parameter to invalidate (note: not the error message!)
ModelState.AddModelError("email", "wrongEmailFormat");
ModelState.AddModelError("general", "generalError"); // the 'general' property does not have a corresponding input
return BadRequest(ModelState);
```

**index.html:**
```
<form name="myForm" ng-submit="submitMyForm()" server-validate novalidate>
    <input type="text" name="email" ng-model="email" required>
    <div ng-messages="myForm.email.$error" ng-show="myForm.email.$dirty">
        <div ng-message="required">Email address is required</div>
        <div ng-message="server_wrongEmailFormat">This email address is incorrect</div>
    </div>
    <div ng-messages="myForm.$serverErrors.general">
        <div ng-message="server_generalError">Server is completely broke!</div>
    </div>
    <button type="submit">Submit</button>
</form>
```

**index.js - inside Controller:**
```
$scope.submitMyForm = function() {
  $http.post('/api/Email/Add', { email: $scope.email }).then(
    function(response) {
      no errors - do whatever you need to do
    },
    function(error) {
      $scope.modelState = error.data.modelState;
    }
  );
}
```
