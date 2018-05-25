(function(){
    'use strict';

    var app = angular.module('redactorDemo', [
        'angular-redactor'
    ]);
    app.controller('AppCtrl', AppController);

    AppController.$inject = ['$scope', '$location'];

    function AppController($scope, $location){
        var self = this,
            content;
        self.saveContent = function () {
            content = self.content;
            console.log("content", content);
            alert("content is "+ content);
        }
    }
    
})();