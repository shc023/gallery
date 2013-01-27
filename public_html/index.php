<?php

require_once(__DIR__ . '/../vendor/autoload.php');
require_once(__DIR__ . '/../configs/config.php');

if ($debug) {
    error_reporting(E_ALL); // or E_STRICT
    ini_set("display_errors", 1);
    ini_set("memory_limit", "1024M");
}

$app = new \Slim\Slim();

$app->get('/', function () use ($app) {
    $app->render('bucket.php');
});

$app->get('/info', function () use ($app) {
    echo phpinfo();
});

$app->run();