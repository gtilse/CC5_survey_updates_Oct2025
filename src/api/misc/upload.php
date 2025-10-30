<?php

/*
 * File upload script
 */

require __DIR__ . "/../common.php";

if(DEV){  // only required in Dev mode
 header("Access-Control-Allow-Origin: http://localhost:4200");
 header("Access-Control-Allow-Credentials: true");
 header("Access-Control-Max-Age: 1000");
 header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Origin, Cache-Control, Pragma, Authorization, Accept, Accept-Encoding");
 header("Access-Control-Allow-Methods: PUT, POST, GET, OPTIONS, DELETE");
}


$parts = pathinfo($_FILES["file_to_upload"]["name"]);
if (!isset($parts["extension"])) $parts["extension"] = "png";   // assuming blob image file
$fileToSave = $_POST["prefix"] . "-" . uniqid() . "." . $parts["extension"];
$vendorId = $_POST["vendorId"];

$uploadDir = UPLOAD_DIR . $vendorId . "/";

if (!file_exists($uploadDir)) {
  mkdir($uploadDir, 0777, true);
}

if(move_uploaded_file($_FILES["file_to_upload"]["tmp_name"],$uploadDir . $fileToSave)) {
  chmod($uploadDir . $fileToSave, 0644);

  echo json_encode($fileToSave);
  exit;

}

else {

  header('HTTP/1.1 400 Bad Request');
	header('Content-Type: application/json; charset=UTF-8');

  echo json_encode(array("errNum"=>500,"errMsg"=>"Failed to save file"));
}
