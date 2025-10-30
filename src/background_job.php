<?php

require __DIR__ . "/api/common.php";
define("PRIVATE_KEY","klientkultureapp");
define("SURVEY_EMAILER_PATH","https://www.clientculture.net/survey/survey_emailer.php");

// Verify authorization
if(count($argv)<3) die();

parse_str($argv[1],$params);
if(isset($params["KLIENTKULTURECRON"])==false || $params["KLIENTKULTURECRON"]!==PRIVATE_KEY) die();

parse_str($argv[2],$params);
if(isset($params["JOB"])==false) die();

switch ($params["JOB"]) {
  case "SURVEYREMINDER":
    sendSurveyReminder();
    break;
  
  case "PULSESURVEYREMINDER":
    sendPulseSurveyReminder();
    break;

  case "TRIAGESURVEYREMINDER":
    sendTriageSurveyReminder();
    break;
    
  case "NEWRESPONSES":
    sendResponsesNotification("NEWRESPONSES");
    break;
  case "ACTIONITEMS":
    sendResponsesNotification("ACTIONITEMS");
    break;

  default:
    echo "BAD INPUT";
    break;
}

// Process and send reminders
function sendSurveyReminder() {

  if(!DEV) file_put_contents("/var/www/html/admin/background_job.log", gmdate("Y-m-d H:i:s") . " - Survey reminder job started" . PHP_EOL, FILE_APPEND);

  $results = [];
  $conn = Util::createConnection();

  $curl = curl_init();
  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, SURVEY_EMAILER_PATH);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, false);
  $params = array("emailType"=>2,"surveyType"=>"1");
  $stmt = $conn->query("Select DISTINCT(surveyId) FROM Survey_Log " .
    "INNER JOIN Survey ON Survey.objectId = Survey_Log.surveyId " .
    "where Survey.type = 0 AND " .
    "reminderDate IS NOT NULL AND DATE(reminderDate) = CURDATE() AND score IS NULL AND reminderSentOnDate IS NULL");

  if($stmt !== false && $stmt->rowCount() > 0) {

    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

      $params["surveyId"] = $row["surveyId"];
      curl_setopt($curl, CURLOPT_POSTFIELDS,json_encode($params));
      $results[] = curl_exec($curl);

    }

    echo json_encode($results);
    curl_close($curl);

  }

  else {
    echo "NO Reminders to send!";
  }

}

function sendTriageSurveyReminder() {

  if(!DEV) file_put_contents("/var/www/html/admin/background_job.log", gmdate("Y-m-d H:i:s") . " - Survey reminder job started" . PHP_EOL, FILE_APPEND);

  $results = [];
  $conn = Util::createConnection();

  $curl = curl_init();
  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, SURVEY_EMAILER_PATH);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, false);
  $params = array("emailType"=>2,"surveyType"=>5);
  $stmt = $conn->query("Select DISTINCT(surveyId) FROM Survey_Log " .
    "INNER JOIN Survey ON Survey.objectId = Survey_Log.surveyId " .
    "where Survey.type = 4 AND " .
    "reminderDate IS NOT NULL AND DATE(reminderDate) = CURDATE() AND triageScore IS NULL AND reminderSentOnDate IS NULL");

  if($stmt !== false && $stmt->rowCount() > 0) {

    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

      $params["surveyId"] = $row["surveyId"];
      curl_setopt($curl, CURLOPT_POSTFIELDS,json_encode($params));
      $results[] = curl_exec($curl);

    }

    echo json_encode($results);
    curl_close($curl);

  }

  else {
    echo "NO Reminders to send!";
  }

}

// New responses and action items notification
function sendResponsesNotification($responseType){

  if(!DEV) file_put_contents("/var/www/html/admin/background_job.log", gmdate("Y-m-d H:i:s") . " - Notifications job started for $responseType" . PHP_EOL, FILE_APPEND);

  $conn = Util::createConnection();
  $conn->exec("SET @@session.group_concat_max_len = 100000");

  if($responseType == "NEWRESPONSES"){
    $stmt = $conn->query("SELECT count(sl.objectId) AS count, GROUP_CONCAT(CONCAT_WS('~~~~',sl.score,c.name,c.email,IFNULL(sl.comments,' '),IFNULL(sl.receivedOnDate,' ')) ORDER BY sl.receivedOnDate DESC SEPARATOR '++++') AS clients," .
                         "CONCAT(u.firstName, ' ',u.lastName) AS clientContact, u.email, s.ssoUrl  " .
                         "FROM Survey_Log sl INNER JOIN Client c ON sl.clientId = c.objectId INNER JOIN User u ON u.objectId = c.drl " .
                         "INNER JOIN Setting s ON s.vendorId = sl.vendorId " .
                         "WHERE sl.receivedOnDate > (NOW()-INTERVAL 2 DAY) AND sl.score IS NOT NULL " .
                         "AND s.newResponsesNotification=1 AND c.active = 1 AND c.isDeleted = 0 " .
                         "GROUP BY u.objectId LIMIT 10");

  } else if($responseType == "ACTIONITEMS") {

    $stmt = $conn->query("SELECT count(sl.objectId) AS count, GROUP_CONCAT(CONCAT_WS('~~~~',sl.score,c.name,c.email,IFNULL(sl.comments,' '),IFNULL(sl.receivedOnDate,' ')) ORDER BY sl.receivedOnDate DESC SEPARATOR '++++') AS clients," .
                         "CONCAT(u.firstName, ' ',u.lastName) AS clientContact, u.email, s.ssoUrl  " .
                         "FROM Survey_Log sl INNER JOIN Client c ON sl.clientId = c.objectId INNER JOIN User u ON u.objectId = c.drl " .
                         "INNER JOIN Setting s ON s.vendorId = sl.vendorId " .
                         "WHERE sl.receivedOnDate > (NOW()-INTERVAL 30 DAY) AND sl.score IS NOT NULL AND sl.flagged =1 " .
                         "AND s.pendingActionItemsNotification=1 AND c.active = 1 AND c.isDeleted = 0 " .
                         "GROUP BY u.objectId LIMIT 10");
  } else {
    return;
    die();
  }

  if($stmt && $stmt->rowCount() > 0) {
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

      $clientContact = explode(" ",$row["clientContact"])[0];

      if($responseType == "NEWRESPONSES"){
        $emailBodyPrefix = "<p>Hi $clientContact</p>" .
                           "<p>You have new survey responses in your dashboard. Login to find out more.</p> ";

      } else if ($responseType == "ACTIONITEMS") {
        $emailBodyPrefix = "<p>Hi $clientContact</p>" .
                           "<p>In our experience it's important to follow-up personally with <strong>detractor</strong> " .
                           "clients (i.e. those that have given a survey score of 0 to 6). Better understanding the reasons " .
                           "behind detractor scores can help you improve the client experience and client retention. " .
                           "For this reason the <strong>Action Items</strong> tab (top right of your dashboard) lists all detractor " .
                           "clients until followed-up or resolved. We see there are still unresolved action items in your account. Login to find out more.</p>";
      } else {
        $emailBodyPrefix = "";
      }

      $emailBody = "<table border='0' cellpadding='10' cellspacing='0' width='100%' class='text-small'>";

      $clients = explode("++++", $row["clients"]);
      if($responseType == "NEWRESPONSES" && count($clients)>3){
        array_splice($clients, 3);
      }

      foreach($clients as $value){
        $response = explode("~~~~",$value);

        if(intval($response[0])>8){
          $scoreClass = "bg-promoter";
        } else if(intval($response[0])<=6){
          $scoreClass = "bg-detractor";
        } else {
          $scoreClass = "bg-neutral";
        }

        $commentClass="";
        if(trim($response[3])==""){
          $comment = "No comments provided";
          $commentClass = "text-empty";
        } else {
          $comment = $response[3];
        }

        $emailBody .= "<tr>" .
                        "<td align='center' valign='top' width='100' class='bottom-border-light'>" .
                          "<span class='score-label $scoreClass'>{$response[0]}</span>" .
                        "</td>" .
                        "<td align='left' valign='top' width='200' class='bottom-border-light'>" .
                          $response[1] .
                        "</td>" .
                        "<td align='left' valign='top' width='300' class='bottom-border-light $commentClass'>" .
                          $comment .
                        "</td>" .
                      "</tr>";
      }

      $siteLink = 'https://www.clientculture.net/auth/login';
      if($row["ssoUrl"]) {
        $siteLink = $row["ssoUrl"];
      }

      $emailBody .= "</table><a class='btn-login' href='" . $siteLink . "' style='color:white'>Login to your account</a>";
      Util::sendSupportEmail($row["clientContact"],$row["email"],"Client Culture - Automated Notification",$emailBodyPrefix . $emailBody);
      // Util::sendSupportEmail('Tabraiz dada','tjdada@gmail.com',"Client Culture - Automated Notification",$emailBodyPrefix . $emailBody);
    }
  }

}

// Pulse survey
function sendPulseSurveyReminder() {

  if(!DEV) file_put_contents("/var/www/html/admin/background_job.log", gmdate("Y-m-d H:i:s") . " - Pulse Survey reminder job started" . PHP_EOL, FILE_APPEND);

  $results = [];
  $conn = Util::createConnection();

  $curl = curl_init();
  curl_setopt($curl, CURLOPT_POST, 1);
  curl_setopt($curl, CURLOPT_URL, SURVEY_EMAILER_PATH);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, false);
  $params = array("emailType"=>2,"surveyType"=>"3");
  $stmt = $conn->query("Select DISTINCT(surveyId) FROM Survey_Log " .
    "INNER JOIN Survey ON Survey.objectId = Survey_Log.surveyId " .
    "where Survey.type = 2 AND " .
    "reminderDate IS NOT NULL AND DATE(reminderDate) = CURDATE() AND Survey_Log.additionalQuestions is NULL AND Survey_Log.reminderSentOnDate IS NULL");

  if($stmt !== false && $stmt->rowCount() > 0) {

    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {

      $params["surveyId"] = $row["surveyId"];
      curl_setopt($curl, CURLOPT_POSTFIELDS,json_encode($params));
      $results[] = curl_exec($curl);

    }

    echo json_encode($results);
    curl_close($curl);

  }

  else {
    echo "NO Reminders to send!";
  }
}
