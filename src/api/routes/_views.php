<?php

  use \Psr\Http\Message\ServerRequestInterface as Request;
  use \Psr\Http\Message\ResponseInterface as Response;

  // Dashboard for logged user
  $app->post("/dashboardForLoggedUser",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $clientFilterParam = $reqData["params"]["clientFilterParam"];
    $staffFilterParam = $reqData["params"]["staffFilterParam"];
    $startDate = $reqData["params"]["startDate"];
    $endDate = $reqData["params"]["endDate"];
    $conn = Util::createConnection();
    $retArr = [];

    $clientFilterCol = "";
    $clientFilterVal = "";
    $clientCustomCategoriesWhere = "";

    if(!empty($clientFilterParam)){
      $arr = explode("_",$clientFilterParam);
      switch ($arr[0]) {
        case "Account Value":
          $clientFilterCol = "c.category";
          $clientFilterVal = $arr[1];
          break;
        
        case "Group":
          $clientFilterCol = "c.clientGroup";
          $clientFilterVal = $arr[1];
          break;

        case "Industry":
          $clientFilterCol = "c.industry";
          $clientFilterVal = $arr[1];
          break;

        case "Department":
          $clientFilterCol = "u.department";
          $clientFilterVal = $arr[1];
          break;

        default:     // Custom droplist category
          $clientCustomCategoriesWhere = " AND ((c.customCategory1 = '$arr[0]' AND c.customCategory1Desc = '$arr[1]') OR " .
                                         "(c.customCategory2 = '$arr[0]' AND c.customCategory2Desc = '$arr[1]') OR " .
                                         "(c.customCategory3 = '$arr[0]' AND c.customCategory3Desc = '$arr[1]')) ";

          $clientFilterParam = "";
          break;
      }

      
    }

    // Get staff list (primary & secondary)
    $staffList = Util::getChildrenArray($conn, $vendorId, $userId);
    if($staffList===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    $retArr["staff"] = $staffList;

    // Get children
    $children = Util::getChildrenArray($conn, $vendorId, $userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    // Get client groups
    $clientGroups = [];
    $clientGroups["Account Value"] = array_keys($GLOBALS["CLIENT_CATEGORY_SORT"]);
    
    $stmt = $conn->query("SELECT DISTINCT description FROM DropList WHERE category='Client Industry' AND vendorId='$vendorId' AND isDeleted=0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $clientGroups["Industry"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      array_walk($clientGroups["Industry"], function(&$value, $key) { $value = $value["description"]; } );
    }

    $stmt->closeCursor();

    $stmt = $conn->query("SELECT DISTINCT description FROM DropList WHERE category='Client Category' AND vendorId='$vendorId' AND isDeleted=0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $clientGroups["Group"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      array_walk($clientGroups["Group"], function(&$value, $key) { $value = $value["description"]; } );
    }

    $stmt->closeCursor();

    $stmt = $conn->query("SELECT DISTINCT description FROM DropList WHERE category='Department' AND vendorId='$vendorId' AND isDeleted=0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $clientGroups["Department"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      array_walk($clientGroups["Department"], function(&$value, $key) { $value = $value["description"]; } );
    }

    $stmt->closeCursor();

    // Get the custom categories
    $stmt = $conn->query("SELECT category, description FROM DropList WHERE isCustom = 1 AND vendorId='$vendorId' AND isDeleted = 0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
      foreach($rows as $value){
        if(!array_key_exists($value["category"],$clientGroups)) {
          $clientGroups[$value["category"]] = [];
        }

        $clientGroups[$value["category"]][] = $value["description"];

      }
    }


    // Transform data to send back
    $arWrapper = array();
    $arWrapper['key'] = array_keys($clientGroups);
    $arWrapper['value'] = $clientGroups;

    $retArr["clientGroups"] = $arWrapper;

    $stmt->closeCursor();

    // Get summaries by staff
    $whereClause = "";

    if(!empty($staffFilterParam)){
      $whereClause .= "AND (CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END)='$staffFilterParam' ";
    }

    if(!empty($clientFilterParam)){
      $whereClause .= "AND $clientFilterCol = '$clientFilterVal' ";

    } 

    $whereClause .= "AND ((CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END) IN(";
      $whereArr = [];

      foreach ($children as $key => $value) {
        $whereArr[] = $conn->quote($value["objectId"]);
      }
      $whereClause .= implode(",",$whereArr) . ")) ";

    if(isset($startDate) && isset($endDate)) {
      $whereClause .= "AND sl.sentOnDate >= '$startDate' AND sl.sentOnDate <= '$endDate' ";
    }

    $sql = "SELECT YEAR(sl.createdAt) AS year, MONTH(sl.createdAt) AS month, " .
          "CONCAT(u.firstName, ' ', u.lastName) AS drlName, u.objectId AS drlId, " .
          "COUNT(sl.score) as count, COUNT(*) as countTotal, " .
          "SUM(CASE WHEN sl.score >=9 THEN 1 ELSE 0 END) AS promoters, " .
          "SUM(CASE WHEN sl.score >6 AND sl.score<=8 THEN 1 ELSE 0 END) AS neutrals," .
          "SUM(CASE WHEN sl.score <=6 THEN 1 ELSE 0 END) AS detractors," .
          "SUM(CASE WHEN (sl.followupOnDate IS NOT NULL AND sl.score >=9) THEN 1 ELSE 0 END) AS followupPromoters," .
          "SUM(CASE WHEN (sl.followupOnDate IS NOT NULL AND sl.score >6 AND sl.score <=8) THEN 1 ELSE 0 END) AS followupNeutrals," .
          "SUM(CASE WHEN (sl.followupOnDate IS NOT NULL AND sl.score <=6) THEN 1 ELSE 0 END) AS followupDetractors," .
          "SUM(sl.score) AS scoreTotal " .
          "FROM Survey_Log sl INNER JOIN Client c ON c.objectId = sl.clientId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL " . $whereClause . $clientCustomCategoriesWhere .
          "GROUP BY YEAR(sl.createdAt), MONTH(sl.createdAt), CONCAT(u.firstName, ' ', u.lastName),u.objectId " .
          "ORDER BY YEAR(sl.createdAt) ASC, MONTH(sl.createdAt) ASC,CONCAT(u.firstName, ' ', u.lastName) ASC";
    
    $staffResponses = [];
    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $staffResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);
      foreach($staffResponses as $key=>$value){
        $staffResponses[$key]["count"] = intval($staffResponses[$key]["count"]);
        $staffResponses[$key]["countTotal"] = intval($staffResponses[$key]["countTotal"]);
        $staffResponses[$key]["promoters"] = intval($staffResponses[$key]["promoters"]);
        $staffResponses[$key]["neutrals"] = intval($staffResponses[$key]["neutrals"]);
        $staffResponses[$key]["detractors"] = intval($staffResponses[$key]["detractors"]);
        $staffResponses[$key]["scoreTotal"] = intval($staffResponses[$key]["scoreTotal"]);
        $staffResponses[$key]["followupDetractors"] = intval($staffResponses[$key]["followupDetractors"]);
        $staffResponses[$key]["followupNeutrals"] = intval($staffResponses[$key]["followupNeutrals"]);
        $staffResponses[$key]["followupPromoters"] = intval($staffResponses[$key]["followupPromoters"]);
      }
    }

    $retArr["staffResponses"] = $staffResponses;
    $stmt->closeCursor();

    // Get summaries for organisation
    $whereClause = "";
    if(isset($startDate) && isset($endDate)) {
      $whereClause .= "AND sl.sentOnDate >= '$startDate' AND sl.sentOnDate <= '$endDate' ";
    }

    $sql = "SELECT YEAR(sl.createdAt) AS year, MONTH(sl.createdAt) AS month, " .
          "COUNT(sl.score) as count, COUNT(*) as countTotal, " .
          "SUM(CASE WHEN sl.score >=9 THEN 1 ELSE 0 END) AS promoters, " .
          "SUM(CASE WHEN sl.score >6 AND sl.score<=8 THEN 1 ELSE 0 END) AS neutrals," .
          "SUM(CASE WHEN sl.score <=6 THEN 1 ELSE 0 END) AS detractors," .
          "SUM(sl.score) AS scoreTotal " .
          "FROM Survey_Log sl INNER JOIN Client c ON c.objectId = sl.clientId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL $whereClause " .
          "GROUP BY YEAR(sl.createdAt), MONTH(sl.createdAt) " .
          "ORDER BY YEAR(sl.createdAt) DESC, MONTH(sl.createdAt) DESC";
    
    $orgResponses = [];
    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $orgResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);
      foreach($orgResponses as $key=>$value){
        $orgResponses[$key]["count"] = intval($orgResponses[$key]["count"]);
        $orgResponses[$key]["countTotal"] = intval($orgResponses[$key]["countTotal"]);
        $orgResponses[$key]["promoters"] = intval($orgResponses[$key]["promoters"]);
        $orgResponses[$key]["neutrals"] = intval($orgResponses[$key]["neutrals"]);
        $orgResponses[$key]["detractors"] = intval($orgResponses[$key]["detractors"]);
        $orgResponses[$key]["scoreTotal"] = intval($orgResponses[$key]["scoreTotal"]);
      }
    }

    $retArr["orgResponses"] = $orgResponses;
    $stmt->closeCursor();

    // get all scores for users
    $whereClause = "";

    if(!empty($staffFilterParam)){
      $whereClause .= "AND c.drl='$staffFilterParam' ";
    }

    if(!empty($clientFilterParam)){
      $whereClause .= "AND $clientFilterCol = '$clientFilterVal' ";

    }

    $whereClause .= "AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }
    $whereClause .= implode(",",$whereArr) . ")) ";

    $dateWhereClause = "";
    if(isset($startDate) && isset($endDate)) {
      $dateWhereClause .= "AND sl.sentOnDate >= '$startDate' AND sl.sentOnDate <= '$endDate' ";
    }

    $sql = "SELECT c.name, c.email, c.phone, c.industry, c.category, c.clientSince, c.clientSinceYear,c.drlInclude,c.drl," .
          "sl.objectId,sl.surveyId,sl.clientId,sl.score,sl.useCommentsAsTestimonial,sl.loyaltyDrivers, msl.allScores,msl.allReceivedOnDates,msl.allComments, sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.messageId, sl.followupOnDate,sl.additionalQuestions," .
          "s.description as surveyDescription," .
          "u.objectId as drlId, CONCAT(u.firstName, ' ',u.lastName) as drlName, se.testimonialType " .
          "FROM Client c INNER JOIN (SELECT clientId, MAX(receivedOnDate) as receivedOnDate," .
          "GROUP_CONCAT(score ORDER BY receivedOnDate) AS allScores,GROUP_CONCAT(receivedOnDate ORDER BY receivedOnDate) AS allReceivedOnDates," .
          "GROUP_CONCAT(comments ORDER BY receivedOnDate SEPARATOR '++++') AS allComments from Survey_Log GROUP BY clientId) msl " .
          "ON c.objectId = msl.clientId " .
          "INNER JOIN Survey_Log sl ON sl.clientId = msl.clientId AND sl.receivedOnDate = msl.receivedOnDate " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
          "WHERE c.isDeleted=0 AND sl.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId='$vendorId' AND s.type=0 " .
          $whereClause . $dateWhereClause . $clientCustomCategoriesWhere .
          "ORDER BY sl.receivedOnDate DESC";
    
    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $retArr["allScores"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    else {
      $retArr["allScores"] = [];
    }

    $stmt->closeCursor();

    // Settings
    $sql = "SELECT * FROM Setting WHERE vendorId='$vendorId' LIMIT 1";
    $stmt = $conn->query($sql);
    $retArr["setting"] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    // Client counts
    $sql = "SELECT SUM(CASE WHEN c.active = 1 THEN 1 ELSE 0 END) AS activeClients, SUM(CASE WHEN LENGTH(c.drlInclude) > 2 THEN 1 ELSE 0 END) AS sharedClients, " .
          "SUM(CASE WHEN c.referredBefore = 1 THEN 1 ELSE 0 END) AS referredClients, SUM(CASE WHEN c.sendSurveyEmail = 0 THEN 1 ELSE 0 END) AS unsubscribedClients " .
          "FROM Client c INNER JOIN User u ON u.objectId = c.drl " .
          "WHERE c.isDeleted=0 AND c.vendorId='$vendorId' " .
          $whereClause . $clientCustomCategoriesWhere;

    $stmt = $conn->query($sql);
    $retArr["clientSummary"] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    // Send back the response
    return $response->withJson($retArr);

  });

  // Insights by group
  $app->post("/insightsByGroup", function(Request $request, Response $response) {
    
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $startDate = $reqData["startDate"];
    $endDate = $reqData["endDate"];
    $conn = Util::createConnection();

    $children = Util::getChildrenArray($conn, $vendorId, $userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    $whereClause .= "AND ((CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END) IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }
    $whereClause .= implode(",",$whereArr) . ")) ";

    if(isset($startDate) && isset($endDate)) {
      $whereClause .= "AND sl.sentOnDate >= '$startDate' AND sl.sentOnDate <= '$endDate' ";
    }

    // Set group
    switch ($reqData["group"]) {
      case "team":
        $groupColumn = "CONCAT(u.firstName, ' ', u.lastName)";
        break;

      case "department":
        $groupColumn = "u.department";
        break;

      case "value":
        $groupColumn = "c.category";
        break;

      case "group":
        $groupColumn = "c.clientGroup";
        break;

      case "industry":
        $groupColumn = "c.industry";
        break;

      case "clientSince":
        $groupColumn = "c.clientSinceYear";
        break;
      
      default:
        $groupColumn = "CASE WHEN c.customCategory1 = '" . $reqData["group"] . "' THEN c.customCategory1Desc " .
                        "WHEN c.customCategory2 = '" . $reqData["group"] . "' THEN c.customCategory2Desc " . 
                        "WHEN c.customCategory3 = '" . $reqData["group"] . "' THEN c.customCategory3Desc " . 
                        "ELSE 'None' END";
        break;
    }

    $sql = "SELECT YEAR(sl.createdAt) AS year, MONTH(sl.createdAt) AS month, " .
          "$groupColumn AS groupCol, " .
          "COUNT(sl.score) as count, COUNT(*) as countTotal, " .
          "SUM(CASE WHEN sl.score >=9 THEN 1 ELSE 0 END) AS promoters, " .
          "SUM(CASE WHEN sl.score >6 AND sl.score<=8 THEN 1 ELSE 0 END) AS neutrals," .
          "SUM(CASE WHEN sl.score <=6 THEN 1 ELSE 0 END) AS detractors," .
          "SUM(sl.score) AS scoreTotal " .
          "FROM Survey_Log sl INNER JOIN Client c ON c.objectId = sl.clientId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "WHERE sl.vendorId='$vendorId' AND c.isDeleted = 0 AND sl.isDeleted=0 AND s.type=0 AND sl.emailId IS NOT NULL AND u.active=1 " . $whereClause .
          // "GROUP BY YEAR(sl.createdAt), MONTH(sl.createdAt), $groupColumn " .
          // "ORDER BY YEAR(sl.createdAt) ASC, MONTH(sl.createdAt) ASC,$groupColumn ASC";
          "GROUP BY YEAR(sl.createdAt), MONTH(sl.createdAt), groupCol " .
          "ORDER BY YEAR(sl.createdAt) ASC, MONTH(sl.createdAt) ASC,groupCol ASC";

      $retArr = [];
      $stmt = $conn->query($sql);
      if($stmt && $stmt->rowCount()>0) {
        $retArr = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($retArr as $key=>$value){
          $retArr[$key]["count"] = intval($retArr[$key]["count"]);
          $retArr[$key]["countTotal"] = intval($retArr[$key]["countTotal"]);
          $retArr[$key]["promoters"] = intval($retArr[$key]["promoters"]);
          $retArr[$key]["neutrals"] = intval($retArr[$key]["neutrals"]);
          $retArr[$key]["detractors"] = intval($retArr[$key]["detractors"]);
          $retArr[$key]["scoreTotal"] = intval($retArr[$key]["scoreTotal"]);
        }
      }

      return $response->withJson($retArr);
    
  });

  // Dashboard for logged user
  // Delete
  $app->post("/dashboardForLoggedUserX",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $conn = Util::createConnection();

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    // get all scores for users
    // scores are for past 1 year
    $whereClause = "WHERE c.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId=" . $conn->quote($vendorId) . " AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $whereClause .= implode(",",$whereArr) . ")) ";

    $sql = "SELECT c.name, c.email, c.phone, c.industry, c.category, c.clientSince, c.clientSinceYear,c.drlInclude,c.drl," .
          "sl.objectId,sl.surveyId,sl.clientId,sl.score,sl.useCommentsAsTestimonial, msl.allScores,msl.allReceivedOnDates,msl.allComments, sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.messageId, sl.followupOnDate,sl.additionalQuestions," .
          "s.description as surveyDescription," .
          "u.objectId as drlId, CONCAT(u.firstName, ' ',u.lastName) as drlName, se.testimonialType " .
          "FROM Client c INNER JOIN (SELECT clientId, MAX(receivedOnDate) as receivedOnDate," .
          "GROUP_CONCAT(score ORDER BY receivedOnDate) AS allScores,GROUP_CONCAT(receivedOnDate ORDER BY receivedOnDate) AS allReceivedOnDates," .
          "GROUP_CONCAT(comments ORDER BY receivedOnDate SEPARATOR '++++') AS allComments from Survey_Log GROUP BY clientId) msl " .
          "ON c.objectId = msl.clientId " .
          "INNER JOIN Survey_Log sl ON sl.clientId = msl.clientId AND sl.receivedOnDate = msl.receivedOnDate " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = c.drl " .
          "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
          $whereClause .
          "ORDER BY sl.receivedOnDate DESC";

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);
      $retArr = Array("responses"=>$responses);
    }

    else {
      $retArr = Array("responses"=>(Array()));
    }

    $retArr["surveySummary"] = clientSurveySummary($vendorId);

    // $whereClause = "WHERE Survey_Log.vendorId = ". $conn->quote($vendorId) . " AND Client.drl IN(" . implode(",",$whereArr) . ") AND Survey_Log.emailStatus=1 ";
    //
    // $sql = "SELECT Survey_Log.surveyId, Survey.description, MAX(sentOnDate) as maxDate, MAX(reminderSentOnDate) as maxReminderDate, " .
    //        "SUM(CASE WHEN score is not null THEN 1 ELSE 0 END) as scoreCount, SUM(CASE WHEN score >=" . PROMOTERS . " THEN 1 ELSE 0 END) as promoterCount, " .
    //        "SUM(CASE WHEN score <=" . DETRACTORS . " THEN 1 ELSE 0 END) as detractorCount, " .
    //        "COUNT(sentOnDate) as sentCount from Survey_Log INNER JOIN Survey " .
    //        "ON Survey_Log.surveyId=Survey.objectId INNER JOIN Client ON Survey_Log.clientId = Client.objectId " . $whereClause . "group by surveyId order by sentOnDate desc";
    // $stmt = $conn->query($sql);
    //
    // if($stmt->rowCount() > 0) {
    //   $retArr["surveySummary"] = $stmt->fetch(PDO::FETCH_ASSOC);
    // }
    //
    // else
    //   $retArr["surveySummary"] = Array();
    //
    // // fetch organisation summary
    // $stmt->closeCursor();
    //
    // $whereClause = "WHERE sl.vendorId = ". $conn->quote($vendorId);
    // $sql = "SELECT SUM(CASE WHEN score is not null THEN 1 ELSE 0 END) as scoreCount," .
    //        "SUM(CASE WHEN score >=" . PROMOTERS . " THEN 1 ELSE 0 END) as promoterCount, " .
    //        "SUM(CASE WHEN score <=" . DETRACTORS . " THEN 1 ELSE 0 END) as detractorCount " .
    //        "FROM Survey_Log sl INNER JOIN (SELECT clientId, MAX(receivedOnDate) as maxReceivedOnDate FROM Survey_Log GROUP BY clientId) msl ON msl.clientId=sl.clientId AND msl.maxReceivedOnDate=sl.receivedOnDate " . $whereClause;
    // $stmt = $conn->query($sql);
    // if($stmt->rowCount() > 0) {
    //   $retArr["organisationSummary"] = $stmt->fetch(PDO::FETCH_ASSOC);
    // }
    //
    // else
    //   $retArr["organisationSummary"] = Array();

    return $response->withJson($retArr);
  });

  // Get client feedback
  $app->post("/getClientFeedback", function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $clientFilterParam = $reqData["clientFilter"];
    $staffFilterParam = $reqData["staffFilter"];
    $dateRange = $reqData["dateRange"];
    $searchString = $reqData["searchString"];
    $scoreType = $reqData["scoreType"];
    $limit = $reqData["dataLimit"];
    $offset = $reqData["dataOffset"];
    $flagged = $reqData["flagged"];
    $followup = $reqData["followup"];

    $conn = Util::createConnection();

    // Get children
    $children = Util::getChildrenArray($conn, $vendorId, $userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    $whereClause = "";

    // DRLs
    $whereClause .= " AND ((CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END) IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }
    $whereClause .= implode(",",$whereArr) . ") OR c.drlInclude LIKE '%" . $userId . "%') ";
    //$whereClause .= implode(",",$whereArr) . ")) ";

    // Client filter
    $clientFilterCol = "";
    $clientFilterVal = "";

    if(!empty($clientFilterParam)){
      $arr = explode("_",$clientFilterParam);
      switch ($arr[0]) {
        case "Account Value":
          $clientFilterCol = "category";
          break;
        
        case "Group":
          $clientFilterCol = "clientGroup";
          break;

        case "Industry":
          $clientFilterCol = "industry";
          break;
      }

      $clientFilterVal = $arr[1];
    }

    if(!empty($clientFilterParam)){
      $whereClause .= " AND c.$clientFilterCol = '$clientFilterVal' ";
    }

    // Staff filter
    if(!empty($staffFilterParam)){
      $whereClause .= " AND (CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END)='$staffFilterParam' ";
    }

    // Date filter
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.receivedOnDate) > (CURDATE() - INTERVAL $dateRange DAY) ";

    // Score type filter
    if(!empty($scoreType)){
      switch ($scoreType) {
        case 'PROMOTER':
          $whereClause .= " AND sl.score >= " . PROMOTERS;
          break;
        case 'NEUTRAL':
          $whereClause .= " AND sl.score < " . PROMOTERS . " AND sl.score > " . DETRACTORS;
          break;
        case 'DETRACTOR':
          $whereClause .= " AND sl.score <= " . DETRACTORS;
          break;
      }
    }

    // Search string filter
    if(!empty($searchString)) {
      $whereClause .= " AND (LOWER(sl.comments) LIKE LOWER('%$searchString%') OR LOWER(c.name) LIKE LOWER('%$searchString%'))";
    }

    // Followup
    if(!empty($followup)) {
      $whereClause .= ($followup == "TODO" ? " AND sl.flagged=1 AND sl.followupOnDate IS NULL " : " AND sl.flagged=1 AND sl.followupOnDate IS NOT NULL ");
    }
    
    // Execute query
    $sql = "SELECT c.name, c.email, c.phone, c.industry, c.category, c.clientSince, c.clientSinceYear,c.drlInclude,c.drl," .
          "sl.objectId,sl.surveyId,sl.clientId,sl.score,sl.useCommentsAsTestimonial,sl.loyaltyDrivers, msl.allScores,msl.allReceivedOnDates,msl.allComments, sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.messageId, sl.followupOnDate,sl.additionalQuestions," .
          "sl.howToImproveComments, sl.howToImproveComments2, sl.followupComments, sl.callRequest, sl.kudos," .
          "s.description as surveyDescription," .
          "u.objectId as drlId, CONCAT(u.firstName, ' ',u.lastName) as drlName, se.testimonialType " .
          "FROM Client c INNER JOIN (SELECT clientId, MAX(receivedOnDate) as receivedOnDate," .
          "GROUP_CONCAT(score ORDER BY receivedOnDate) AS allScores,GROUP_CONCAT(receivedOnDate ORDER BY receivedOnDate) AS allReceivedOnDates," .
          "GROUP_CONCAT(comments ORDER BY receivedOnDate SEPARATOR '++++') AS allComments from Survey_Log GROUP BY clientId) msl " .
          "ON c.objectId = msl.clientId " .
          "INNER JOIN Survey_Log sl ON sl.clientId = msl.clientId AND sl.receivedOnDate = msl.receivedOnDate " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
          "WHERE c.isDeleted=0 AND sl.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId='$vendorId' AND s.type=0 " .
          $whereClause . 
          " ORDER BY sl.receivedOnDate DESC LIMIT $limit OFFSET $offset";

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $retArr["allScores"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    else {
      $retArr["allScores"] = [];
    }

    // Get the total record count
    $stmt->closeCursor();
    $sql = "SELECT COUNT(*) AS totalCount " .
      "FROM Client c INNER JOIN (SELECT clientId, MAX(receivedOnDate) as receivedOnDate," .
      "GROUP_CONCAT(score ORDER BY receivedOnDate) AS allScores,GROUP_CONCAT(receivedOnDate ORDER BY receivedOnDate) AS allReceivedOnDates," .
      "GROUP_CONCAT(comments ORDER BY receivedOnDate SEPARATOR '++++') AS allComments from Survey_Log GROUP BY clientId) msl " .
      "ON c.objectId = msl.clientId " .
      "INNER JOIN Survey_Log sl ON sl.clientId = msl.clientId AND sl.receivedOnDate = msl.receivedOnDate " .
      "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
      "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
      "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
      "WHERE c.isDeleted=0 AND sl.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId='$vendorId' AND s.type=0 " .
      $whereClause;

    $stmt = $conn->query($sql);
    
    $retArr["count"] = intval($stmt->fetch(PDO::FETCH_ASSOC)["totalCount"]);

    return $response->withJson($retArr);

  });

  // Get custom filters
  $app->post("/getFilters",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $conn = Util::createConnection();
    $retArr = [];

    // Get staff list (primary & secondary)
    $staffList = Util::getChildrenArray($conn, $vendorId, $userId);
    if($staffList===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    $retArr["staff"] = $staffList;

    // Get client groups
    $clientGroups = [];
    $clientGroups["Account Value"] = array_keys($GLOBALS["CLIENT_CATEGORY_SORT"]);
    
    $stmt = $conn->query("SELECT DISTINCT description FROM DropList WHERE category='Client Industry' AND vendorId='$vendorId' AND isDeleted=0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $clientGroups["Industry"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      array_walk($clientGroups["Industry"], function(&$value, $key) { $value = $value["description"]; } );
    }

    $stmt->closeCursor();

    $stmt = $conn->query("SELECT DISTINCT description FROM DropList WHERE category='Client Category' AND vendorId='$vendorId' AND isDeleted=0 ORDER BY description");
    if($stmt && $stmt->rowCount()>0) {
      $clientGroups["Group"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
      array_walk($clientGroups["Group"], function(&$value, $key) { $value = $value["description"]; } );
    }

    $arWrapper = array();
    $arWrapper['key'] = array_keys($clientGroups);
    $arWrapper['value'] = $clientGroups;

    $retArr["clientGroups"] = $arWrapper;

    $stmt->closeCursor();

    return $response->withJson($retArr);


  });

  // Pending action items count
  $app->post("/pendingActionItemsCount",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $conn = Util::createConnection();

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    // get all scores for users
    // scores are for past 1 year
    $whereClause = "WHERE c.isDeleted=0 AND sl.vendorId=" . $conn->quote($vendorId) . " AND sl.flagged=1 AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $whereClause .= implode(",",$whereArr) . ")) ";

    $sql = "SELECT count(sl.objectId) AS pendingActionItemsCount " .
          "FROM Client c INNER JOIN " .
          "Survey_Log sl ON sl.clientId = c.objectId " .
          $whereClause;

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0 && ($row = $stmt->fetch(PDO::FETCH_ASSOC))) {

      return $response->withJson(Array("pendingActionItemsCount"=>intval($row["pendingActionItemsCount"])));

    }

    else {
      return $response->withJson(Array("pendingActionItemsCount"=>0));
    }
  });

  // Action items
  $app->post("/actionItems",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $clientFilterParam = $reqData["clientFilter"];
    $staffFilterParam = $reqData["staffFilter"];
    $dateRange = $reqData["dateRange"];
    $searchString = $reqData["searchString"];
    $scoreType = $reqData["scoreType"];
    $limit = $reqData["dataLimit"];
    $offset = $reqData["dataOffset"];
    $flagged = $reqData["flagged"];
    $followup = $reqData["followup"];

    $conn = Util::createConnection();

    // Get children
    $children = Util::getChildrenArray($conn, $vendorId, $userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    $whereClause = "";

    // DRLs
    $whereClause .= " AND ((CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END) IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }
    $whereClause .= implode(",",$whereArr) . ")) ";

    // Client filter
    $clientFilterCol = "";
    $clientFilterVal = "";

    if(!empty($clientFilterParam)){
      $arr = explode("_",$clientFilterParam);
      switch ($arr[0]) {
        case "Account Value":
          $clientFilterCol = "category";
          break;
        
        case "Group":
          $clientFilterCol = "clientGroup";
          break;

        case "Industry":
          $clientFilterCol = "industry";
          break;
      }

      $clientFilterVal = $arr[1];
    }

    if(!empty($clientFilterParam)){
      $whereClause .= " AND c.$clientFilterCol = '$clientFilterVal' ";
    }

    // Staff filter
    if(!empty($staffFilterParam)){
      $whereClause .= " AND (CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END)='$staffFilterParam' ";
    }

    // Date filter
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.receivedOnDate) > (CURDATE() - INTERVAL $dateRange DAY) ";

    // Score type filter
    if(!empty($scoreType)){
      switch ($scoreType) {
        case 'PROMOTER':
          $whereClause .= " AND sl.score >= " . PROMOTERS;
          break;
        case 'NEUTRAL':
          $whereClause .= " AND sl.score < " . PROMOTERS . " AND sl.score > " . DETRACTORS;
          break;
        case 'DETRACTOR':
          $whereClause .= " AND sl.score <= " . DETRACTORS;
          break;
      }
    }

    // Search string filter
    if(!empty($searchString)) {
      $whereClause .= " AND (LOWER(sl.comments) LIKE LOWER('%$searchString%') OR LOWER(c.name) LIKE LOWER('%$searchString%'))";
    }

    // Followup
    if(!empty($followup)) {
      $whereClause .= ($followup == "TODO" ? " AND sl.flagged=1" : " AND sl.followupOnDate IS NOT NULL ");
    }
    
    // Execute query
    $sql = "SELECT c.name, c.email, c.phone, c.industry, c.category, c.clientSince, c.clientSinceYear,c.drlInclude,c.drl," .
          "sl.objectId,sl.surveyId,sl.clientId,sl.score,sl.useCommentsAsTestimonial,sl.loyaltyDrivers, sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.messageId, sl.followupOnDate,sl.additionalQuestions," .
          "sl.howToImproveComments, sl.howToImproveComments2, sl.followupComments," .
          "s.description as surveyDescription," .
          "u.objectId as drlId, CONCAT(u.firstName, ' ',u.lastName) as drlName, se.testimonialType " .
          "FROM Client c INNER JOIN " .
          "Survey_Log sl ON sl.clientId = c.objectId " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
          "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
          "WHERE c.isDeleted=0 AND sl.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId='$vendorId' AND s.type=0 " .
          $whereClause . 
          " ORDER BY sl.receivedOnDate DESC LIMIT $limit OFFSET $offset";

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0) {
      $retArr["allScores"] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    else {
      $retArr["allScores"] = [];
    }

    // Get the total record count
    $stmt->closeCursor();
    $sql = "SELECT COUNT(*) AS totalCount " .
            "FROM Client c INNER JOIN " .
            "Survey_Log sl ON sl.clientId = c.objectId " .
            "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
            "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
            "INNER JOIN Setting se ON c.vendorId = se.vendorId " .
            "WHERE c.isDeleted=0 AND sl.isDeleted=0 AND sl.score IS NOT NULL AND sl.vendorId='$vendorId' AND s.type=0 " .
            $whereClause . 
            " ORDER BY sl.receivedOnDate DESC";

    $stmt = $conn->query($sql);
    
    $retArr["count"] = intval($stmt->fetch(PDO::FETCH_ASSOC)["totalCount"]);

    return $response->withJson($retArr);

  });

  // App notifications
  $app->post("/appNotifications",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $userLevel = $reqData["userLevel"];
    $dateNow = gmdate("Y-m-d H:i:s");
    $conn = Util::createConnection();

    $actionItemCount = 0;
    $notifications = [];

    // User and children
    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    if($children===false) setErrorResponse($response, "DATA_FETCH_FAILED");

    // Get the action items and bounced emails
    $whereClause = "WHERE c.isDeleted=0 AND sl.vendorId=" . $conn->quote($vendorId) . " AND (sl.flagged=1 OR sl.emailStatus > 2) AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $whereClause .= implode(",",$whereArr) . ")) ";

    $sql = "SELECT c.name AS clientName, c.email As clientEmail, c.objectId as clientId," .
          "sl.objectId,sl.emailStatus,sl.flagged, sl.createdAt " .
          "FROM Client c INNER JOIN " .
          "Survey_Log sl ON sl.clientId = c.objectId " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = c.drl " .
          $whereClause .
          "ORDER BY sl.receivedOnDate DESC";

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0 && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))) {
      foreach ($rows as $key => $value) {
        if($value["flagged"]=="1") $actionItemCount++;
        if(isset($value["emailStatus"]) && intval($value["emailStatus"]) > 2) {
          $notifications[] = array(
            "objectId" => $value["objectId"],
            "date" => $value["createdAt"],
            "notificationType" => $GLOBALS["APP_NOTIFICATION_TYPES"]["CLIENT_EMAIL_BOUNCED"],
            "description"=> "Bounced email for client [$value[clientName]][$value[clientEmail]]",
            "linkedId" => $value["clientId"]

          );
        }
      }
    }

    $stmt->closeCursor();

    // Get data from notifications table
    $sql = "SELECT objectId, createdAt AS date, notificationType, description, linkedId from Notification  " .
          "WHERE vendorId = '$vendorId'";

    $stmt = $conn->query($sql);
    if($stmt && $stmt->rowCount()>0 && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))) $notifications = array_merge($notifications,$rows);

    $stmt->closeCursor();

    // Get login history
    if($userLevel==1){
      $sql = "SELECT LoginHistory.*, CONCAT(User.firstName,' ',User.lastName) as staffName FROM LoginHistory INNER JOIN User " .
            "ON LoginHistory.userId = User.objectId WHERE User.vendorId='$vendorId' AND User.isDeleted=0 ORDER by createdAt DESC LIMIT 50";

      $stmt = $conn->query($sql);
      if($stmt && $stmt->rowCount()>0 && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))) {
        foreach ($rows as $key => $value) {
          $notifications[] = array(
            "objectId" => $value["objectId"],
            "date" => $value["createdAt"],
            "notificationType" => $value["status"]=="1" ? $GLOBALS["APP_NOTIFICATION_TYPES"]["LOGIN_SUCCESS"] :($value["status"] == "2" ? $GLOBALS["APP_NOTIFICATION_TYPES"]["LOGIN_SUCCESS_SSO"] : $GLOBALS["APP_NOTIFICATION_TYPES"]["LOGIN_FAILED"]),
            "description" => $value["staffName"] . " [" . $value["ipAddress"] . "]",
            "linkedId" => ''

          );
        }
      }
    }

    // Finalize and send the notifications to client
    usort($notifications, function($a, $b) {
      $date1 = strtotime($a["date"]);
      $date2 = strtotime($b["date"]);

      if($date1 === $date2) return 0;
      return $date1 < $date2 ? 1 : -1;
    });

    if($actionItemCount > 0){
      array_unshift($notifications,array(
        "objectId" => '',
        "date" => $dateNow,
        "notificationType" => $GLOBALS["APP_NOTIFICATION_TYPES"]["ACTION_ITEM"],
        "description" => "You have $actionItemCount open follow-up items",
        "linkedId" => ''
      ));
    }

    return $response->withJson($notifications);

  });

  // Client survey status report
  $app->post("/reportClientSurveyStatus",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $stmt = $conn->query("SELECT c.name, c.email, sl.receivedOnDate, sl.emailOpened,sl.emailStatus, sl.sendId, sl.sendDate, sl.surveyId, " .
                        "sl.reminderEmailStatus,sl.reminderDate, s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "WHERE sl.vendorId = '$vendorId' AND s.type=0 AND c.isDeleted = 0 $whereClause " .
                        "ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "clientName" => $value["name"],
        "clientEmail" => $value["email"],
        "receivedOnDate" => $value["receivedOnDate"],
        "emailOpened" => isset($value["emailOpened"]) ? intval($value["emailOpened"]) : 0,
        "emailStatus" => isset($value["emailStatus"]) ? intval($value["emailStatus"]) : 0,
        "reminderEmailStatus" => isset($value["reminderEmailStatus"]) ? intval($value["reminderEmailStatus"]) : 0,
        "reminderDate" => $value["reminderDate"]
      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }


  });

  // Client survey responders
  $app->post("/reportClientSurveyResponders",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $conn = Util::createConnection();

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    $drlWhereClause = " AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $drlWhereClause .= implode(",",$whereArr) . ")) ";

    $stmt = $conn->query("SELECT c.name, c.email, c.phone, sl.score, sl.receivedOnDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, sl.additionalQuestions, " .
                        "sl.howToImproveComments, sl.loyaltyDrivers, c.category, c.clientGroup, c.industry, u.department, c.organisation, " .
                        "c.customCategory1, c.customCategory1Desc, c.customCategory2, c.customCategory2Desc, c.customCategory3, c.customCategory3Desc," .
                        "s.description AS surveyDescription, CONCAT(u.firstName, ' ', u.lastName) AS clientContact FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = c.drl " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 AND s.type=0 " .
                        "AND sl.score IS NOT NULL $whereClause $drlWhereClause ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "clientName" => $value["name"],
        "clientEmail" => $value["email"],
        "receivedOnDate" => $value["receivedOnDate"],
        "score" => intval($value["score"]),
        "clientPhone" => $value["phone"],
        "clientContact" => $value["clientContact"],
        "clientOrganisation" => $value["organisation"],
        "comments" => $value["comments"],
        "additionalQuestions" => $value["additionalQuestions"],
        "howToImproveComments" => $value["howToImproveComments"],
        "loyaltyDrivers" => $value["loyaltyDrivers"],
        "category" => $value["category"],
        "clientGroup" => $value["clientGroup"],
        "industry" => $value["industry"],
        "department" => $value["department"],
        "customCategory1" => $value["customCategory1"],
        "customCategory1Desc" => $value["customCategory1Desc"],
        "customCategory2" => $value["customCategory2"],
        "customCategory2Desc" => $value["customCategory2Desc"],
        "customCategory3" => $value["customCategory3"],
        "customCategory3Desc" => $value["customCategory3Desc"]

      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Client action items
  $app->post("/reportClientActionItems",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    $drlWhereClause = " AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $drlWhereClause .= implode(",",$whereArr) . ")) ";

    $stmt = $conn->query("SELECT c.name AS clientName, c.email As clientEmail, c.phone AS clientPhone," .
          "sl.objectId,sl.clientId,sl.score,sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.followupOnDate, sl.followupComments, sl.followupBy AS followupById," .
          "u.objectId as clientDrlId, CONCAT(u.firstName, ' ',u.lastName) as clientDrlName, " .
          "CONCAT(uf.firstName, ' ',uf.lastName) as followupByName " .
          "FROM Client c INNER JOIN " .
          "Survey_Log sl ON sl.clientId = c.objectId " .
          "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
          "INNER JOIN User u ON u.objectId = c.drl " .
          "LEFT JOIN User uf ON uf.objectId = sl.followupBy " .
          "WHERE sl.vendorId = '$vendorId' $drlWhereClause AND c.isDeleted = 0 AND s.type=0 AND sl.score IS NOT NULL AND (sl.flagged=1 OR sl.followupOnDate IS NOT NULL) $whereClause " .
          "ORDER BY c.name");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {

      $retArr = Array("Open"=>[],"Resolved"=>[]);
      foreach ($rows as $key => $value) {
        if(isset($value["followupOnDate"])) {
          $retArr["Resolved"][] = $value;
        } else {
          $retArr["Open"][] = $value;
        }
      }

      return $response->withJson($retArr);

    } else {
      return setErrorResponse($response, "DATA_FETCH_FAILED");
    }

  });

  // Client survey non-responders
  $app->post("/reportClientSurveyNonResponders",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $stmt = $conn->query("SELECT c.name, c.email, c.phone, c.organisation, sl.emailStatus,sl.emailOpened,sl.reminderEmailStatus,sl.reminderDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, " .
                        "s.description AS surveyDescription, CONCAT(u.firstName, ' ', u.lastName) AS clientContact FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = c.drl " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 AND s.type=0 " .
                        "AND sl.score IS NULL $whereClause ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "clientName" => $value["name"],
        "clientEmail" => $value["email"],
        "clientPhone" => $value["phone"],
        "clientContact" => $value["clientContact"],
        "clientOrganisation" => $value["organisation"],
        "emailOpened" => isset($value["emailOpened"]) ? intval($value["emailOpened"]) : 0,
        "emailStatus" => isset($value["emailStatus"]) ? intval($value["emailStatus"]) : 0,
        "reminderEmailStatus" => isset($value["reminderEmailStatus"]) ? intval($value["reminderEmailStatus"]) : 0,
        "reminderDate" => $value["reminderDate"]

      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // All survey responders/non-responders report
  $app->post("/reportAllResults",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $conn = Util::createConnection();

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    $drlWhereClause = " AND ((CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END) IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $drlWhereClause .= implode(",",$whereArr) . ")) ";

    $stmt = $conn->query("SELECT c.name, c.email, c.phone, sl.score, sl.receivedOnDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, sl.additionalQuestions, " .
                        "sl.howToImproveComments, sl.howToImproveComments2, sl.loyaltyDrivers, c.category, c.clientGroup, c.industry, u.department, c.organisation, " .
                        "c.customCategory1, c.customCategory1Desc, c.customCategory2, c.customCategory2Desc, c.customCategory3, c.customCategory3Desc, c.category, c.code," .
                        "s.description AS surveyDescription, CONCAT(u.firstName, ' ', u.lastName) AS clientContact, " . 
                        
                        // Previous score and comments
                        "(SELECT sl2.score FROM Survey_Log sl2 WHERE sl2.clientId = sl.clientId AND sl2.createdAt < sl.createdAt ORDER BY sl2.createdAt DESC LIMIT 1) AS prevScore, " .
                        "(SELECT sl2.comments FROM Survey_Log sl2 WHERE sl2.clientId = sl.clientId AND sl2.createdAt < sl.createdAt ORDER BY sl2.createdAt DESC LIMIT 1) AS prevComment " .
                        
                        "FROM Survey_Log sl " .
                        
                        // Join
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 AND s.type=0 and sl.isDeleted=0 " .
                        "$whereClause $drlWhereClause ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = $rows;
    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  //  Client satisfaction by
  $app->post("/reportClientSatisfactionBy",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];
    $groupBy = $reqData["groupBy"];
    $groupByColumnName = "";

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    $drlWhereClause = " AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $drlWhereClause .= implode(",",$whereArr) . ")) ";

    // Set group by column
    switch ($groupBy) {
      case "SATISFACTION_STAFF":
        $groupByColumnName = "clientContact";

        break;

      case "SATISFACTION_CATEGORY":
        $groupByColumnName = "clientGroup";
        break;

      case "SATISFACTION_INDUSTRY":
        $groupByColumnName = "industry";
        break;

      default:

        break;
    }

    $stmt = $conn->query("SELECT c.name AS clientName, c.email AS clientEmail, c.phone AS clientPhone, c.clientGroup, c.industry, sl.score, sl.receivedOnDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, " .
                        "s.description AS surveyDescription, CONCAT(u.firstName, ' ', u.lastName) AS clientContact FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = c.drl " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 AND s.type=0 " .
                        "AND sl.score IS NOT NULL $whereClause $drlWhereClause ORDER BY sl.receivedOnDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
      $retArr = [];

      foreach ($rows as $key => &$value) {

        if(!isset($value[$groupByColumnName])) $value[$groupByColumnName] = "None";

        $groupKey = array_search($value[$groupByColumnName], array_column($retArr,"groupName"));
        if($groupKey === FALSE) {
        $retArr[] = array("groupName"=>$value[$groupByColumnName], "promoterCount"=>0,"neutralCount"=>0,"detractorCount"=>0,"totalEmailsSent"=>0, "data"=>array());
        $groupKey = count($retArr)-1;
        }

        if(intval($value["score"]) >= PROMOTERS){
          $retArr[$groupKey]["promoterCount"]++;
        } elseif (intval($value["score"]) <= DETRACTORS) {
          $retArr[$groupKey]["detractorCount"]++;
        } else {
          $retArr[$groupKey]["neutralCount"]++;
        }

        $retArr[$groupKey]["data"][] = array(
          "clientName" => $value["clientName"],
          "clientEmail" => $value["clientEmail"],
          "receivedOnDate" => $value["receivedOnDate"],
          "score" => intval($value["score"]),
          "clientPhone" => $value["clientPhone"],
          "clientContact" => $value["clientContact"],
          "comments" => $value["comments"]
        );
      }

      // Email sent totals by group
      $stmt->closeCursor();

      switch ($groupBy) {
        case "SATISFACTION_STAFF":
          $sql = "SELECT CONCAT(u.firstName,' ',u.lastName) as groupName ,COUNT(sl.createdAt) as totalEmailsSent " .
                "FROM Survey_Log sl INNER JOIN Client c ON sl.clientId = c.objectId INNER JOIN User u ON u.objectId = c.drl " .
                "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                "WHERE c.isDeleted = 0 AND s.type=0 $whereClause $drlWhereClause " .
                "GROUP BY u.firstName,u.lastName";

          break;

        case "SATISFACTION_CATEGORY":
          $sql = "SELECT IFNULL(c.clientGroup,'None') as groupName ,COUNT(sl.createdAt) as totalEmailsSent " .
              "FROM Survey_Log sl INNER JOIN Client c ON sl.clientId = c.objectId " .
              "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
              "WHERE c.isDeleted = 0 AND s.type=0 $whereClause $drlWhereClause " .
              "GROUP BY c.clientGroup";
          break;

        case "SATISFACTION_INDUSTRY":
          $sql = "SELECT IFNULL(c.industry,'None') as groupName ,COUNT(sl.createdAt) as totalEmailsSent " .
              "FROM Survey_Log sl INNER JOIN Client c ON sl.clientId = c.objectId " .
              "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
              "WHERE c.isDeleted = 0 AND s.type=0 $whereClause $drlWhereClause " .
              "GROUP BY c.clientGroup";
          break;

        default:

          break;
      }

      $stmt = $conn->query($sql);

      if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {
        foreach ($rows as $key => $value) {
          $groupKey = array_search($value["groupName"], array_column($retArr,"groupName"));
          if($groupKey !== FALSE) $retArr[$groupKey]["totalEmailsSent"] = intval($value["totalEmailsSent"]);
        }
      } else {
        return setErrorResponse($response, "DATA_FETCH_FAILED");
      }


      // Send back data
      usort($retArr, function($a, $b) {

        if($a["groupName"] === $b["groupName"]) return 0;
        return $a["groupName"] < $b["groupName"] ? -1 : 1;
      });

      return $response->withJson($retArr);

    } else {
      return setErrorResponse($response, "DATA_FETCH_FAILED");
    }


  });

  // Organisation summary
  $app->post("/reportOrganisationSummary",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();
    $stmt = $conn->query("SELECT sl.surveyId, sl.score, s.description AS surveyDescription, u.objectId AS staffId, CONCAT(u.firstName, ' ', u.lastName) AS clientContact FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = c.drl " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 " .
                        "AND sl.score IS NOT NULL $whereClause");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

      $retArr = Array("staff"=>[], "survey"=>[], "surveySummary"=>[], "scoreBreakdown"=>[0,0,0,0,0,0,0,0,0,0]);
      // Grouped data by client contact and survey
      foreach ($rows as $key => $value) {

        // by survey
        $surveyKey = array_search($value["surveyId"], array_column($retArr["survey"],"surveyId"));
        if($surveyKey === FALSE) {
        $retArr["survey"][] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],
                                  "promoterCount"=>0,"detractorCount"=>0,"neutralCount"=>0,"totalEmailsSent"=>0,"scoreTotal"=>0);
        $surveyKey = count($retArr["survey"])-1;
        }

        $retArr["survey"][$surveyKey]["scoreTotal"] += intval($value["score"]);
        if(intval($value["score"]) >= PROMOTERS){
          $retArr["survey"][$surveyKey]["promoterCount"]++;
        } elseif (intval($value["score"]) <= DETRACTORS) {
          $retArr["survey"][$surveyKey]["detractorCount"]++;
        } else {
          $retArr["survey"][$surveyKey]["neutralCount"]++;
        }

        // by staff
        $staffKey = array_search($value["staffId"], array_column($retArr["staff"],"staffId"));
        if($staffKey === FALSE) {
        $retArr["staff"][] = array("staffId"=>$value["staffId"],"name"=>$value["clientContact"],
                                  "promoterCount"=>0,"detractorCount"=>0,"neutralCount"=>0,"totalEmailsSent"=>0,"scoreTotal"=>0);
        $staffKey = count($retArr["staff"])-1;
        }

        $retArr["staff"][$staffKey]["scoreTotal"] += intval($value["score"]);
        if(intval($value["score"]) >= PROMOTERS){
          $retArr["staff"][$staffKey]["promoterCount"]++;
        } elseif (intval($value["score"]) <= DETRACTORS) {
          $retArr["staff"][$staffKey]["detractorCount"]++;
        } else {
          $retArr["staff"][$staffKey]["neutralCount"]++;
        }

        // Score breakdown
        $score = intval($value["score"]);
        $retArr["scoreBreakdown"][$score]++;

      }

      // Survey summary
      $retArr["surveySummary"] = clientSurveySummary($vendorId);

      foreach ($retArr["surveySummary"] as $key => $value) {
        $surveyKey = array_search($value["surveyId"], array_column($retArr["survey"],"surveyId"));
        if($surveyKey !== FALSE){
          $retArr["survey"][$surveyKey]["totalEmailsSent"] += intval($value["totalCount"]);
        }
      }

      return $response->withJson($retArr);
    } else {
      return setErrorResponse($response, "DATA_FETCH_FAILED");
    }

  });

  // Staff survey status report
  $app->post("/reportStaffSurveyStatus",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $stmt = $conn->query("SELECT CONCAT(u.firstName, ' ',u.lastName) AS staffName, u.email, (sl.receivedOnDate IS NOT NULL) as responseReceived, sl.emailOpened,sl.emailStatus, sl.sendId, sl.sendDate, sl.surveyId, " .
                        "sl.reminderEmailStatus,sl.reminderDate, s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN User u ON sl.staffId = u.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "WHERE sl.vendorId = '$vendorId' AND s.type=1 AND u.isDeleted = 0 $whereClause " .
                        "ORDER BY sl.sendDate DESC,u.firstName ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "staffName" => $value["staffName"],
        "staffEmail" => $value["email"],
        "responseReceived" => ($value["responseReceived"]==1?"Yes":"No"),
        "emailOpened" => isset($value["emailOpened"]) ? intval($value["emailOpened"]) : 0,
        "emailStatus" => isset($value["emailStatus"]) ? intval($value["emailStatus"]) : 0,
        "reminderEmailStatus" => isset($value["reminderEmailStatus"]) ? intval($value["reminderEmailStatus"]) : 0,
        "reminderDate" => $value["reminderDate"]
      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Staff survey responders report
  $app->post("/reportStaffSurveyResponders",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $conn = Util::createConnection();

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";


    $stmt = $conn->query("SELECT u.department, u.designation, sl.score, sl.receivedOnDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, sl.additionalQuestions, " .
                        "s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN User u ON sl.StaffId = u.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "WHERE sl.vendorId = '$vendorId' AND u.isDeleted = 0 AND s.type=1 " .
                        "AND sl.score IS NOT NULL $whereClause ORDER BY sl.sendDate DESC, u.department ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "department" => $value["department"],
        "designation" => $value["designation"],
        "receivedOnDate" => $value["receivedOnDate"],
        "score" => intval($value["score"]),
        "comments" => $value["comments"],
        "additionalQuestions" => $value["additionalQuestions"]

      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Pulse survey status report
  $app->post("/reportPulseSurveyStatus",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $stmt = $conn->query("SELECT c.name, c.email, sl.receivedOnDate, sl.emailOpened,sl.emailStatus, sl.sendId, sl.sendDate, sl.surveyId, " .
                        "sl.reminderEmailStatus,sl.reminderDate, s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "WHERE sl.vendorId = '$vendorId' AND s.type=2 AND c.isDeleted = 0 $whereClause " .
                        "ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "clientName" => $value["name"],
        "clientEmail" => $value["email"],
        "receivedOnDate" => $value["receivedOnDate"],
        "emailOpened" => isset($value["emailOpened"]) ? intval($value["emailOpened"]) : 0,
        "emailStatus" => isset($value["emailStatus"]) ? intval($value["emailStatus"]) : 0,
        "reminderEmailStatus" => isset($value["reminderEmailStatus"]) ? intval($value["reminderEmailStatus"]) : 0,
        "reminderDate" => $value["reminderDate"]
      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }


  });

  // Pulse survey responders
  $app->post("/reportPulseSurveyResponders",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $userId = $reqData["userId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $conn = Util::createConnection();

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $children = Util::getChildrenArray($conn,$vendorId,$userId);
    $drlWhereClause = " AND (c.drl IN(";
    $whereArr = [];

    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }

    $drlWhereClause .= implode(",",$whereArr) . ")) ";

    $stmt = $conn->query("SELECT c.name, c.email, c.phone, sl.score, sl.receivedOnDate, sl.sendId, sl.sendDate, sl.surveyId, sl.comments, sl.additionalQuestions, " .
                        "s.description AS surveyDescription, CONCAT(u.firstName, ' ', u.lastName) AS clientContact FROM Survey_Log sl " .
                        "INNER JOIN Client c ON sl.clientId = c.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN User u ON u.objectId = c.drl " .
                        "WHERE sl.vendorId = '$vendorId' AND c.isDeleted = 0 AND s.type=2 " .
                        "AND sl.receivedOnDate IS NOT NULL $whereClause $drlWhereClause ORDER BY sl.sendDate DESC,c.name ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "clientName" => $value["name"],
        "clientEmail" => $value["email"],
        "receivedOnDate" => $value["receivedOnDate"],
        "clientPhone" => $value["phone"],
        "clientContact" => $value["clientContact"],
        "additionalQuestions" => $value["additionalQuestions"]

      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Manager survey status report
  $app->post("/reportManagerSurveyStatus",function(Request $request, Response $response) {

    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";

    $conn = Util::createConnection();

    $stmt = $conn->query("SELECT CONCAT(u.firstName, ' ',u.lastName) AS staffName, u.email, (sl.receivedOnDate IS NOT NULL) as responseReceived, sl.emailOpened,sl.emailStatus, sl.sendId, sl.sendDate, sl.surveyId, " .
                        "sl.reminderEmailStatus,sl.reminderDate, s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN User u ON sl.staffId = u.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "WHERE sl.vendorId = '$vendorId' AND s.type=3 AND u.isDeleted = 0 $whereClause " .
                        "ORDER BY sl.sendDate DESC,u.firstName ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "staffName" => $value["staffName"],
        "staffEmail" => $value["email"],
        "responseReceived" => ($value["responseReceived"]==1?"Yes":"No"),
        "emailOpened" => isset($value["emailOpened"]) ? intval($value["emailOpened"]) : 0,
        "emailStatus" => isset($value["emailStatus"]) ? intval($value["emailStatus"]) : 0,
        "reminderEmailStatus" => isset($value["reminderEmailStatus"]) ? intval($value["reminderEmailStatus"]) : 0,
        "reminderDate" => $value["reminderDate"]
      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Manager survey responders report
  $app->post("/reportManagerSurveyResponders",function(Request $request, Response $response) {
    $reqData = $request->getParsedBody();
    $vendorId = $reqData["vendorId"];
    $surveyId = $reqData["surveyId"];
    $dateRange = $reqData["dateRange"];

    $conn = Util::createConnection();

    $whereClause = "";
    if(isset($dateRange)) $whereClause .= " AND DATE(sl.createdAt) > (CURDATE() - INTERVAL $dateRange DAY) ";
    if(isset($surveyId)) $whereClause .= " AND sl.surveyId = '$surveyId' ";


    $stmt = $conn->query("SELECT u.department, u.designation, sl.sendId, sl.sendDate, sl.surveyId, CONCAT(um.firstName, ' ',um.lastName) as managerName, sld.additionalQuestions, sld.createdAt AS receivedOnDate, " .
                        "s.description AS surveyDescription FROM Survey_Log sl " .
                        "INNER JOIN User u ON sl.StaffId = u.objectId " .
                        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
                        "INNER JOIN Survey_Log_Detail sld ON sld.surveyLogId = sl.objectId " .
                        "INNER JOIN User um ON um.objectId = sld.staffId " .
                        "WHERE sl.vendorId = '$vendorId' AND u.isDeleted = 0 AND s.type=3 " .
                        "AND sl.receivedOnDate IS NOT NULL $whereClause ORDER BY sl.sendDate DESC, um.firstName ASC");

    if($stmt !== false && ($rows = $stmt->fetchAll(PDO::FETCH_ASSOC))!=false) {

    $retArr = [];
    foreach ($rows as $key => $value) {
      $surveyKey = array_search($value["surveyId"], array_column($retArr,"surveyId"));
      if($surveyKey === FALSE) {
        $retArr[] = array("surveyId"=>$value["surveyId"],"description"=>$value["surveyDescription"],"log"=>array());
        $surveyKey = count($retArr)-1;
      }

      $logKey = array_search($value["sendDate"], array_column($retArr[$surveyKey]["log"],"sendDate"));
      if($logKey === FALSE){
        $retArr[$surveyKey]["log"][] = array("sendDate"=>$value["sendDate"],"data"=>[]);
        $logKey = count($retArr[$surveyKey]["log"]) - 1;
      }

      $retArr[$surveyKey]["log"][$logKey]["data"][] = array(
        "department" => $value["department"],
        "designation" => $value["designation"],
        "receivedOnDate" => $value["receivedOnDate"],
        "managerName" => $value["managerName"],
        "additionalQuestions" => $value["additionalQuestions"]

      );

    }

    return $response->withJson($retArr);

    } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
    }
  });

  // Shared functions
  function clientSurveySummary($vendorId){
    $conn = Util::createConnection();

    $stmt = $conn->query(
        "SELECT s.description, s.objectId AS surveyId, MAX(sl.sentOnDate) as maxDate, MAX(sl.reminderSentOnDate) as maxReminderDate," .
        "SUM(CASE WHEN sl.emailStatus <=2 THEN 1 ELSE 0 END) as deliveryCount,SUM(CASE WHEN sl.emailStatus >2 THEN 1 ELSE 0 END) as bounceCount," .
        "COUNT(sl.objectId) as totalCount,SUM(CASE WHEN sl.score is not null THEN 1 ELSE 0 END) as scoreCount " .
        "FROM Survey_Log sl INNER JOIN Survey s ON sl.surveyId=s.objectId WHERE sl.vendorId='$vendorId' AND s.type=0 GROUP by sl.sendId ORDER BY sl.sendDate DESC"
    );

    if($stmt && $stmt->rowCount()>0) {
      $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);
      return $responses;
    }

    else {
      return [];
    }

  }

?>
