require(["fix-selector", "fix-xselector"], function ($, $x) {

    var result = null,
        xresult = null;
    //some of selector patterns which are supported now
    result = $("body div");
    result = $("body>div");
    result = $("body>.some_class");
    result = $("#some_id input:checked");
    result = $("#some_id input:not(:checked)");
    result = $("#some_id option:checked");
    result = $("#some_id>select>option:not(:checked)");

    //some of selector patterns which are supported with xpath solution
    xresult = $x("*");
    xresult = $x("body>*");
    xresult = $x("body>div *");
    xresult = $x("body div");
    xresult = $x("body>div");
    xresult = $x("body .some_class");
    xresult = $x("div[class*=some]");
    xresult = $x("body > div + div");
    xresult = $x("body>div ~ div");

});