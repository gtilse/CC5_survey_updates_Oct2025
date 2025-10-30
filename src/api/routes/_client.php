<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Clients
$app->post("/clients",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $options = $reqData["options"];
  $userId = $reqData["userId"];
  $limit = $reqData["dataLimit"];
  $offset = $reqData["dataOffset"];
  $searchText = $reqData["filterString"];
  $clientContacts = $reqData["clientContacts"];
  $dateRange = $reqData["dateRange"];
  $clientGroup = $reqData["clientGroup"];

  $searchTextWhereClause = "";
  $clientContactsWhereClause = "";
  $dateRangeWhereClause = "";
  $clientGroupWhereClause = "";

  $result = ["count"=>0, "clients"=>[]];

  $children = Util::getChildrenArray($conn,$vendorId,$userId);
  $whereArr = [];

  // Sort
  $orderBy = "ORDER BY c." . $reqData["sort"] . " " . $reqData["sortDirection"];

  // Search text
  if(isset($searchText) && trim($searchText)!=="") {
    $searchTextWhereClause = "AND (c.name LIKE '%$searchText%' OR c.phone like '%$searchText%' OR c.email LIKE '%$searchText%') ";
  }

  // Client contacts
  if(isset($clientContacts) && count($clientContacts)>0) {
    $clientContactsWhereClause = "AND c.drl IN(" . "'" . implode("','", $clientContacts) . "')";
  } else {
    
    foreach ($children as $key => $value) {
      $whereArr[] = $conn->quote($value["objectId"]);
    }
  
    $clientContactsWhereClause .= " AND (c.drl IN(" . implode(",",$whereArr) . ")) ";
  }

  // Date Range
  if(isset($dateRange)) {
    $dateRangeWhereClause = "AND c.createdAt >= NOW()-INTERVAL $dateRange DAY";
  }

  // Active/Inactive
  $clientActiveWhereClause = "AND c.active =  " . $reqData["active"];

  // Client group
  
  $clientFilterCol = "";
  $clientFilterVal = "";

  if(!empty($clientGroup)){
    $arr = explode("_",$clientGroup);
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

  if(!empty($clientGroup)){
    $clientGroupWhereClause .= " AND c.$clientFilterCol = '$clientFilterVal' ";
  }

  $stmt = $conn->query(
    "SELECT c.objectId,c.vendorId,c.active,c.sendSurveyEmail,c.title,c.name,c.organisation,c.email,c.code,c.yearOfBirth,c.address,c.phone," .
    "c.secondaryTitle,c.secondaryName,c.secondaryPhone,c.secondaryEmail,c.tertiaryTitle,c.tertiaryName,c.tertiaryPhone,c.tertiaryEmail," .
    "c.industry,c.companySize,c.category,c.clientGroup,c.clientSinceYear,c.accountSize,c.referredBefore,c.recommendedByExistingClient,c.frequencyOfReview,c.drl,c.drlInclude,c.transferredFromDrl,c.transferredFromDrlReason, c.tags," .
    "c.customCategory1, c.customCategory1Desc,c.customCategory2, c.customCategory2Desc,c.customCategory3, c.customCategory3Desc," .
    "CONVERT_TZ(c.transferredFromDrlDate, @@session.time_zone, '+00:00') AS transferredFromDrlDate, " .
    "CONVERT_TZ(c.createdAt, @@session.time_zone, '+00:00') AS createdAt, " .
    "CONVERT_TZ(c.updatedAt, @@session.time_zone, '+00:00') AS updatedAt " .
    "FROM Client c " .
    "WHERE c.vendorId='$vendorId' $clientActiveWhereClause $clientGroupWhereClause $searchTextWhereClause $clientContactsWhereClause $dateRangeWhereClause AND c.isDeleted=0 " .
    "$orderBy LIMIT $limit OFFSET $offset"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    $result["clients"] = $rows;
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  // Get the total count of the result set
  $stmt->closeCursor();
  $stmt = $conn->query(
    "SELECT COUNT(*) AS totalCount " .
    "FROM Client c " .
    "WHERE c.vendorId='$vendorId' $clientActiveWhereClause $clientGroupWhereClause $searchTextWhereClause $clientContactsWhereClause $dateRangeWhereClause AND c.isDeleted=0 "
  );

  $result["count"] = intval($stmt->fetch(PDO::FETCH_ASSOC)["totalCount"]);


  return $response->withJson($result);

});

// Get last score for clients
$app->post("/clientsLastScore",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $options = $reqData["options"];

  $searchTextWhereClause = "";
  $clientContactsWhereClause = "";
  $dateRangeWhereClause = "";

  if(isset($options["searchText"]) && trim($options["searchText"])!=="") {
    $searchTextWhereClause = "AND (c.name LIKE '%$options[searchText]%' OR c.phone like '%$options[searchText]%' OR c.email LIKE '%$options[searchText]%') ";
  }

  if(isset($options["clientContacts"]) && count($options["clientContacts"])>0) {
    $clientContactsWhereClause = "AND c.drl IN(" . "'" . implode("','", $options["clientContacts"]) . "')";
  }

  if(isset($options["dateRange"])) {
    $dateRangeWhereClause = "AND c.createdAt >= NOW()-INTERVAL $options[dateRange] DAY";
  }


  $stmt = $conn->query(
    "SELECT c.objectId AS clientId,c.name, c.email, sl.score, sl.comments, " .
    "CONVERT_TZ(sl.receivedOnDate, @@session.time_zone, '+00:00') AS receivedOnDate " .
    "FROM Client c INNER JOIN Survey_Log sl ON c.objectId=sl.clientId " .
    "INNER JOIN (SELECT clientId, MAX(receivedOnDate) AS maxDate FROM Survey_Log GROUP BY clientId) sld " .
    "ON sl.clientId=sld.clientId AND sl.receivedOnDate = sl.receivedOnDate " .
    "WHERE c.vendorId='$vendorId' $searchTextWhereClause $clientContactsWhereClause $dateRangeWhereClause AND c.isDeleted=0 ORDER BY sl.receivedOnDate DESC"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

});

// All scores for client
$app->post("/scoresForClient",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $vendorId = $reqData["vendorId"];
  $clientId = $reqData["clientId"];

  $stmt = $conn->query(
    "SELECT c.objectId AS clientId,c.name, c.email, c.vendorId, sl.score, sl.comments, sl.objectId as surveyLogId, " .
    "CONVERT_TZ(sl.receivedOnDate, @@session.time_zone, '+00:00') AS receivedOnDate " .
    "FROM Client c INNER JOIN Survey_Log sl ON c.objectId=sl.clientId " .
    "WHERE c.vendorId='$vendorId' AND c.objectId='$clientId' AND sl.score IS NOT NULL AND c.isDeleted=0 AND sl.isDeleted=0 ORDER BY sl.receivedOnDate DESC"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    return $response->withJson($rows);
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }


});

// Delete score for client
$app->post("/deleteScoreForClient",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $vendorId = $reqData["vendorId"];
  $userId = $reqData["userId"];
  $surveyLogId = $reqData["surveyLogId"];

  $conn = Util::createConnection();
  
  $count = $conn->exec("UPDATE Survey_Log SET isDeleted=1 WHERE objectId = '$surveyLogId' LIMIT 1");
  if($count) {
    // Audit Log
    $stmt = $conn->prepare("INSERT INTO Audit_Trail(type, recordId, userId) VALUES(?,?,?)");
    $stmt->execute(["DELETE_CLIENT_SCORE", $surveyLogId, $userId]);
    
    // Response
    return $response->withJson(array("message"=>"Deleted successfully"));

  }
  else
    return setErrorResponse($response, "DATA_DELETE_FAILED");

});


// Upload client data from file
$app->post("/uploadClientData",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $vendorId = $reqData["vendorId"];
  $columns = $reqData["columns"];
  $fileName = $reqData["fileName"];

  $dataError = [];
  $conn = Util::createConnection();
  $runDate = gmdate("Y-m-d H:i:s");

  $customCategoryCount = 0;

  // fetch dropList, clients and users
  $sth = $conn->query("SELECT * FROM DropList WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY category");
  $dropLists = $sth->fetchAll(PDO::FETCH_ASSOC);
  $sth->closeCursor();

  $sth = $conn->query("SELECT * FROM User WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY lastName");
  $users = $sth->fetchAll(PDO::FETCH_ASSOC);
  $sth->closeCursor();

  $sth = $conn->query("SELECT * FROM Client WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY name");
  $clients = $sth->fetchAll(PDO::FETCH_ASSOC);
  $sth->closeCursor();

  // Open the file and transfer data to array
  $clientArray = Util::readCSVFile(UPLOAD_DIR . $fileName);
  if($clientArray===false) return setErrorResponse($response, "CSV_READ_FAIL");
  // prepare insert statement
  $clientInsertSQLPrefix = "insert into Client (objectId,vendorId,active,sendSurveyEmail";
  
  // $updateArray = ["active=VALUES(active)","sendSurveyEmail=VALUES(sendSurveyEmail)"];
  // Do not update the active and sendSurveyEmail columns
  $updateArray = [];

  foreach($columns as $value) {

    if(isset($value["mapTo"])) {
      if($value["isCustomCategory"] === false) {
        $clientInsertSQLPrefix .= "," . $value["mapTo"];
        $updateArray[] = $value["mapTo"] . "= VALUES("  . $value["mapTo"] . ")";
      } else {
        $customCategoryCount++;
        $clientInsertSQLPrefix .= "," . "customCategory" . $customCategoryCount;
        $clientInsertSQLPrefix .= "," . "customCategory" . $customCategoryCount . "Desc";

        // Update array
        $updateArray[] = "customCategory" . $customCategoryCount . "= VALUES("  . "customCategory" . $customCategoryCount . ")";
        $updateArray[] = "customCategory" . $customCategoryCount . "Desc" . "= VALUES("  . "customCategory" . $customCategoryCount . "Desc" . ")";

      }
    }
  }
  
  $clientInsertSQLPrefix .= ") VALUES ";
  $dropListInsertArr = [];
  $clientInsertArr = [];

  // find the name and email column index to search for duplicates
  // incase of duplicates, existing data is updated for the client
  $nameColumnIndex = 0;
  $emailColumnIndex = 0;

  foreach($columns as $colValue) {
    if(isset($colValue["mapTo"]) && $colValue["mapTo"]=="name")
      $nameColumnIndex = $colValue["colIndex"];

    if(isset($colValue["mapTo"]) && $colValue["mapTo"]=="email")
      $emailColumnIndex = $colValue["colIndex"];

  }

  // loop through all the column mappings and set values
  foreach($clientArray as $key=>$value) {

    $rowNum = (int)$key+1;
    $valueArray = [];

    $searchClient = Util::searchArray($clients,array("name"=>$value[$nameColumnIndex],"email"=>$value[$emailColumnIndex]));

    $valueArray[] = $searchClient !== false ? $conn->quote($clients[$searchClient]["objectId"]) : $conn->quote(Util::createID());

    $valueArray[] = $conn->quote($vendorId );
    $valueArray[] = $valueArray[] = 1;    // active, sendSurveyEmail

    foreach($columns as $colValue) {

      $customCategoryCount = 0;

      if(isset($colValue["mapTo"])) {

        switch ($colValue["mapTo"]) {

          case "title":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            } else {
              $valueArray[] = $conn->quote($value[$colValue["colIndex"]]);
            }

            break;

          case "name":
            $valueArray[] = $conn->quote($value[$colValue["colIndex"]]);
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $dataError[] = "Client name is invalid or empty in Row " . $rowNum;
            }
            break;

          case "email":
            $valueArray[] = $conn->quote(trim($value[$colValue["colIndex"]]));
            if (filter_var(trim($value[$colValue["colIndex"]]), FILTER_VALIDATE_EMAIL)==false) {
              $dataError[] = "[Client:{$value[$nameColumnIndex]}][Row:$rowNum] has an invalid email address";
            }
            break;
          case "tags":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            } else {
              $tags = explode(",", $value[$colValue["colIndex"]]);
              $valueArray[] = $conn->quote(json_encode($tags));
              
            }
            break;
          case "industry":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              $searchKey = Util::searchArray($dropLists,array("category"=>"Client Industry","description"=>$value[$colValue["colIndex"]]));

              if($searchKey) {
                $valueArray[] = $conn->quote($dropLists[$searchKey]["description"]);
              }

              else {        // insert a new value to drop lists table

                $dt = gmdate("Y-m-d H:i:s");
                $dropListInsertArr[] = "INSERT INTO DropList (objectId,vendorId,category,description) VALUES (" .
                                      $conn->quote($dlId=Util::createID()) . "," .
                                      $conn->quote($vendorId) . "," .
                                      $conn->quote($dlCat="Client Industry") . "," .
                                      $conn->quote($dlDesc=$value[$colValue["colIndex"]]) .
                                      ")";

              $dropLists[]= array("objectId"=>$dlId,"vendorId"=>$vendorId,"category"=>$dlCat,"description"=>$dlDesc);
              $valueArray[] = $conn->quote($dlDesc);
              }
            }

            break;

          case "clientGroup":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              $searchKey = Util::searchArray($dropLists,array("category"=>"Client Category","description"=>$value[$colValue["colIndex"]]));

              if($searchKey) {
                $valueArray[] = $conn->quote($dropLists[$searchKey]["description"]);
              }

              else {        // insert a new value to drop lists table

                $dt = gmdate("Y-m-d H:i:s");
                $dropListInsertArr[] = "INSERT INTO DropList (objectId,vendorId,category,description) VALUES (" .
                                      $conn->quote($dlId=Util::createID()) . "," .
                                      $conn->quote($vendorId) . "," .
                                      $conn->quote($dlCat="Client Category") . "," .
                                      $conn->quote($dlDesc=$value[$colValue["colIndex"]]) .
                                      ")";

              $dropLists[]= array("objectId"=>$dlId,"vendorId"=>$vendorId,"category"=>$dlCat,"description"=>$dlDesc);
              $valueArray[] = $conn->quote($dlDesc);
              }
            }

            break;

          case "accountSize":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              switch (strtolower(trim($value[$colValue["colIndex"]]))) {
                case "small":
                  $valueArray[] = $conn->quote("Small");
                  break;

                case "medium":
                  $valueArray[] = $conn->quote("Medium");
                  break;

                case "large":
                  $valueArray[] = $conn->quote("Large");
                  break;

                default:
                  $valueArray[] = "NULL";
                  break;
              }
            }

            break;

          case "category":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              $found = false;

              foreach ($GLOBALS["CLIENT_CATEGORY_SORT"] as $keyCat => $valueCat) {
                $keyStr = strtolower(str_replace(' ', '', $keyCat));     // remove spaces and convert to lower
                $valueStr = isset($value[$colValue["colIndex"]]) ? strtolower(str_replace(' ', '', $value[$colValue["colIndex"]])) : "";

                if($keyStr === $valueStr) {
                  $found = true;
                  $valueArray[] = $conn->quote($keyCat);
                  break;
                }
              }

              if(!$found) $valueArray[] = "NULL";
            }

            break;

          case "clientSinceYear":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              if(is_numeric($value[$colValue["colIndex"]]) && (int)$value[$colValue["colIndex"]] >=1950 && (int)$value[$colValue["colIndex"]] <= (int)date('Y')) {
                $valueArray[]= (int)$value[$colValue["colIndex"]];
              }

              else {
                $valueArray[]= "NULL";
              }
            }
            break;

          case "yearOfBirth":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $valueArray[]= "NULL";
            }

            else {
              if(is_numeric($value[$colValue["colIndex"]]) && (int)$value[$colValue["colIndex"]] >=1900 && (int)$value[$colValue["colIndex"]] <= (int)date('Y')) {
                $valueArray[]= (int)$value[$colValue["colIndex"]];
              }

              else {
                $valueArray[]= "NULL";
              }
            }
            break;

          case "referredBefore":

            if(empty($value[$colValue["colIndex"]]) || strtoupper($value[$colValue["colIndex"]])=="N" || strtoupper($value[$colValue["colIndex"]])=="NO") {
              $valueArray[]= 0;
            }

            else $valueArray[] = 1;

            break;

          case "drl":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
              $dataError[] = "[Client:{$value[$nameColumnIndex]}][Row:$rowNum] Client Contact is required";
              $valueArray[]= "NULL";
            }

            else {
              $found = false;
              foreach ($users as $user) {

                $userName = strtolower($user["firstName"] . $user["lastName"]);
                $drlName = isset($value[$colValue["colIndex"]]) ? $value[$colValue["colIndex"]] : "";

                if(Util::compareSortedStrings($userName,$drlName)==true) {
                  $valueArray[] = $conn->quote($user["objectId"]);
                  $found=true;
                  break;
                }

              }

              if(!$found) {
                $valueArray[] = "NULL";
                $dataError[] = "[Client:{$value[$nameColumnIndex]}][Row:$rowNum] Client Contact does not exist";
              }

            }

            break;

          case "drlInclude":
            if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="" || trim($value[$colValue["colIndex"]])=="+") {
              $valueArray[]= "NULL";
            }

            else {

              $drlInclude = [];
              $drlIncludeArr = explode("+",$value[$colValue["colIndex"]]);

              foreach ($drlIncludeArr as $drlIncludeName) {
                if(isset($drlIncludeName) && trim($drlIncludeName) != "") {
                  $found = false;
                  foreach ($users as $user) {

                    $userName = strtolower($user["firstName"] . $user["lastName"]);

                    if(Util::compareSortedStrings($userName,$drlIncludeName)==true) {
                      $drlInclude[] = "\"" . $user["objectId"] . "\"";

                      $found=true;
                      break;
                    }

                  }

                  if(!$found) {
                    $dataError[] = "[Client:{$value[$nameColumnIndex]}][Row:$rowNum] Secondary Client Contact does not exist";
                  }
                }
              }

              if(count($drlInclude)) {
                $valueArray[] = $conn->quote("[" . implode(",",$drlInclude) . "]");
              } else {
                $valueArray[] = "NULL";
              }


            }

            break;

          
          default:

            if($colValue["isCustomCategory"] === false) {
              if(empty($value[$colValue["colIndex"]]) || trim($value[$colValue["colIndex"]])=="") {
                $valueArray[]= "NULL";
              }
              else {
                $valueArray[] = $conn->quote($value[$colValue["colIndex"]]);
              }  
            } else {

                $customCategoryCount++;

                $valueArray[] = $conn->quote($colValue["mapTo"]);
                $valueArray[] = $conn->quote($value[$colValue["colIndex"]]);

                
            }
            
            break;
        }

      }
    }

    $valuesArray[] = "(" . implode(",",$valueArray) . ")";
  

  }

  // If there are any data errors inform user and exit
  if(count($dataError)>0) {
    return $response->withJson(array("errMsg"=>$dataError));
    die();
  }

  // Save data
  try {
    $conn->beginTransaction();

    if(count($valuesArray)>0) {
      $clientInsertSQLPrefix .= implode(",",$valuesArray);

      

      // On duplicate update record
      $clientInsertSQLPrefix .= " ON DUPLICATE KEY UPDATE " . implode(",", $updateArray);

      // Execute query
      $conn->exec($clientInsertSQLPrefix);

    }

    foreach($dropListInsertArr as $row) {
      $conn->exec($row);
    }

    $conn->commit();
  }

  catch (PDOException $e) {
    $conn->rollBack();
    return setErrorResponse($response, "DATA_CREATE_FAILED");
    
  }

  return $response->withJson("Done importing");

});

// Client info
$app->post("/getClientInfo",function(Request $request, Response $response){
  
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $vendorId = $reqData["vendorId"];
  $clientId = $reqData["clientId"];
  $clientInfo = [];

  $stmt = $conn->query(
    "SELECT c.objectId,c.vendorId,c.active,c.sendSurveyEmail,c.title,c.name,c.organisation,c.email,c.code,c.yearOfBirth,c.address,c.phone," .
    "c.secondaryTitle,c.secondaryName,c.secondaryPhone,c.secondaryEmail,c.tertiaryTitle,c.tertiaryName,c.tertiaryPhone,c.tertiaryEmail," .
    "c.industry,c.companySize,c.category,c.clientGroup,c.clientSinceYear,c.accountSize,c.recommendedByExistingClient,c.referredBefore," .
    "c.createdAt, c.updatedAt, " . 
    "CONCAT(u.firstName, ' ',u.lastName) AS drlName " .
    "FROM Client c INNER JOIN User u ON c.drl = u.objectId " .
    "WHERE c.objectId='$clientId'"
  );

  if($stmt && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    $clientInfo["clientInfo"] = $row;
  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }

  $stmt->closeCursor();
  // Get surveys sent to the client
  $sql = "SELECT sl.objectId,sl.clientId,sl.score,sl.comments, sl.flagged, sl.note, sl.receivedOnDate, sl.sentOnDate,sl.reminderSentOnDate,sl.emailStatus, " .
        "sl.followupOnDate, sl.followupComments, sl.followupBy AS followupById, sl.loyaltyDrivers, sl.howToImproveComments, sl.howToImproveComments2, sl.kudos," .
        "CONCAT(uf.firstName, ' ',uf.lastName) as followupByName, u.objectId AS drlId, " .
        "CONCAT(u.firstName, ' ',u.lastName) as drlName, " .
        "s.description as surveyDescription " .
        "FROM Client c INNER JOIN " .
        "Survey_Log sl ON sl.clientId = c.objectId " .
        "INNER JOIN Survey s ON s.objectId = sl.surveyId " .
        "INNER JOIN User u ON u.objectId = CASE WHEN sl.drlId IS NOT NULL THEN sl.drlId ELSE c.drl END " .
        "LEFT JOIN User uf ON uf.objectId = sl.followupBy " .
        "WHERE c.objectId='$clientId' AND sl.isDeleted=0 " .
        "ORDER BY sl.sentOnDate DESC";

  $stmt = $conn->query($sql);
  $clientInfo["surveys"] = [];
  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
    $clientInfo["surveys"] = $rows;
  }

  return $response->withJson($clientInfo);

});

// Edit survey drl
$app->post("/saveSurveyDrl", function(Request $request, Response $response){
  
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $vendorId = $reqData["vendorId"];
  $surveyId = $reqData["surveyId"];
  $drlId = $reqData["drlId"];

  $count = $conn->exec("UPDATE Survey_Log SET drlId = '$drlId' WHERE objectId='$surveyId' AND vendorId='$vendorId' LIMIT 1");
  return $response->withJson(array("success"=>true, "count"=>$count));
});

?>
