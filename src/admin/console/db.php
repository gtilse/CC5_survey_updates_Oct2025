<?php

require __DIR__ . "/../../api/common.php";

/** -----POST-------------------------------------------------------------------
 ** process the post request and call relevant function
 ** ----------------------------------------------------------------------------
 **/

$postData = json_decode(file_get_contents("php://input"),true);

if(isset($postData)) {

  switch($postData["ACTION"]) {

    case "GETADMINCONSOLE":
      getAdminConsole();
      break;

    case "CREATEORGANISATION":
      createOrganisation($postData["record"]);
      break;

    case "MODIFYVENDORINFO":
      modifyVendorInfo($postData["record"]);
      break;

    default:

      trigger_error("POST action is undefined",E_USER_ERROR);
      break;

  }

}

function getAdminConsole() {

  $response = array("vendors"=>[],"appLog"=>[],"exceptionLog"=>[]);     //function return array
  $conn = Util::createConnection();

  // Vendor info
  $stmt = $conn->query(
    "SELECT Vendor.*, Setting.surveyEmailFrom FROM Vendor  INNER JOIN Setting ON " .
    "Vendor.objectId = Setting.vendorId ORDER BY Vendor.createdAt DESC"
  );

  if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false)
    $response["vendors"] = $rows;
  else
    trigger_error("Database Error",E_USER_ERROR);

  // Application log
  if(file_exists(APP_LOG_FILE)) {
    $data = array_reverse(array_slice(file(APP_LOG_FILE), -1000));
    $appLog = [];
    foreach ($data as $key => $value) {
      $appLog[] = json_decode($value);
    }
    $response["appLog"] = $appLog;
  }

  // Exception log
  if(file_exists(EXCEPTION_LOG_FILE)) {
    $response["exceptionLog"] = array_reverse(array_slice(file(EXCEPTION_LOG_FILE), -1000));
  }

  // Return
  Util::sendJSONResponse($response);

}

function modifyVendorInfo($record) {

  $objectId = $record["objectId"];
  $surveyEmailFrom = $record["surveyEmailFrom"];
  $tmpArray = [];

  unset($record["objectId"]);
  unset($record["surveyEmailFrom"]);
  $updatedAt = gmdate("Y-m-d H:i:s");

  foreach($record as $key=>$value) {

    $keyName = ":" . $key;
    $tmpArray[] = "$key=$keyName";
  }

  $conn = Util::createConnection();
  $sql = "UPDATE Vendor SET " . implode(",",$tmpArray) . " WHERE objectId=" . $conn->quote($objectId);
  $stmt=$conn->prepare($sql);

  if($stmt->execute($record)){
    $stmt->closeCursor();
    $conn->exec("UPDATE Setting SET surveyEmailFrom = " . $conn->quote($surveyEmailFrom) . " WHERE vendorId=" . $conn->quote($objectId));
    echo json_encode(array("objectId"=>$objectId,"updatedAt"=>$updatedAt));
  }

  else {
    trigger_error("Failed to update vendor information", E_USER_ERROR);
  }

}

function createOrganisation($record) {
  $conn = Util::createConnection();

  // ensure username is not taken
  $stmt = $conn->query("SELECT * FROM User where userName=" . $conn->quote($record["username"]));
  if($stmt->rowCount()>0) {
    trigger_error("Username already exists. Try a different name", E_USER_ERROR);
  }

  // Begin transaction to create the company
  $stmt->closeCursor();
  try {
    $conn->beginTransaction();
    $vendorId = Util::createID();
    $timeStamp = gmdate("Y-m-d H:i:s");

    // Insert record into Vendor table
    $sql = "INSERT INTO Vendor (objectId,trial,active,name,email,primaryContact,updatedAt,createdAt) VALUES " .
           "(?,1,1,?,?,?,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array($vendorId,$record["name"],$record["email"],$record["primaryContact"],$timeStamp,$timeStamp));

    // Create a user
    $password = password_hash($record["password"], PASSWORD_DEFAULT);
    $nameArr = explode(" ",$record["primaryContact"]);
    $firstName = $nameArr[0];
    $lastName = count($nameArr) > 1 ? $nameArr[count($nameArr)-1] : NULL;

    $sql = "INSERT INTO User(objectId,vendorId,active,type,level,firstName,lastName,userName,email,emailVerified,password, createdAt, updatedAt) " .
           "VALUES(?,?,1,0,1,?,?,?,?,?,?,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array(Util::createID(),$vendorId,$firstName,$lastName,$record["username"],$record["email"],1,$password,$timeStamp,$timeStamp));

    // Insert default values in Setting table
    $sql = "INSERT INTO Setting(objectId,vendorId,surveyEmailFrom,notificationsEmail,followupDays,emailMessageNotification,displaySocialLinksInSurvey,bouncedEmailNotification,createdAt,updatedAt) " .
           "VALUES(?,?,?,?,7,1,1,1,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array(Util::createID(),$vendorId,SurveyEmailDefaultAddress,$record["email"],$timeStamp,$timeStamp));

    // Insert default values in SurveyEmployee table
    $sql = "INSERT INTO SurveyEmployee(objectId,vendorId,surveyHtml,emailSubject,frequency,addLogo,createdAt,updatedAt) " .
           "VALUES(?,?,?,?,0,1,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array(Util::createID(),$vendorId,EmployeeSurveyHtml,EmployeeSurveySubject,$timeStamp,$timeStamp));

    // commit transaction and email account creation confirmation message
    $conn->commit();

    $emailBody = "Hello $record[primaryContact],\r\n\r\n" .
                 "Your Client Culture account has been successfully created. Please login using the provided credentials.\r\n\r\n" .
                 "Username: $record[username]\r\n" .
                 "Password: (supplied when creating your account)\r\n\r\n" .
                 "Please email support@clientculture.com if you face any issues";
    Util::sendAutomatedEmail($record["name"],$record["email"],"Your Client Culture account is ready!",$emailBody);

    echo "Organisation created successfully";

  }

  catch(Exception $e) {
    $conn->rollBack();
    trigger_error($e->getMessage(), E_USER_ERROR);
  }

}

?>
