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

    /**
     * @return \Imagine\Image\ImagineInterface
     */
    public function getImagine()
    {
        // hacky service configuration
        global $config;

        $class = 'Imagine\\' . $config['imagine_class'] . '\\Imagine';
=        return new $class();
    }

    public function createThumb($pathToImages, $pathToThumbs, $type, $thumbWidth = 200)
    {
//        $type = $this->normalizeType($type);

        $image = $imagine = $this->getImagine()->open($pathToImages);
        $size = $image->getSize();

        if ($size->getWidth() > $thumbWidth) {
            $new_size = $size->scale($thumbWidth / $size->getWidth());
        } else {
            $new_size = $size;
        }

        $image->resize($new_size)->save($pathToThumbs);

//        switch ($type) {
//            case "jpg":
//                $img = imagecreatefromjpeg($pathToImages);
//                $width = imagesx($img);
//                $height = imagesy($img);
//
//                $new_width = $thumbWidth;
//                $new_height = floor($height * ($thumbWidth / $width));
//                $tmp_img = imagecreatetruecolor($new_width, $new_height);
//                imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
//                imagejpeg($tmp_img, "$pathToThumbs");
//                break;
//
//            case "png":
//                $img = imagecreatefrompng($pathToImages);
//                $width = imagesx($img);
//                $height = imagesy($img);
//
//                $new_width = $thumbWidth;
//                $new_height = floor($height * ($thumbWidth / $width));
//                $tmp_img = imagecreatetruecolor($new_width, $new_height);
//                imagecopyresized($tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
//                imagepng($tmp_img, "$pathToThumbs");
//                break;
//        }
    }
}