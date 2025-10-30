<?php

/**
 * Application configuration data
 * Applies to all users of the app
 */

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Quarterly data
$app->get("/quarterly_results",function(Request $request, Response $response){

    // 
    $headers = apache_request_headers();
    if (!isset($headers['x-api-secret'])) {
        return $response->withStatus(400)->withHeader("Content-Type","application/json")->withJson(array("code"=>400,"message"=>"Invalid key"));
    }

    // Make sure we have an api key an it matches
    $vendorId = NULL;
    $apiKeys = unserialize(API_KEYS);

    foreach ($apiKeys as $k => $v) {
        if($headers['x-api-secret'] === $k) {
            $vendorId =  $apiKeys[$k];
        }
    }

    if($vendorId === NULL) {
        return $response->withStatus(400)->withHeader("Content-Type","application/json")->withJson(array("code"=>400,"message"=>"Invalid key value"));
    }


    $conn = Util::createConnection();
    $sql =  "select YEAR(sl.sentOnDate) 'YEAR', QUARTER(sl.sentOnDate) 'QUARTER', CONCAT(u.firstName, ' ', u.lastName) AS 'NAME'," .
            "u.department AS 'DEPARTMENT', u.designation AS 'DESIGNATION'," .
            "COUNT(IFNULL(sl.score, 1)) AS 'NON RESPONDERS', COUNT(sl.score) AS 'RESPONDERS'," .
            "SUM(CASE WHEN sl.score >= 9 THEN 1 ELSE 0 END) AS 'PROMOTERS', SUM(CASE WHEN sl.score <= 6 THEN 1 ELSE 0 END) AS 'DETRACTORS'," .
            "SUM(CASE WHEN sl.followupOnDate IS NOT NULL THEN 1 ELSE 0 END) AS 'FOLLOWUP COUNT' " .
            "FROM Survey_Log sl " .
            "INNER JOIN Client c ON c.objectId = sl.clientId " .
            "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
            "WHERE sl.vendorId = '$vendorId' AND sl.sentOnDate IS NOT NULL AND sl.emailId IS NOT NULL " .
            "GROUP BY YEAR(sl.sentOnDate), QUARTER(sl.sentOnDate), CONCAT(u.firstName, ' ', u.lastName) ";

    $stmt = $conn->query($sql);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $k => &$v) {
        $responders = intval($v["RESPONDERS"]);
        $nonResponders = intval($v["NON RESPONDERS"]);
        $promoters = intval($v["PROMOTERS"]);
        $detractors = intval($v["DETRACTORS"]);
        $followupCount = intval($v["FOLLOWUP COUNT"]);

        $percentPromoters =  ($promoters > 0) ? (($promoters / $responders) * 100) : 0;
        $percentDetractors = ($detractors > 0) ? (($detractors / $responders) * 100) : 0;

        $v["NPS"] = round($percentPromoters - $percentDetractors);
        $v["RESPONSE RATE"] = round(($responders / ($responders +$nonResponders))*100);
        $v["FOLLOWUP RATE"] = $detractors > 0 ? round(($followupCount / $detractors)*100) : 0;
    }

    return $response->withJson($results);
    
});

?>