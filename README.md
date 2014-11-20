ng-server-validation
====================

Provides easy hooks for server side validation on AngularJs apps.
Set of directives to ease up displaying of the server side validation errors to the user
Originally built to handle bad response from the ASP.NET MVC API assuming that the ModelState object was passed.
However it can be adopted in any server side technology given that the bad validation response will return
an object of the same structure as MVC's ModelState object.

Example:

**ASP.NET MVC API Action Result:**
```
ModelState.AddModelError("email", "wrongEmailFormat");
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
