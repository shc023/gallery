<?php

require_once("createThumb.php");

error_reporting(E_ALL); // or E_STRICT
ini_set("display_errors",1);
ini_set("memory_limit","1024M");

// set error reporting level
if (version_compare(phpversion(), '5.3.0', '>=') == 1) {
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
} else {
    error_reporting(E_ALL & ~E_NOTICE);
}

function bytesToSize1024($bytes, $precision = 2) {
    $unit = array('B','KB','MB');
    return @round($bytes / pow(1024, ($i = floor(log($bytes, 1024)))), $precision).' '.$unit[$i];
}

if (isset($_FILES['newfile'])) {
    $sFileName = $_FILES['newfile']['name'];
    $sFileType = $_FILES['newfile']['type'];
    $sFileSize = bytesToSize1024($_FILES['myfile']['size'], 1);

    $allowedExts = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");
    $allowedTypes = array("image/gif", "image/jpeg", "image/png", "image/pjpeg");
    $extension = end(explode(".", $_FILES["newfile"]["name"]));
    if ( ($_FILES["newfile"]["size"] < 10485760) && in_array($extension, $allowedExts))
    {
        if ($_FILES["newfile"]["error"] > 0)
        {
            echo "ERROR: " . $_FILES["newfile"]["error"] . "<br />";
            exit;
        }
        else
        {
            $path = "images/" . $_FILES["newfile"]["name"];
            $thumbPath = "thumbs/" . $_FILES["newfile"]["name"];
            
            
            if (file_exists($path))
            {
                //echo "ERROR: ".$_FILES["newfile"]["name"] . " already exists. ";
                //exit;
            }
            else
            {
                move_uploaded_file($_FILES["newfile"]["tmp_name"], $path);
                    //echo "Stored in: ".$path;
                    
                $size = getimagesize($path);
                $width = $size[0];
                $thumbWidth = min($width, 200);
                    
                
                createThumb($path, $thumbPath, $extension, $thumbWidth);
            }
        }
    }
    else
    {
        echo "Invalid file:<br>";
        exit;
    }
    
    echo <<<EOF
<a class="gallery_element fancybox" rel="group" href="{$path}">
    <img src="{$thumbPath}">
</a>
EOF;
} 
