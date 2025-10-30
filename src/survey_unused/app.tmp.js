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

    // Staffs
    staffSelectList: ko.observableArray([]),
    selectedStaff: ko.observable(null),

    // Additional questions array
    additionalQuestions: ko.observableArray([]),

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
          if(this.comments().trim().length === 0) {
            $("#lblInvalidFeedback").show();
            $("#txtFeedback").focus();
            return;
          }

          $button.addClass("disabled");
          this.saveSurveyFeedback({ id: this.id, prop: prop, comments: this.comments(),"useCommentsAsTestimonial":this.allowTestimonial()?1:0 }).then(function(response){

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
                viewModel.saveSurveyFeedback({"surveyType":viewModel.surveyType,"id": viewModel.id,"score":viewModel.score,"prop":"SCORE"}).then(function(response){
                  deferred.resolve();
                },function(err){
                  deferred.reject(err);
                });
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

          // Logo
          if(parseInt(response.addLogo)==1 && response.logo) {
            viewModel.vendorLogo(response.logo);
          }
          else {
            viewModel.vendorLogo(_appLogoFile);
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
            viewModel.scoreText("Please tell us why you chose score " + String(viewModel.score) + "...");

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
