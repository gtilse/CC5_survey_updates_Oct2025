<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Surveys
$app->post("/surveys",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,vendorId,type,active,description,surveyHtml,reminderHtml,emailFrom,emailSubject,emailSubjectReminder," .
    "frequency,splitSend,addLogo,newClientsOnly,reminderDays,includeDRLS,includeCategories,additionalQuestions,excludeEmployees, " .
    "addHowToImproveQuestion, howToImproveQuestionText, addHowToImproveQuestion2, howToImproveQuestion2Text, tags, loyaltyDrivers, clientSurveyMonthsLimit," .
    "customClientCategory1, customClientCategory1Desc, customization," .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM Survey WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY updatedAt desc"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Save survey
$app->post("/saveSurvey",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $loyaltyDrivers = $reqData["loyaltyDrivers"];
  $customQuestions = $reqData["customQuestions"];

  unset($reqData["createdAt"]);
  unset($reqData["updatedAt"]);
  unset($reqData["loyaltyDrivers"]);
  unset($reqData["customQuestions"]);
  unset($reqData["clientCSV"]);

  $whereClause = "";
  $objectId=$reqData["objectId"];
  $tmpArray = array();

  if($objectId =="0") {     //New Record
    $objectId = $reqData["objectId"] = Util::createID();
    $sql = "INSERT INTO Survey SET ";
  }

  else {                //Update current record
    $sql = "UPDATE Survey SET ";
    unset($reqData["objectId"]);
    $whereClause = " WHERE objectId='" . $objectId . "'";
  }

  foreach($reqData as $key=>$value) {

    if(isset($reqData[$key]) && !is_numeric($reqData[$key]) && trim($reqData[$key])=='') {
      $reqData[$key] = NULL;
    }

    $keyName = ":" . $key;
    $tmpArray[] = "$key=$keyName";
  }

  $sql .= implode(",",$tmpArray) . $whereClause;
  
  // create the connection and execute statement
  $conn = Util::createConnection();

  $conn->beginTransaction();
  try {
    // Survey table
    $stmt=$conn->prepare($sql);
    $stmt->execute($reqData);
    // Loyalty drivers
    $conn->exec("DELETE FROM SurveyLoyaltyDriver WHERE surveyId='$objectId'");
    foreach ($loyaltyDrivers as $key => $value) {
      
      if($value["isSelected"]==1) {
        $stmt = $conn->prepare("INSERT INTO SurveyLoyaltyDriver(objectId,vendorId,loyaltyDriverId,surveyId,description) VALUES(?,?,?,?,?)");
        $stmt->execute(array(Util::createID(),$reqData["vendorId"],$value["loyaltyDriverId"],$objectId,$value["description"]));
      }
    }

    // Custom questions
    $conn->exec("DELETE FROM SurveyCustomQuestion WHERE surveyId='$objectId'");
    foreach ($customQuestions as $key => $value) {
      
      if($value["isSelected"]==1) {
        $stmt = $conn->prepare("INSERT INTO SurveyCustomQuestion(objectId,vendorId,customQuestionId,surveyId,heading,subHeading) VALUES(?,?,?,?,?,?)");
        $stmt->execute(array(Util::createID(),$reqData["vendorId"],$value["customQuestionId"],$objectId,$value["heading"],$value["subHeading"]));
      }
    }

    $conn->commit();
    // Fetch createdAt and updatedAt for the record
    $stmt->closeCursor();
    $stmt = $conn->query("SELECT objectId,CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt,CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
                        "FROM Survey WHERE objectId='$objectId' LIMIT 1");

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $response->withJson($row);

  }

  catch(PDOException $e) {
    $conn->rollBack();
    return setErrorResponse($response, "DATA_SAVE_FAILED");
  }
  
});

// Survey List
$app->post("/surveyList",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId, active, type, description " .
    "FROM Survey WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY description"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Surveys status
$app->post("/surveysStatus",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT sl.surveyId, sl.sendDate, COUNT(sl.objectId) AS totalSent, MAX(sl.receivedOnDate) AS lastResponseOn, COUNT(sl.receivedOnDate) AS totalResponses " .
    "FROM Survey_Log sl WHERE sl.vendorId='$vendorId' AND " .
    "sl.sendDate = (SELECT MAX(slm.sendDate) from Survey_Log slm  WHERE slm.objectId=sl.objectId) " .
    "GROUP BY sl.surveyId " .
    "ORDER BY sl.sendDate DESC"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return $response->withJSON([]);
  }
});

// Client list for survey
$app->post("/clientListForSurvey",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $surveyId = $reqData["surveyId"];

  // fetch Survey Information
  $stmt = $conn->query("SELECT * FROM Survey WHERE objectId = " . $conn->quote($surveyId));

  if(!($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false)) {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  // If limited to DRL or categories then create where clause
  $drlWhereClause = "";
  $catWhereClause = "";
  $tagsWhereClause = "";

  if(isset($survey["includeDRLS"])) {
    $drlArr = json_decode($survey["includeDRLS"],true);

    if(count($drlArr)>0) {
      $drlWhereClause = "Client.drl IN('" . implode("','", $drlArr) . "')";

    }

  }

  if(isset($survey["includeCategories"])) {
    $catArr = json_decode($survey["includeCategories"],true);

    if(count($catArr)>0) {
      $catWhereClause = "Client.category IN('" . implode("','", $catArr) . "')";

    }
  }

  if(isset($survey["tags"])) {
    $tagsArr = json_decode($survey["tags"],true);
    $likeArr = [];

    foreach ($tagsArr as $key => $value) {
      $likeArr[] = "Client.tags LIKE '%$value%'";
    }

    if(count($likeArr)) {
      $tagsWhereClause = "(" . implode(" OR ", $likeArr) . ")";
    }

  }

  $whereClause = " WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Client.isDeleted=0 AND Client.vendorId = '" . $survey["vendorId"] . "' ";

  // New clients only
  if(intval($survey["newClientsOnly"])==1) {
    $whereClause .= "AND Client.objectId NOT IN(SELECT clientId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";
  }

  // Throttle months
  if(isset($survey["clientSurveyMonthsLimit"]) && intval($survey["clientSurveyMonthsLimit"])>0) {

    $clientSurveyMonthsLimit = intval($survey["clientSurveyMonthsLimit"]);

    $whereClause .= "AND Client.email NOT IN " .
                    "(SELECT DISTINCT c.email FROM Survey_Log sl INNER JOIN Client c ON c.objectId=sl.clientId " .
                    "WHERE sl.sentOnDate >= DATE_SUB(curdate(), INTERVAL {$clientSurveyMonthsLimit} MONTH) AND c.vendorId='$survey[vendorId]') ";
  }
  // 
  if($drlWhereClause != "") $whereClause .= " AND " . $drlWhereClause;
  if($catWhereClause != "") $whereClause .= " AND " . $catWhereClause;
  if($tagsWhereClause != "") $whereClause .= " AND " . $tagsWhereClause;

  $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.name, Client.organisation, Client.phone,Client.email, Client.drl, CONCAT(User.firstName, ' ',User.lastName) as drlName from Client " .
          " INNER JOIN User ON Client.drl = User.objectId "  .
          $whereClause .
          " ORDER BY Client.name";

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt && $stmt->rowCount() > 0 && ($clients = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($clients);
  }

  else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Staff list for survey
$app->post("/staffListForSurvey",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $surveyId = $reqData["surveyId"];

  // Fetch Survey and Organisation info
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.vendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt === false || $stmt->rowCount()===0 || ($survey=$stmt->fetch(PDO::FETCH_ASSOC))===false) return setErrorResponse($response, "DATA_FETCH_FAILED");
  $vendorId = $survey["vendorId"];

  $excludeEmployeesWhereClause = "";
  if(isset($survey["excludeEmployees"])) {
    $excludeEmployeesArr = json_decode($survey["excludeEmployees"], true);

    if(count($excludeEmployeesArr)>0) {
      $excludeEmployeesWhereClause = "User.objectId NOT IN('" . implode("','", $excludeEmployeesArr) . "')";
    }
  }

  $whereClause = " WHERE User.active=1 AND User.isDeleted=0 AND User.type=0 AND User.vendorId=" . $conn->quote($vendorId) . " ";
  if ($excludeEmployeesWhereClause !== "") $whereClause .= "AND " . $excludeEmployeesWhereClause;

  $whereClause .= "AND User.objectId NOT IN(SELECT staffId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";

  $sql = "SELECT User.objectId, User.vendorId, User.email,User.department,User.designation, CONCAT(User.firstName, ' ',User.lastName) as employeeName FROM User " .
         $whereClause . " ORDER BY User.firstName";

  $stmt->closeCursor();
  $stmt = $conn->query($sql);
  if($stmt && $stmt->rowCount() > 0 && ($users = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($users);
  }

  else {
    return $response->withJson([]);
  }

});

// Survey loyalty drivers
$app->post("/surveyLoyaltyDrivers",function(Request $request, Response $response){
  
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $surveyId = $reqData["surveyId"];
  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query("SELECT * FROM SurveyLoyaltyDriver WHERE surveyId='$surveyId'");
  if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($rows);
  } else {
    return $response->withJson([]);
  }

});

// Survey custom questions
$app->post("/surveyCustomQuestions",function(Request $request, Response $response){
  
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $surveyId = $reqData["surveyId"];
  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query("SELECT * FROM SurveyCustomQuestion WHERE surveyId='$surveyId'");
  if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($rows);
  } else {
    return $response->withJson([]);
  }

});

// Unique sendId and sendDate for Survey
$app->post("/sendIdsForSurvey",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $surveyId = $reqData["surveyId"];

  $stmt = $conn->query("SELECT sendId,  CONVERT_TZ(sendDate, @@session.time_zone, '+00:00') AS sendDate FROM Survey_Log WHERE surveyId='$surveyId' GROUP BY sendId, sendDate ORDER BY sendDate DESC");

  if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

});

// Survey Log for Client
$app->post("/surveyLogForClientBySendId",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $sendId = $reqData["sendId"];
  $surveyId = $reqData["surveyId"];
  $conn = Util::createConnection();

  $stmt = $conn->query("SELECT type FROM Survey WHERE objectId='$surveyId'");
  if($stmt !== false && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $surveyType = $survey["type"];
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  $stmt->closeCursor();

  if($surveyType === "4") {       // Project survey
    $stmt = $conn->query("SELECT sl.clientName AS name, sl.clientEmail AS email, CONVERT_TZ(sl.receivedOnDate, @@session.time_zone, '+00:00') AS receivedOnDate, sl.emailOpened,sl.emailStatus, " .
                       "sl.reminderEmailStatus, CONVERT_TZ(reminderDate, @@session.time_zone, '+00:00') AS reminderDate FROM Survey_Log sl " .
                       "WHERE sl.sendId='$sendId' ORDER BY sl.clientName");
  } else {
    $stmt = $conn->query("SELECT c.name, c.email, CONVERT_TZ(sl.receivedOnDate, @@session.time_zone, '+00:00') AS receivedOnDate, sl.emailOpened,sl.emailStatus, " .
                       "sl.reminderEmailStatus, CONVERT_TZ(reminderDate, @@session.time_zone, '+00:00') AS reminderDate FROM Survey_Log sl INNER JOIN " .
                       "Client c ON sl.clientId = c.objectId WHERE sl.sendId='$sendId' ORDER BY c.name");
  }
  
  if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
   return $response->withJson($rows);
  } else {
   return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

});

// Survey Log for Staff
$app->post("/surveyLogForStaffBySendId",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $sendId = $reqData["sendId"];
  $conn = Util::createConnection();

  $stmt = $conn->query("SELECT CONCAT(u.firstName,' ',u.lastName) AS name, u.email, CONVERT_TZ(sl.receivedOnDate, @@session.time_zone, '+00:00') AS receivedOnDate, sl.emailOpened,sl.emailStatus, " .
                       "sl.reminderEmailStatus, CONVERT_TZ(reminderDate, @@session.time_zone, '+00:00') AS reminderDate FROM Survey_Log sl INNER JOIN " .
                       "User u ON sl.staffId = u.objectId WHERE sl.sendId='$sendId' ORDER BY u.firstName");

  if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
   return $response->withJson($rows);
  } else {
   return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

});

// Survey Security Code
$app->post("/surveySecurityCode",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $vendorId = $reqData["vendorId"];
  $userId = $reqData["userId"];
  $surveyId = $reqData["surveyId"];
  $objectId = Util::createID();
  $securityCode = Util::createUUID();
  $vendorName = "";
  $conn = Util::createConnection();

  // Get the vendor info
  $stmt = $conn->query("SELECT * FROM Vendor WHERE objectId='$vendorId' LIMIT 1");
  if($stmt !== false && $stmt->rowCount() > 0 && ($vendor = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorName = $vendor["name"];
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  $stmt = $conn->prepare("INSERT INTO Survey_Security (objectId,vendorId,userId,surveyId,securityCode) VALUES(?,?,?,?,?)");
  $stmt->execute(array($objectId,$vendorId,$userId,$surveyId,$securityCode));

  // Email security code to the user
  // Create email to send
  $emailBody = "<p>Here is your code for sending the survey:</p>" .
               "<h3>$securityCode</h3>" .
               "<p> Please note that the code will automatically expire in 24 hours.</p>";

  //Util::sendSupportEmail("Tabraiz Dada","tjdada@gmail.com","Survey send code for " . $vendorName,$emailBody);
  Util::sendSupportEmail("Greg Tilse","gtilse@clientculture.com","Survey send code for " . $vendorName,$emailBody);

  return $response->withJson(array("status"=>"success","message"=>"Code emailed"));

});

// Queue Survey for sending
$app->post("/queueSurvey",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $securityCode = $reqData["securityCode"];
  $surveyId = $reqData["surveyId"];
  $surveyType = $reqData["surveyType"];
  $dateNow = gmdate("Y-m-d H:i:s");
  $createPurl = (isset($reqData["createPurl"]) && $reqData["createPurl"]==TRUE) ? TRUE : FALSE;
  $purlArray = [];

  $thisSendID = Util::createID();
  $surveyLogId = NULL;

  // Verify security code first
  $stmt = $conn->query("SELECT * FROM Survey_Security WHERE securityCode='$securityCode' AND surveyId='$surveyId' LIMIT 1");
  if($stmt !== FALSE && $stmt->rowCount()>0){
    // Do nothing, all good
    // return $response->withJson("Client Survey Queued");
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    die();
  }

  $stmt->closeCursor();

  // Get survey and organisation information
  $stmt = $conn->query("SELECT Survey.*, Vendor.name as organisationName, Vendor.logo as organisationLogo, " .
                       "Setting.surveyEmailFrom, Setting.notificationsEmail,Setting.socialMediaReminderDays FROM Survey INNER JOIN Vendor ON " .
                       "Survey.vendorId = Vendor.objectId INNER JOIN Setting ON Survey.VendorId = Setting.vendorId " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));


  if($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
   $vendorId = $survey["vendorId"];

   if(isset($survey["reminderDays"]) && intval($survey["reminderDays"])>0) {
     $reminderDays = intval($survey["reminderDays"]);
     $reminderDate = date("Y-m-d H:i:s", strtotime($dateNow. " + $reminderDays days"));
   }

   else $reminderDate = null;

   if(isset($survey["socialMediaReminderDays"]) && intval($survey["socialMediaReminderDays"])>0) {
     $socialMediaReminderDays = intval($survey["socialMediaReminderDays"]);
     $socialMediaReminderDate = date("Y-m-d H:i:s", strtotime($dateNow. " + $socialMediaReminderDays days"));
   }

   else $socialMediaReminderDate = null;

  }

  else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  // Client or Employee Survey
  switch ($surveyType) {

    // Client Survey
    case "CLIENT":
    case "PULSE":
    case "TRIAGE":

      // If limited to DRL or categories then create where clause
      $drlWhereClause = "";
      $catWhereClause = "";
      $tagsWhereClause = "";

      if(isset($survey["includeDRLS"])) {
        $drlArr = json_decode($survey["includeDRLS"],true);

        if(count($drlArr)>0) {
          $drlWhereClause = "Client.drl IN('" . implode("','", $drlArr) . "')";

        }
      }

      if(isset($survey["includeCategories"])) {
        $catArr = json_decode($survey["includeCategories"],true);

        if(count($catArr)>0) {
          $catWhereClause = "Client.category IN('" . implode("','", $catArr) . "')";

        }
      }

      if(isset($survey["tags"])) {
        $tagsArr = json_decode($survey["tags"],true);
        $likeArr = [];
    
        foreach ($tagsArr as $key => $value) {
          $likeArr[] = "Client.tags LIKE '%$value%'";
        }
    
        if(count($likeArr)) {
          $tagsWhereClause = "(" . implode(" OR ", $likeArr) . ")";
        }
    
      }

      $whereClause = " WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Client.isDeleted=0 AND Client.vendorId = '" . $vendorId . "' ";

      // New clients only
      if(intval($survey["newClientsOnly"])==1) {
        $whereClause .= "AND Client.objectId NOT IN(SELECT clientId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";
      }

      // Throttle months
      if(isset($survey["clientSurveyMonthsLimit"]) && intval($survey["clientSurveyMonthsLimit"])>0) {

        $clientSurveyMonthsLimit = intval($survey["clientSurveyMonthsLimit"]);

        $whereClause .= "AND Client.email NOT IN " .
                        "(SELECT DISTINCT c.email FROM Survey_Log sl INNER JOIN Client c ON c.objectId=sl.clientId " .
                        "WHERE sl.sentOnDate >= DATE_SUB(curdate(), INTERVAL {$clientSurveyMonthsLimit} MONTH) AND c.vendorId='$survey[vendorId]') ";
      }

      // 

      if($drlWhereClause != "") $whereClause .= " AND " . $drlWhereClause;
      if($catWhereClause != "") $whereClause .= " AND " . $catWhereClause;
      if($tagsWhereClause != "") $whereClause .= " AND " . $tagsWhereClause;

      $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.name, Client.organisation, Client.email, Client.drl, CONCAT(User.firstName, ' ',User.lastName) as drlName from Client " .
              " INNER JOIN User ON Client.drl = User.objectId "  .
              $whereClause .
              " ORDER BY Client.name";

      // Add list of clients to Survey Log
      $stmt->closeCursor();
      $stmt = $conn->query($sql);

      if($stmt && $stmt->rowCount() > 0) {

        try {

          $conn->beginTransaction();

          while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $stmt2 = $conn->prepare("INSERT INTO Survey_Log (objectId,surveyId,vendorId,clientId,sendId,sendDate,reminderDate," .
                                 "socialMediaReminderDate,emailStatus, drlId, sentOnDate) VALUES(:objectId,:surveyId,:vendorId,:clientId,:sendId," .
                                 ":sendDate,:reminderDate,:socialMediaReminderDate,0,:drlId, :sentOnDate)");

            $surveyLogId = Util::createID();

            $stmt2->bindParam(":objectId", $surveyLogId);
            $stmt2->bindParam(":surveyId", $surveyId);
            $stmt2->bindParam(":vendorId", $vendorId);
            $stmt2->bindParam(":clientId", $row["clientId"]);
            $stmt2->bindParam(":sendId", $thisSendID);
            $stmt2->bindParam(":sendDate", $dateNow);
            $stmt2->bindParam(":reminderDate", $reminderDate);
            $stmt2->bindParam(":socialMediaReminderDate", $socialMediaReminderDate);
            $stmt2->bindParam(":drlId", $row["drl"]);
            $stmt2->bindParam(":sentOnDate", $createPurl==TRUE ? $dateNow : NULL);

            $stmt2->execute();

            // Add to PURL array
            $purlArray[] = Array("surveyLogId"=>$surveyLogId, "clientId"=>$row["clientId"], "clientName"=>$row["name"], 
                                 "clientEmail"=>$row["email"], "drlName"=> $row["drlName"]);
          }

          $conn->commit();

          // Insert into notification table
          $notificationType = $GLOBALS["APP_NOTIFICATION_TYPES"]["CLIENT_SURVEY_QUEUED"];
          $notificationDescription = "Client survey queued for [" . $survey["description"] . "]";
          Util::createNotification($survey["vendorId"],$notificationType,$notificationDescription,$thisSendID);

          // Call the email sending script once
          if($surveyType === "CLIENT") {
            $sType = 1;
          } else if($surveyType === "PULSE") {
            $sType = 3;
          } else {
            $sType = 5;
          }

          if($createPurl) {
            return $response->withJson($purlArray);
          } else {
            // Note:
            // The survey queue will be processed via CRON or manual intervention
            //$output = shell_exec("php ../survey/survey_emailer.php '" . "surveyId=$surveyId&emailType=1&surveyType=$sType' > /dev/null 2>/dev/null &");
            // return success
            return $response->withJson("Client Survey Queued");
          }

          

        }

        catch (PDOException $e) {
          $conn->rollBack();
          return setErrorResponse($response, "DATA_CREATE_FAILED");
        }

      }

      // No clients to email - return error
      else {
        return setErrorResponse($response, "NO_CLIENTS_TO_SURVEY");
      }

      break;

    // Employee survey
    case "EMPLOYEE":
    case "MANAGER":

      // Get list of employeed to be sent the survey
      $excludeEmployeesWhereClause = "";
      if(isset($survey["excludeEmployees"])) {
        $excludeEmployeesArr = json_decode($survey["excludeEmployees"], true);

        if(count($excludeEmployeesArr)>0) {
          $excludeEmployeesWhereClause = "User.objectId NOT IN('" . implode("','", $excludeEmployeesArr) . "')";
        }
      }

      $whereClause = " WHERE User.active=1 AND User.isDeleted=0 AND User.type=0 AND User.vendorId=" . $conn->quote($vendorId) . " ";
      if ($excludeEmployeesWhereClause !== "") $whereClause .= "AND " . $excludeEmployeesWhereClause;

      $whereClause .= "AND User.objectId NOT IN(SELECT staffId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";

      $sql = "SELECT User.objectId, User.vendorId, User.email, CONCAT(User.firstName, ' ',User.lastName) as employeeName FROM User " .
             $whereClause . " ORDER BY User.firstName";

       // Add list of staffs to Survey Log
       $stmt->closeCursor();
       $stmt = $conn->query($sql);

       if($stmt && $stmt->rowCount() > 0) {

         try {

           $conn->beginTransaction();

           while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
             $stmt2 = $conn->prepare("INSERT INTO Survey_Log (objectId,surveyId,vendorId,staffId,sendId,sendDate,reminderDate," .
                                  "socialMediaReminderDate,emailStatus) VALUES(:objectId,:surveyId,:vendorId,:staffId,:sendId," .
                                  ":sendDate,:reminderDate,:socialMediaReminderDate,0)");

             $stmt2->bindParam(":objectId", Util::createID());
             $stmt2->bindParam(":surveyId", $surveyId);
             $stmt2->bindParam(":vendorId", $vendorId);
             $stmt2->bindParam(":staffId", $row["objectId"]);
             $stmt2->bindParam(":sendId", $thisSendID);
             $stmt2->bindParam(":sendDate", $dateNow);
             $stmt2->bindParam(":reminderDate", $reminderDate);
             $stmt2->bindParam(":socialMediaReminderDate", $socialMediaReminderDate);

             $stmt2->execute();
           }

           $conn->commit();

           // Insert into notification table
           $notificationType = $GLOBALS["APP_NOTIFICATION_TYPES"]["STAFF_SURVEY_QUEUED"];
           $notificationDescription = "Staff survey queued for [" . $survey["description"] . "]";
           Util::createNotification($survey["vendorId"],$notificationType,$notificationDescription,$thisSendID);

           // Call the email sending script once
           $sType = ($surveyType === "EMPLOYEE" ? 2 : 4);
           //$output = shell_exec("php ../survey/survey_emailer.php '" . "surveyId=$surveyId&emailType=1&surveyType=$sType' > /dev/null 2>/dev/null &");

           // return success
           return $response->withJson("Staff Survey Queued");

         }

         catch (PDOException $e) {
           $conn->rollBack();
           return setErrorResponse($response, "DATA_CREATE_FAILED");
         }

       }

       // No clients to email - return error
       else {
         return setErrorResponse($response, "NO_STAFFS_TO_SURVEY");
       }


      break;

    default:
      return setErrorResponse($response, "INVALID_SURVEY_TYPE");
      break;
  }


});

// Get Survey Queue
$app->post("/getQueueForSurvey",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $surveyId = $reqData["surveyId"];
  $surveyType = $reqData["surveyType"];
  $vendorId = $reqData["vendorId"];

  switch ($surveyType) {
    case 'CLIENT':
    case 'PULSE':
    case 'TRIAGE':
      
      $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.title, Client.name, Client.organisation, Client.email, Client.drl, Client.phone, " .
        "CONCAT(User.firstName, ' ',User.lastName) as drlName, Survey_Log.objectId as objectId  from Client INNER JOIN User ON Client.drl = User.objectId " .
        "INNER JOIN Survey_Log ON Client.objectId = Survey_Log.clientId WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Survey_Log.score IS NULL AND " .
        "Survey_Log.emailStatus=0 AND Survey_Log.sendDate IS NOT NULL AND DATE(Survey_Log.sendDate) = CURDATE() AND " .
        "Client.vendorId = '" . $vendorId . "' AND Survey_Log.surveyId=" . $conn->quote($surveyId) . " ORDER BY Client.name";
      break;

    case 'EMPLOYEE':
    case 'MANAGER':
      return setErrorResponse($response, "DATA_FETCH_FAILED");
      break;
    
    default:
      return setErrorResponse($response, "DATA_FETCH_FAILED");
      break;
  }

  // Query and return data
  $stmt = $conn->query($sql);

  if($stmt && $stmt->rowCount() > 0 && ($clients = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $response->withJson($clients);
  }

  else {
    return $response->withJson([]);
  }

});

// Clear survey queue
$app->post("/clearQueueForSurvey",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $surveyId = $reqData["surveyId"];
  $surveyType = $reqData["surveyType"];
  
  $sType = 0;
  switch ($surveyType) {
    case 'CLIENT':
      $sType = 1;
      break;

    case 'EMPLOYEE':
      $sType = 2;
      break;

    case 'PULSE':
      $sType = 3;
      break;

    case 'MANAGER':
      $sType = 4;
      break;
    
    case 'PULSE':
      $sType = 5;
      break;

    default:
      return setErrorResponse($response, "DATA_FETCH_FAILED");
      break;
  }

  //$output = shell_exec("php ../survey/survey_emailer.php '" . "surveyId=$surveyId&emailType=1&surveyType=$sType'");
  //return $response->withJson($output);
  $output = shell_exec("php ../survey/survey_emailer.php " . escapeshellarg("surveyId=$surveyId&emailType=1&surveyType=$sType"));
  return $response->withJson($output);

});

// Survey info for feedback
$app->post("/surveyInfoForFeedback",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $objectId = $reqData["objectId"];
  $surveyType = $reqData["surveyType"];

  if(substr($objectId,0,7)==="PREVIEW"){
    $sid = substr($objectId,8);
    $sql = "SELECT '000000' as objectId, S.vendorId, S.addLogo,S.additionalQuestions,S.addHowToImproveQuestion, V.logo, SE.displaySocialLinksInSurvey, SE.googlePage, SE.facebookPage, SE.truelocalPage,SE.socialLinksBeforeComments,SE.testimonialType, " .
           "S.addHowToImproveQuestion2, S.howToImproveQuestionText, S.howToImproveQuestion2Text, S.loyaltyDrivers " .
           "FROM Survey S INNER JOIN Vendor V ON V.objectId = S.vendorId " .
           "INNER JOIN Setting SE ON SE.vendorId = S.vendorId " .
           "WHERE S.objectId=" . $conn->quote($sid);
  } else {
    $sql = "SELECT SL.objectId, SL.vendorId, S.addLogo,S.additionalQuestions,S.addHowToImproveQuestion,V.logo, SE.displaySocialLinksInSurvey, SE.googlePage, SE.facebookPage, SE.truelocalPage,SE.socialLinksBeforeComments,SE.testimonialType, " .
           "S.addHowToImproveQuestion2, S.howToImproveQuestionText, S.howToImproveQuestion2Text, S.loyaltyDrivers " .
           "FROM Survey_Log SL " .
           "INNER JOIN Survey S ON S.objectId = SL.surveyId " .
           "INNER JOIN Vendor V ON V.objectId = SL.vendorId " .
           "INNER JOIN Setting SE ON SE.vendorId = SL.vendorId " .
           "WHERE SL.objectId=" . $conn->quote($objectId);
  }

  $stmt = $conn->query($sql);
  if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {

    if($row["logo"] && intval($row["addLogo"])==1)
      $row["logo"] = FULL_PATH_UPLOAD_DIR . $row["vendorId"] . "/" . $row["logo"];
    else {
      unset($row["logo"]);
      $row["addLogo"] = "0";
    }

    return $response->withJson($row);
  }

  else return setErrorResponse($response, "DATA_FETCH_FAILED");

});

// Survey info for loyalty drivers
$app->post("/surveyInfoForLoyaltyDrivers",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $objectId = $reqData["objectId"];
  $surveyType = $reqData["surveyType"];

  $r = [];
  
  if(substr($objectId,0,7)==="PREVIEW"){
    $sid = substr($objectId,8);
    $sql1 = "SELECT v.logo, s.addLogo, s.vendorId FROM Survey s " .
            "INNER JOIN Vendor v " .
            "ON v.objectId = s.vendorId " .
            "WHERE s.objectId='$sid'";

    $sql2 = "SELECT sld.objectId, sld.vendorId, sld.loyaltyDriverId, sld.surveyId, sld.description " .
           "FROM SurveyLoyaltyDriver sld " .
           "WHERE sld.surveyId='$sid'";
  } else {

    $sql1 = "SELECT v.logo, s.addLogo, s.vendorId FROM Survey_Log sl " .
            "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
            "INNER JOIN Vendor v " .
            "ON v.objectId = s.vendorId " .
            "WHERE sl.objectId='$objectId'";

    $sql2 = "SELECT sld.objectId, sld.vendorId, sld.loyaltyDriverId, sld.surveyId, sld.description " .
           "FROM SurveyLoyaltyDriver sld " .
           "INNER JOIN Survey_Log sl ON sl.surveyId=sld.surveyId " .
           "WHERE sl.objectId='$objectId'";
  }

  

  $stmt = $conn->query($sql1);
  if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {

    if($row["logo"] && intval($row["addLogo"])==1) {
      $r["logo"] = FULL_PATH_UPLOAD_DIR . $row["vendorId"] . "/" . $row["logo"];
      $r["addLogo"] = "1";
    }
    else {
      $r["addLogo"] = "0";
    }

    // Get the loyalty drivers
    $stmt->closeCursor();
    $stmt = $conn->query($sql2);
    if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
      $r["loyaltyDrivers"] = $rows;
      return $response->withJson($r);
    } else {
      return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  }

  else return setErrorResponse($response, "DATA_FETCH_FAILED");

});

// Survey info for custom questions
$app->post("/surveyInfoForCustomQuestions",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $objectId = $reqData["objectId"];
  $surveyType = $reqData["surveyType"];

  $r = [];
  
  if(substr($objectId,0,7)==="PREVIEW"){
    $sid = substr($objectId,8);
    $sql1 = "SELECT v.logo, s.addLogo, s.vendorId FROM Survey s " .
            "INNER JOIN Vendor v " .
            "ON v.objectId = s.vendorId " .
            "WHERE s.objectId='$sid'";

    $sql2 = "SELECT scq.objectId, scq.vendorId, scq.customQuestionId, scq.surveyId, scq.heading, scq.subHeading, cq.type, " .
            "GROUP_CONCAT(cql.description ORDER BY cql.weight DESC SEPARATOR '++++') AS customQuestionList " .
            "FROM SurveyCustomQuestion scq INNER JOIN CustomQuestion cq ON cq.objectId = scq.customQuestionId " .
            "LEFT JOIN CustomQuestionList cql ON cql.customQuestionId = cq.objectId " .
            "WHERE scq.surveyId='$sid'" .
            "GROUP BY cq.objectId ORDER BY cq.sortOrder";

  } else {

    $sql1 = "SELECT v.logo, s.addLogo, s.vendorId FROM Survey_Log sl " .
            "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
            "INNER JOIN Vendor v " .
            "ON v.objectId = s.vendorId " .
            "WHERE sl.objectId='$objectId'";

    $sql2 = "SELECT scq.objectId, scq.vendorId, scq.customQuestionId, scq.surveyId, scq.heading, scq.subHeading, cq.type, " .
            "GROUP_CONCAT(cql.description ORDER BY cql.weight DESC SEPARATOR '++++') AS customQuestionList " .
            "FROM SurveyCustomQuestion scq INNER JOIN CustomQuestion cq ON cq.objectId = scq.customQuestionId " .
            "INNER JOIN Survey_Log sl ON sl.surveyId=scq.surveyId " .
            "LEFT JOIN CustomQuestionList cql ON cql.customQuestionId = cq.objectId " .
            "WHERE sl.objectId='$objectId'" .
            "GROUP BY cq.objectId ORDER BY cq.sortOrder";
  }

  $stmt = $conn->query($sql1);
  if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {

    if($row["logo"] && intval($row["addLogo"])==1) {
      $r["logo"] = FULL_PATH_UPLOAD_DIR . $row["vendorId"] . "/" . $row["logo"];
      $r["addLogo"] = "1";
    }
    else {
      $r["addLogo"] = "0";
    }

    // Get the custom questions
    $stmt->closeCursor();
    $stmt = $conn->query($sql2);
    if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
      $r["customQuestions"] = $rows;
      return $response->withJson($r);
    } else {
      return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  }

  else return setErrorResponse($response, "DATA_FETCH_FAILED");

});

// Survey managers list
$app->post("/surveyManagers",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $objectId = $reqData["id"];
  $surveyType = $reqData["type"];

  if(substr($objectId,0,7)==="PREVIEW"){
    $sid = substr($objectId,8);
    $sql = "SELECT u.objectId, CONCAT(u.firstName,' ',u.lastName) AS name FROM Survey s INNER JOIN User u ON " .
           "s.vendorId = u.vendorId WHERE s.objectId='$sid' AND u.active=1 AND u.isDeleted=0 AND u.designation LIKE '%MANAGER%' order by u.firstName ASC";
  } else {
    $sql = "SELECT u.objectId, CONCAT(u.firstName,' ',u.lastName) AS name FROM Survey_Log sl INNER JOIN User u ON " .
           "sl.vendorId = u.vendorId WHERE sl.objectId='$objectId' AND u.active=1 AND u.isDeleted=0 AND u.designation LIKE '%MANAGER%' order by u.firstName ASC";
  }

  $stmt = $conn->query($sql);

  if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  }

  else return $response->withJson([]);

});

// Save survey feedback
$app->post("/saveSurveyFeedback",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $objectId = $reqData["id"];
  $conn = Util::createConnection();
  $dateNow = gmdate("Y-m-d H:i:s");

  // Check preview mode
  if(substr($objectId,0,7)==="PREVIEW"){
    return $response->withJson("Preview mode - no updation required");
    die();
  }

  // Save data
  switch ($reqData["prop"]) {
    case "SCORE":

      $flagged = 0;
      if(intval($reqData["score"])<=6) $flagged = 1;
      $stmt = $conn->prepare("UPDATE Survey_Log SET score=?,receivedOnDate=?,flagged=? WHERE objectId=?");
      $stmt->execute(array($reqData["score"],$dateNow,$flagged,$objectId));

      return $response->withJson("Score updated");
      break;

    case "BOT_VIEW":
        $stmt = $conn->prepare("UPDATE Survey_Log SET botViewOpened=? WHERE objectId=? LIMIT 1");
        $stmt->execute(array(1, $objectId));
  
        return $response->withJson("Bot view updated");
  
        break;

    case "CALL_REQUEST":
      $stmt = $conn->prepare("UPDATE Survey_Log SET callRequest=? WHERE objectId=? LIMIT 1");
      $stmt->execute(array(intval($reqData["callRequest"]), $objectId));

      return $response->withJson("Call Request updated");

      break;

    case "COMMENT":

      $stmt = $conn->prepare("UPDATE Survey_Log SET comments=?,howToImproveComments=?,howToImproveComments2=?,useCommentsAsTestimonial=?,loyaltyDrivers=? WHERE objectId=?");
      $stmt->execute(array($reqData["comments"],$reqData["howToImproveComments"],$reqData["howToImproveComments2"],$reqData["useCommentsAsTestimonial"],$reqData["loyaltyDrivers"],$objectId));

      return $response->withJson("Comment updated");

      break;

    case "ADDITIONAL_QUESTIONS":

      if(isset($reqData["staffId"])){   // Insert into Survey_Log_Detail table

        $staffId = $reqData["staffId"];
        $id = Util::createID();

        // Update receivedOnDate column
        $stmt = $conn->prepare("UPDATE Survey_Log SET receivedOnDate=? WHERE objectId=?");
        $stmt->execute(array($dateNow,$objectId));

        $stmt->closeCursor();

        // Insert row into Survey_Log_Detail table
        $stmt = $conn->prepare("INSERT INTO Survey_Log_Detail (objectId,surveyLogId,staffId,additionalQuestions) VALUES(?,?,?,?)");
        $stmt->execute(array($id,$objectId,$staffId,$reqData["additionalQuestions"]));


      } else {                          // Update Survey_Log table
        $stmt = $conn->prepare("UPDATE Survey_Log SET additionalQuestions=?,receivedOnDate=? WHERE objectId=?");
        $stmt->execute(array($reqData["additionalQuestions"],$dateNow,$objectId));
      }

      return $response->withJson("Additonal questions updated");
      break;

    default:
      return setErrorResponse($response, "DATA_UPDATE_FAILED");
      break;
  }

});

// Save Survey Log note
$app->post("/saveSurveyLogNote",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $objectId = $reqData["objectId"];
  $userId = $reqData["userId"];
  $addToFollowup = $reqData["addToFollowup"];
  $note = $reqData["note"];
  $dateNow = gmdate("Y-m-d H:i:s");

  $conn = Util::createConnection();

  $stmt = $conn->prepare("UPDATE Survey_Log SET note=? WHERE objectId=?");
  $stmt->execute(array($note,$objectId));

  if($addToFollowup) {
    $stmt = $conn->prepare("UPDATE Survey_Log SET followupBy=?,followupOnDate=?,followupComments=?, flagged=0 WHERE objectId=?");
    $stmt->execute(array($userId,$dateNow,$note,$objectId));
  }

  return $response->withJson(array("status"=>"success","message"=>"Note added to survey response"));

});

// Set flag for survey log
$app->post("/saveSurveyLogFlag",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $objectId = $reqData["objectId"];
  $flagged = $reqData["flagged"];
  $conn = Util::createConnection();

  $stmt = $conn->prepare("UPDATE Survey_Log SET flagged=? WHERE objectId=?");
  $stmt->execute(array($flagged,$objectId));

  return $response->withJson(array("status"=>"success","message"=>"Flag set successfully"));

});

// Save survey log followup info
$app->post("/saveSurveyLogFollowup",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $objectId = $reqData["objectId"];
  $userId = $reqData["userId"];
  $note = $reqData["note"];
  $dateNow = gmdate("Y-m-d H:i:s");

  $conn = Util::createConnection();

  $stmt = $conn->prepare("UPDATE Survey_Log SET followupBy=?,followupOnDate=?,followupComments=?, flagged=0 WHERE objectId=?");
  $stmt->execute(array($userId,$dateNow,$note,$objectId));

  return $response->withJson(array("status"=>"success","message"=>"Data saved","data"=>array("followupOnDate"=>$dateNow)));

});

// Undo resolved action item
$app->post("/undoResolvedActionItem",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $objectId = $reqData["objectId"];

  $conn = Util::createConnection();

  $stmt = $conn->prepare("UPDATE Survey_Log SET followupBy=NULL,followupOnDate=NULL,followupComments=NULL, flagged=1 WHERE objectId=?");
  $stmt->execute(array($objectId));

  return $response->withJson(array("status"=>"success","message"=>"Undo resolved status success"));

});

/**
 * Common function to fetch client and staff lists for surveys
 */

// Returns client list for a survey
function clientListForSurvey($surveyId, $limit = 0) {

  $conn = Util::createConnection();
  $limitClause = "";
  
  // fetch Survey Information
  $stmt = $conn->query("SELECT * FROM Survey WHERE objectId = " . $conn->quote($surveyId));

  if(!($stmt !== false && $stmt->rowCount() > 0 && ($survey = $stmt->fetch(PDO::FETCH_ASSOC))!=false)) {
    return FALSE;
  }

  if($limit) {
    $limitClause = "LIMIT $limit";
  }

  // If project survey return with client list from survey object
  if($survey["type"]=="4") {
    $retArr = [];
    $clientList = json_decode($survey["clientList"],true);

    foreach ($clientList as $key => &$value) {
      // Set other key/values
      $value["clientId"] = "0";
      $value["vendorId"] = $survey["vendorId"];
      $value["organisation"] = "NA";
      $value["phone"] = "NA";
      $value["drl"] = "0";
      $value["drlName"] = "NA";
    }
    
    // return client list
    return $clientList;
  }
  
  /**
   * For Client/Pulse survey types
   * Fetch client list from Client table
   */

  // If limited to DRL or categories then create where clause
  $drlWhereClause = "";
  $catWhereClause = "";

  if(isset($survey["includeDRLS"])) {
    $drlArr = json_decode($survey["includeDRLS"],true);

    if(count($drlArr)>0) {
      $drlWhereClause = "Client.drl IN('" . implode("','", $drlArr) . "')";

    }

  }

  if(isset($survey["includeCategories"])) {
    $catArr = json_decode($survey["includeCategories"],true);

    if(count($catArr)>0) {
      $catWhereClause = "Client.category IN('" . implode("','", $catArr) . "')";

    }
  }

  $whereClause = " WHERE Client.active=1 AND Client.sendSurveyEmail=1 AND Client.isDeleted=0 AND Client.vendorId = '" . $survey["vendorId"] . "' ";

  if(intval($survey["newClientsOnly"])==1) {
    $whereClause .= "AND Client.objectId NOT IN(SELECT clientId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";
  }

  if($drlWhereClause != "") $whereClause .= " AND " . $drlWhereClause;
  if($catWhereClause != "") $whereClause .= " AND " . $catWhereClause;

  $sql = "SELECT Client.objectId as clientId, Client.vendorId, Client.name, Client.organisation, Client.phone,Client.email, Client.drl, CONCAT(User.firstName, ' ',User.lastName) as drlName from Client " .
          " INNER JOIN User ON Client.drl = User.objectId "  .
          $whereClause .
          " ORDER BY Client.name " . $limitClause;

  $stmt->closeCursor();
  $stmt = $conn->query($sql);

  if($stmt && $stmt->rowCount() > 0 && ($clients = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $clients;
  }

  else {
    return FALSE;
  }
}

// Returns staff list for a survey
function staffListForSurvey($surveyId, $limit = 0) {

  $conn = Util::createConnection();
  $limitClause = "";

  if($limit) {
    $limitClause = "LIMIT $limit";
  }

  // Fetch Survey and Organisation info
  $stmt = $conn->query("SELECT * from Survey " .
                       "WHERE Survey.objectId = " . $conn->quote($surveyId));

  if($stmt === false || $stmt->rowCount()===0 || ($survey=$stmt->fetch(PDO::FETCH_ASSOC))===false) {
    return FALSE;
  }

  $vendorId = $survey["vendorId"];
  $excludeEmployeesWhereClause = "";

  if(isset($survey["excludeEmployees"])) {
    $excludeEmployeesArr = json_decode($survey["excludeEmployees"], true);

    if(count($excludeEmployeesArr)>0) {
      $excludeEmployeesWhereClause = "User.objectId NOT IN('" . implode("','", $excludeEmployeesArr) . "')";
    }
  }

  $whereClause = " WHERE User.active=1 AND User.isDeleted=0 AND User.type=0 AND User.vendorId=" . $conn->quote($vendorId) . " ";
  if ($excludeEmployeesWhereClause !== "") $whereClause .= "AND " . $excludeEmployeesWhereClause;

  $whereClause .= "AND User.objectId NOT IN(SELECT staffId FROM Survey_Log WHERE surveyId=" . $conn->quote($survey["objectId"]) . ") ";

  $sql = "SELECT User.objectId, User.vendorId, User.email,User.department,User.designation, CONCAT(User.firstName, ' ',User.lastName) as employeeName FROM User " .
         $whereClause . " ORDER BY User.firstName " . $limitClause;

  $stmt->closeCursor();
  $stmt = $conn->query($sql);
  if($stmt && $stmt->rowCount() > 0 && ($users = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
    return $users;
  }

  else {
    return [];
  }

}

// Send kudos email
$app->Post('/sendKudos', function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $fromName = $reqData["fromName"];
  $fromEmail = $reqData["fromEmail"];
  $toEmails = $reqData["toEmails"];
  $comment = $reqData["comment"];
  $client = $reqData["client"];
  $vendorId = $reqData["vendorId"];
  $kudos = $reqData["kudos"];

  // Update kudos in db
  $conn = Util::createConnection();
  $stmt = $conn->prepare("UPDATE Survey_Log SET kudos=? WHERE objectId=? LIMIT 1");
  $stmt->execute(array(json_encode($kudos),$reqData["objectId"]));

  // Send email;
  $logo = "<img alt='Logo' style='margin-bottom:25px;max-width:300px' src='https://www.clientculture.net/assets/images/app-logo.png'/>";
  // Get the logo and replace if exists
  $conn = Util::createConnection();
  // fetch Survey/Organisation/Settings
  $stmt = $conn->query("SELECT logo FROM Vendor " .
                       "WHERE objectId = " . $conn->quote($vendorId));

  if($stmt !== false && $stmt->rowCount() > 0 && ($vendor = $stmt->fetch(PDO::FETCH_ASSOC))!=false) {
    $vendorLogo = $vendor["logo"];
    if(isset($vendorLogo) && file_exists(UPLOAD_DIR . $vendorId . "/" . $vendorLogo)) {    //insert logo into email
      $logo = "<img alt='Logo' width='300' style='margin-bottom:25px;width:100%;max-width:300px;height:auto' src='" . FULL_PATH_UPLOAD_DIR . $vendorId . "/" . $vendorLogo . "'/>";
    }
  }

  // Contruct the email
  $emailBody = "<p>" . preg_replace("/\r\n|\r|\n/", '<br/>', $comment) . "</p>";
  $emailBody .= "<table border='0' cellpadding='10' cellspacing='0' width='100%' class='text-small'>";

  if(intval($client["score"])>8){
    $scoreClass = "bg-promoter";
  } else if(intval($client["score"])<=6){
    $scoreClass = "bg-detractor";
  } else {
    $scoreClass = "bg-neutral";
  }

  $commentClass="";
  if(trim($client['comments'])==""){
    $client['comments'] = "No comments provided";
    $commentClass = "text-empty";
  }
  
  $emailBody .= "<tr>" .
                  "<td align='left' valign='top' width='100' class='bottom-border-light'>" .
                    "<span class='score-label $scoreClass'>{$client['score']}</span>" .
                  "</td>" .
                  "<td align='left' valign='top' width='200' class='bottom-border-light'>" .
                    $client["name"] .
                  "</td>" .
                  "<td align='left' valign='top' width='300' class='bottom-border-light $commentClass'>" .
                  $client['comments'] .
                  "</td>" .
                "</tr>" . 
                "<tr><td colspan='3'></td></tr>" . 
                "<tr>" . 
                "<td colspan='3'><a href=mailto:" . $fromEmail . ">Click here</a>" . " to respond to " . $fromName . 
                "</td></tr>";
  
  $emailBody .= "</table>";

  // Testing
  // $toEmails = [
  //   [
  //     "name" => "Greg Tilse",
  //     "email" => "gtilse@clientculture.com"
  //   ]
  // ];

  // $toEmails = [
  //   [
  //     "name" => "Tabraiz",
  //     "email" => "tjdada@gmail.com"
  //   ]
  // ];
  

  Util::sendKudosEmail($toEmails,"New message from $fromName via Client Culture",$emailBody, $logo);
});
?>
