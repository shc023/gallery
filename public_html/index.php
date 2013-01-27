<?php

require_once(__DIR__ . '/../vendor/autoload.php');

$app = new \Slim\Slim();


$app->get('/', function () use ($app) {
    $app->render('bucket.php');
});

$app->get('/info', function () use ($app) {
    echo phpinfo();
});

$app->run();