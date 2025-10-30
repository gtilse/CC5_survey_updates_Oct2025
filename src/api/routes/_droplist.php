<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Drop Lists
$app->post("/droplists",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT objectId,vendorId,category,description, " .
    "CONVERT_TZ(createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM DropList " .
    "WHERE vendorId='$vendorId' ORDER BY category, description"
  );

  if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return $response->withJson([]);
  }
});

// Custom categories
$app->post("/droplistCustomCategories",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];

  $stmt = $conn->query(
    "SELECT DISTINCT category from DropList " .
    "WHERE vendorId='$vendorId' AND isCustom=1 ORDER BY category"
  );

  if($stmt && $stmt->rowCount()>0 && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return $response->withJson([]);
  }


});


?>
