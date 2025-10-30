<?php

/**
 * REST routing
 * @description
 * 
 */

//ssh -i ~/AWS/KlientKulture.pem -Ng  -L 3308:127.0.0.1:3306 ec2-user@ec2-13-55-139-221.ap-southeast-2.compute.amazonaws.com
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

//

require "./common.php";

if(DEV){  // only required in Dev mode
  header("Access-Control-Allow-Origin: *");
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Max-Age: 1000");
  header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Origin, Cache-Control, Pragma, Authorization, Accept, Accept-Encoding");
  header("Access-Control-Allow-Methods: PUT, POST, GET, OPTIONS, DELETE");
}

// Create instance of SLIM app
// -- define a custom error handler
$c = new \Slim\Container();
$c["errorHandler"] = function($c){
  return function ($request, $response, $exception) use ($c) {

        GLOBAL $ERROR_DICT;
        $errorInfo = $ERROR_DICT["APP_ERROR"];
        $errorInfo["exception"] = $exception;

        return $c["response"]->withStatus(500)
                             ->withHeader("Content-Type","application/json")
                             ->withJson($errorInfo);
  };
};
//$c["settings"] = ['determineRouteBeforeAppMiddleware' => true];
$app = new \Slim\App($c);

// SLIM routes
require __DIR__ . "/routes/_app.php";
require __DIR__ . "/routes/_auth.php";
require __DIR__ . "/routes/_views.php";
require __DIR__ . "/routes/_organisation.php";
require __DIR__ . "/routes/_profile.php";
require __DIR__ . "/routes/_droplist.php";
require __DIR__ . "/routes/_staff.php";
require __DIR__ . "/routes/_client.php";
require __DIR__ . "/routes/_survey.php";
require __DIR__ . "/routes/_generic.php";
require __DIR__ . "/routes/_api.php";

// Create error response
function setErrorResponse(Response $response,$errorCode){
  global $ERROR_DICT;
  return $response->withStatus(400)->withHeader("Content-Type","application/json")->withJson($ERROR_DICT[$errorCode]);
}

// Middleware to check authorization header
$app->add(function ($request, $response, $next) {

  $excludedRoutes = ["login","verifyLoggedUser","createPasswordResetLink","resetPassword","verifyPasswordResetLink","createOrganisation","saveSurveyFeedback","saveTriageFeedback","surveyInfoForFeedback","surveyManagers","surveyInfoForLoyaltyDrivers","surveyInfoForCustomQuestions", "quarterly_results"];
  $routeName = $request->getUri()->getPath();

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $response = $next($request, $response);
    return $response;
  }

  if(in_array($routeName,$excludedRoutes)) {
    $response = $next($request, $response);
    return $response;
  } else {        // Verify the token first. Return error is token is invalid

    $token = null;
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
      $header = trim($headers["Authorization"]);
      if (preg_match('/Bearer\s(\S+)/', $header, $matches)) {
        $token = $matches[1];
      }

    } else {
      return $response->withStatus(400)->withHeader("Content-Type","application/json")->withJson(array("code"=>400,"message"=>"Invalid token"));
    }

    if($token && Util::validateWebToken($token)) {
      $response = $next($request, $response);
      return $response->withHeader("Client-Culture","Auth Request");
    }
    else

      return $response->withStatus(400)->withHeader("Content-Type","application/json")->withJson(array("code"=>400,"message"=>"Failed to validate token"));
  }

});
// Start SLIM
$app->run()

// Allow from any origin
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Credentials: true");
// header("Access-Control-Max-Age: 1000");
// header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Origin, Cache-Control, Pragma, Authorization, Accept, Accept-Encoding");
// header("Access-Control-Allow-Methods: PUT, POST, GET, OPTIONS, DELETE");
//
// require_once("common.php");
//
// $postData = json_decode(file_get_contents("php://input"),true);   //post data as an associative array
//
// // Get ACTION var from $postData and call relevant function with payload
// if(isset($postData["ACTION"])) {
//   switch ($postData["ACTION"]) {
//     case "LOGIN_USER":
//       loginUser($postData["PAYLOAD"]);
//       break;
//     case "GET_ORGANISATION":
//       getOrganisation($postData["PAYLOAD"]["vendorId"]);
//       break;
//     case "GET_EMPLOYEES":
//       getEmployees($postData["PAYLOAD"]["vendorId"]);
//       break;
//
//     default:
//       break;
//   }
// }
//
// // Login User
// function loginUser($payload) {
//
//  $conn = Util::createConnection();
//  $username = $payload["username"];
//  $password = $payload["password"];
//
//  $sql = "SELECT User.*,Vendor.trial FROM User INNER JOIN Vendor ON User.vendorId=Vendor.objectId WHERE Vendor.active=1 AND User.isDeleted=0 AND User.userName='" . $username . "' LIMIT 1";
//  $q = $conn->query($sql);
//  $q->setFetchMode(PDO::FETCH_ASSOC);
//
//  if($q->rowCount()>0) {
//    $r= $q->fetch();
//
//    if($password=="Leroyleroy1") {   // TODO: Get rid of this!
//    //$conn->exec("UPDATE User SET lastSuccessfulLogin=" . $conn->quote(gmdate("Y-m-d H:i:s")) . " WHERE objectId=" . $conn->quote($r["objectId"]) );
//      Util::sendUserInfo($r);
//    }
//
//    else {
//
//      if($r["active"]==="0") trigger_error("Account has been deactivated", E_USER_ERROR);
//
//      if(password_verify($password,$r["password"])) {
//
//        $loginHistory = isset($r["loginHistory"]) ? json_decode($r["loginHistory"],true) : [];
//        if(count($loginHistory)>=10) $loginHistory = array_shift($loginHistory);    //remove first element from the array
//        //$loginHistory[] = array("ip"=>$_SERVER['REMOTE_ADDR'],"date"=>gmdate("Y-m-d H:i:s"));
//
//        //$conn->exec("UPDATE User SET lastSuccessfulLogin=" . $conn->quote(gmdate("Y-m-d H:i:s")) . ",loginHistory=" . $conn->quote(json_encode($loginHistory)) .  " WHERE objectId=" . $conn->quote($r["objectId"]) );
//        Util::sendUserInfo($r);
//      }
//
//      else {
//        $conn->exec("UPDATE User SET lastFailedLogin=" . $conn->quote(gmdate("Y-m-d H:i:s")) . " WHERE objectId=" . $conn->quote($r["objectId"]) );
//        trigger_error("Invalid username or password", E_USER_ERROR);
//      }
//    }
//  }
//
//  else {
//    trigger_error("Invalid username or password",E_USER_ERROR);
//  }
//
// }
//
// // Organisation info
// function getOrganisation($vendorId){
//   $conn = Util::createConnection();
//
//   $stmt = $conn->query(
//     "SELECT objectId,name,email,logo,address,city,state,postCode,primaryContact,secondaryContact,alternateEmail,phone,fax,mobile FROM Vendor " .
//     "WHERE objectId='$vendorId'"
//   );
//
//   if($stmt && $stmt->rowCount()>0 && ($row=$stmt->fetch(PDO::FETCH_ASSOC))!==false) {
//     Util::sendJSONResponse($row);
//   } else {
//     trigger_error("Could not get organisation info",E_USER_ERROR);
//   }
// }
//
// // Get Employees
// function getEmployees($vendorId){
//   $conn = Util::createConnection();
//
//   $stmt = $conn->query(
//     "SELECT objectId, vendorId, firstName, middleName, lastName, email,designation, department, phone, mobile FROM User " .
//     "WHERE vendorId='$vendorId' ORDER BY firstName ASC"
//   );
//
//   if($stmt && ($rows=$stmt->fetchAll(PDO::FETCH_ASSOC))!==false) {
//     Util::sendJSONResponse($rows);
//   } else {
//     trigger_error("Could not get employees",E_USER_ERROR);
//   }
// }


?>
