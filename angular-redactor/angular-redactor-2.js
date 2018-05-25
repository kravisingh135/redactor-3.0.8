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
                scope: {      
                    allowedTagsByUser: '=tags',              
                    getName: '&'
                },
                link: function(scope, element, attrs, ngModel) {

                    // Expose scope var with loaded state of Redactor
                    scope.redactorLoaded = false;

                    var updateModel = function updateModel(value) {
                            // $timeout to avoid $digest collision
                            $timeout(function() {
                                scope.$apply(function() {
                                    console.log("value", value);
                                    ngModel.$setViewValue(value);
                                });
                            });
                        },
                        options = {
                            callbacks: {
                                change: updateModel,
                                upload: {
                                    beforeSend: function(xhr)
                                    {                                        
                                        xhr.setRequestHeader('authtoken', 'bltb5b09fd76c3aa743');
                                        xhr.setRequestHeader('api_key', 'blt564311023f09ceae');
                                    }
                                }
                            },
                            multipleUpload: false,
                            getName: scope.getName(),
                            // imageUpload: function(formData, files, event)
                            // {
                            //     // ... your process for uploading an image ...
                            //     //  in the end, you must return JSON or a string with the image URL
                            //     // return json;
                            //     // or
                            //     console.log("formData, files, event", formData, files, event); 
                            //     var formData = new FormData(files[0]); // Currently empty

                            //     //formData.append("name", "asset[upload]", "about.PNG")   
                            //     var xhr = new XMLHttpRequest();
                            //     xhr.open('POST', 'https://app.contentstack.com/v3/assets?authtoken=blt4a692f9f234b867e&api_key=blt564311023f09ceae', true);
                            //     xhr.onload = function(e) {
                            //        console.log('yay its done');
                            //        return '/images/my-image.jpg';
                            //     };

                            //     xhr.send(formData);
                                
                            // }
                            imageUpload: 'https://stag-app.contentstack.com/v3/assets',
                            imageUploadParam: 'asset[upload]',
                            imageData: {
                                "asset[title]": "my image",
                                "asset[description]": 'desc'
                            },
                            imageManagerJson: 'https://stag-app.contentstack.com/v3/assets/images?authtoken=bltb5b09fd76c3aa743&api_key=blt564311023f09ceae'

                            
                            // imageManagerJson: {
                            //     "thumb": "/image-thumbnail-url/1.jpg",
                            //     "url": "/image-url/1.jpg",
                            //     "id": "img1",
                            //     "title": "Image 1"
                            // },
                            // imageUpload: function(formData, files, event)
                            // {
                            //     console.log("formData, files, event", files);    
                            //     // var imgSrc = JSON.stringify(files);
                            //     var imgSrc = files;
                            //     console.log('imgSrc', imgSrc);
                            //     return imgSrc;
                            // },
                            // imageManagerJson: {                                
                            //     "url": imgSrc.name,                                
                            //     "title": imgSrc.name
                            // }

                        },
                        additionalOptions = attrs.redactor ?
                            scope.$eval(attrs.redactor) : {},
                        editor;

                    angular.extend(options, redactorOptions, additionalOptions);

                    // put in timeout to avoid $digest collision.  call render()
                    // to set the initial value.
                    $timeout(function() {
                        // editor = element.redactor(options);
                        // console.log('element --', element[0]);
                        editor = $R(element[0], options);
                        ngModel.$render();
                        element.on('remove',function(){
                            console.log("test....");
                            element.off('remove');
                            element.redactor('core.destroy');
                        });
                    });

                    ngModel.$render = function() {
                        if(angular.isDefined(editor)) {
                            $timeout(function() {
                                // element.redactor('code.set', ngModel.$viewValue || '');
                                scope.redactorLoaded = true;
                            });
                        }
                    };
                }
            };
        }]);
})();