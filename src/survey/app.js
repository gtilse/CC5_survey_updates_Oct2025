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
  var AdditionalQuestion = function(heading,subHeading,type,options){

    var self = this;
    this.heading = ko.observable(heading);
    this.subHeading = ko.observable(subHeading);
    this.type = ko.observable(parseInt(type));
    this.options = options ? ko.observableArray(options) : ko.observableArray([]);
    this.textInput = ko.observable('');
    this.singleSelectionValue = ko.observable('');
    this.multipleSelectionValue = ko.observableArray([]);

  }

  var viewModel = {

    id: null,
    score: null,
    surveyType: null,
    socialLinksActivated: false,
    _additionalQuestions: [],

    // View states
    // 0: Error
    // 1: Loading
    // 2: Ready
    viewState: ko.observable(1),

    // 1: Comments
    // 2: Additional questions
    // 3: Social links
    // 4: Feedback completed
    // 5: Bot protection
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
    addHowToImproveQuestion: ko.observable(false),
    addHowToImproveQuestion2: ko.observable(false),
    howToImproveQuestionText: ko.observable(''),
    howToImproveQuestion2Text: ko.observable(''),
    howToImproveComments: ko.observable(''),
    howToImproveComments2: ko.observable(''),

    scoreObs: ko.observable(10),
    webSurveyLink: ko.observable(''),

    // Staffs
    staffSelectList: ko.observableArray([]),
    selectedStaff: ko.observable(null),

    // Additional questions array
    additionalQuestions: ko.observableArray([]),
    additionalQuestionsText: ko.observable(''),

    // Loyalty drivers
    loyaltyDriversHeading: ko.observable(''),
    loyaltyDriversOptions: ko.observableArray([]),
    loyaltyDriversMultipleSelectionValue: ko.observableArray([]),
    
    // functions
    validSurveyType: function(surveyType){
      return (surveyType==="CLI" || surveyType==="GP" || surveyType==="STA" || surveyType==="PUL" || surveyType==="MGR") ? true : false;
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

    getManagers: function(data){
      return $.ajax({
          url: _apiPath + "surveyManagers",
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
          // if(this.comments().trim().length === 0) {
          //   $("#lblInvalidFeedback").show();
          //   $("#txtFeedback").focus();
          //   return;
          // }

          $button.addClass("disabled");
          this.saveSurveyFeedback({ id: this.id, prop: prop, comments: this.comments(),
            "useCommentsAsTestimonial":this.allowTestimonial()?1:0,
            howToImproveComments: this.howToImproveComments(), howToImproveComments2: this.howToImproveComments2(),
            loyaltyDrivers: this.loyaltyDriversMultipleSelectionValue ? ko.toJSON(this.loyaltyDriversMultipleSelectionValue) : [] }).then(function(response){

            $button.removeClass("disabled");

            if(self.additionalQuestions().length){
              self.wizardState(2);
            }

            else if(self.socialLinksActivated) {
              self.wizardState(3);
            }

            else {
              self.wizardState(4);
            }
          },function(error){
            $button.removeClass("disabled");
            alert("Sorry, could not save your feedback as our servers might be busy. Please click the Submit Feedback button again.")
          })

          break;

        case "ADDITIONAL_QUESTIONS":

          if(self.surveyType == "MGR" && !self.selectedStaff()){
            bootbox.alert({
                message: "Please select a manager",
                size: 'small'
            });
            window.scrollTo(0,0);
            return;
          }

          $button.addClass("disabled");

          this.saveSurveyFeedback({ id: this.id, prop: prop, staffId: self.selectedStaff(), additionalQuestions: ko.toJSON(this.additionalQuestions) }).then(function(response){

            $button.removeClass("disabled");

            // Check if manager survey, ask another feedback
            if(self.surveyType == "MGR"){

              bootbox.confirm({
                  message: "Your feedback has been saved. Would you like to enter feedback for another Manager?",
                  buttons: {
                      confirm: {
                          label: 'Yes'
                      },
                      cancel: {
                          label: 'No'
                      }
                  },
                  callback: function (result) {
                    if(result){
                      self.selectedStaff(null);
                      self.additionalQuestions([]);
                      $.each(self._additionalQuestions,function(index,value){
                        self.additionalQuestions.push(new AdditionalQuestion(value.heading,value.subHeading,value.type,value.options));
                      });
                    } else {
                      self.wizardState(4);
                    }
                  }
              });

              return;

            } else {
              //
              if(self.socialLinksActivated) {
                self.wizardState(3);
              }

              else {
                self.wizardState(4);
              }
            }


          },function(error){
            $button.removeClass("disabled");
            alert("Sorry, could not save your feedback as our servers might be busy. Please click the Submit Feedback button again.")
          })

          break;

        default:

      }
    },

    callButtonClick: function(prop,e) {
      console.log(prop);

      // Save the score
      viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"score":viewModel.score,"prop":"SCORE"}).then(function(response){
        viewModel.wizardState(1);
        if(prop) {
          viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"prop":"CALL_REQUEST", "callRequest": prop});
        }
      },function(err){
        viewModel.viewState(0);
      });
     
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
            case "CLI":
            case "STA":
              if($.isNumeric(viewModel.score) && viewModel.score >=0 && viewModel.score <=10){
                
                if(viewModel.surveyType === "CLI" && viewModel.score <= 6) {
                  viewModel.scoreObs(viewModel.score);
                  viewModel.webSurveyLink("https://clientculture.net/survey/survey.php?id=" + viewModel.id + "&type=CLI")
                  viewModel.wizardState(5);
                  viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"prop":"BOT_VIEW"});
                  deferred.resolve();

                } else {
                  // Save feedback
                  viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"score":viewModel.score,"prop":"SCORE"}).then(function(response){
                    viewModel.wizardState(1);
                    deferred.resolve();
                  },function(err){
                    deferred.reject(err);
                  });
                }
                
              } else {
                deferred.reject();
              }

              break;
            case "PUL":
              deferred.resolve();
              break;
            case "MGR":
              viewModel.getManagers({"surveyType":viewModel.surveyType,"id": viewModel.id}).then(function(response){
                viewModel.staffSelectList(response);
                deferred.resolve();
              },function(err){
                deferred.reject(err);
              });
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

          // Setup the additional questions, if any
          var additionalQuestions = viewModel._additionalQuestions = response.additionalQuestions ? JSON.parse(response.additionalQuestions) : [];
          $.each(additionalQuestions,function(index,value){
            viewModel.additionalQuestions.push(new AdditionalQuestion(value.heading,value.subHeading,value.type,value.options));
          })

          viewModel.additionalQuestionsText("Would you mind answering " + toWordsconver(viewModel.additionalQuestions().length) + " final question" + (viewModel.additionalQuestions().length > 1 ? "s" : ""));

          // Logo
          if(parseInt(response.addLogo)==1 && response.logo) {
            viewModel.vendorLogo(response.logo);
          }
          else {
            viewModel.vendorLogo(_appLogoFile);
          }

          // Add how to improve question
          viewModel.addHowToImproveQuestion(parseInt(response.addHowToImproveQuestion)?true:false);
          viewModel.addHowToImproveQuestion2(parseInt(response.addHowToImproveQuestion2)?true:false);
          viewModel.howToImproveQuestionText(response.howToImproveQuestionText || '');
          viewModel.howToImproveQuestion2Text(response.howToImproveQuestion2Text || '');

          // Temporary adjustment
          // Show additionalquestion2 if score >=8
          if(viewModel.addHowToImproveQuestion2() === true && viewModel.score < 8 ) {
            viewModel.addHowToImproveQuestion2(false);
          }
          // End temporary adjustment

          // Loyalty drivers
          if (response.loyaltyDrivers && JSON.parse(response.loyaltyDrivers).length) {
            viewModel.addHowToImproveQuestion(true);
            viewModel.howToImproveQuestionText(viewModel.score >= 9 ? 'How could we do even better? What improvements would you like us to make?' : 'How would you like us to improve?');

            $.each(JSON.parse(response.loyaltyDrivers),function(index,value){
              viewModel.loyaltyDriversOptions.push(value);
            });

            viewModel.loyaltyDriversHeading(viewModel.score >=9 ? 'What are the 3 most important reasons you’d recommend us?': 'What are the 3 most important areas <span class="font-500 text-underline">we need to improve</span> for you to be more likely to recommend us?');
            
          }

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

            viewModel.socialLinksActivated = viewModel.score >=9 && parseInt(response.displaySocialLinksInSurvey)==1 && (response.googlePage || response.facebookPage || response.truelocalPage);

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

          if(viewModel.surveyType === "CLI" || viewModel.surveyType === "STA"){
            // Score text
            viewModel.scoreText("Please tell us the primary reason for your score of " + String(viewModel.score));

          } else if(viewModel.surveyType === "PUL" || viewModel.surveyType === "MGR") {

            if(viewModel.surveyType=="MGR") $("#slStaff").toggle();

            viewModel.wizardState(2);
          }

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
