<?php

require "../api/common.php";

$isError = false;
$isPreviewMode = false;

if (isset($_GET['id']) && isset($_GET['type']) && ($_GET['type']=="CLI" || $_GET['type']=="STA" || $_GET['type']=="PUL" || $_GET['type']=="TRI")) {

  $emailHtml;
  $surveyId;

  $clientName = "";
  $clientId = $_GET['clientId'];
  
  try {
    $surveyId = $_GET['id'];
    $surveyType = $_GET['type'];
    
    // App configuration setting
    $appConfig = json_decode(file_get_contents("../assets/config.json"),true);

    // Setup the template to display
    $conn = Util::createConnection();

    if($surveyType=="CLI" || $surveyType == "PUL" || $surveyType == "TRI"){

      if(substr($surveyId,0,7)==="PREVIEW"){
        $isPreviewMode = true;
        $sid = substr($surveyId,8);

        if($clientId) {

          $q = $conn->query("SELECT Survey.*, " .
                          "(SELECT Client.name FROM Client WHERE objectId = " . $conn->quote($clientId) . ") AS name, " .
                          "(SELECT Client.title FROM Client WHERE objectId = " . $conn->quote($clientId) . ") AS clientTitle, " .
                          "(SELECT CONCAT(User.firstName, ' ',User.lastName) as drlName FROM Client INNER JOIN User ON Client.drl=User.objectId WHERE Client.objectId = " . $conn->quote($clientId) . ") AS drlName, " .
                          "'000000' as clientId," .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey INNER JOIN Vendor ON Survey.vendorId = Vendor.objectId " .
                          "WHERE Survey.objectId = " . $conn->quote($sid));


        } else {
          $q = $conn->query("SELECT Survey.*, '{{CLIENTNAME}}' as name, '000000' as clientId, '{{CLIENTCONTACT}}' as drlName, '' as clientTitle," .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey INNER JOIN Vendor ON Survey.vendorId = Vendor.objectId " .
                          "WHERE Survey.objectId = " . $conn->quote($sid));
        }
        
      } else {
        $q = $conn->query("SELECT Survey.*, Client.name, Client.objectId as clientId, Client.title as clientTitle, CONCAT(User.firstName, ' ',User.lastName) as drlName, " .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey_Log INNER JOIN Survey ON Survey_Log.surveyId = Survey.objectId " .
                          "INNER JOIN Client ON Survey_Log.clientId = Client.objectId INNER JOIN User ON Client.drl = User.objectId " .
                          "INNER JOIN Vendor ON Survey_Log.vendorId = Vendor.objectId " .
                          "WHERE Survey_Log.objectId = " . $conn->quote($surveyId));
      }

      if($q !== false && $q->rowCount() > 0 && ($survey = $q->fetch(PDO::FETCH_ASSOC))!=false) {
          $nameArr = explode(" ",$survey["name"]);
          $clientName = $nameArr[0];

          if($surveyType == "CLI") {
            $emailTemplate = file_get_contents(__DIR__ ."/email_template_reminder.html");
          } else if($surveyType == "PUL") {
            $emailTemplate = file_get_contents(__DIR__ ."/email_template2.html");
          } else { // Triage
            $emailTemplate = file_get_contents(__DIR__ ."/email_template_triage.html");
          }

          //$emailTemplate = ($surveyType == "CLI" ? file_get_contents(__DIR__ ."/email_template_reminder.html") : file_get_contents(__DIR__ ."/email_template2.html"));
          $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$survey["surveyHtml"],$emailTemplate);
          $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}",UNSUBSCRIBE_LINK,$emailTemplate);
          $emailTemplate = str_ireplace("{{WEB_LINK}}","",$emailTemplate);
          $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
          $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
          $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
          $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);

          if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $survey["vendorId"] . "/" . $survey["organisationLogo"])) {    //insert logo into email
            $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
            "<img alt='Logo' style='margin-bottom:25px;max-width:300px' src='" . FULL_PATH_UPLOAD_DIR . $survey["vendorId"] . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
          }

          else {
            $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
          }
          $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

          if(isset($survey["clientTitle"]) && trim($survey["clientTitle"]) !== "") $nameArr[0] = $survey["clientTitle"] . " " . $nameArr[0];
          
          $emailTemplate = str_ireplace("{{ClientName}}",$nameArr[0],$emailTemplate);
          
          $emailTemplate = str_ireplace("{{ClientFullName}}",$survey["name"],$emailTemplate);
          
          $emailTemplate = str_ireplace("{{OBJECTID}}",$surveyId,$emailTemplate);
          $emailTemplate = str_ireplace("{{ClientContact}}",$survey["drlName"],$emailTemplate);
          $emailTemplate = str_ireplace("{{CONTACTID}}",$survey["clientId"],$emailTemplate);

          // Customization
          $customization = null;
          if (isset($survey["customization"])) {
            $customization = json_decode($survey["customization"], true);
            if (is_array($customization) && isset($customization["leftScoreLabel"]) && isset($customization["rightScoreLabel"])) {
              $emailTemplate = str_ireplace("{{LEFT_SCORE_LABEL}}", $customization["leftScoreLabel"], $emailTemplate);
              $emailTemplate = str_ireplace("{{RIGHT_SCORE_LABEL}}", $customization["rightScoreLabel"], $emailTemplate);
            }
          }

          $emailTemplate = str_ireplace("{{LEFT_SCORE_LABEL}}","Least Likely",$emailTemplate);
          $emailTemplate = str_ireplace("{{RIGHT_SCORE_LABEL}}","Most Likely",$emailTemplate);
      }

      else {
        $isError = true;

      }
    } else {  // Staff survey

      if(substr($surveyId,0,7)==="PREVIEW"){
        $isPreviewMode = true;
        $sid = substr($surveyId,8);
        $q = $conn->query("SELECT Survey.*, '000000' as staffId, '{{STAFFNAME}}' as staffName, " .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey INNER JOIN Vendor ON Survey.vendorId = Vendor.objectId " .
                          "WHERE Survey.objectId = " . $conn->quote($sid));

      } else {
        $q = $conn->query("SELECT Survey.*, User.objectId as staffId, CONCAT(User.firstName, ' ',User.lastName) as staffName, " .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey_Log INNER JOIN Survey ON Survey_Log.surveyId = Survey.objectId " .
                          "INNER JOIN User ON Survey_Log.staffId = User.objectId " .
                          "INNER JOIN Vendor ON Survey_Log.vendorId = Vendor.objectId " .
                          "WHERE Survey_Log.objectId = " . $conn->quote($surveyId));
      }


      if($q !== false && $q->rowCount() > 0 && ($survey = $q->fetch(PDO::FETCH_ASSOC))!=false) {

        $nameArr = explode(" ",$survey["staffName"]);
        $staffName = $nameArr[0];

        $emailTemplate = ($surveyType == "STA" ? file_get_contents(__DIR__ ."/email_template_reminder.html") : file_get_contents(__DIR__ ."/email_template2.html")) ;
        $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$survey["surveyHtml"],$emailTemplate);
        $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}","",$emailTemplate);
        $emailTemplate = str_ireplace("{{WEB_LINK}}","",$emailTemplate);
        $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
        $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
        $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
        $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);

        if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $survey["vendorId"] . "/" . $survey["organisationLogo"])) {    //insert logo into email
          $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
          "<img alt='Logo' style='margin-bottom:25px;max-width:300px' src='" . FULL_PATH_UPLOAD_DIR . $survey["vendorId"] . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
        }

        else {
          $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
        }
        $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

        $emailTemplate = str_ireplace("{{STAFFNAME}}",$staffName,$emailTemplate);
        $emailTemplate = str_ireplace("{{OBJECTID}}",$surveyId,$emailTemplate);
        $emailTemplate = str_ireplace("{{CONTACTID}}",$survey["staffId"],$emailTemplate);

      } else {
        $isError = true;
      }

    }

  }

  catch(Exception $e) {
    
    $isError = true;
  }

}

else {
  $isError = true;
}

?>

<?php if($isError==true) { ?>
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>Invalid request</title>
    </head>
    <body><h2>Invalid request. Please contact support</h2></body>
  </html>
<?php } else {
    echo $emailTemplate;
  }
?>
