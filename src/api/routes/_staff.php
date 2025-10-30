<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Employees
$app->post("/employees",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,vendorId,active,parentId,type,level,userOverrideId,locationId,firstName," .
    "middleName,lastName,picture,userName,email,designation,department,phone,mobile,locationName, staffSurveyOnly, " .
    "CONVERT_TZ(lastSuccessfulLogin, @@session.time_zone, '+00:00') AS lastSuccessfulLogin, " .
    "CONVERT_TZ(lastFailedLogin, @@session.time_zone, '+00:00') AS lastFailedLogin, " .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt, " .
    "loginHistory FROM User " .
    "WHERE vendorId='$vendorId' AND type=0 AND isDeleted=0 ORDER BY firstName"
  );

  if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);

  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});

// Get employee info
$app->post("/getEmployeeInfo",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $vendorId = $reqData["vendorId"];
  $staffId = $reqData["staffId"];
  $staffInfo = [];

  $stmt = $conn->query(
    "SELECT u.objectId,u.vendorId,u.active,u.type,u.level,u.firstName," .
    "u.middleName,u.lastName,u.picture,u.userName,u.email,u.designation,u.department,u.phone,u.mobile, " .
    "u.createdAt, u.updatedAt, " .
    "CONCAT(up.firstName,' ',up.lastName) AS parentName " .
    "FROM User u LEFT JOIN User up ON u.parentId=up.objectId " .
    "WHERE u.vendorId='$vendorId' AND u.objectId='$staffId'"
  );

  if($stmt && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    $staffInfo["staffInfo"] = $row;
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  $stmt->closeCursor();
  // Get surveys for the staff
  $sql = "SELECT sl.objectId,sl.clientId,sl.score,sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.sentOnDate,sl.reminderSentOnDate,sl.emailStatus, " .
         "sl.followupOnDate, sl.followupComments, sl.followupBy AS followupById," .
         "CONCAT(uf.firstName, ' ',uf.lastName) as followupByName, " .
         "s.description as surveyDescription " .
         "FROM Client c INNER JOIN " .
         "Survey_Log sl ON sl.clientId = c.objectId " .
         "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
         "INNER JOIN User u ON u.objectId = c.drl " .
         "LEFT JOIN User uf ON uf.objectId = sl.followupBy " .
         "WHERE c.drl='$staffId' " .
         "ORDER BY sl.sentOnDate DESC";

  $stmt = $conn->query($sql);
  $staffInfo["surveys"] = [];
  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    $staffInfo["surveys"] = $rows;
  }

  return $response->withJson($staffInfo);

});

// Locations
$app->post("/locations",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,vendorId,name,address,city,state,postCode," .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM Location " .
    "WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY name"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});

// Employees/locations select list
$app->post("/employeesLocationsSelectList",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $includeLocations = $reqData["includeLocations"] ? "" : " AND type=0 ";

  $stmt = $conn->query(
    "SELECT objectId,active,type,locationName, CONCAT(firstName,' ',lastName) as fullName " .
    "FROM User " .
    "WHERE vendorId='$vendorId' $includeLocations AND isDeleted=0"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Staff select list
$app->post("/staffSelectList",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,active,level,locationName, CONCAT(firstName,' ',lastName) as name " .
    "FROM User " .
    "WHERE vendorId='$vendorId' AND type=0 ORDER BY firstName"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Descendants for user
$app->post("/descendantsForUser",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $userId = $reqData["userId"];

  $children = Util::getChildrenArray($conn,$vendorId,$userId);
  if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

  return $response->withJson($children);

});

// Assign login
$app->post("/assignLogin",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $objectId = $reqData["objectId"];
  $userName = $reqData["userName"];
  $password = $reqData["password"];
  $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

  // Check if username is not already taken
  $stmt = $conn->query(
    "SELECT objectId FROM User where userName = '$userName' LIMIT 1"
  );

  if($stmt && $stmt->rowCount()>0){
    return setErrorResponse($response, "USER_ALREADY_EXIST");
  }

  // Assign login and password
  $count = $conn->exec("UPDATE User SET userName='$userName', password = '$hashedPassword' WHERE objectId='$objectId'");
  if($count===0){
    return setErrorResponse($response, "DATA_UPDATE_FAILED");
  }

  return $response->withJson(array("message"=>"Record updated"));

});

// Assign login
$app->post("/removeLogin",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $objectId = $reqData["objectId"];

  $count = $conn->exec("UPDATE User SET userName=NULL, password = NULL WHERE objectId='$objectId'");
  if($count===false){
    return setErrorResponse($response, "DATA_UPDATE_FAILED");
  }

  return $response->withJson(array("message"=>"Record updated"));

});



?>
