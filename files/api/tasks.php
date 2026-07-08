<?php

/*
 api/tasks.php
 Todo App API
*/

header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';


$method = $_SERVER['REQUEST_METHOD'];


// JSON Response function
function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}


// Read JSON body
function get_json_body()
{
    $raw = file_get_contents("php://input");

    $data = json_decode($raw, true);

    if(is_array($data)){
        return $data;
    }

    return array();
}


// -----------------------------
// Get Action
// -----------------------------

$body = array();

$action = isset($_GET['action']) ? $_GET['action'] : '';


if($method == "POST")
{
    $body = get_json_body();

    if($action == "")
    {
        $action = isset($body['action']) ? $body['action'] : '';
    }
}


// default open action
if($action == "")
{
    $action = "list";
}



// =============================
// Actions
// =============================

switch($action)
{


// =============================
// LIST TASKS
// =============================

case "list":

try{


    // ==============================
    // DAILY DEFAULT TASK CREATE
    // ==============================

    $today = date('Y-m-d');


    $check = $pdo->prepare("
        SELECT COUNT(*)
        FROM tasks
        WHERE task_date = ?
        AND task_name='Open Laptop'
    ");

    $check->execute(array($today));

    $exists = $check->fetchColumn();



    if($exists == 0)
    {

        $defaultTasks = array(

            'Open Laptop',

            'Maintain Streak 1 - Elevate & W3Schools',

            'Solve One LeetCode Problem',

            'Java Practice',

            'MySQL Practice',

            'Meganthi'

        );



        foreach($defaultTasks as $task)
        {


            $insert = $pdo->prepare("
                INSERT INTO tasks
                (
                    task_name,
                    task_date,
                    task_time,
                    status,
                    created_at
                )
                VALUES
                (
                    ?,
                    ?,
                    '08:00:00',
                    'active',
                    NOW()
                )
            ");



            $insert->execute(array(

                $task,

                $today

            ));


        }

    }




    // active
    $stmt = $pdo->query("
        SELECT *
        FROM tasks
        WHERE status='active'
        AND task_date >= CURDATE()
        ORDER BY task_date, task_time
    ");

    $active = $stmt->fetchAll();



    // pending
    $stmt = $pdo->query("
        SELECT *
        FROM tasks
        WHERE status='active'
        AND task_date < CURDATE()
        ORDER BY task_date, task_time
    ");

    $pending = $stmt->fetchAll();



    // completed
    $stmt = $pdo->query("
        SELECT *
        FROM tasks
        WHERE status='completed'
        ORDER BY completed_at DESC
    ");

    $completed = $stmt->fetchAll();



    $counts = array(

        "total" =>
            count($active)
            + count($pending)
            + count($completed),

        "active" => count($active),

        "pending" => count($pending),

        "completed" => count($completed)
    );



    respond(array(

        "success"=>true,

        "active"=>$active,

        "pending"=>$pending,

        "completed"=>$completed,

        "counts"=>$counts

    ));




}
catch(PDOException $e){


    respond(array(

        "success"=>false,

        "error"=>$e->getMessage()

    ),500);


}

break;



// =============================
// CREATE TASK
// =============================

case "create":


$taskName = isset($body['task_name'])
            ? trim($body['task_name'])
            : "";


$taskDate = isset($body['task_date'])
            ? trim($body['task_date'])
            : "";


$taskTime = isset($body['task_time'])
            ? trim($body['task_time'])
            : "";



if(
    $taskName == "" ||
    $taskDate == "" ||
    $taskTime == ""
)
{
    respond(array(
        "success"=>false,
        "error"=>"All fields required"
    ),422);
}



try{


$stmt = $pdo->prepare("
INSERT INTO tasks
(
task_name,
task_date,
task_time,
status,
created_at
)
VALUES
(
:task_name,
:task_date,
:task_time,
'active',
NOW()
)
");


$stmt->execute(array(

":task_name"=>$taskName,

":task_date"=>$taskDate,

":task_time"=>$taskTime

));



respond(array(
    "success"=>true,
    "id"=>$pdo->lastInsertId()
));


}
catch(PDOException $e){

respond(array(

"success"=>false,

"error"=>$e->getMessage()

),500);

}


break;




// =============================
// COMPLETE TASK
// =============================

case "complete":


$id = isset($body['id'])
        ? (int)$body['id']
        : 0;


if($id <= 0)
{
    respond(array(
        "success"=>false,
        "error"=>"Invalid id"
    ),422);
}



try{


$stmt = $pdo->prepare("

UPDATE tasks

SET 
status='completed',
completed_at=NOW()

WHERE id=:id

");


$stmt->execute(array(
    ":id"=>$id
));



respond(array(
    "success"=>true
));


}
catch(PDOException $e){

respond(array(

"success"=>false,

"error"=>$e->getMessage()

),500);

}


break;





// =============================
// DELETE TASK
// =============================

case "delete":


$id = isset($body['id'])
        ? (int)$body['id']
        : 0;


if($id <=0)
{

respond(array(

"success"=>false,

"error"=>"Invalid id"

),422);

}



try{


$stmt=$pdo->prepare(

"DELETE FROM tasks WHERE id=:id"

);


$stmt->execute(array(

":id"=>$id

));


respond(array(

"success"=>true

));


}
catch(PDOException $e){


respond(array(

"success"=>false,

"error"=>$e->getMessage()

),500);


}


break;





// =============================
// UNKNOWN
// =============================

default:


respond(array(

"success"=>false,

"error"=>"Invalid action"

),400);


}

?>