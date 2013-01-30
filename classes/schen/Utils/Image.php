<?php

namespace schen\Utils;

class Image
{
    /**
     * @return \Imagine\Image\ImagineInterface
     */
    public function getImagine()
    {
        // hacky service configuration
        global $config;

        $class = 'Imagine\\' . $config['imagine_class'] . '\\Imagine';
        return new $class();
    }

    public function createThumb($sourcePath, $targetPath, $thumbWidth = 200)
    {
        $image = $imagine = $this->getImagine()->open($sourcePath);
        $size = $image->getSize();

        if ($size->getWidth() > $thumbWidth) {
            $new_size = $size->scale($thumbWidth / $size->getWidth());
        } else {
            $new_size = $size;
        }

        $image->resize($new_size)->save($targetPath);
    }
}