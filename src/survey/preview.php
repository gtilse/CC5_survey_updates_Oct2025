<?php

// Survey Preview Page
// Displays how the survey emails will look like for the end users
// Preview of both email and reminders are displayed

require __DIR__ . "/../api/common.php";
require __DIR__ . "/../api/vendor/autoload.php";

$isError = true;
$parsedown = new Parsedown();
$appConfig = json_decode(file_get_contents(__DIR__ . "/../assets/config.json"),true);

if (isset($_GET['surveyid'])==false) die();
$surveyId = $_GET['surveyid'];

try {
  $conn = Util::createConnection();

  // fetch organisation and survey info
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo " .
                       "FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt === false) die();
  $stmt->setFetchMode(PDO::FETCH_ASSOC);
  if($stmt->rowCount() > 0) {
    $survey = $stmt->fetch();

    $vendorId = $survey["vendorId"];
  }

  else {
    die();
  }

  // Create the email template for rendering
  $emailTemplateMaster = file_get_contents("./email_template.html");

  if(intval($survey["addLogo"])==1 && isset($survey["organisationLogo"]) && file_exists(UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"])) {    //insert logo into email
    $emailTemplateMaster = str_ireplace("{{LOGO_IMAGE}}",
    "<img alt='Logo' style='margin-bottom:25px;max-width:300px' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $survey["organisationLogo"] . "'/><br/>",$emailTemplateMaster);

  }

  else {
    $emailTemplateMaster = str_ireplace("{{LOGO_IMAGE}}","",$emailTemplateMaster);
  }

  $emailTemplateMaster = str_ireplace("{{PAGE_TITLE}}","Email Preview",$emailTemplateMaster);
  $emailTemplateMaster = str_ireplace("{{UNSUBSCRIBE_LINK}}",UNSUBSCRIBE_LINK,$emailTemplateMaster);
  $emailTemplateMaster = str_ireplace("{{WEB_LINK}}",WEB_LINK,$emailTemplateMaster);
  $emailTemplateMaster = str_ireplace("{{COMPANY_NAME}}",$appConfig["company"]["name"],$emailTemplateMaster);
  $emailTemplateMaster = str_ireplace("{{COMPANY_WEBSITE}}",$appConfig["company"]["appWebsite"],$emailTemplateMaster);


  $emailTemplateMaster = str_ireplace("{{FIRMNAME}}",$survey["organisationName"],$emailTemplateMaster);
  $surveyHtml = $parsedown->text($survey["surveyHtml"]);
  $emailTemplateMaster = str_ireplace("{{EMAIL_HTML}}",$surveyHtml,$emailTemplateMaster);

  $isError = false;    // all good!
}

catch(Exception $ex) {
  $isError = true;
}

if($isError) {
  echo "<html>" .
          "<body>" .
            "<h4>Something went wrong...Please try again later</h4>" .
          "</body>" .
       "</html>";
} else {

  $dom = new DOMDocument();
  libxml_use_internal_errors(true);
  $dom->loadHTML($emailTemplateMaster);
  $body = $dom->getElementsByTagName("body")->item(0);

  $jqueryScriptElement = $dom->createElement('script');
  $domAttribute = $dom->createAttribute('src');
  $domAttribute->value = "../../assets/js/jquery-3.3.1.min.js";
  $jqueryScriptElement->appendChild($domAttribute);
  $body->appendChild($jqueryScriptElement);

  $scriptContent = "$(function() { " .
                   "$('a').attr('href', '#').attr('target',''); " .
                   "});";

  $scriptElement = $dom->createElement('script');
  $scriptElement->appendChild($dom->createTextNode($scriptContent));
  $body->appendChild($scriptElement);

  echo $dom->saveHTML();
}

?>
