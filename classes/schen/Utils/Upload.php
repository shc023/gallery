<?php

namespace schen\Utils;

class Uploader
{
    public function upload()
    {

        function bytesToSize1024($bytes, $precision = 2)
        {
            $unit = array('B', 'KB', 'MB');
            return @round($bytes / pow(1024, ($i = floor(log($bytes, 1024)))), $precision) . ' ' . $unit[$i];
        }

        if (isset($_FILES['newfile'])) {
            $sFileName = $_FILES['newfile']['name'];
            $sFileType = $_FILES['newfile']['type'];
            $sFileSize = bytesToSize1024($_FILES['myfile']['size'], 1);

            $allowedExts = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");
            $allowedTypes = array("image/gif", "image/jpeg", "image/png", "image/pjpeg");
            $extension = end(explode(".", $_FILES["newfile"]["name"]));
            if (($_FILES["newfile"]["size"] < 10485760) && in_array($extension, $allowedExts)) {
                if ($_FILES["newfile"]["error"] > 0) {
                    echo "ERROR: " . $_FILES["newfile"]["error"] . "<br />";
                    exit;
                } else {
                    $path = "../images/" . $_FILES["newfile"]["name"];
                    $thumbPath = "../thumbs/" . $_FILES["newfile"]["name"];


                    if (file_exists($path)) {
                        //echo "ERROR: ".$_FILES["newfile"]["name"] . " already exists. ";
                        //exit;
                    } else {
                        move_uploaded_file($_FILES["newfile"]["tmp_name"], $path);
                        //echo "Stored in: ".$path;

                        $size = getimagesize($path);
                        $width = $size[0];
                        $thumbWidth = min($width, 200);


                        createThumb($path, $thumbPath, $extension, $thumbWidth);
                    }
                }
            } else {
                echo "Invalid file:<br>";
                exit;
            }

            echo <<<EOF
<a class="gallery_element fancybox" rel="group" href="{$path}">
    <img src="{$thumbPath}">
</a>
EOF;
        }

    }
}