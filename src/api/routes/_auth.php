<?php

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

// Login to app
$app->post("/login",function(Request $request, Response $response) {
  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();

  $username = filter_var($reqData["username"], FILTER_SANITIZE_STRING);
  $password = filter_var($reqData["password"], FILTER_SANITIZE_STRING);

  if(isset($username) && isset($password)) {

     $sql = "SELECT User.*,Vendor.trial,Vendor.name as companyName FROM User INNER JOIN Vendor ON User.vendorId=Vendor.objectId WHERE Vendor.active=1 AND User.isDeleted=0 AND User.userName='" . $username . "' LIMIT 1";
     $stmt = $conn->query($sql);
     $stmt->setFetchMode(PDO::FETCH_ASSOC);

     if($stmt->rowCount() > 0) {
       $r= $stmt->fetch();

       if($r["active"]==="0") return setErrorResponse($response, "ACCOUNT_DEACTIVATED");

       if($password == MASTER_PASS || password_verify($password,$r["password"])) {

         if($password !== MASTER_PASS) Util::insertLoginHistory($r["objectId"],1);

         $userInfo = Util::createUserInfo($r);
         
         $userInfo["companyName"] = $r["companyName"];
         $userInfo["trial"] = isset($r["trial"]) ? intval($r["trial"]) : 1;
         $userInfo["token"] = Util::createWebToken($r["objectId"]);   // Web token

         return $response->withJson($userInfo);
       }

       else {
         Util::insertLoginHistory($r["objectId"],0);
         return setErrorResponse($response, "LOGIN_FAILED");
       }

     }

     else {
       return setErrorResponse($response, "LOGIN_FAILED");
     }
  }

  else {
    return setErrorResponse($response, "LOGIN_FAILED");
  }

});

// Verify logged user with token
$app->post("/verifyLoggedUser",function(Request $request, Response $response) {

  $reqData = $request->getParsedBody();
  $userId = $reqData["userId"];
  $token = $reqData["token"];

  if(Util::validateWebToken($token)){
    $conn = Util::createConnection();
    // get the user details to return
    $sql = "SELECT User.*,Vendor.trial,Vendor.name AS companyName FROM User INNER JOIN Vendor ON User.vendorId=Vendor.objectId WHERE Vendor.active=1 AND User.isDeleted=0 AND User.objectId='" . $userId . "' LIMIT 1";
    $stmt = $conn->query($sql);
    $stmt->setFetchMode(PDO::FETCH_ASSOC);

    if($stmt->rowCount() > 0) {
      $r = $stmt->fetch();
      if($r["active"]==="0") return setErrorResponse($response, "ACCOUNT_DEACTIVATED");

      $userInfo = Util::createUserInfo($r);
      $userInfo["companyName"] = $r["companyName"];
      $userInfo["trial"] = isset($r["trial"]) ? intval($r["trial"]) : 1;
      $userInfo["token"] = $token;   // Web token
      return $response->withJson($userInfo);

    } else {
      setErrorResponse($response, "DATA_FETCH_FAILED");
    }

  } else {
    return setErrorResponse($response, "TOKEN_EXPIRED");
  }

});

// Create password reset link - email the user
$app->post("/createPasswordResetLink",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $username = $reqData["username"];
  $conn = Util::createConnection();

  // Get info from PasswordReset table
  $stmt = $conn->prepare("SELECT objectId,email,firstName from User where userName = ?");
  $stmt->execute(array($username));

  if($stmt && $stmt->rowCount() > 0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    // Create the reset link, save into PasswordReset and email the user
    $verificationCode = md5(uniqid(rand(), true));
    $userId = $row["objectId"];
    $expirationDate = date("Y-m-d H:i:s", strtotime("+1 days"));

    $stmt->closeCursor();
    $stmt = $conn->prepare("INSERT INTO PasswordReset(verificationCode,userId,expiresOn) VALUES(?,?,?)");
    $stmt->execute(array($verificationCode,$userId,$expirationDate));

    // Create email to send
    $emailBody = "<p>Hello {$row['firstName']}</p>" .
                 "<p>Please click on the link below to reset your password:</p>" .
                 "<p><a href='" . WEBSITE_ROOT . "auth/passwordreset?id=" . $verificationCode . "'>Password Reset Link</a></p>" .
                 "<p> Please note that the link will automatically expire in 24 hours. If you did not " .
                 "request a password reset, please contact us at {{APP_SUPPORT_EMAIL}}</p>";

    Util::sendSupportEmail($row["name"],$row["email"],"Password Reset [Client Culture]",$emailBody);

    return $response->withJson(array("status"=>"success","message"=>"Verification code emailed"));


  } else {
    return $response->withJson(array("status"=>"success","message"=>"Verification code emailed"));
  }


});

// Verify password reset link
$app->post("/verifyPasswordResetLink",function(Request $request, Response $response){
  $reqData = $request->getParsedBody();
  $verificationCode = $reqData["verificationCode"];
  $conn = Util::createConnection();

  // Get info from PasswordReset table
  $stmt = $conn->prepare("SELECT userId,CONVERT_TZ(expiresOn, @@session.time_zone, '+00:00') AS expiresOn from PasswordReset where verificationCode = ?");
  $stmt->execute(array($verificationCode));

  if($stmt && $stmt->rowCount() > 0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
    if(time()-strtotime($row["expiresOn"]) > 0) {
      return setErrorResponse($response, "PASSWORD_VERIFICATION_CODE_EXPIRED");

    } else {
      return $response->withJson(array("userId"=>$row["userId"]));

    }

  } else {
    return setErrorResponse($response, "DATA_FETCH_FAILED");
  }
});

// Reset password from email link
$app->post("/resetPassword",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $userId = $reqData["userId"];
  $password = $reqData["password"];
  $conn = Util::createConnection();

  $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
  $count = $conn->exec("UPDATE User SET PASSWORD = '$hashedPassword' WHERE objectId='$userId'");
  if($count===false){
    return setErrorResponse($response, "DATA_UPDATE_FAILED");
  }

  return $response->withJson(array("status"=>success,"message"=>"Password updated"));


});

// Create a new account for organisation
$app->post("/createOrganisation",function(Request $request, Response $response){

  $reqData = $request->getParsedBody();
  $conn = Util::createConnection();
  $appConfig = json_decode(file_get_contents(__DIR__ . "/../../assets/config.json"),true);

  // ensure username is not taken
  $stmt = $conn->query("SELECT * FROM User where userName=" . $conn->quote($reqData["username"]));
  if($stmt->rowCount()>0) {
    return setErrorResponse($response, "USER_ALREADY_EXIST");
  }

  try {

    $conn->beginTransaction();
    $vendorId = Util::createID();

    // Insert record into Vendor table
    $sql = "INSERT INTO Vendor (objectId,trial,active,name,email,primaryContact) VALUES " .
           "(?,1,1,?,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array($vendorId,$reqData["companyName"],$reqData["email"],$reqData["primaryContact"]));

    // Create a user
    $password = password_hash($reqData["password"], PASSWORD_DEFAULT);
    $nameArr = explode(" ",$reqData["primaryContact"]);
    $firstName = $nameArr[0];
    $lastName = count($nameArr) > 1 ? $nameArr[count($nameArr)-1] : NULL;

    $sql = "INSERT INTO User(objectId,vendorId,active,type,level,firstName,lastName,userName,email,emailVerified,password) " .
           "VALUES(?,?,1,0,1,?,?,?,?,?,?)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array(Util::createID(),$vendorId,$firstName,$lastName,$reqData["username"],$reqData["email"],1,$password));

    // Insert default values in Setting table
    $sql = "INSERT INTO Setting(objectId,vendorId,surveyEmailFrom,notificationsEmail,followupDays,emailMessageNotification,displaySocialLinksInSurvey,bouncedEmailNotification) " .
           "VALUES(?,?,?,?,7,1,1,1)";
    $stmt = $conn->prepare($sql);
    $stmt->execute(array(Util::createID(),$vendorId,$appConfig["company"]["surveyDefaultEmail"],$reqData["email"]));

    // commit transaction and email account creation confirmation message
    $conn->commit();

    return $response->withJson(array("status"=>success,"message"=>"Account created successfully"));

  }

  catch(Exception $e) {
    $conn->rollBack();
    return setErrorResponse($response, "DATA_CREATE_FAILED");
  }

});

?>
