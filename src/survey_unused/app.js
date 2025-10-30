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
      // 2: Feedback complete/display social links/link to loyalty driver/link to custom question
      wizardState: ko.observable(1),
  
      // Observables
      pageTitle: ko.observable(''),
      loadingImageFile: ko.observable(''),
      companyName: ko.observable(''),
      companyWebsite: ko.observable(''),
      supportEmailAddress: ko.observable(''),
      vendorLogo: ko.observable(''),
      googleLink: ko.observable(''),
      facebookLink: ko.observable(''),
      truelocalLink: ko.observable(''),
      testimonial: ko.observable(''),
      allowTestimonial: ko.observable(false),
      scoreText: ko.observable(''),
      comments: ko.observable(''),
      addHowToImproveQuestion: ko.observable(''),
      howToImproveComments: ko.observable(''),
      loyaltyDriversCount: ko.observable(''),
      customQuestionsCount: ko.observable(''),
      socialLinksActivated: ko.observable(false),
  
      // functions
      validSurveyType: function(surveyType){
        return (surveyType==="CLI" || surveyType==="GP" || surveyType==="STA" || surveyType==="PUL" || surveyType==="MGR" || surveyType==="PRO") ? true : false;
      },
  
      saveSurveyFeedback: function(data){
        return $.ajax({
            url: _apiPath + "saveSurveyFeedback",
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
  
            // validation
            if(this.comments().trim().length === 0) {
              $("#lblInvalidFeedback").show();
              $("#txtFeedback").focus();
              return;
            }
  
            $button.addClass("disabled");
            this.saveSurveyFeedback({ id: this.id, prop: prop, comments: this.comments(), 
                howToImproveComments: this.howToImproveComments(),
                "useCommentsAsTestimonial":this.allowTestimonial()?1:0 }).then(function(response){
  
              $button.removeClass("disabled");
              
              // Display the completion view
              if(viewModel.loyaltyDriversCount() > 0) {
                var customQuestions = viewModel.customQuestionsCount() ? 1 : 0;
                window.location.href = "loyaltydrivers.html?id=" + viewModel.id + "&type=" + viewModel.surveyType + "&customquestions=" + customQuestions;
              } else if(viewModel.customQuestionsCount() > 0) {
                window.location.href = "customquestions.html?id=" + viewModel.id + "&type=" + viewModel.surveyType
              } else {
                self.wizardState(2);
              }
              

            },function(error){
              $button.removeClass("disabled");
              alert("Sorry, could not save your feedback as our servers might be busy. Please click the Submit Feedback button again.")
            })
  
            break;
  
          default:
  
        }
      }
    }
  
    // Fetch app config
    // Starts on page load
    $.getJSON(_appConfigFile, function( data ) {
  
      _appConfig = data;
  
      // document ready func
      $(function() {
  
        // Bind viewModel to htmlDocument
        ko.applyBindings(viewModel,document.getElementById("htmlDocument"));
  
        // Page title
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

            // If survey type is Pulse or Manager then redirect to Custom Questions page
            if(viewModel.surveyType === 'MGR' || viewModel.surveyType === 'PUL') {
                window.location.replace("customquestions.html?id=" + viewModel.id + "&type=" + viewModel.type);
                return;
            }

            // Save score to backend
            if($.isNumeric(viewModel.score) && viewModel.score >=0 && viewModel.score <=10){
                viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"score":viewModel.score,"prop":"SCORE"}).then(function(response){
                  deferred.resolve();
                },function(err){
                  deferred.reject(err);
                });
              } else {
                deferred.reject();
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
  
            // Get loyalty driver and custom questions count
            viewModel.loyaltyDriversCount(parseInt(response.loyaltyDriversCount));
            viewModel.customQuestionsCount(parseInt(response.customQuestionsCount));
            
            // Logo
            if(parseInt(response.addLogo)==1 && response.logo) {
              viewModel.vendorLogo(response.logo);
            }
            else {
              viewModel.vendorLogo(_appLogoFile);
            }

            // How to improve comments
            viewModel.addHowToImproveQuestion(parseInt(response.addHowToImproveQuestion)?true:false);
  
            // Additional customisations for Client surveys
            if(viewModel.surveyType === "CLI"){
              // add href for social pages
              if(response.googlePage) {
                viewModel.googleLink(response.googlePage);
              }
              if(response.facebookPage) {
                viewModel.facebookLink(response.facebookPage);
              }
  
              if(response.truelocalPage) {
                viewModel.truelocalLink(response.truelocalPage);
              }
  
              viewModel.socialLinksActivated(viewModel.score >=9 && parseInt(response.displaySocialLinksInSurvey)==1 && (response.googlePage || response.facebookPage || response.truelocalPage));
  
              // testimonial
              if(viewModel.score >=9 && parseInt(response.testimonialType)>0){
  
                switch (parseInt(response.testimonialType)) {
                  case 1:
                    viewModel.testimonial("We would not publish your name");
                    break;
                  case 2:
                    viewModel.testimonial("We would only publish your first name and the first letter of your surname eg. Jenny H");
                    break;
                  case 3:
                    viewModel.testimonial("Please note we may publish your name alongside your comment");
                    break;
                  default:
  
                }
              }
  
            }
  
            // Score text
            viewModel.scoreText("Please tell us why you chose score " + String(viewModel.score) + "...");
  
            // Set the view state
            viewModel.viewState(2);
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
  