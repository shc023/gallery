<?php

namespace schen\Utils;

class Uploader
{
    private $allowedExtensions = array("jpg", "JPG", "jpeg", "JPEG", "png", "PNG");
    private $allowedMimes = array("image/gif", "image/jpeg", "image/png", "image/pjpeg");

    private $web_root = null;
    private $image_dir = null;
    private $thumb_dir = null;

    function __construct($web_root, $image_dir, $thumb_dir)
    {
        $this->web_root = $web_root;
        $this->image_dir = $image_dir;
        $this->thumb_dir = $thumb_dir;
    }

    /**
     * Get the difference of paths e.g.
     *
     * /path
     * /path/to/something
     *
     * Returns /to/something
     *
     * @param $outer string The outer, less specific path
     * @param $inner string The inner path
     * @return string
     */
    public function pathDiff($outer, $inner)
    {
        $outer_len = strlen($outer);

        if (substr($inner, 0, $outer_len) === $outer) {
            return substr($inner, $outer_len);
        }

        return '';
    }

    public function bytesToSize1024($bytes, $precision = 2)
    {
        $unit = array('B', 'KB', 'MB');
        return @round($bytes / pow(1024, ($i = (int)floor(log($bytes, 1024)))), $precision) . ' ' . $unit[$i];
    }

    public function upload()
    {
        if (isset($_FILES['newfile'])) {

            $source_name = $_FILES['newfile']['name'];
            $source_tmp_path = $_FILES["newfile"]["tmp_name"];
            $source_type = $_FILES['newfile']['type'];
            $source_size = $this->bytesToSize1024($_FILES['newfile']['size'], 1);
            $source_ext = end(explode(".", $source_name));

            if (($source_size < 10485760) && in_array($source_ext, $this->allowedExtensions)) {

                if ($_FILES["newfile"]["error"] > 0) {

                    return "ERROR: " . $_FILES["newfile"]["error"];

                } else {

                    $target_path = $this->getImageDir() . '/' . $source_name;
                    $target_thumb_path = $this->getThumbDir() . '/' . $source_name;

                    if (file_exists($target_path)) {
                        return "ERROR: " . $source_name . " already exists. ";
                    } else {
                        move_uploaded_file($source_tmp_path, $target_path);

                        $size = getimagesize($target_path);
                        $width = $size[0];
                        $thumbWidth = min($width, 200);

                        $image = new Image();
                        $image->createThumb($target_path, $target_thumb_path, $source_ext, $thumbWidth);
                    }
                }
            } else {
                return 'Invalid file';
            }

            $image_url = $this->pathDiff($this->web_root, $target_path);
            $thumb_url = $this->pathDiff($this->web_root, $target_thumb_path);

            return '<a class="gallery_element fancybox" rel="group" href="' . $image_url . '"><img src="' . $thumb_url . '"></a>';
        }

        return null;
    }

    public function setImageDir($image_dir)
    {
        $this->image_dir = $image_dir;
    }

    public function getImageDir()
    {
        return $this->image_dir;
    }

    public function setThumbDir($thumb_dir)
    {
        $this->thumb_dir = $thumb_dir;
    }

    public function getThumbDir()
    {
        return $this->thumb_dir;
    }
}