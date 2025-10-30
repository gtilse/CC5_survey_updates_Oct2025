<?php


function customExceptionHandler($ex) {

  // write error details to log file

  if($ex->getCode() !== E_USER_ERROR) {       // log all errors except for user defined one's
    $message = "[Type] " . get_class($ex) . " [Message] " . $ex->getMessage() . " [File] " . $ex->getFile() . " [Line] " .$ex->getLine();
    file_put_contents(EXCEPTION_LOG_FILE, $message . PHP_EOL, FILE_APPEND);
  }

  // return error info as JSON
  header('HTTP/1.1 400 Bad Request');
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(array("errNum"=>$ex->getCode(),"errMsg"=>$ex->getMessage()));

  die();
}

function customErrorHandler($num, $str, $file, $line) {
  // redirect to the custom exception handler function
  customExceptionHandler( new ErrorException( $str, $num, 0, $file, $line ));
}

function fatalErrorHandler() {
    $error = error_get_last();
    if ( $error["type"] == E_ERROR )
        customErrorHandler($error["type"], $error["message"], $error["file"], $error["line"]);
}

register_shutdown_function("fatalErrorHandler");
set_error_handler("customErrorHandler");
set_exception_handler("customExceptionHandler");
ini_set( "display_errors", "off" );
error_reporting( E_ALL );

?>
