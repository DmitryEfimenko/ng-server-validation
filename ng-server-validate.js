'use strict';

/*
  * Source: https://github.com/DmitryEfimenko/ng-server-validation
  * Set of directives to ease up displaying of the server side validation errors to the user
  * Originally built to handle bad response from the ASP.NET MVC API assuming that the ModelState object was passed.
  * However it can be adopted in any server side technology given that the bad validation response will return
  * an object of the same structure as MVC's ModelState object.
  * In case server adds a ModelState error with a property name that does not have a corresponding input,
  * the error will be placed under `formName.$serverErrors.propertyName`
  *
  * Example:
  * ASP.NET MVC API Action Result:
  * ModelState.AddModelError("email", "wrongEmailFormat");
  * ModelState.AddModelError("general", "generalError"); // the 'general' property does not have a corresponding input
  * return BadRequest(ModelState);
  *
  * index.html:
  * <form name="myForm" ng-submit="submitMyForm()" server-validate novalidate>
  *     <input type="text" name="email" ng-model="email" required>
  *     <div ng-messages="myForm.email.$error" ng-show="myForm.email.$dirty">
  *         <div ng-message="required">Email address is required</div>
  *         <div ng-message="wrongEmailFormat">This email address is incorrect</div>
  *     </div>
  *     <div ng-messages="myForm.$serverErrors.general" ng-show="myForm.email.$dirty">
  *         <div ng-message="generalError">Server is completely broke!</div>
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

angular.module('server-validate', [])
    .service('serverValidateService', [function () {
        var watchingFieldNames = [];
        var self = this;

        self.clearServerError = function (form, fieldName) {
            if (form[fieldName]) {
                for (var errorFieldName in form[fieldName].$error) {
                    if (form[fieldName].$error.hasOwnProperty(errorFieldName)) {
                        form[fieldName].$setValidity(errorFieldName, true);
                    }
                }
                // make sure that clearing server side validation does not interfere with client side validation:
                form[fieldName].$validate();
            }
            var fieldNameIndex = watchingFieldNames.indexOf(fieldName);
            if (fieldNameIndex > -1) watchingFieldNames.splice(fieldNameIndex, 1);
        };

        self.clearServerErrors = function (form) {
            for (var i = 0, l = watchingFieldNames.length; i < l; i++) {
                self.clearServerError(form, watchingFieldNames[i]);
            }
        };

        self.watchOnce = function (form, fieldName) {
            watchingFieldNames.push(fieldName);

            form[fieldName].$viewChangeListeners.push(addChangeListener);

            function addChangeListener() {
                self.clearServerError(form, fieldName);
                var listenerIndex = form[fieldName].$viewChangeListeners.indexOf(addChangeListener);
                if (listenerIndex > -1)
                    form[fieldName].$viewChangeListeners.splice(listenerIndex, 1);
            }
        };

        self.addError = function (form, fieldName, validationProperty) {
            if (form[fieldName]) {
                form[fieldName].$setValidity(validationProperty, false);
                self.watchOnce(form, fieldName);
            } else {
                console.log('error on serverValidateService.setServerValidity(): there is no input with name="' + fieldName + '" in the form');
            }
        };
    }])
    .directive('serverValidate', ['serverValidateService',
        function (serverValidateService) {
            return {
                restrict: 'A',
                require: 'form',
                link: function ($scope, $elem, $attrs, $form) {

                    var errorFormat = $attrs.serverValidate;
                    $form.$serverErrors = {};

                    $scope.$watch('modelState', function () {
                        // clear all modelState errors from form
                        serverValidateService.clearServerErrors($form);

                        var foundErrors = false;

                        if ($scope.modelState) {
                            if (errorFormat && errorFormat == 'Microsoft.Owin') {
                                // expecting server response like: { error: '[inputName]', error_description: '[errorType]' }
                                // example: { error: 'password', error_description: 'invalid' }

                                foundErrors = true;
                                var inputName = $scope.modelState.error;
                                var errorType = $scope.modelState.error_description;

                                if ($form[inputName]) {
                                    $form[inputName].$dirty = true;
                                    $form[inputName].$pristine = false;
                                    $form[inputName].$setValidity(errorType, false);
                                    serverValidateService.watchOnce($form, inputName);
                                } else {
                                    if (!$form.$serverErrors[inputName]) $form.$serverErrors[inputName] = {};
                                    $form.$serverErrors[inputName][errorType] = true;
                                    angular.element($elem).on('submit', clearGeneralServerErrors);
                                }

                            } else {
                                // expecting server response like: { '[inputName1]': ['[errorType1]', '[errorType2]'], '[inputName2]': ['[errorType3]', '[errorType4]'], ... }
                                // example: { password: ['invalid', 'maxlength'], email: ['required'] }
                                for (var fieldName in $scope.modelState) {
                                    if ($scope.modelState.hasOwnProperty(fieldName)) {
                                        foundErrors = true;

                                        if ($form[fieldName]) {
                                            $form[fieldName].$dirty = true;
                                            $form[fieldName].$pristine = false;
                                            for (var i = 0, l = $scope.modelState[fieldName].length; i < l; i++) {
                                                $form[fieldName].$setValidity($scope.modelState[fieldName][i], false);
                                            }
                                            serverValidateService.watchOnce($form, fieldName);
                                        } else {
                                            // there is no input associated with provided fieldName
                                            if (!$form.$serverErrors[fieldName]) $form.$serverErrors[fieldName] = {};
                                            for (var j = 0, jl = $scope.modelState[fieldName].length; j < jl; j++) {
                                                $form.$serverErrors[fieldName][$scope.modelState[fieldName][j]] = true;
                                            }

                                            angular.element($elem).on('submit', clearGeneralServerErrors);
                                        }
                                    }
                                }
                            }
                        } else {
                            clearGeneralServerErrors();
                        }

                        if (foundErrors)
                            $form.$setDirty();
                    });

                    function clearGeneralServerErrors() {
                        $form.$serverErrors = {};
                        angular.element($elem).off('submit', clearGeneralServerErrors);
                    }
                }
            };
        }
    ]);
