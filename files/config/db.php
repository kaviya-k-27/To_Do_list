<?php

$DB_HOST = "localhost";
$DB_NAME = "todo_app";
$DB_USER = "root";
$DB_PASS = "mysql";   // AMPPS default empty

try {

    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS
    );

    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

}
catch(PDOException $e){

    header('Content-Type: application/json');

    echo json_encode([
        "success"=>false,
        "error"=>$e->getMessage()
    ]);

    exit;
}

?>