<?php
require '../vendor/autoload.php';

$app = new \Slim\Slim();


$app->get('/', function () use ($app) {
    $app->render('views/bucket.php');
});

$app->get('/info', function () use ($app) {
    $app->render('phpinfo.php');
});

$app->run();