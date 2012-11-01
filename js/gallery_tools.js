gallery_mode = "gallery_square";

$("#to_square").on("click",function(){
    $(".gallery_element").addClass("gallery_square");
    $(".gallery_element").removeClass("gallery_rect");
    gallery_mode = "gallery_square";
});

$("#to_rect").on("click",function(){
    $(".gallery_element").addClass("gallery_rect");
    $(".gallery_element").removeClass("gallery_square");
    gallery_mode = "gallery_rect";
});