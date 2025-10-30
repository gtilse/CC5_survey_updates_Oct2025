<?php

if ('POST' !== $_SERVER['REQUEST_METHOD']) {
    http_response_code(405);
    die;
}

require "./api/vendor/autoload.php";
require "./api/common.php";

use Aws\Sns\Message;
use Aws\Sns\MessageValidator;

// write out the message to an output file
file_put_contents("./admin/aws_notification.log", file_get_contents("php://input") . PHP_EOL . "------" . PHP_EOL, FILE_APPEND);

try {
    //$message = Message::fromRawPostData();
    //$validator = new MessageValidator();
    $message = json_decode(file_get_contents("php://input"),true);

    // confirm to a subscription message...only done once
    // if (in_array($message['Type'], ['SubscriptionConfirmation', 'UnsubscribeConfirmation'])) {
    //     file_get_contents($message['SubscribeURL']);
    //     return;
    // }

    $emailComplaint = "";
    if($message["Type"]=="Notification" && $message["Message"]) {

      $message = json_decode($message["Message"],true);
      // Set email status based upon message contents
      $emailStatus=2;
      if($message["notificationType"]=="Delivery")
        $emailStatus = 2;
      elseif ($message["notificationType"]=="Bounce") {
        if($message["bounce"]["bounceType"]=="Permanent")
          $emailStatus = 3;     //hard bounce
        else $emailStatus = 4;  //soft bounce
      }
      elseif ($message["notificationType"]=="Complaint")
        $emailComplaint = ",emailComplaint=1";       //complaint

      // find email ID in Survey_Log table and update its status
      $conn = Util::createConnection();
      if(($conn->exec("UPDATE Survey_Log SET emailStatus=$emailStatus" . $emailComplaint . " WHERE emailId=".$conn->quote($message["mail"]["messageId"])))==0)
        $conn->exec("UPDATE Survey_Log SET reminderEmailStatus=$emailStatus" . $emailComplaint . " WHERE reminderEmailId=".$conn->quote($message["mail"]["messageId"]));

    } else {
      file_put_contents("./admin/aws_notification.log", "Invalid message" . PHP_EOL . "------" . PHP_EOL, FILE_APPEND);
    }



} catch (Exception $e) {
    file_put_contents("./admin/aws_notification.log", json_encode($e) . PHP_EOL . "------" . PHP_EOL, FILE_APPEND);
    http_response_code(404);
    die();
}
