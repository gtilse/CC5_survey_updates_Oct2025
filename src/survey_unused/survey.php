<?php

require "../api/common.php";

$isError = false;
$isPreviewMode = false;

if (isset($_GET['id']) && isset($_GET['type']) && ($_GET['type']=="CLI" || $_GET['type']=="STA" || $_GET['type']=="PUL" || $_GET['type']=="MGR")) {

  $emailHtml;
  $surveyId;
  $clientName;

  try {
    $surveyId = $_GET['id'];
    $surveyType = $_GET['type'];

    // App configuration setting
    $appConfig = json_decode(file_get_contents("../assets/config.json"),true);

    // Setup the template to display
    $conn = Util::createConnection();

    if($surveyType=="CLI" || $surveyType == "PUL"){

      if(substr($surveyId,0,7)==="PREVIEW"){
        $isPreviewMode = true;
        $sid = substr($surveyId,8);
        $q = $conn->query("SELECT Survey.*, '{{CLIENTNAME}}' as name, '000000' as clientId, '{{CLIENTCONTACT}}' as drlName, " .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey INNER JOIN Vendor ON Survey.vendorId = Vendor.objectId " .
                          "WHERE Survey.objectId = " . $conn->quote($sid));
      } else {
        $q = $conn->query("SELECT Survey.*, Client.name, Client.objectId as clientId, CONCAT(User.firstName, ' ',User.lastName) as drlName, " .
                          "Vendor.name as organisationName,Vendor.logo as organisationLogo " .
                          "FROM Survey_Log INNER JOIN Survey ON Survey_Log.surveyId = Survey.objectId " .
                          "INNER JOIN Client ON Survey_Log.clientId = Client.objectId INNER JOIN User ON Client.drl = User.objectId " .
                          "INNER JOIN Vendor ON Survey_Log.vendorId = Vendor.objectId " .
                          "WHERE Survey_Log.objectId = " . $conn->quote($surveyId));
      }

      if($q !== false && $q->rowCount() > 0 && ($survey = $q->fetch(PDO::FETCH_ASSOC))!=false) {
          $nameArr = explode(" ",$survey["name"]);
          $clientName = $nameArr[0];

          $emailTemplate = ($surveyType == "CLI" ? file_get_contents(__DIR__ ."/email_template.html") : file_get_contents(__DIR__ ."/email_template2.html"));
          $emailTemplate = str_ireplace("{{EMAIL_HTML}}",$survey["surveyHtml"],$emailTemplate);
          $emailTemplate = str_ireplace("{{UNSUBSCRIBE_LINK}}",UNSUBSCRIBE_LINK,$emailTemplate);
          $emailTemplate = str_ireplace("{{WEB_LINK}}",WEB_LINK,$emailTemplate);
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

          $emailTemplate = str_ireplace("{{ClientName}}",$clientName,$emailTemplate);
          $emailTemplate = str_ireplace("{{OBJECTID}}",$surveyId,$emailTemplate);
          $emailTemplate = str_ireplace("{{ClientContact}}",$survey["drlName"],$emailTemplate);
          $emailTemplate = str_ireplace("{{CONTACTID}}",$survey["clientId"],$emailTemplate);

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

        $emailTemplate = ($surveyType == "STA" ? file_get_contents(__DIR__ ."/email_template.html") : file_get_contents(__DIR__ ."/email_template2.html")) ;
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
