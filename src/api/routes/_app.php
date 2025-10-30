<?php

/**
 * Application configuration data
 * Applies to all users of the app
 */

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// App loyalty drivers list
$app->post("/appLoyaltyDrivers",function(Request $request, Response $response){
    $reqData = $request->getParsedBody();
    $conn = Util::createConnection();
    $stmt = $conn->query("SELECT * FROM LoyaltyDriver ORDER BY sortOrder");
    if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
        return $response->withJson($rows);
      } else {
        return $response->withJson([]);
    }
});

// App custom questions list
$app->post("/appCustomQuestions",function(Request $request, Response $response){
    $reqData = $request->getParsedBody();
    $conn = Util::createConnection();

    $sql = "SELECT cq.*, " .
           "GROUP_CONCAT(CONCAT_WS(';;;;',cql.objectId,cql.customQuestionId,cql.description,cql.weight) ORDER BY cql.weight DESC SEPARATOR '++++') AS customQuestionList " .
           "FROM CustomQuestion cq LEFT JOIN CustomQuestionList cql " .
           "ON cq.objectId = cql.customQuestionId " .
           "GROUP BY cq.objectId " .
           "ORDER BY cq.sortOrder";

    $stmt = $conn->query($sql);
    if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
        return $response->withJson($rows);
      } else {
        return $response->withJson([]);
    }
    
});


?>