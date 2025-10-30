<?php


// Survey email routine
// All survey emails and reminders sent via this script

// Includes
require "../api/vendor/autoload.php";
require "../api/common.php";
require "../api/error_handler.php";


// Get config file
$_appConfig = json_decode(file_get_contents("../assets/config.json"),true);
// Use namespace
use Aws\Ses\SesClient;



// Get post request params
if (!isset($_SERVER["HTTP_HOST"])) {
  parse_str($argv[1], $_postData);
} else {
  $_postData = json_decode(file_get_contents("php://input"),true);
}

// ensure we have a valid request
if(!(isset($_postData)&& isset($_postData["surveyId"]) && isset($_postData["emailType"]) && isset($_postData["surveyType"]))) {
  echo "BAD REQUEST";
  die();
}

// AWS SES config
$sesClient = SesClient::factory(array(
    'version'=> 'latest',
    'region' => 'us-east-1',
    'credentials' => array('key'=>AWS_ACCESS_KEY_ID,'secret'=>AWS_SECRET_KEY)
));

// global vars
$_surveyId = $_postData["surveyId"];
$_emailType = intval($_postData["emailType"]);
$_surveyType = intval($_postData["surveyType"]);


// Call relevant survey send function
switch ($_surveyType) {
  case $SURVEY_TYPE["CLIENT"]:
    sendClientSurvey();
    break;
  case $SURVEY_TYPE["EMPLOYEE"]:
    sendEmployeeSurvey();
    break;
  case $SURVEY_TYPE["PULSE"];
    sendPulseSurvey();
    break;
  case $SURVEY_TYPE["MANAGER"];
    sendManagerSurvey();
    break;
  case $SURVEY_TYPE["GP"]:
    sendGPSurvey();
    break;

  default:
    die();
    break;
}

// Send Client Survey
function sendClientSurvey(){
  global $sesClient;
  $surveyId = $GLOBALS["_surveyId"];
  $appConfig = $GLOBALS["_appConfig"];
  $emailType = $GLOBALS["_emailType"];
  $surveyType = "CLI";
  $dateNow = date("Y-m-d H:i:s");
  $thisSendID = Util::createID();

  // Fetch Survey/Organisation settings
  $conn = Util::createConnection();
  // fetch Survey/Organisation/Settings
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail,Setting.socialMediaReminderDays FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.VendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorId = $survey["vendorId"];
  }

  else {
    trigger_error("Failed to fetch survey information", E_USER_ERROR);
  }

  if($emailType==$GLOBALS["EMAIL_TYPE"]["SURVEY"]) {         //Survey
    $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.title, Client.name, Client.organisation, Client.email, Client.drl," .
           "CONCAT(User.firstName, ' ',User.lastName) as drlName, Survey_Log.objectId as objectId  from Client INNER JOIN User ON Client.drl = User.objectId " .
           "INNER JOIN Survey_Log ON Client.objectId = Survey_Log.clientId WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Survey_Log.score IS NULL AND " .
           "Survey_Log.emailStatus=0 AND Survey_Log.sendDate IS NOT NULL AND DATE(Survey_Log.sendDate) = CURDATE() AND " .
           "Client.vendorId = '" . $vendorId . "' AND Survey_Log.surveyId=" . $conn->quote($survey["objectId"]) . " ORDER BY Client.name";
  }

  else {                      //Reminder
    $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.title, Client.name, Client.organisation, Client.email, Client.drl," .
           "CONCAT(User.firstName, ' ',User.lastName) as drlName, Survey_Log.objectId as objectId  from Client INNER JOIN User ON Client.drl = User.objectId " .
           "INNER JOIN Survey_Log ON Client.objectId = Survey_Log.clientId WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Survey_Log.score IS NULL AND " .
           "Survey_Log.emailStatus=2 AND Survey_Log.reminderSentOnDate IS NULL AND Survey_Log.reminderDate IS NOT NULL AND DATE(Survey_Log.reminderDate) = CURDATE() AND " .
           "Client.vendorId = '" . $vendorId . "' AND Survey_Log.surveyId=" . $conn->quote($survey["objectId"]) . " ORDER BY Client.name LIMIT 300";
  }

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt===false || $stmt->rowCount()===0) trigger_error("No records to email", E_USER_ERROR);

  // set the email default settings
  $sesReq = array();
  $sesReq["Source"] = "{$survey['organisationName']} <{$survey['surveyEmailFrom']}>";

  ///
  /// Email template global placeholder replacement
  ///

  $emailTemplate = file_get_contents(__DIR__ ."/email_template.html");

  // Email html
  if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {   //Survey

    $html = $survey["surveyHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);

    $sesReq['Message']['Subject']['Data'] = $survey["emailSubject"];
  }

  else {    //Reminder
    $html = $survey["reminderHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);
    $sesReq['Message']['Subject']['Data'] = $survey["emailSubjectReminder"];
  }

  // Unsubscribe link
  $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}",UNSUBSCRIBE_LINK,$emailTemplate);
  // Web link
  $emailTemplate = str_ireplace("{{WEB_LINK}}",WEB_LINK,$emailTemplate);
  // Web root
  $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
  // Survey type
  $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
  // Company name
  $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
  // Company website
  $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);

  // Logo
  if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"])) {    //insert logo into email
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
    "<img alt='Logo' width='300' style='margin-bottom:25px;width:100%;max-width:300px;height:auto' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
  }

  else {
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
  }
  // Organisation name
  $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

  // Loop through all clients and send emails
  while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if($row["vendorId"]===$vendorId && isset($row["name"]) && isset($row["email"]) && filter_var($row["email"], FILTER_VALIDATE_EMAIL)) {

      $objectId = $row["objectId"];
      $nameArr = explode(" ",$row["name"]);
      if(isset($row["title"]) && trim($row["title"]) !== "") $nameArr[0] = $row["title"] . " " . $nameArr[0];

      $sesReq['Destination']['ToAddresses'] = array("{$row['name']} <{$row['email']}>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tjdada@gmail.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tabraiz@outlook.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Greg Tilse <gtilse@klientkulture.com>");

      $emailBody = str_ireplace("{{ClientName}}",$nameArr[0],$emailTemplate);
      $emailBody = str_ireplace("{{OBJECTID}}",$objectId,$emailBody);
      $emailBody = str_ireplace("{{ClientContact}}",$row["drlName"],$emailBody);
      $emailBody = str_ireplace("{{CONTACTID}}",$row["clientId"],$emailBody);
      $emailBody = str_ireplace("{{UTRACK}}","<img alt='' src='" . $appConfig["company"]["appWebsite"] . "track_user.php?surveyid=$objectId' style='display: none' width='1' height='1' border='0'>",$emailBody);

      $sesReq['Message']['Body']['Html']['Data'] = $emailBody;
      $sesReq['Message']['Body']['Html']['Charset'] = "UTF-8";
      $sesReq['Message']['Body']['Text']['Data'] = "Please take out a few seconds to complete our online Survey \r\n" .
                                                   $appConfig["company"]["appWebsite"]. "survey/survey.php?id=$objectId?type=$surveyType";
      $sesReq['Message']['Body']['Text']['Charset'] = "UTF-8";

      try {
        $result = $sesClient->sendEmail($sesReq);
        $emailId = $result->get("MessageId");

        // Insert or update Survey_Log table depending on message type
        if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {

          $sql = $conn->prepare("UPDATE Survey_Log SET emailId = :emailId,sentOnId= :sentOnId,sentOnDate=:sentOnDate,emailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":sentOnId", $thisSendID);
          $sql->bindParam(":emailId", $emailId);
          $sql->bindParam(":sentOnDate", $dateNow);

        }

        else {
          $sql = $conn->prepare("UPDATE Survey_Log SET reminderEmailId = :reminderEmailId,reminderSentOnId= :reminderSentOnId,reminderSentOnDate=:reminderSentOnDate,reminderEmailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":reminderSentOnId", $thisSendID);
          $sql->bindParam(":reminderEmailId", $emailId);
          $sql->bindParam(":reminderSentOnDate", $dateNow);

        }

        $sql->execute();

      }

      catch(Exception $e) {
        //
      }

    }
  }   // While loop

  echo "Survey queued";

}

// Send Employee Survey
function sendEmployeeSurvey(){

  global $sesClient;
  $surveyId = $GLOBALS["_surveyId"];
  $appConfig = $GLOBALS["_appConfig"];
  $emailType = $GLOBALS["_emailType"];
  $surveyType = "STA";
  $dateNow = date("Y-m-d H:i:s");
  $thisSendID = Util::createID();

  // Fetch Survey/Organisation settings
  $conn = Util::createConnection();

  // fetch Survey/Organisation/Settings
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail,Setting.socialMediaReminderDays FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.VendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorId = $survey["vendorId"];
  }

  else {
    trigger_error("Failed to fetch survey information", E_USER_ERROR);
  }

  if($emailType==$GLOBALS["EMAIL_TYPE"]["SURVEY"]) {         //Survey

    $sql = "SELECT sl.objectId,sl.vendorId, CONCAT(u.firstName, ' ',u.lastName) as name, u.email FROM Survey_Log sl " .
           "INNER JOIN User u ON sl.staffId = u.objectId " .
           "WHERE sl.emailStatus=0 AND sl.sendDate IS NOT NULL AND DATE(sl.sendDate) = CURDATE() AND " .
           "sl.score IS NULL AND u.active=1 AND u.isDeleted=0 AND sl.vendorId='$vendorId' AND sl.surveyId='$surveyId' ORDER BY u.firstName";
  }

  else {                      //Reminder
    $sql = "SELECT sl.objectId,sl.vendorId, CONCAT(u.firstName, ' ',u.lastName) as name, u.email FROM Survey_Log sl " .
           "INNER JOIN User u ON sl.staffId = u.objectId " .
           "WHERE sl.emailStatus=2 AND sl.reminderDate IS NOT NULL AND DATE(sl.reminderDate) = CURDATE() AND " .
           "sl.score IS NULL AND u.active=1 AND u.isDeleted=0 AND sl.vendorId='$vendorId' AND sl.surveyId='$surveyId' ORDER BY u.firstName";
  }

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt===false || $stmt->rowCount()===0) trigger_error("No records to email", E_USER_ERROR);

  // set the email default settings
  $sesReq = array();
  $sesReq["Source"] = "{$survey['organisationName']} <{$survey['surveyEmailFrom']}>";

  ///
  /// Email template global placeholder replacement
  ///

  $emailTemplate = file_get_contents(__DIR__ ."/email_template.html");

  // Email html
  if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {   //Survey

    $html = $survey["surveyHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);

    $sesReq['Message']['Subject']['Data'] = $survey["emailSubject"];
  }

  else {    //Reminder
    $html = $survey["reminderHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);
    $sesReq['Message']['Subject']['Data'] = $survey["emailSubjectReminder"];
  }

  // Unsubscribe link
  $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}","",$emailTemplate);
  // Web link
  $emailTemplate = str_ireplace("{{WEB_LINK}}",WEB_LINK,$emailTemplate);
  // Web root
  $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
  // Survey type
  $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
  // Company name
  $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
  // Company website
  $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);


  // Logo
  if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"])) {    //insert logo into email
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
    "<img alt='Logo' width='300' style='margin-bottom:25px;width:100%;max-width:300px;height:auto' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
  }

  else {
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
  }
  // Organisation name
  $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

  // Loop through all clients and send emails
  while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if($row["vendorId"]===$vendorId && isset($row["name"]) && isset($row["email"]) && filter_var($row["email"], FILTER_VALIDATE_EMAIL)) {

      $objectId = $row["objectId"];
      $nameArr = explode(" ",$row["name"]);

      $sesReq['Destination']['ToAddresses'] = array("{$row['name']} <{$row['email']}>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tjdada@gmail.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tabraiz@outlook.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Greg Tilse <gtilse@klientkulture.com>");

      $emailBody = str_ireplace("{{STAFFNAME}}",$nameArr[0],$emailTemplate);
      $emailBody = str_ireplace("{{OBJECTID}}",$objectId,$emailBody);
      $emailBody = str_ireplace("{{CONTACTID}}",$row["objectId"],$emailBody);
      $sesReq['Message']['Body']['Html']['Data'] = $emailBody;
      $sesReq['Message']['Body']['Html']['Charset'] = "UTF-8";
      $sesReq['Message']['Body']['Text']['Data'] = "Please take out a few seconds to complete our online Survey \r\n" .
                                                   $appConfig["company"]["appWebsite"]. "survey/survey.php?id=$objectId?type=$surveyType";
      $sesReq['Message']['Body']['Text']['Charset'] = "UTF-8";

      try {
        $result = $sesClient->sendEmail($sesReq);
        $emailId = $result->get("MessageId");

        // Insert or update Survey_Log table depending on message type
        if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {

          $sql = $conn->prepare("UPDATE Survey_Log SET emailId = :emailId,sentOnId= :sentOnId,sentOnDate=:sentOnDate,emailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":sentOnId", $thisSendID);
          $sql->bindParam(":emailId", $emailId);
          $sql->bindParam(":sentOnDate", $dateNow);

        }

        else {
          $sql = $conn->prepare("UPDATE Survey_Log SET reminderEmailId = :reminderEmailId,reminderSentOnId= :reminderSentOnId,reminderSentOnDate=:reminderSentOnDate,reminderEmailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":reminderSentOnId", $thisSendID);
          $sql->bindParam(":reminderEmailId", $emailId);
          $sql->bindParam(":reminderSentOnDate", $dateNow);

        }

        $sql->execute();

      }

      catch(Exception $e) {
        //
      }

    }
  }   // While loop

  echo "Survey queued";
}

// Send GP Survey
function sendGPSurvey(){

}

// Send Pulse Survey
function sendPulseSurvey(){
  global $sesClient;
  $surveyId = $GLOBALS["_surveyId"];
  $appConfig = $GLOBALS["_appConfig"];
  $emailType = $GLOBALS["_emailType"];
  $surveyType = "PUL";
  $dateNow = date("Y-m-d H:i:s");
  $thisSendID = Util::createID();

  // Fetch Survey/Organisation settings
  $conn = Util::createConnection();
  // fetch Survey/Organisation/Settings
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail,Setting.socialMediaReminderDays FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.VendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorId = $survey["vendorId"];
  }

  else {
    trigger_error("Failed to fetch survey information", E_USER_ERROR);
  }

  if($emailType==$GLOBALS["EMAIL_TYPE"]["SURVEY"]) {         //Survey
    $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.title, Client.name, Client.organisation, Client.email, Client.drl," .
           "CONCAT(User.firstName, ' ',User.lastName) as drlName, Survey_Log.objectId as objectId  from Client INNER JOIN User ON Client.drl = User.objectId " .
           "INNER JOIN Survey_Log ON Client.objectId = Survey_Log.clientId WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Survey_Log.score IS NULL AND " .
           "Survey_Log.emailStatus=0 AND Survey_Log.sendDate IS NOT NULL AND DATE(Survey_Log.sendDate) = CURDATE() AND " .
           "Client.vendorId = '" . $vendorId . "' AND Survey_Log.surveyId=" . $conn->quote($survey["objectId"]) . " ORDER BY Client.name";
  }

  else {                      //Reminder
    $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.title, Client.name, Client.organisation, Client.email, Client.drl," .
           "CONCAT(User.firstName, ' ',User.lastName) as drlName, Survey_Log.objectId as objectId  from Client INNER JOIN User ON Client.drl = User.objectId " .
           "INNER JOIN Survey_Log ON Client.objectId = Survey_Log.clientId WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Survey_Log.score IS NULL AND " .
           "Survey_Log.emailStatus=2 AND Survey_Log.reminderSentOnDate IS NULL AND Survey_Log.reminderDate IS NOT NULL AND DATE(Survey_Log.reminderDate) = CURDATE() AND " .
           "Client.vendorId = '" . $vendorId . "' AND Survey_Log.surveyId=" . $conn->quote($survey["objectId"]) . " ORDER BY Client.name";
  }

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt===false || $stmt->rowCount()===0) trigger_error("No records to email", E_USER_ERROR);

  // set the email default settings
  $sesReq = array();
  $sesReq["Source"] = "{$survey['organisationName']} <{$survey['surveyEmailFrom']}>";

  ///
  /// Email template global placeholder replacement
  ///

  $emailTemplate = file_get_contents(__DIR__ ."/email_template2.html");

  // Email html
  if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {   //Survey

    $html = $survey["surveyHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);

    $sesReq['Message']['Subject']['Data'] = $survey["emailSubject"];
  }

  else {    //Reminder
    $html = $survey["reminderHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);
    $sesReq['Message']['Subject']['Data'] = $survey["emailSubjectReminder"];
  }

  // Unsubscribe link
  $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}",UNSUBSCRIBE_LINK,$emailTemplate);
  // Web link
  $emailTemplate = str_ireplace("{{WEB_LINK}}","",$emailTemplate);
  // Web root
  $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
  // Survey type
  $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
  // Company name
  $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
  // Company website
  $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);

  // Logo
  if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"])) {    //insert logo into email
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
    "<img alt='Logo' width='300' style='margin-bottom:25px;width:100%;max-width:300px;height:auto' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
  }

  else {
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
  }
  // Organisation name
  $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

  // Loop through all clients and send emails
  while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if($row["vendorId"]===$vendorId && isset($row["name"]) && isset($row["email"]) && filter_var($row["email"], FILTER_VALIDATE_EMAIL)) {

      $objectId = $row["objectId"];
      $nameArr = explode(" ",$row["name"]);
      if(isset($row["title"]) && trim($row["title"]) !== "") $nameArr[0] = $row["title"] . " " . $nameArr[0];

      $sesReq['Destination']['ToAddresses'] = array("{$row['name']} <{$row['email']}>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tjdada@gmail.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tabraiz@outlook.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Greg Tilse <gtilse@klientkulture.com>");

      $emailBody = str_ireplace("{{ClientName}}",$nameArr[0],$emailTemplate);
      $emailBody = str_ireplace("{{OBJECTID}}",$objectId,$emailBody);
      $emailBody = str_ireplace("{{ClientContact}}",$row["drlName"],$emailBody);
      $emailBody = str_ireplace("{{CONTACTID}}",$row["clientId"],$emailBody);
      $emailBody = str_ireplace("{{UTRACK}}","<img alt='' src='" . $appConfig["company"]["appWebsite"] . "track_user.php?surveyid=$objectId' style='display: none' width='1' height='1' border='0'>",$emailBody);

      $sesReq['Message']['Body']['Html']['Data'] = $emailBody;
      $sesReq['Message']['Body']['Html']['Charset'] = "UTF-8";
      $sesReq['Message']['Body']['Text']['Data'] = "Please take out a few seconds to complete our online Survey \r\n" .
                                                   $appConfig["company"]["appWebsite"]. "survey/survey.php?id=$objectId?type=$surveyType";
      $sesReq['Message']['Body']['Text']['Charset'] = "UTF-8";

      try {
        $result = $sesClient->sendEmail($sesReq);
        $emailId = $result->get("MessageId");

        // Insert or update Survey_Log table depending on message type
        if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {

          $sql = $conn->prepare("UPDATE Survey_Log SET emailId = :emailId,sentOnId= :sentOnId,sentOnDate=:sentOnDate,emailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":sentOnId", $thisSendID);
          $sql->bindParam(":emailId", $emailId);
          $sql->bindParam(":sentOnDate", $dateNow);

        }

        else {
          $sql = $conn->prepare("UPDATE Survey_Log SET reminderEmailId = :reminderEmailId,reminderSentOnId= :reminderSentOnId,reminderSentOnDate=:reminderSentOnDate,reminderEmailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":reminderSentOnId", $thisSendID);
          $sql->bindParam(":reminderEmailId", $emailId);
          $sql->bindParam(":reminderSentOnDate", $dateNow);

        }

        $sql->execute();

      }

      catch(Exception $e) {
        //
      }

    }
  }   // While loop

  echo "Survey queued";
}

// Send Manager Survey
function sendManagerSurvey(){
  global $sesClient;
  $surveyId = $GLOBALS["_surveyId"];
  $appConfig = $GLOBALS["_appConfig"];
  $emailType = $GLOBALS["_emailType"];
  $surveyType = "MGR";
  $dateNow = date("Y-m-d H:i:s");
  $thisSendID = Util::createID();

  // Fetch Survey/Organisation settings
  $conn = Util::createConnection();

  // fetch Survey/Organisation/Settings
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail,Setting.socialMediaReminderDays FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.VendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorId = $survey["vendorId"];
  }

  else {
    trigger_error("Failed to fetch survey information", E_USER_ERROR);
  }

  if($emailType==$GLOBALS["EMAIL_TYPE"]["SURVEY"]) {         //Survey

    $sql = "SELECT sl.objectId,sl.vendorId, CONCAT(u.firstName, ' ',u.lastName) as name, u.email FROM Survey_Log sl " .
           "INNER JOIN User u ON sl.staffId = u.objectId " .
           "WHERE sl.emailStatus=0 AND sl.sendDate IS NOT NULL AND DATE(sl.sendDate) = CURDATE() AND " .
           "sl.score IS NULL AND u.active=1 AND u.isDeleted=0 AND sl.vendorId='$vendorId' AND sl.surveyId='$surveyId' ORDER BY u.firstName";
  }

  else {                      //Reminder
    $sql = "SELECT sl.objectId,sl.vendorId, CONCAT(u.firstName, ' ',u.lastName) as name, u.email FROM Survey_Log sl " .
           "INNER JOIN User u ON sl.staffId = u.objectId " .
           "WHERE sl.emailStatus=2 AND sl.reminderDate IS NOT NULL AND DATE(sl.reminderDate) = CURDATE() AND " .
           "sl.score IS NULL AND u.active=1 AND u.isDeleted=0 AND sl.vendorId='$vendorId' AND sl.surveyId='$surveyId' ORDER BY u.firstName";
  }

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt===false || $stmt->rowCount()===0) trigger_error("No records to email", E_USER_ERROR);

  // set the email default settings
  $sesReq = array();
  $sesReq["Source"] = "{$survey['organisationName']} <{$survey['surveyEmailFrom']}>";

  ///
  /// Email template global placeholder replacement
  ///

  $emailTemplate = file_get_contents(__DIR__ ."/email_template2.html");

  // Email html
  if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {   //Survey

    $html = $survey["surveyHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);

    $sesReq['Message']['Subject']['Data'] = $survey["emailSubject"];
  }

  else {    //Reminder
    $html = $survey["reminderHtml"];
    $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$html,$emailTemplate);
    $sesReq['Message']['Subject']['Data'] = $survey["emailSubjectReminder"];
  }

  // Unsubscribe link
  $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}","",$emailTemplate);
  // Web link
  $emailTemplate = str_ireplace("{{WEB_LINK}}","",$emailTemplate);
  // Web root
  $emailTemplate = str_ireplace("{{WEB_ROOT}}",$appConfig["company"]["appWebsite"],$emailTemplate);
  // Survey type
  $emailTemplate = str_ireplace("{{SURVEY_TYPE}}",$surveyType,$emailTemplate);
  // Company name
  $emailTemplate = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplate);
  // Company website
  $emailTemplate = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["website"],$emailTemplate);


  // Logo
  if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"])) {    //insert logo into email
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}",
    "<img alt='Logo' width='300' style='margin-bottom:25px;width:100%;max-width:300px;height:auto' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"] . "'/>",$emailTemplate);
  }

  else {
    $emailTemplate = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplate);
  }
  // Organisation name
  $emailTemplate = str_ireplace("{{FirmName}}",$survey["organisationName"],$emailTemplate);

  // Loop through all clients and send emails
  while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if($row["vendorId"]===$vendorId && isset($row["name"]) && isset($row["email"]) && filter_var($row["email"], FILTER_VALIDATE_EMAIL)) {

      $objectId = $row["objectId"];
      $nameArr = explode(" ",$row["name"]);

      $sesReq['Destination']['ToAddresses'] = array("{$row['name']} <{$row['email']}>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tjdada@gmail.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Tabraiz Dada <tabraiz@outlook.com>");
      //$sesReq['Destination']['ToAddresses'] = array("Greg Tilse <gtilse@klientkulture.com>");

      $emailBody = str_ireplace("{{STAFFNAME}}",$nameArr[0],$emailTemplate);
      $emailBody = str_ireplace("{{OBJECTID}}",$objectId,$emailBody);
      $emailBody = str_ireplace("{{CONTACTID}}",$row["objectId"],$emailBody);
      $sesReq['Message']['Body']['Html']['Data'] = $emailBody;
      $sesReq['Message']['Body']['Html']['Charset'] = "UTF-8";
      $sesReq['Message']['Body']['Text']['Data'] = "Please take out a few seconds to complete our online Survey \r\n" .
                                                   $appConfig["company"]["appWebsite"]. "survey/survey.php?id=$objectId?type=$surveyType";
      $sesReq['Message']['Body']['Text']['Charset'] = "UTF-8";

      try {
        $result = $sesClient->sendEmail($sesReq);
        $emailId = $result->get("MessageId");

        // Insert or update Survey_Log table depending on message type
        if($emailType == $GLOBALS["EMAIL_TYPE"]["SURVEY"]) {

          $sql = $conn->prepare("UPDATE Survey_Log SET emailId = :emailId,sentOnId= :sentOnId,sentOnDate=:sentOnDate,emailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":sentOnId", $thisSendID);
          $sql->bindParam(":emailId", $emailId);
          $sql->bindParam(":sentOnDate", $dateNow);

        }

        else {
          $sql = $conn->prepare("UPDATE Survey_Log SET reminderEmailId = :reminderEmailId,reminderSentOnId= :reminderSentOnId,reminderSentOnDate=:reminderSentOnDate,reminderEmailStatus=1 WHERE objectId= :objectId");
          $sql->bindParam(":objectId", $objectId);
          $sql->bindParam(":reminderSentOnId", $thisSendID);
          $sql->bindParam(":reminderEmailId", $emailId);
          $sql->bindParam(":reminderSentOnDate", $dateNow);

        }

        $sql->execute();

      }

      catch(Exception $e) {
        //
      }

    }
  }   // While loop

  echo "Survey queued";
}

?>
