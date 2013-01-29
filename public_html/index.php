<?php

require_once(__DIR__ . '/../vendor/autoload.php');
require_once(__DIR__ . '/../configs/config.php');

if ($config['debug']) {
    error_reporting(E_ALL); // or E_STRICT
    ini_set("display_errors", 1);
    ini_set("memory_limit", "1024M");

    // set error reporting level
    if (version_compare(phpversion(), '5.3.0', '>=') == 1) {
        error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
    } else {
        error_reporting(E_ALL & ~E_NOTICE);
    }
}

$app = new \Slim\Slim();

$app->get('/', function () use ($app) {
    $app->render('bucket.php');
});

$app->get('/info', function () use ($app) {
    echo phpinfo();
});

// Handle an upload!
$app->post('/upload', function() use ($app, $config){
    $uploader = new schen\Utils\Uploader(__DIR__, $config['upload_image_dir'], $config['upload_thumb_dir']);
    echo $uploader->upload();
});

$app->run();