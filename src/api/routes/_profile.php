<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// User profile
$app->post("/profile",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $objectId = $reqData["objectId"];

  $stmt = $conn->query(
    "SELECT objectId, vendorId, level, firstName, middleName, lastName, picture, designation," .
    "department,phone,mobile,userName,email," .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM User WHERE type=0 AND isDeleted=0 and objectId='$objectId' AND vendorId='$vendorId'"
  );

  if($stmt && $stmt->rowCount()>0 && ($userInfo=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    $stmt->closeCursor();
    $userInfo["loginHistory"] = [];
    $userInfo["lastSuccessfulLogin"] = NULL;
    $userInfo["lastFailedLogin"] = NULL;

    // Login history
    $stmt = $conn->query(
      "SELECT status, ipAddress, createdAt FROM LoginHistory WHERE userId='$objectId' AND status=1 ORDER BY createdAt DESC LIMIT 10"
    );

    if($stmt && $stmt->rowCount()>0 && ($loginHistory=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
      $userInfo["loginHistory"] = $loginHistory;
    }

    // Last successful login
    $stmt->closeCursor();
    $stmt = $conn->query("SELECT createdAt FROM LoginHistory WHERE userId='$objectId' AND status=1 ORDER BY createdAt DESC LIMIT 1");
    if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
      $userInfo["lastSuccessfulLogin"] = $row["createdAt"];
    }

    // Last failed login
    $stmt->closeCursor();
    $stmt = $conn->query("SELECT createdAt FROM LoginHistory WHERE userId='$objectId' AND status=0 ORDER BY createdAt DESC LIMIT 1");
    if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
      $userInfo["lastFailedLogin"] = $row["createdAt"];
    }

    return $response->withJson($userInfo);

  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});

// User profile save
$app->post("/saveUserProfile",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $data = $reqData["data"];

  unset($data["createdAt"]);
  unset($data["updatedAt"]);
  unset($data["loginHistory"]);
  unset($data["lastSuccessfulLogin"]);
  unset($data["lastFailedLogin"]);

  $conn = Util::createConnection();

  $whereClause = "";

  $objectId=$data["objectId"];
  $tmpArray = array();

  $sql = "UPDATE User SET ";
  unset($data["objectId"]);
  $whereClause = " WHERE objectId='" . $objectId . "'";

  foreach($data as $key=>$value) {

    if(isset($data[$key]) && !is_numeric($data[$key]) && trim($data[$key])=='') {
      $data[$key] = NULL;
    }

    $keyName = ":" . $key;
    $tmpArray[] = "$key=$keyName";
  }

  $sql .= implode(",",$tmpArray) . $whereClause;

  // create the connection and execute statement
  $conn = Util::createConnection();
  $stmt=$conn->prepare($sql);
  $stmt->execute($data);

  // Fetch createdAt and updatedAt for the record
  $stmt->closeCursor();
  $stmt = $conn->query("SELECT objectId,CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt,CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
                       "FROM User WHERE objectId='$objectId' LIMIT 1");

  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  return $response->withJson($row);

});

// Update password
$app->post("/updateUserPassword",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $password = $reqData["password"];
  $objectId = $reqData["objectId"];

  $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
  $count = $conn->exec("UPDATE User SET PASSWORD = '$hashedPassword' WHERE objectId='$objectId'");
  if($count===false){
    return setErrorResponse($response, "DATA_UPDATE_FAILED");
  }

  return $response->withJson(array("message"=>"Record updated"));

});


?>
