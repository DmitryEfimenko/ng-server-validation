'use strict';

/*
  * Set of directives to ease up displaying of the server side validation errors to the user
  * Originally built to handle bad response from the ASP.NET MVC API assuming that the ModelState object was passed.
  * However it can be adopted in any server side technology given that the bad validation response will return
  * an object of the same structure as MVC's ModelState object.
  *
  * Example:
  * ASP.NET MVC API Action Result:
  * ModelState.AddModelError("email", "wrongEmailFormat");
  * return BadRequest(ModelState);
  *
  * index.html:
  * <form name="myForm" ng-submit="submitMyForm()" server-validate novalidate>
  *     <input type="text" name="email" ng-model="email" required>
  *     <div ng-messages="myForm.email.$error" ng-show="myForm.email.$dirty">
  *         <div ng-message="required">Email address is required</div>
  *         <div ng-message="server_wrongEmailFormat">This email address is incorrect</div>
  *     </div>
  *     <button type="submit">Submit</button>
  * </form>
  *
  * index.js - inside Controller:
  * $scope.submitMyForm = function() {
  *     $http.post('/api/Email/Add', { email: $scope.email }).then(
  *         function(response) {
  *             // no errors - do whatever you need to do
  *         },
  *         function(error) {
  *             $scope.modelState = error.data.modelState;
  *         }
  *     );
  * }
*/

angular.module('app.directives')
    .directive('serverValidate', [
        function() {
            return {
                restrict: 'A',
                require: 'form',
                link: function($scope, $elem, $attrs, $form) {
                    var watchingProps = [];

                    $scope.$watch('modelState', function() {
                        // clear all modelState errors from form
                        clearServerErrors();

                        var foundErrors = false;

                        for (var property in $scope.modelState) {
                            if ($scope.modelState.hasOwnProperty(property)) {
                                foundErrors = true;

                                if ($form[property]) {
                                    $form[property].$dirty = true;
                                    $form[property].$pristine = false;
                                    for (var i = 0, l = $scope.modelState[property].length; i < l; i++) {
                                        $form[property].$setValidity('server_' + $scope.modelState[property][i], false);
                                    }
                                    watchOnce(property);
                                } else {
                                    // there is no input associated with provided property
                                    // TODO: not sure how to handle this scenario 
                                    // the problem is that submit button gets disabled if form is invalid
                                    // watchOnce() allows to set input valid if changed. However, in this case watchOnce cannot be applied, so the form will always be invalid

                                    //for (var j = 0, jl = $scope.modelState[property].length; j < jl; j++) {
                                    //    $form.$setValidity('server_' + $scope.modelState[property][j], false);
                                    //}
                                }
                            }
                        }
                        

                        if (foundErrors)
                            $form.$setDirty();
                    });

                    function watchOnce(property) {
                        watchingProps.push(property);
                        $form[property].$viewChangeListeners.push(addChangeListener);

                        function addChangeListener() {
                            clearServerError(property);
                            var listenerIndex = $form[property].$viewChangeListeners.indexOf(addChangeListener);
                            if (listenerIndex > -1)
                                $form[property].$viewChangeListeners.splice(listenerIndex, 1);
                        }
                    }

                    function clearServerError(property) {
                        if ($form[property]) {
                            for (var errorProperty in $form[property].$error) {
                                if ($form[property].$error.hasOwnProperty(errorProperty) && errorProperty.substring(0, 7) == 'server_') {
                                    $form[property].$setValidity(errorProperty, true);
                                }
                            }
                        }
                        var propertyIndex = watchingProps.indexOf(property);
                        if (propertyIndex > -1) watchingProps.splice(propertyIndex, 1);
                    }

                    function clearServerErrors() {
                        for (var i = 0, l = watchingProps.length; i < l; i++) {
                            clearServerError(watchingProps[i]);
                        }
                    }
                }
            };
        }
    ]);
    
