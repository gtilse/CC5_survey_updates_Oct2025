+function($,undefined) {

var _phpPostURL = "./db.php";

var app = angular.module("klientKultureAdmin",["ui.bootstrap","ngNotify"]);

app.factory("App",["$http","$q","ngNotify","$location",function($http,$q,ngNotify,$location){
  return {
    showNotification: function(options) {
      ngNotify.set(options.message, {
          type: options.type || 'info',
          position: options.position || 'bottom',
          sticky: options.sticky || false,
          duration: options.duration || 3000

      });
    }
  }
}]);

app.filter("timeStampFormat",function(){
  return function(input, format) {

    if(!input) return "";

    format = format || "DD/MM/YYYY HH:mm A";
    return moment.utc(input).local().format(format);    //local time
  }
});

// Password comparison directive
app.directive("compareTo",function(){
  return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.otherModelValue;
            };

            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    }
});

// Admin controller
app.controller("adminCtrl",["$scope","$q","$http","$uibModal","App",function($scope,$q,$http,$uibModal,App){

  $scope.vendors = [];
  $scope.appLogs = [];
  $scope.exceptions = [];
  $scope.selectedVendor = null;

  // Fetch data from backend for admin console
  $scope.loadData = function() {
    $scope.isLoading = true;
    $http({"method":"POST","url": _phpPostURL,"data":{"ACTION":"GETADMINCONSOLE"}}).then(function(response){
      $scope.isLoading = false;
      $scope.vendors = response.data.vendors;
      $scope.appLogs = response.data.appLog;
      $scope.exceptions = response.data.exceptionLog;
    },function(response){
      $scope.isLoading = false;
    })


  }

  $scope.loadData();

  // Edit organisation info
  $scope.editOrganisation = function(data) {

    var selectedRecord = $.grep($scope.vendors, function (vendor) {
      return vendor.objectId == data.objectId;
    });

    $scope.selectedVendor = selectedRecord[0];

    var modalInstance = $uibModal.open({
      animation: false,
      backdrop: 'static',
      templateUrl: './vendor-edit-modal.html',
      controller: 'vendorModalInstanceCtrl',
      resolve: {
        data: $scope.selectedVendor
      }
    });

    modalInstance.result.then(function(response) {
      $.extend($scope.selectedVendor, response.data);
      App.showNotification({type:"info",message:"Organisation info saved"});
    });

  }

}]);

// Vendor edit modal
app.controller("vendorModalInstanceCtrl",["App","$scope","$http","$uibModalInstance","data",function(App,$scope,$http,$uibModalInstance,data){

  $scope.isBusy = false;

  $scope.vendorModel = {
    objectId: null,
    active: null,
    trial: null,
    surveyEmailFrom: null,
    name: null,
    _formSubmitted: false
  }

  $scope.vendorModel.objectId = data.objectId;
  $scope.vendorModel.active = parseInt(data.active);
  $scope.vendorModel.trial = parseInt(data.trial);
  $scope.vendorModel.name = data.name;
  $scope.vendorModel.surveyEmailFrom = data.surveyEmailFrom;

  // Save record
  $scope.saveRecord = function(event) {
    $scope.vendorModel._formSubmitted = true;
    if (!$scope.vendorModel._form.$valid) return;

    $scope.isBusy = true;
    $http({"method":"POST","url": _phpPostURL,
           "data": {"ACTION":"MODIFYVENDORINFO","record":{objectId:$scope.vendorModel.objectId,active:$scope.vendorModel.active,trial:$scope.vendorModel.trial,surveyEmailFrom:$scope.vendorModel.surveyEmailFrom}}})
    .then(function(response){
      $scope.isBusy = false;
      $uibModalInstance.close({data:{active:$scope.vendorModel.active.toString(),trial:$scope.vendorModel.trial.toString(),surveyEmailFrom:$scope.vendorModel.surveyEmailFrom} });
    },function(response){
      $scope.isBusy = false;
      App.showNotification({type:"error",message:"Error saving record. Try again later"});
    });

  }

  // Close modal
  $scope.cancel = function(event) {
    $uibModalInstance.dismiss();
  }


}]);

} (jQuery);
