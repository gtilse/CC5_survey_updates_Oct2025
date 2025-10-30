<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Organisation
$app->post("/organisation",function(Request $request, Response $response) {
  
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,name,email,logo,address,city,state,postCode,primaryContact,secondaryContact,alternateEmail,phone,fax,mobile FROM Vendor " .
    "WHERE objectId='$vendorId'"
  );

  if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($row);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});

// Organisation Setting
$app->post("/organisationSetting",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,vendorId,surveyEmailFrom,notificationsEmail,followupDays," .
    "emailMessageNotification,googlePage,facebookPage,truelocalPage,displaySocialLinksInSurvey," .
    "automatedEmailSocialMedia,socialMediaReminderDays,socialLinksBeforeComments,testimonialType," .
    "bouncedEmailNotification,pendingActionItemsNotification,newResponsesNotification,clientSurveyLimit,clientCheckIn,surveySchedule,surveyScheduleCustom,vendorLevel," .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM Setting " .
    "WHERE vendorId='$vendorId'"
  );

  if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($row);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});


?>
