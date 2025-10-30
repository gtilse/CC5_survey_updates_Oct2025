<?php

require "../api/common.php";
$isError = false;

if (isset($_GET['id'])) {
  try {
    $clientId = $_GET['id'];
    $conn = Util::createConnection();

    $count = $conn->exec("UPDATE Client SET sendSurveyEmail=0 WHERE objectId=" . $conn->quote($clientId));
    $isError = ($count > 0) ? false : true;
  }

  catch(Exception $e) {
    $isError = true;
  }

}

else {
  $isError = true;
}

?>

<!doctype html>
<html>

  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Client Culture Survey">
    <meta name="author" content="">

    <title>Unsubscribe</title>

    <!-- Style Sheets -->
    <link href="../assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="./styles.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->

  </head>

<body>

  <?php if($isError==true) { ?>
    <div class="alert alert-warning" role="alert">
      Invalid request! Please contact support
    </div>

  <?php } else { ?>
    <div class="alert alert-success" role="alert">
      You have been successfully unsubscribed from all future surveys.
    </div>

  <?php } ?>

</body>

</html>
