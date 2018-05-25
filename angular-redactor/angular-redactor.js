(function() {
    'use strict';

    /**
     * usage: <textarea ng-model="content" redactor></textarea>
     *
     *    additional options:
     *      redactor: hash (pass in a redactor options hash)
     *
     */

    var redactorOptions = {};

    angular.module('angular-redactor', [])
        .constant('redactorOptions', redactorOptions)
        .directive('redactor', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function(scope, element, attrs, ngModel) {
                    // Expose scope var with loaded state of Redactor
                    // scope.redactorLoaded = false;
                        var updateModel = function updateModel(value) {
                            // $timeout to avoid $digest collision
                            $timeout(function() {
                                scope.$apply(function() {
                                    ngModel.$setViewValue(value); 
                                });
                            });
                        },
                        options = {
                            buttonSource: true,
                            buttons: ['html', 'bold', 'italic', 'underline', 'deleted','lists','Align' ,'format','Style','Line','link','horizontalrule','image','Video'],
                            callbacks: {
                                change: updateModel
                            }
                        },
                        additionalOptions = attrs.redactor ?
                            scope.$eval(attrs.redactor) : {},
                        editor;
                        var $_element = $(angular.element(element));
                    angular.extend(options, additionalOptions);
                    $timeout(function () {
                        editor = $_element.redactor(options);
                        ngModel.$render();
                    });
                    ngModel.$render = function() {
                        if(angular.isDefined(editor)) {
                            $timeout(function() {
                                element.redactor('code.set', ngModel.$viewValue || '');
                                scope.redactorLoaded = true;
                            });
                        }
                    };
                    console.log(additionalOptions);

                    // put in timeout to avoid $digest collision.  call render() to
                    // set the initial value.
                    // $timeout(function() {
                    //     editor = element.redactor(options);
                    //     ngModel.$render();
                    //     element.on('remove',function(){
                    //         element.off('remove');
                    //         element.redactor('core.destroy');
                    //     });
                    // });
                }
            };
        }]);
})();

