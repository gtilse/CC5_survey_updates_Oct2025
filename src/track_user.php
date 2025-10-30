<?php

require __DIR__ . "/api/common.php";

if(!empty( $_GET['surveyid'])) {
  $surveyId = $_GET['surveyid'];
  $useragent = $_SERVER ['HTTP_USER_AGENT'];

  $conn = Util::createConnection();

  $sql = $conn->prepare("UPDATE Survey_Log SET emailOpened = emailOpened+1, emailOpenedUsing= :emailOpenedUsing WHERE objectId = :objectId");
  $sql->bindParam(":objectId", $surveyId);
  $sql->bindParam(":emailOpenedUsing", $useragent);
  $sql->execute();

  // return image and exit
  returnImage();
}

else {
  // just return the image
  returnImage();
}

// return a tiny gif back to the client
function returnImage() {

  //Full URI to the image
  $graphic_http = "https://www.clientculture.net/tiny.gif";

  //Get the filesize of the image for headers
  $filesize = filesize("tiny.gif");

  header( 'Pragma: public' );
  header( 'Expires: 0' );
  header( 'Cache-Control: must-revalidate, post-check=0, pre-check=0' );
  header( 'Cache-Control: private',false );
  header( 'Content-Disposition: attachment; filename="tiny.gif"' );
  header( 'Content-Transfer-Encoding: binary' );
  header( 'Content-Length: '.$filesize );
  readfile( $graphic_http );
  exit;
}
