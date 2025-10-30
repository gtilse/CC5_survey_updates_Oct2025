<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Generic record save
$app->post("/saverecord",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $tableName = $reqData["tableName"];
  $data = $reqData["data"];

  unset($data["createdAt"]);
  unset($data["updatedAt"]);

  $whereClause = "";

  $objectId=$data["objectId"];
  $tmpArray = array();

  if($objectId =="0") {     //New Record
    $objectId = $data["objectId"] = Util::createID();
    $sql = "INSERT INTO $tableName SET ";
  }

  else {                //Update current record
    $sql = "UPDATE $tableName SET ";
    unset($data["objectId"]);
    $whereClause = " WHERE objectId='" . $objectId . "'";
  }

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
                       "FROM $tableName WHERE objectId='$objectId' LIMIT 1");

  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  return $response->withJson($row);

});

// Generic delete record
$app->post("/deleteRecords",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $tableName = $reqData["tableName"];
  $records = $reqData["records"];

  $conn = Util::createConnection();
  $array = implode("','",$records);

  $count = $conn->exec("UPDATE $tableName SET isDeleted=1 WHERE objectId IN ('" . $array . "')");
  if($count)
    return $response->withJson(array("message"=>"Deleted successfully"));
  else
    return setErrorResponse($response, "DATA_DELETE_FAILED");

});

// Generic deactivate records
$app->post("/deactivateRecords",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $tableName = $reqData["tableName"];
  $records = $reqData["records"];

  $conn = Util::createConnection();
  $array = implode("','",$records);

  $count = $conn->exec("UPDATE $tableName SET active=0 WHERE objectId IN ('" . $array . "')");
  if($count)
    return $response->withJson(array("message"=>"Deactivated successfully"));
  else
    return setErrorResponse($response, "DATA_DEACTIVATE_FAILED");

});

// Submit app feedback
$app->post("/submitAppFeedback", function(Request $request, Response $response) {
  
  $reqData = $request->getParsedBody();

  $emailBody = "<p>Organisation: {$reqData['companyName']}</p>" .
               "<p>User: {$reqData['user']}</p>" .
               "<p>App Area: {$reqData['appArea']}</p>" .
               "<p>Feedback Type: {$reqData['feedbackType']}</p>" .
               "<p>Feedback:</p>" .
               "<p>{$reqData['feedbackText']}</p>";

  //Util::sendSupportEmail("Tabraiz Dada","tjdada@gmail.com","Client Culture - Feedback received",$emailBody);
  Util::sendSupportEmail("Greg Tilse","gtilse@clientculture.com","Client Culture - Feedback received",$emailBody);

  return $response->withJson(array("message"=>"Feedback sent"));
}); 

?>
