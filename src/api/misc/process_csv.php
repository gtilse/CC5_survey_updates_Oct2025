<?php

/*
 * Read a CSV file and return contents as an array
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 1000");
header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Origin, Cache-Control, Pragma, Authorization, Accept, Accept-Encoding");
header("Access-Control-Allow-Methods: PUT, POST, GET, OPTIONS, DELETE");

define("UPLOAD_DIR","../../app_data/");
require __DIR__ . "/../common.php";

// if(DEV){  // only required in Dev mode
//   header("Access-Control-Allow-Origin: *");
//   header("Access-Control-Allow-Credentials: true");
//   header("Access-Control-Max-Age: 1000");
//   header("Access-Control-Allow-Headers: X-Requested-With, Content-Type, Origin, Cache-Control, Pragma, Authorization, Accept, Accept-Encoding");
//   header("Access-Control-Allow-Methods: PUT, POST, GET, OPTIONS, DELETE");
// }

// copy the file to uploads folder
$name = preg_replace("/[^A-Z0-9._-]/i", "_", $_FILES["file_to_upload"]["name"]);
if(file_exists(UPLOAD_DIR . $name)) {
    chmod(UPLOAD_DIR . $name,0755); //Change the file permissions if allowed
    unlink(UPLOAD_DIR . $name); //remove the file
}

move_uploaded_file($_FILES["file_to_upload"]["tmp_name"], UPLOAD_DIR . $name);
chmod(UPLOAD_DIR . $name, 0755);

// get contents of file
$clientArray = Util::readCSVFile(UPLOAD_DIR . $name);

if($clientArray === false) {
  
  //header('HTTP/1.1 400 Bad Request');
	//header('Content-Type: application/json; charset=UTF-8');

  echo json_encode(array("errNum"=>500,"errMsg"=>"Failed to read file"));
}

else {
  echo json_encode(array("fileName"=>$name,"clients"=>$clientArray));
}
