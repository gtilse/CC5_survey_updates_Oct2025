<!-- Script to upload staff from CSV file -->
<?php

// imports
require __DIR__ . "/common.php";

// Constants
DEFINE('VENDOR_ID', 'pYRkDKvw5jcYW');

$file = fopen('staff_upload.csv', 'r');
$conn = Util::createConnection();
set_time_limit(300);

// 
while (($line = fgetcsv($file)) !== FALSE) {

    $vendorId = VENDOR_ID;
    $objectId = Util::createID();
    $firstName = $line[0];
    $lastName = $line[1];
    $designation = $line[7];
    $department = $line[8];
    $email = $line[4];
    $username = $line[5];
    $password = password_hash($line[6], PASSWORD_DEFAULT);
    $reportsTo = $line[9];

    // Find the reportsTo person
    $stmt = $conn->query("SELECT * FROM User where CONCAT(firstName, ' ', lastName) = '$reportsTo' AND vendorId='" . VENDOR_ID . "'");
    if($stmt->rowCount()>0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt->closeCursor();

        $sql = "INSERT INTO User (objectId, vendorId, active, parentId, type, level, userOverrideId, " .
            "firstName, lastName, designation, department, userName, email, password, staffSurveyOnly) " .
            "VALUES(?,?,1,?,0,2,?,?,?,?,?,?,?,?,1)";

        $stmt = $conn->prepare($sql);
        $stmt->execute(array($objectId, $vendorId, $row["objectId"], $row["objectId"], $firstName, $lastName, $designation, $department, $username, $email, $password ));

        
    } else {
        $sql = "INSERT INTO User (objectId, vendorId, active, type, level," .
            "firstName, lastName, designation, department, userName, email, password, staffSurveyOnly) " .
            "VALUES(?,?,1,0,2,?,?,?,?,?,?,?,1)";

        $stmt = $conn->prepare($sql);
        $stmt->execute(array($objectId, $vendorId,  $firstName, $lastName, $designation, $department, $username, $email, $password ));

    }

}

// Close file
fclose($file);
echo "Import completed";

?>