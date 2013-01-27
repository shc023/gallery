<?php

require_once(__DIR__ . '/../vendor/autoload.php');

$app = new \Slim\Slim();

$app->get('/', function() {
	echo 'This is the index';
});

$app->get('/hello/:name', function ($name) {
    echo "Hello, $name";
});

$app->run();