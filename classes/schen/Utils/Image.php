<?php

namespace schen\Utils;

class Image
{
    public function normalizeType($type)
    {
        $type = strtolower($type);

        if ($type === 'jpeg') {
            $type = 'jpg';
        }

        return $type;
    }

    function createThumb($pathToImages, $pathToThumbs, $type, $thumbWidth = 200)
    {
        $type = $this->normalizeType($type);

        switch ($type) {
            case "jpg":
                $img = imagecreatefromjpeg($pathToImages);
                $width = imagesx($img);
                $height = imagesy($img);

                $new_width = $thumbWidth;
                $new_height = floor($height * ($thumbWidth / $width));
                $tmp_img = imagecreatetruecolor($new_width, $new_height);
                imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
                imagejpeg($tmp_img, "$pathToThumbs");
                break;

            case "png":
                $img = imagecreatefrompng($pathToImages);
                $width = imagesx($img);
                $height = imagesy($img);

                $new_width = $thumbWidth;
                $new_height = floor($height * ($thumbWidth / $width));
                $tmp_img = imagecreatetruecolor($new_width, $new_height);
                imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
                imagepng($tmp_img, "$pathToThumbs");
                break;
        }
    }
}