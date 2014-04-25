define(function () {
  var getxpathselector = function getxpathselector() {
    var $x = function $x(selector) {
      var elements = [];

      $x.xpathSelect("//" + $x.convert2xpath(selector), elements);

      return elements;
    };

    $x.convert2xpath = function convert2xpath(selector) {
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

    $x.xpathSelect = function xpathSelect(query, elements) {

        var iterator = document.evaluate(query, document.lastChild, null, XPathResult.ANY_TYPE, null);

        var nodes = [],
          node;
        while (node = iterator.iterateNext()) {
            elements.push(node);
        }

        return nodes;
    };

    return $x;
  };

  var getjsselector = function getjsselector() {
    var $ = function $(selector) {
        var elements = [];

        //remove spaces around ","
        selector = selector.replace(/\s(,)\s/g, ",");

        var selectors = selector.split(","),
          l = selectors.length,
          i = 0;

        for ( ; i < l; i++) {
            var sel = selectors[i].trim();
            if (sel) {
                //remove spaces around ">", "+" and "~"
                sel = sel.replace(/\s*(>|\+|~)\s*/g, "$1");

                //split based on ">", "+" and "~"
                var selarr = sel.split(/([\s|>|+|~])+/);

                var context = [];
                var j = 0,
                  len = selarr.length;
                while (j < len) {
                    var s = selarr[j];

                    var firstLevel = false;
                    if (j > 0) {
                        var op = selarr[j - 1];

                        //all childs Selector in all dom levels (“parent child”) is implemented
                        //Child Selector (“parent > child”) is implemented
                        if (op == " " || (op == ">" && (firstLevel = true))) {
                            context = $.processRule(s, context, firstLevel);
                        }
                        else if (op == "+") {
                            console.log("Next Adjacent Selector is not implemented yet!");
                        }
                        else if (op == "~") {
                            console.log("Next Siblings Selector is not implemented yet!");
                        }
                    }
                    else context = $.processRule(s, [document], false);

                    if (context.length) {
                        j += 2;
                    }
                    else {
                        break;
                    }
                }
                elements = elements.concat(context);
            }
            else {
                throw new Error("Invalid selector : " + selector);
            }
        }

        return elements;
    };

    /**
     *  Array contextNodes, String tagName ("div", "div,select,input"), Boolean firstLevel
    **/
    $.GEBTN = function (contextNodes, tagName, firstLevel) {
        var result = [],
          i = 0,
          l = contextNodes.length;
        var filterf = function (child) {
            return (child.nodeType == 1 && tagName.search("," + child.tagName.toLowerCase() + ",") > -1);
        };
        for( ; i<l; i++ ){
            var node = contextNodes[i];
            if (firstLevel) {
                tagName = "," + tagName.toLowerCase() + ",";
                result = result.concat(Array.prototype.filter.call(node.childNodes, filterf));
            }
            else {
                var tgarr = tagName.split(","),
                  j = 0,
                  len = tgarr.length;
                for( ; j<len; j++){
                    result = result.concat(Array.prototype.slice.call(node.getElementsByTagName(tgarr[j]), 0));
                }
            }
        }
        return result;
    };

    /**
     *  Array contextNodes, String className, Boolean firstLevel
    **/
    $.GEBCN = function (contextNodes, className, firstLevel) {
        var result = [],
          i = 0,
          l = contextNodes.length;
        var filterf = function (child) {
            return (child.nodeType == 1 && $.hasClass(child, className));
        };
        for ( ; i < l; i++ ) {
            var node = contextNodes[i];
            if (firstLevel) {
                result = result.concat(Array.prototype.filter.call(node.childNodes, filterf));
            }
            else {
                result = result.concat(Array.prototype.slice.call(node.getElementsByClassName(className), 0));
            }
        }
        return result;
    };

    /**
     *  Array contextNodes, Boolean firstLevel
    **/
    $.getChecked = function (contextNodes, checked) {
        return contextNodes.filter(function (el) {
            return ((el.tagName.toLowerCase() == "input" &&
              (el.type=="checkbox" || el.type=="radio") &&
                  el.checked == checked) ||
              (el.tagName.toLowerCase() == "option" && el.selected == checked));
        });
    };

    /**
     *  Array contextNodes, Node el
    **/
    $.isInContext = function (contextNodes, el) {
        var i = 0,
          l = contextNodes.length;
        for ( ; i < l; i++) {
            if ( contextNodes[i] === document ){
                return true;
            }
            if ( $.isParentOf(contextNodes[i], el) ){
                return true;
            }
        }
        return false;
    };

    /**
     *  Array contextNodes, Node el
    **/
    $.isInFirstLevel = function (contextNodes, el) {
        var i = 0,
          l = contextNodes.length;
        for ( ; i < l; i++ ) {
            var node = contextNodes[i];
            if ($.indexOf(node,el) > -1){
                return true;
            }
        }
        return false;
    };

    /**
     *  String rule, Array contextNodes, Boolean firstLevel
    **/
    $.processRule = function (rule, contextNodes, firstLevel) {
        rule = rule.replace(/]:/g, "] :");

        //temporary solution for ":not(:checked)"
        rule = rule.replace(/:not\(:/g, ":not\(");

        var arr = rule
          .split(/([.|:|#|\/[|\/]|])+/)
          .filter(function (val, index) {
              return val.trim() !== "";
          });

        var k = 0,
          context = [],
          l = arr.length;

        while ( k < l ) {
            var o = arr[k];

            if (o === "*") {
                console.log("star is not implemented yet!");
                break;
            }
                //check if it is letter only
            else if (/^[a-z]+[a-z0-9]+$/gi.test(o)) {
                //first rule
                context = $.GEBTN(contextNodes, o, firstLevel);
                if (context.length) k++;
                else break;
            }
            else if (o == "#") {
                var idvalue = arr[k + 1];
                if (context.length) {
                    context = context.filter(function (o) { return o.id == idvalue; });
                }
                else {
                    //first rule
                    var el = document.getElementById(idvalue);
                    if (el && $.isInContext(contextNodes, el)){
                        context.push(el);
                    }
                }

                if (context.length){
                    k += 2;
                }
                else{
                    break;
                }
            }
            else if (o == ".") {
                var className = arr[k + 1];
                if (context.length) {
                    context = context.filter(function (o) {
                        var v = true;
                        if (firstLevel) {
                            v = $.isInFirstLevel(contextNodes, o);
                        }
                        return (v && $.hasClass(o, className));
                    });
                }
                else {
                    //first rule
                    context = $.GEBCN(contextNodes, className, firstLevel);
                }

                if (context.length){
                    k += 2;
                }
                else{
                    break;
                }
            }
            else if (o == ":") {
                var r = arr[k + 1];
                if (r == "checked") {
                    if (context.length) {
                        context = $.getChecked(context, true);
                    }
                }
                else if (r == "not(checked)") {
                    if (context.length) {
                        context = $.getChecked(context, false);
                    }
                }
                else {
                    console.log("not all Form selectors and Content Filters are implemented!");
                }
                if (context.length){
                    k += 2;
                }
                else{
                    break;
                }
            }
            else if (o == "[") {
                console.log("Attribute selectors are not implemented yet!");

                if (context.length){
                    k += 3;
                }
                else{
                    break;
                }
            }
            else {
                break;
            }
        }

        return context;
    };

    /**
     *  Node node, String className
    **/
    $.hasClass = function (node, className) {
        className = " " + className + " ";
        return (node.nodeType === 1 &&
          ( " " + node.className + " " )
              .replace(/[\n\t\r]/g, " ")
              .indexOf(className) > -1 );
    };

    /**
     *  Node p (parentNode), Node l (childNode)
    **/
    $.isParentOf = function (p, l) {
        //assign a new value to l in a condition clause is intentionally there
        while (l && (l = l.parentNode) != p);
        return !!l;
    };

    $.indexOf = function (array, obj) {
        for (var i = 0, item; item = array[i]; i += 1) {
            if (obj === item) return i;
        }
        return !1;
    };

    return $;
  };
  /**
   *  Not supported general prototype functions in some browsers
  **/
  if (!Array.prototype.filter) {
      Array.prototype.filter = function (fun /*, thisArg */) {
          if ( this === void 0 || this === null ){
              throw new TypeError();
          }

          var t = Object(this),
            len = t.length >>> 0;
          if (typeof fun != "function"){
              throw new TypeError();
          }

          var res = [],
            thisArg = arguments.length >= 2 ? arguments[1] : void 0,
            i = 0;
          for ( ; i < len; i++ ) {
              if (i in t) {
                  var val = t[i];

                  if (fun.call(thisArg, val, i, t))
                      res.push(val);
              }
          }

          return res;
      };
  }
  if ( !Array.prototype.indexOf ) {
      Array.prototype.indexOf = function (searchElement, fromIndex) {
          if ( this === undefined || this === null ) {
              throw new TypeError('"this" is null or not defined');
          }

          var length = this.length >>> 0;

          fromIndex = +fromIndex || 0;

          if (Math.abs(fromIndex) === Infinity) {
              fromIndex = 0;
          }

          if ( fromIndex < 0 ) {
              fromIndex += length;
              if ( fromIndex < 0 ) {
                  fromIndex = 0;
              }
          }

          for ( ; fromIndex < length; fromIndex++ ) {
              if (this[fromIndex] === searchElement) {
                  return fromIndex;
              }
          }

          return -1;
      };
  }
  if ( !String.prototype.trim ) {
      /**
       * String.prototype.trim()
       * is added natively in JavaScript 1.8.1 / ECMAScript 5
       * supported in: Firefox 3.5+, Chrome/Safari 5+, IE9+ (in Standards mode only!)
       */
      String.prototype.trimLeft = function () {
          return this.replace(/^\s+/, '');
      };
      String.prototype.trimRight = function () {
          return this.replace(/\s+$/, '');
      };
      String.prototype.trim = function () {
          return this.replace(/^\s+|\s+$/g, '');
      };
  }
  //For older versions of IE
  if( typeof window.console === "undefined" ) {
    window.console = {
        log: function() {

        }
    };
  }

  var xpathSupport;
  try {
    var res = document.evaluate('string(//html/head/title)', document, null, 0, null);
    xpathSupport = ((res = (res != null ? res.stringValue : void 0)) != null);
  } catch (e) {
    //check for e.message
    xpathSupport = false;
  }

  if(xpathSupport){
    window.$fix = getxpathselector();
  }
  else{
    window.$fix = getjsselector();
  }

  return window.$fix;
});