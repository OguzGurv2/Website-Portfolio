<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $message = trim($_POST["message"]);

    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo "Please fill out all fields.";
        exit;
    }

    $to = "oguz.gur.cs@example.com"; 

    $subject = "New Contact Form Submission from $name";

    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";

    $headers = "From: $name <$email>";

    if (mail($to, $subject, $email_content, $headers)) {
        http_response_code(200);
        echo "Thank you! Your message has been sent.";
    } else {
        http_response_code(500);
        echo "Something went wrong. Please try again later.";
    }
} else {
    http_response_code(403);
    echo "Access forbidden.";
}
?>
