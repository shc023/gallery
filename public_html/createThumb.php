<?php
function createThumb( $pathToImages, $pathToThumbs, $extension, $thumbWidth = 200) 
{    
    switch($extension){
        case "jpg":
        case "jpeg":
        case "JPG":
        case "JPEG":
            $img = imagecreatefromjpeg( $pathToImages );
            $width = imagesx( $img );
            $height = imagesy( $img );
            
            $new_width = $thumbWidth;
            $new_height = floor( $height * ( $thumbWidth / $width ) );
            $tmp_img = imagecreatetruecolor( $new_width, $new_height );
            imagecopyresized( $tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height );
            imagejpeg( $tmp_img, "$pathToThumbs" );
        break;
    
        case "png":
        case "PNG":
            $img = imagecreatefrompng( $pathToImages );
            $width = imagesx( $img );
            $height = imagesy( $img );
            
            $new_width = $thumbWidth;
            $new_height = floor( $height * ( $thumbWidth / $width ) );
            $tmp_img = imagecreatetruecolor( $new_width, $new_height );
            imagecopyresized( $tmp_img, $img, 0, 0, 0, 0, $new_width, $new_height, $width, $height );
            imagepng( $tmp_img, "$pathToThumbs" );
        break;
    }
}