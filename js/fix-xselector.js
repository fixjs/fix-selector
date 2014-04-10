define(function () {
  var $ = function (selector) {
    var elements = [];
    
    $.xpathSelect("//" + $.convert2xpath(selector), elements);

    return elements;
  };

  $.convert2xpath = function (selector) {
      //not supported patterns:
      // :only-child, :not, :nth-child, :contains, $= for attributes, ...

      //Attribute Equals Selector [name="value"](https://api.jquery.com/attribute-equals-selector/)
      selector = selector.replace(/\[([^\]~\$\*\^\|\!]+)(=[^\]]+)?\]/, "[@$1$2]");

      //Multiple Selector (“selector1, selector2, selectorN”)(https://api.jquery.com/multiple-selector/)
      selector = selector.replace(/\s*,\s*/, "|");

      //remove extra spaces for ~
      selector = selector.replace(/\s*(~)\s*/g, "$1");
      //Next Siblings Selector (“prev ~ siblings”)(http://api.jquery.com/next-siblings-selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*])~([a-zA-Z0-9_\-\*])/, "$1/following-sibling::$2");

      //remove extra spaces for +
      selector = selector.replace(/\s*(\+)\s*/g, "$1");
      //Next Adjacent Selector (“prev + next”)(http://api.jquery.com/next-adjacent-Selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*])\+([a-zA-Z0-9_\-\*])/, "$1/following-sibling::*[1]/self::$2");

      //remove extra spaces for >
      selector = selector.replace(/\s*(>)\s*/g, "$1");
      //Child Selector (“parent > child”)(http://api.jquery.com/child-selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*])>([a-zA-Z0-9_\-\*])/, "$1/$2");

      //add single quotation for attribute values
      selector = selector.replace(/\[([^=]+)=([^'|" + "\"" + @"][^\]]*)\]/, "[$1='$2']");

      //add xpath star search in all nodes
      selector = selector.replace(/(^|[^a-zA-Z0-9_\-\*])(#|\.)([a-zA-Z0-9_\-]+)/, "$1*$2$3");
      //add xpath // search in all dom levels
      selector = selector.replace(/([\>\+\|\~\,\s])([a-zA-Z\*]+)/, "$1//$2");
      selector = selector.replace(/\s+\/\//, "//");

      // :first-child Selector(https://api.jquery.com/first-child-selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*]+):first-child/, "*[1]/self::$1");

      // :last-child Selector(https://api.jquery.com/last-child-selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*]+):last-child/, "$1[not(following-sibling::*)]");

      // :empty Selector(http://api.jquery.com/empty-selector/)
      selector = selector.replace(/([a-zA-Z0-9_\-\*]+):empty/, "$1[not(*) and not(normalize-space())]");

      // Attribute Not Equal Selector [name!="value"](http://api.jquery.com/attribute-not-equal-selector/)
      selector = selector.replace(/\[([a-zA-Z0-9_\-]+)\!=([^\]]+)\]/, "[@$1!=$2 or not(@$1)]");

      //Attribute Starts With Selector [name^="value"](https://api.jquery.com/attribute-starts-with-selector/)
      selector = selector.replace(/\[([a-zA-Z0-9_\-]+)\^=([^\]]+)\]/, "[starts-with(@$1,$2)]");

      //Attribute Contains Selector [name*="value"](http://api.jquery.com/attribute-contains-selector/)
      selector = selector.replace(/\[([a-zA-Z0-9_\-]+)\*=([^\]]+)\]/, "[contains(@$1,$2)]");

      //Attribute Contains Word Selector [name~="value"](http://api.jquery.com/attribute-contains-word-selector/)
      selector = selector.replace(/\[([a-zA-Z0-9_\-]+)~=([^\]]+)\]/, "[contains(concat(' ',normalize-space(@$1),' '),concat(' ',$2,' '))]");

      //ID Selector (“#id”)(http://api.jquery.com/id-selector/)
      selector = selector.replace(/#([a-zA-Z0-9_\-]+)/, "[@id='$1']");

      //Class Selector (“.class”)(http://api.jquery.com/class-selector/)
      selector = selector.replace(/\.([a-zA-Z0-9_\-]+)/, "[contains(concat(' ',normalize-space(@class),' '),' $1 ')]");

      //Multiple Attribute Selector [name="value"][name2="value2"](http://api.jquery.com/multiple-attribute-selector/)
      selector = selector.replace(/\]\[([^\]]+)/, " and ($1)");

      return selector;
  };

  $.xpathSelect = function (query, elements) {

      var iterator = document.evaluate(query, document.lastChild, null, XPathResult.ANY_TYPE, null);

      var nodes = [];
      var node;
      while (node = iterator.iterateNext()) {
          elements.push(node);
      }

      return nodes;
  };
  
  return $;
});