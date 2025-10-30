+function($,undefined) {

    // Global vars
    var _appConfig = null;
    var _apiPath = "../api/root.php/";
    var _appConfigFile = "../assets/config.json";
    var _loadingImageFile = "../assets/images/app-logo.png";
    var _appLogoFile = "../assets/images/app-logo.png";
  
    // Get url vars
    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
  
  
    // KnockoutJS
    var viewModel = {
  
      id: null,
      score: null,
      surveyType: null,
  
      // View states
      // 0: Error
      // 1: Loading
      // 2: Ready
      viewState: ko.observable(1),
  
      // 1: Comments
      // 2: Feedback completed
      wizardState: ko.observable(1),
  
      // Observables
      pageTitle: ko.observable(''),
      loadingImageFile: ko.observable(''),
      companyName: ko.observable(''),
      companyWebsite: ko.observable(''),
      supportEmailAddress: ko.observable(''),
      vendorLogo: ko.observable(''),
      triageComment1: ko.observable(''),
      triageComment2: ko.observable(''),
  
      // functions
      validSurveyType: function(surveyType){
        return (surveyType==="TRI") ? true : false;
      },
  
      saveSurveyFeedback: function(data){
        return $.ajax({
            url: _apiPath + "saveTriageFeedback",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type:"POST",
            data:JSON.stringify(data)
        });
      },
  
      submitButtonClick: function(prop,e){
  
        var $button = $(e.target);
        var self = this;
  
        switch (prop) {
          case "SCORE":
  
            break;
  
          case "COMMENT":
  
            $button.addClass("disabled");
            this.saveSurveyFeedback({ id: this.id, prop: prop, triageComment1: this.triageComment1(), triageComment2: this.triageComment2()}).then(function(response){
            
              $button.removeClass("disabled");
              self.wizardState(2);

            },function(error){
              $button.removeClass("disabled");
              alert("Sorry, could not save your feedback as our servers might be busy. Please click the Submit Feedback button again.")
            })
  
            break;
  
          default:
              break;
  
        }
      }
    }
  
    // Fetch app config
    $.getJSON(_appConfigFile, function( data ) {
  
      _appConfig = data;
  
      // document ready func
      $(function() {
  
        //
        ko.applyBindings(viewModel,document.getElementById("htmlDocument"));
  
        //
        viewModel.pageTitle(_appConfig.company.name + " | " + "Thank you for your feedback");
  
        // app logo
        viewModel.loadingImageFile(_loadingImageFile);
  
        // footer links
        viewModel.companyName(_appConfig.company.name);
        viewModel.companyWebsite(_appConfig.company.website);
        viewModel.supportEmailAddress(_appConfig.company.supportEmail);
  
        // Read URL vars
        var urlVars = getUrlVars();
        viewModel.id = urlVars["id"];
        viewModel.score = parseInt(urlVars["score"]);
        viewModel.surveyType = urlVars["type"];
  
        if(viewModel.id && viewModel.validSurveyType(viewModel.surveyType)) {
  
          var deferred = $.Deferred();
  
          (function(){
            switch(viewModel.surveyType){
              case "TRI":
                if($.isNumeric(viewModel.score) && viewModel.score >=0 && viewModel.score <=10){
                  viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"score":viewModel.score,"prop":"SCORE"}).then(function(response){
                    deferred.resolve();
                  },function(err){
                    deferred.reject(err);
                  });
                } else {
                  deferred.reject();
                }
  
                break;
              
              default:
                break;
            }
  
            return deferred.promise();
  
          })().then(function(response){
            // get survey info
            return $.ajax({
              url: _apiPath + "surveyInfoForFeedback",
              dataType: "json",
              contentType: "application/json; charset=utf-8",
              type:"POST",
              data:JSON.stringify({"objectId": viewModel.id,"surveyType":viewModel.surveyType})
            })
          }).then(function(response){
  
            // Logo
            if(parseInt(response.addLogo)==1 && response.logo) {
              viewModel.vendorLogo(response.logo);
            }
            else {
              viewModel.vendorLogo(_appLogoFile);
            }
  
            // Set the view state
            viewModel.viewState(2);
            $("#txtTriageComment1").focus();
            // Check preview mode
            if(viewModel.id.substr(0,7)=="PREVIEW") $("#preview").toggle();
  
          },function(error){
            viewModel.viewState(0);
          })
  
        }
  
        else {  //incorrect URL params
          viewModel.viewState(0);
        }
      })
    });
  
  }(jQuery);
  