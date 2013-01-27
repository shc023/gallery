<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();


$app->get('/', function () {
    echo "wut?!";
});

$app->get('/hello/:name', function ($name) {
    echo "Hello, $name";
});

$app->run();