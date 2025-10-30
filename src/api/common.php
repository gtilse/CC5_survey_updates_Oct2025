<?php

require __DIR__ . "/vendor/autoload.php";
require __DIR__ . "/../../cc_config.php";

use \Firebase\JWT\JWT;
use Aws\Ses\SesClient;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Shared module
// Definitions for global constants and shared functions

// Get app configuration
$APP_CONFIG = json_decode(file_get_contents(__DIR__ . "/../assets/config.json"),true);

// Default timezone
// Set to UTC
date_default_timezone_set("UTC");

if(DEV) {
  
  //define("MYSQL_PORT",3306);
  //define("MYSQL_HOST","ec2-13-55-139-221.ap-southeast-2.compute.amazonaws.com");
  define("MYSQL_PORT",3306);
  //define("MYSQL_HOST","client-culture-prod.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com");
  define("MYSQL_HOST","client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com");
}

else {
  define("MYSQL_PORT",3306);
  //define("MYSQL_HOST","client-culture-prod.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com");
  define("MYSQL_HOST","client-culture-v8.c1kfmstpx3aa.ap-southeast-2.rds.amazonaws.com");
}

// Global Constants

// Site
define("ROOT_PATH",dirname(dirname(__FILE__)));
define("EXCEPTION_LOG_FILE","app_exception.log");
define("WEBSITE_ROOT",$APP_CONFIG["company"]["appWebsite"]);
define("UPLOAD_DIR", ROOT_PATH . "/app_data/");			//upload folder
define("FULL_PATH_UPLOAD_DIR", $APP_CONFIG["company"]["dataDir"]);

// Survey types
$SURVEY_TYPE = array("CLIENT"=>1,"EMPLOYEE"=>2,"PULSE"=>3,"MANAGER"=>4,"TRIAGE"=>5);
$EMAIL_TYPE = array("SURVEY"=>1,"REMINDER"=>2);

// Error Codes
$ERROR_DICT = array(
  "APP_ERROR" => array("code"=>500,"message"=>"Internal application error"),

  "DATA_FETCH_FAILED" => array("code"=>100, "message"=>"Failed to fetch data"),
  "DATA_UPDATE_FAILED" => array("code"=>101, "message"=>"Failed to update data"),
  "DATA_DELETE_FAILED" => array("code"=>102, "message"=>"Failed to delete data"),
  "DATA_DEACTIVATE_FAILED" => array("code"=>103, "message"=>"Failed to delete data"),
  "DATA_CREATE_FAILED" => array("code"=>104, "message"=>"Failed to create data"),
  "CSV_READ_FAIL" => array("code"=>105, "message"=>"Failed to read CSV file"),

  "LOGIN_FAILED" => array("code"=>200, "message"=>"Bad username or password"),
  "ACCOUNT_DEACTIVATED" => array("code"=>201, "message"=>"Account has been deactivated"),
  "TOKEN_EXPIRED" => array("code"=>202, "message"=>"Security token has expired"),
  "PASSWORD_VERIFICATION_CODE_EXPIRED" => array("code"=>203, "message"=>"Password verification code has expired"),
  "USER_ALREADY_EXIST" => array("code"=>204, "message"=>"Username already exists in the system"),

  "INVALID_SURVEY_TYPE" => array("code"=>203, "message"=>"Invalid survey type"),
  "NO_CLIENTS_TO_SURVEY" => array("code"=>204, "message"=>"No clients to survey"),
  "NO_STAFFS_TO_SURVEY" => array("code"=>205, "message"=>"No staffs to survey")

);

// Client Category sort
$CLIENT_CATEGORY_SORT = array("Platinum"=>0,"Gold"=>1,"Silver"=>2,"Bronze"=>3,"No Fee"=>4);

// App notifications
$APP_NOTIFICATION_TYPES = array("CLIENT_SURVEY_QUEUED"=>"CLIENT_SURVEY_QUEUED",
                                "CLIENT_REMINDER_SENT"=>"CLIENT_REMINDER_SENT",
                                "STAFF_SURVEY_QUEUED"=>"STAFF_SURVEY_QUEUED",
                                "CLIENT_EMAIL_BOUNCED"=>"CLIENT_EMAIL_BOUNCED",
                                "ACTION_ITEM"=>"ACTION_ITEM",
                                "LOGIN_SUCCESS"=>"LOGIN_SUCCESS",
                                "LOGIN_SUCCESS_SSO" => "LOGIN_SUCCESS_SSO",
                                "LOGIN_FAILED"=>"LOGIN_FAILED");

//
define("PROMOTERS",9);
define("DETRACTORS",6);

// HTML
define("UNSUBSCRIBE_LINK","<span class=''><a href='{{WEB_ROOT}}survey/survey_unsubscribe.php?id={{CONTACTID}}' target='_blank' class='footer-link'>Unsubscribe me</a></span>");
define("WEB_LINK","<span class=''>Email not displaying properly? <a href='{{WEB_ROOT}}survey/survey.php?id={{OBJECTID}}&type={{SURVEY_TYPE}}' target='_blank' class='footer-link'>Click here</a></span>");

// Util Class
// Common functions shared by the APIs
class Util {

  // Create connection to DB
  // Returns connection object
  public static function createConnection() {
    $conn = new PDO('mysql:host='.MYSQL_HOST.';port='.MYSQL_PORT.';dbname='.MYSQL_DB, MYSQL_USERNAME, MYSQL_PASSWORD);
    $conn->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
    $conn->setAttribute( PDO::ATTR_EMULATE_PREPARES, true );
    $conn->exec("SET CHARACTER SET utf8;");

    return $conn;
  }

  // Generate JSON Web Token
  public static function createWebToken($userId){
    $issuedAt = time();
    $expirationTime = $issuedAt + 604800;   // set expiry 7 days from now
    $payload = array(
      'userid' => $userid,
      'iat' => $issuedAt,
      'exp' => $expirationTime
    );
    $key = SECRET_KEY;
    $alg = 'HS256';
    $jwt = JWT::encode($payload, $key, $alg);
    return $jwt;
  }

  // Validate JSON Web Token
  public static function validateWebToken($token){
    try {
      $decoded = JWT::decode($token, SECRET_KEY, array('HS256'));
      return $decoded;
    }

    catch(Exception $e){
      return FALSE;
    }

  }

  // Insert row into LoginHistory table
  public static function insertLoginHistory($userId,$status){
    $conn = self::createConnection();
    $objectId = self::createID();

    $stmt = $conn->prepare("INSERT INTO LoginHistory (objectId,userId,status,ipAddress) VALUES(?,?,?,?)");
    $stmt->execute(array($objectId,$userId,$status,$_SERVER['REMOTE_ADDR']));
  }


  // Create user info json
  public static function createUserInfo($r){
    return array("objectId"=>$r["objectId"], "vendorId"=>$r["vendorId"],"accessLevel"=>isset($r["level"])?intval($r["level"]):2,"picture"=>$r["picture"], "userName"=>$r["userName"],
    "email"=>$r["email"],"firstName"=>$r["firstName"], "middleName"=>$r["middleName"], "lastName"=>$r["lastName"], "designation"=>$r["designation"],"department"=>$r["department"],
    "phone"=>$r["phone"],"mobile"=>$r["mobile"],"lastSuccessfulLogin"=>$r["lastSuccessfulLogin"],"lastFailedLogin"=>$r["lastFailedLogin"],
    "loginHistory"=>$r["loginHistory"],"trial"=>(isset($r["trial"])?$r["trial"]:"1") );
  }

  // Send user info back to client
  public static function sendUserInfo($r) {
    self::sendJSONResponse(array("objectId"=>$r["objectId"], "vendorId"=>$r["vendorId"],"accessLevel"=>isset($r["level"])?intval($r["level"]):2,"picture"=>$r["picture"], "userName"=>$r["userName"],
    "email"=>$r["email"],"firstName"=>$r["firstName"], "middleName"=>$r["middleName"], "lastName"=>$r["lastName"], "designation"=>$r["designation"],"department"=>$r["department"],
    "phone"=>$r["phone"],"mobile"=>$r["mobile"],"lastSuccessfulLogin"=>$r["lastSuccessfulLogin"],"lastFailedLogin"=>$r["lastFailedLogin"],
    "loginHistory"=>$r["loginHistory"],"trial"=>(isset($r["trial"])?$r["trial"]:"1") ));
  }

  // converts array input to JSON and returns contents back to caller
  public static function sendJSONResponse($responseArr) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($responseArr);
    die();
  }

  // Create UUID
  public static function createUUID() {
    return sprintf( '%04x%04x%04x%04x%04x%04x%04x%04x',
          mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
          mt_rand( 0, 0xffff ),
          mt_rand( 0, 0x0fff ) | 0x4000,
          mt_rand( 0, 0x3fff ) | 0x8000,
          mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
      );
  }

  // generate a 13 character alpha-numeric ID
  // this is used for creation of objectId primary key
  public static function createID() {
    $generator = new RandomStringGenerator;
    return $generator->generate(13);
  }

  // Read a CSV file into an array
  public static function readCSVFile($filePath) {

    $hasError = false;
    $csvArray = [];

    if (($handle = fopen($filePath, "r")) !== FALSE) {
      while (($data = fgetcsv($handle, 5000, ",")) !== FALSE) {
        $csvArray[] = $data;
      }
      fclose($handle);
    }

    else $hasError = true;

    return $hasError ? false : $csvArray;

  }

  // search an array of object by one or multiple keys
  // returns a found key or false if search fails
  public static function searchArray($parents, $searched) {
    if (empty($searched) || empty($parents)) {
      return false;
    }

    foreach ($parents as $key => $value) {
      $exists = true;
      foreach ($searched as $skey => $svalue) {
        $exists = ($exists && isset($parents[$key][$skey]) && strtolower($parents[$key][$skey]) == strtolower($svalue));
      }
      if($exists){ return $key; }
    }

    return false;
  }

  // Alphabetically sorts a string and then compares if both have same characters
  public static function compareSortedStrings($str1, $str2, $ignoreCase = true) {

    // remove all white spaces before comparison
    $str1 = str_replace(' ', '', $str1);
    $str2 = str_replace(' ', '', $str2);

    // if ignoreCase==true convert to lower before comparison
    if($ignoreCase) {
      $str1 = strtolower($str1);
      $str2 = strtolower($str2);
    }

    $str1Array = str_split($str1);
    $str2Array = str_split($str2);

    sort($str1Array);
    sort($str2Array);

    $str1 = implode('',$str1Array);
    $str2 = implode('',$str2Array);

    return $str1 === $str2 ? true : false;
  }

  // get all children for a user
  // return results in an array
  public static function getAllChildrenForUser($userId, $users, $depth, &$retArr) {
    foreach ($users as $key => $value) {
      if($value["parentId"]===$userId) {

        $fullName = isset($value["fullName"]) ? $value["fullName"] : $value["firstName"] . " " . $value["lastName"];

        if($value["type"]=="0")
          $retArr[] = array("objectId"=>$value["objectId"],"type"=>"0","active"=>$value["active"], "parentId"=>$value["parentId"],"designation"=>$value["designation"], "fullName"=>$fullName, "staffSurveyOnly"=>$value["staffSurveyOnly"],"email"=>$value["email"],"department"=>$value["department"]);
        else
          $retArr[] = array("objectId"=>$value["objectId"],"type"=>"1","active"=>$value["active"], "parentId"=>$value["parentId"],"designation"=>$value["designation"], "fullName"=>$fullName,"staffSurveyOnly"=>$value["staffSurveyOnly"],"email"=>$value["email"],"department"=>$value["department"]);

        if ($depth != 0) {
          self::getAllChildrenForUser($value["objectId"], $users, $depth - 1, $retArr);
        }
      }
    }

    return $retArr;
  }

  // return an array of all children for a user
  // if user is impersonated as another user, return its children
  public static function getChildrenArray($conn, $vendorId, $userId, $depth = -1){
    $stmt = $conn->query("SELECT * FROM User WHERE vendorId='$vendorId' AND isDeleted=0 ORDER BY firstName");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    $key = array_search($userId, array_column($users,"objectId"));
    if($key !== false) {

      $oUser = $users[$key];

      if(isset($oUser["userOverrideId"])) {

        $key = array_search($oUser["userOverrideId"], array_column($users,"objectId"));
        if($key!==false)
          $oUser = $users[$key];
        else
          return false;

        $userId = $oUser["objectId"];
      }

      $children = [];

      if($oUser["type"]=="0")
        $children[] = array("objectId"=>$oUser["objectId"],"type"=>$oUser["type"],"active"=>$oUser["active"], "parentId"=>(isset($oUser["parentId"])?$oUser["parentId"]:""),"designation"=>$oUser["designation"], "fullName"=> $oUser["firstName"] . " " . $oUser["lastName"], "staffSurveyOnly"=>$oUser["staffSurveyOnly"], "email"=>$oUser["email"],"department"=>$oUser["department"]);
      else
        $children[] = array("objectId"=>$oUser["objectId"],"type"=>$oUser["type"],"active"=>$oUser["active"],"parentId"=>(isset($oUser["parentId"])?$oUser["parentId"]:""),"designation"=>"None", "fullName"=> $oUser["locationName"], "staffSurveyOnly"=>$oUser["staffSurveyOnly"],"department"=>$oUser["department"]);

      $children = self::getAllChildrenForUser($userId, $users, $depth, $children);

      usort($children, function($a, $b) {   // sort the array by full name asc
            return strcmp($a["fullName"], $b["fullName"]);
      });

      return $children;
    }

    else {
      return false;
    }

  }

  // Save notification
  public static function createNotification($vendorId,$notificationType,$description,$linkedId=false){

    $conn = self::createConnection();
    $objectId = self::createID();

    $linkedId = $linkedId === false ? NULL : $linkedId;

    try {
      $stmt = $conn->prepare("INSERT INTO Notification (objectId,vendorId,notificationType,description,linkedId) VALUES(?,?,?,?,?)");
      $stmt->execute(array($objectId,$vendorId,$notificationType,$description,$linkedId));
    }

    catch(Exception $ex){
      // TODO: Notification Insert error
    }
  }

  // Send support email
  public static function sendSupportEmail($toName,$toEmail,$subject,$body){

    // Email template text
    $emailBody = file_get_contents(__DIR__ ."/support_email_template.html");
    $emailBody = str_ireplace("{{EMAIL_HTML}}",$body,$emailBody);
    $emailBody = str_ireplace("{{COMPANY_NAME}}",$GLOBALS["APP_CONFIG"]["company"]["name"],$emailBody);
    $emailBody = str_ireplace("{{APP_SUPPORT_EMAIL}}",$GLOBALS["APP_CONFIG"]["company"]["appSupportEmail"],$emailBody);

    // Configure PHP Mailer and send the email
    $mail = new PHPMailer(false);                              // Passing `true` enables exceptions
    try {
        //Server settings
        $mail->SMTPDebug = 0;
        $mail->isSMTP();
        $mail->Host = EMAIL_SMTP;
        $mail->SMTPAuth = true;
        $mail->Username = EMAIL_USERNAME;
        $mail->Password = EMAIL_PASSWORD;
        $mail->SMTPSecure = EMAIL_SMTP_SECURE;
        $mail->Port = EMAIL_PORT;

        //Recipients
        $mail->setFrom(EMAIL_FROM_EMAIL, EMAIL_FROM_NAME);

        $mail->addAddress($toEmail, $toName);
        //$mail->addAddress("tjdada@gmail.com","Tabraiz Dada");
        //$mail->addAddress("survey@clientculture.net","Client Culture");
        //$mail->addAddress("gtilse@clientculture.com.au","Greg Tilse");

        $mail->addReplyTo(EMAIL_FROM_EMAIL, EMAIL_FROM_NAME);

        //Content
        $mail->isHTML(true);                                  // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $emailBody;
        //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }

  }

  // Send support email
  public static function sendKudosEmail($to,$subject,$body, $logo){

    // Email template text
    $emailBody = file_get_contents(__DIR__ ."/kudos_email_template.html");
    $emailBody = str_ireplace("{{EMAIL_HTML}}",$body,$emailBody);
    $emailBody = str_ireplace("{{COMPANY_NAME}}",$GLOBALS["APP_CONFIG"]["company"]["name"],$emailBody);
    $emailBody = str_ireplace("{{APP_SUPPORT_EMAIL}}",$GLOBALS["APP_CONFIG"]["company"]["appSupportEmail"],$emailBody);
    $emailBody = str_ireplace("{{LOGO_IMAGE}}", $logo, $emailBody);
    // Configure PHP Mailer and send the email
    $mail = new PHPMailer(false);                              // Passing `true` enables exceptions
    try {
        //Server settings
        $mail->SMTPDebug = 0;
        $mail->isSMTP();
        $mail->Host = EMAIL_SMTP;
        $mail->SMTPAuth = true;
        $mail->Username = EMAIL_USERNAME;
        $mail->Password = EMAIL_PASSWORD;
        $mail->SMTPSecure = EMAIL_SMTP_SECURE;
        $mail->Port = EMAIL_PORT;

        //Recipients
        $mail->setFrom(EMAIL_FROM_EMAIL, EMAIL_FROM_NAME);

        foreach($to as $key=>$value) {
          $mail->addAddress($value["email"], $value["name"]);
        }
        
        $mail->addReplyTo(EMAIL_FROM_EMAIL, EMAIL_FROM_NAME);

        //Content
        $mail->isHTML(true);                                  // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $emailBody;
        //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }

  }
}

// third party class to generate a Random String
class RandomStringGenerator
 {
     /** @var string */
     protected $alphabet;

     /** @var int */
     protected $alphabetLength;


     /**
      * @param string $alphabet
      */
     public function __construct($alphabet = '')
     {
         if ('' !== $alphabet) {
             $this->setAlphabet($alphabet);
         } else {
             $this->setAlphabet(
                   implode(range('a', 'z'))
                 . implode(range('A', 'Z'))
                 . implode(range(0, 9))
             );
         }
     }

     /**
      * @param string $alphabet
      */
     public function setAlphabet($alphabet)
     {
         $this->alphabet = $alphabet;
         $this->alphabetLength = strlen($alphabet);
     }

     /**
      * @param int $length
      * @return string
      */
     public function generate($length)
     {
         $token = '';

         for ($i = 0; $i < $length; $i++) {
             $randomKey = $this->getRandomInteger(0, $this->alphabetLength);
             $token .= $this->alphabet[$randomKey];
         }

         return $token;
     }

     /**
      * @param int $min
      * @param int $max
      * @return int
      */
     protected function getRandomInteger($min, $max)
     {
         $range = ($max - $min);

         if ($range < 0) {
             // Not so random...
             return $min;
         }

         $log = log($range, 2);

         // Length in bytes.
         $bytes = (int) ($log / 8) + 1;

         // Length in bits.
         $bits = (int) $log + 1;

         // Set all lower bits to 1.
         $filter = (int) (1 << $bits) - 1;

         do {
             $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));

             // Discard irrelevant bits.
             $rnd = $rnd & $filter;

         } while ($rnd >= $range);

         return ($min + $rnd);
     }
 }

?>
