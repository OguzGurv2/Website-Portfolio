<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $question = trim($_POST["question"]);

    if (empty($name) || empty($email) || empty($question)) {
        http_response_code(400);
        echo "Please fill out all fields.";
        exit;
    }

    $to = "oguz.gur.cs@gmail.com"; 
    $subject = "New Question from $name";
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Question:\n$question\n";

    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();


    if (mail($to, $subject, $email_content, $headers)) {
        http_response_code(200);
    } else {
        http_response_code(500);
    }
} else {
    http_response_code(403);
}
require("index.html");
?>
