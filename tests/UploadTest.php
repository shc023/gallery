<?php

require_once(__DIR__ . '/../vendor/autoload.php');

class UploadTest extends PHPUnit_Framework_TestCase
{
    public function testPathDiff()
    {
        $uploader = new schen\Utils\Uploader(__DIR__,__DIR__,__DIR__);

        $path = $uploader->pathDiff('/path/to/blah', '/path/to/blah/and/some/more');
        $this->assertEquals('/and/some/more', $path);

        $path = $uploader->pathDiff('/path/to/blah', '/path/to/cake');
        $this->assertEquals('', $path);
    }
}