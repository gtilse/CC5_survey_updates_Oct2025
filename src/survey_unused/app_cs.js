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

    var CustomQuestion = function(objectId, vendorId, customQuestionId, surveyId, heading, subHeading, type, options){
        
        this.objectId = ko.observable(objectId);
        this.vendorId = ko.observable(vendorId);
        this.customQuestionId = ko.observable(customQuestionId);
        this.surveyId = ko.observable(surveyId);
        this.heading = ko.observable(heading);
        this.subHeading = ko.observable(subHeading);
        this.type = ko.observable(parseInt(type));
        this.options = options ? ko.observableArray(options) : ko.observableArray([]);
        this.textInput = ko.observable('');
        this.selectionValues = ko.observableArray([]);
    
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
  
      // 1: Loyalty drivers view
      // 2: Feedback complete
      wizardState: ko.observable(1),
  
      // Observables
      pageTitle: ko.observable(''),
      loadingImageFile: ko.observable(''),
      companyName: ko.observable(''),
      companyWebsite: ko.observable(''),
      supportEmailAddress: ko.observable(''),
      vendorLogo: ko.observable(''),
      
      customQuestions: ko.observableArray([]),

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

        $button.addClass("disabled");
            this.saveSurveyFeedback({ id: this.id, prop: prop, customQuestions: ko.toJSON(this.customQuestions)}).then(function(response){
  
              $button.removeClass("disabled");
              viewModel.wizardState(2);

            },function(error){
              $button.removeClass("disabled");
              alert("Sorry, could not save your feedback as our servers might be busy. Please click the Submit Feedback button again.")
            });
        
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
  
            $.ajax({
                url: _apiPath + "surveyInfoForCustomQuestions",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type:"POST",
                data:JSON.stringify({"objectId": viewModel.id,"surveyType":viewModel.surveyType})
            }).then(function(response){
  
            // Setup the additional questions, if any
            var customQuestions = response.customQuestions ? response.customQuestions : [];
            $.each(customQuestions,function(index,value){
                var options = value.customQuestionList ? value.customQuestionList.split('++++') : [];
                viewModel.customQuestions.push(new CustomQuestion(value.objectId, value.vendorId, value.customQuestionId, value.surveyId, value.heading, value.subHeading, value.type, options));
            });

            // Logo
            if(parseInt(response.addLogo)==1 && response.logo) {
              viewModel.vendorLogo(response.logo);
            }
            else {
              viewModel.vendorLogo(_appLogoFile);
            }
            
            // Set the view state
            viewModel.viewState(2);

            // Check preview mode
            if(viewModel.id.substr(0,7)=="PREVIEW") $("#preview").toggle();

            // Button state keep active on click
            $(".btn-group > .btn").click(function(){
                $(this).addClass("active").siblings().removeClass("active");
            });
  
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
  