/*!
 * @overview  FixJS - JavaScript Application Framework
 * @copyright (c) 2014 Mehran Hatami
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/fixjs/fix-selector/master/LICENSE
 * @version   0.1.3
 */

(function (window, $, undefined) {

if (window['Fix']) return;

if (typeof(hAzzle) == "undefined"){
	console.log("Please include hAzlle.JS in the page");
	return;
}

var

	$$,
	csp = !!document.createElement('p').classList,

	/**
	 * Prototype references.
	 */
    ArrayProto = Array.prototype,
    StringProto = String.prototype,
    ObjectProto = Object.prototype,

    /**
     * Create a reference to some core methods
     */

    slice = ArrayProto.slice,
    concat = ArrayProto.concat,
    replace = StringProto.replace,
    toString = ObjectProto.toString,

    filter = ArrayProto.filter,

    //RegExp
    trimLeftExp = /^\s+/,
    trimRightExp = /\s+$/,
    trimExp = /^\s+|\s+$/g,

    xpathSupport = (0 && hAzzle.isFunction(document.evaluate) && hAzzle.isFunction(XPathResult));

if ('undefined' === typeof Fix) {
	Fix = {};

	if ('undefined' !== typeof window) {
		window.Fx = window.Fix = Fx = Fix;
	}
}

//polyfills
if ( !filter ) {
  filter = ArrayProto.filter = function (fun /*, thisArg */) {
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
                  res[res.length] = val;
          }
      }

      return res;
  };
}
//For older versions of IE
if( typeof window.console === "undefined" ) {
	window.console = {
	    log: function() {

	    }
	};
}

if(xpathSupport){

	$$ = {
		queries: {},
	    //xpath RegExps
	    getXpathExps: function(){
	    	return [
				//Attribute Equals Selector [name="value"](https://api.jquery.com/attribute-equals-selector/)
			    [/\[([^\]~\$\*\^\|\!]+)(=[^\]]+)?\]/g, "[@$1$2]"],

			    //Multiple Selector (“selector1, selector2, selectorN”)(https://api.jquery.com/multiple-selector/)
			    [/\s*,\s*/g, "|"],

			    //remove extra spaces for ~
			    [/\s*(~)\s*/g, "$1"],
			    //Next Siblings Selector (“prev ~ siblings”)(http://api.jquery.com/next-siblings-selector/)
		        [/([a-zA-Z0-9_\-\*])~([a-zA-Z0-9_\-\*])/g, "$1/following-sibling::$2"],

		        //remove extra spaces for +
		        [/\s*(\+)\s*/g, "$1"],
		        //Next Adjacent Selector (“prev + next”)(http://api.jquery.com/next-adjacent-Selector/)
		        [/([a-zA-Z0-9_\-\*])\+([a-zA-Z0-9_\-\*])/g, "$1/following-sibling::*[1]/self::$2"],

		        //remove extra spaces for >
		        [/\s*(>)\s*/g, "$1"],
		        //Child Selector (“parent > child”)(http://api.jquery.com/child-selector/)
		        [/([a-zA-Z0-9_\-\*])>([a-zA-Z0-9_\-\*])/g, "$1/$2"],

		        //add single quotation for attribute values
		        [(/\[([^=]+)=([^'|" + "\"" + @"][^\]]*)\]/g, "[$1='$2']")],

		        //add xpath star search in all nodes
		        [/(^|[^a-zA-Z0-9_\-\*])(#|\.)([a-zA-Z0-9_\-]+)/g, "$1*$2$3"],
		        //add xpath // search in all dom levels
		        [/([\>\+\|\~\,\s])([a-zA-Z\*]+)/, "$1//$2"],
		        [/\s+\/\//, "//"],

		        // :first-child Selector(https://api.jquery.com/first-child-selector/)
		        [/([a-zA-Z0-9_\-\*]+):first-child/g, "*[1]/self::$1"],

		        // :last-child Selector(https://api.jquery.com/last-child-selector/)
		        [/([a-zA-Z0-9_\-\*]+):last-child/g, "$1[not(following-sibling::*)]"],

		        // :empty Selector(http://api.jquery.com/empty-selector/)
		        [/([a-zA-Z0-9_\-\*]+):empty/g, "$1[not(*) and not(normalize-space())]"],

		        // Attribute Not Equal Selector [name!="value"](http://api.jquery.com/attribute-not-equal-selector/)
		        [/\[([a-zA-Z0-9_\-]+)\!=([^\]]+)\]/g, "[@$1!=$2 or not(@$1)]"],

		        //Attribute Starts With Selector [name^="value"](https://api.jquery.com/attribute-starts-with-selector/)
		        [/\[([a-zA-Z0-9_\-]+)\^=([^\]]+)\]/g, "[starts-with(@$1,$2)]"],

		        //Attribute Contains Selector [name*="value"](http://api.jquery.com/attribute-contains-selector/)
		        [/\[([a-zA-Z0-9_\-]+)\*=([^\]]+)\]/g, "[contains(@$1,$2)]"],

		        //Attribute Contains Word Selector [name~="value"](http://api.jquery.com/attribute-contains-word-selector/)
		        [/\[([a-zA-Z0-9_\-]+)~=([^\]]+)\]/g, "[contains(concat(' ',normalize-space(@$1),' '),concat(' ',$2,' '))]"],

		        //ID Selector (“#id”)(http://api.jquery.com/id-selector/)
		        [/#([a-zA-Z0-9_\-]+)/g, "[@id='$1']"],

		        //Class Selector (“.class”)(http://api.jquery.com/class-selector/)
		        [/\.([a-zA-Z0-9_\-]+)/g, "[contains(concat(' ',normalize-space(@class),' '),' $1 ')]"],

		        //Multiple Attribute Selector [name="value"][name2="value2"](http://api.jquery.com/multiple-attribute-selector/)
		        [/\]\[([^\]]+)/g, " and ($1)"]
			];
		},
		convert2xpath: function(selector) {
			//prevent it from converting a previously convetred selector query
			if($$.queries[cssSelector]){
				return $$.queries[cssSelector];
			}
			var xExps = $$.getXpathExps();
			var cssSelector = selector;
			for (var i = xExps.length - 1; i >= 0; i--) {
				selector = replace.apply(selector, xExps[i]);
			}
			
			//TODO: check if there is any better way instead of using double slash in xpath
			selector = "//" + selector;

			$$.queries[cssSelector] = selector;
			return selector;
		},
		runSelector: function(query) {
			var elements = [],
				el,
	        	iterator = document.evaluate(query, document.lastChild, null, XPathResult.ANY_TYPE, null);

	        if(iterator.resultType==XPathResult.ORDERED_NODE_ITERATOR_TYPE ||
	          iterator.resultType==XPathResult.UNORDERED_NODE_ITERATOR_TYPE){
	          while (el = iterator.iterateNext()) {
	              elements.push(el);
	          }
	        }
	        else{
	        	console.log("Unknown selector pattern");
	        }
	        return elements;
	    }
	};
}
else{
	var cache = {};

	$$ = {
		//filters
		//_idfilter: function(){},

	    hasClass: function (node, className) {
	        return csp ?
	                  node.classList.contains($$.trim(className)) : node.nodeType === 1 && (" " + node.className + " ").replace(/[\t\r\n\f]/g, " ").indexOf($$.trim(className)) >= 0;
	    },

	    isParentOf: function (p, l) {
	        //assign a new value to l in a condition clause is intentionally there
	        while (l && (l = l.parentNode) != p);
	        return !!l;
	    },

	    indexOf: function (array, obj, i) {
	        return hAzzle.inArray.call(array, obj, i);
	    },

	    getChecked: function (contextNodes, checked) {
	        return contextNodes.filter(function (el) {
	            return ((el.tagName.toLowerCase() == "input" &&
	              (el.type=="checkbox" || el.type=="radio") &&
	                  el.checked == checked) ||
	              (el.tagName.toLowerCase() == "option" && el.selected == checked));
	        });
	    },

	    isInContext: function (contextNodes, el) {
	        var i = 0,
	          l = contextNodes.length;
	        for ( ; i < l; i++) {
	            if ( contextNodes[i] === document ){
	                return true;
	            }
	            if ( $$.isParentOf(contextNodes[i], el) ){
	                return true;
	            }
	        }
	        return false;
	    },

	    isInFirstLevel: function (contextNodes, el) {
	        var i = 0,
	          l = contextNodes.length;
	        for ( ; i < l; i++ ) {
	            var node = contextNodes[i];
	            if ($$.indexOf(node,el) > -1){
	                return true;
	            }
	        }
	        return false;
	    },

		GEBTN: function (contextNodes, tagName, firstLevel) {
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
	                result = result.concat(filter.call(node.childNodes, filterf));
	            }
	            else {
	                var tgarr = tagName.split(","),
						j = 0,
						len = tgarr.length;
	                for( ; j<len; j++){
	                    result = result.concat(slice.call(node.getElementsByTagName(tgarr[j]), 0));
	                }
	            }
	        }
	        return result;
	    },

	    GEBCN: function (contextNodes, className, firstLevel) {
	        var result = [],
	          i = 0,
	          l = contextNodes.length;
	        var filterf = function (child) {
	            return (child.nodeType == 1 && $$.hasClass(child, className));
	        };
	        for ( ; i < l; i++ ) {
	            var node = contextNodes[i];
	            if (firstLevel) {
	                result = result.concat(filter.call(node.childNodes, filterf));
	            }
	            else {
	                result = result.concat(slice.call(node.getElementsByClassName(className), 0));
	            }
	        }
	        return result;
	    },

		processRule: function (rule, contextNodes, firstLevel) {

			rule = rule.replace(/]:/g, "] :");

	        //temporary solution for ":not(:checked)"
	        rule = rule.replace(/:not\(:/g, ":not\(");

	        var
	        	arr = rule
				.split(/([.|:|#|\/[|\/]|])+/)
				.filter(function (val, index) {
					return val.trim() !== "";
				}),

				context = [],
	        	k = 0,
	          	l = arr.length;

	        while ( k < l ) {
	            var o = arr[k],
	            	onext = arr[k + 1];

	            /*
	            if (o === "*") {
	                console.log("star is not implemented yet!");
	                break;
	            }
                else*/
            	//check if it is letter only
            	//TODO: fic lettersExp to check for star
	            if (/^[a-z]+[a-z0-9]+$/gi.test(o)) {
	                //first rule
	                context = $$.GEBTN(contextNodes, o, firstLevel);
	                if (context.length){
	                	k++;
	                }
	                else{
	                	break;
	                }
	            }
	            else if (o == "#") {
	            	//onext is id
	                if (context.length) {
	                	//TODO: come up with a solution to abstract filter function away
	                    context = context.filter(function (o) {
				        	return o.id == onext;
				        });
	                }
	                else {
	                    
	                    //first rule ????????
	                    var el = document.getElementById(onext);

	                    if (el && $$.isInContext(contextNodes, el)){
	                        context[context.length] = el;
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
	            	//onext is className
	                if (context.length) {
	                	//TODO: come up with a solution to abstract filter function away
	                    context = context.filter(function (o) {
	                        var v = true;
	                        if (firstLevel) {
	                            v = $$.isInFirstLevel(contextNodes, o);
	                        }
	                        return (v && $$.hasClass(o, onext));
	                    });
	                }
	                else {
	                    //first rule
	                    context = $$.GEBCN(contextNodes, onext, firstLevel);
	                }

	                if (context.length){
	                    k += 2;
	                }
	                else{
	                    break;
	                }
	            }
	            else if (o == ":") {
	            	//temporary solution
	            	//onext is checked or no(checked)
	                if (onext == "checked") {
	                    if (context.length) {
	                        context = $$.getChecked(context, true);
	                    }
	                }
	                else if (onext == "not(checked)") {
	                    if (context.length) {
	                        context = $$.getChecked(context, false);
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
	    },

	    runSelector: function (selector){
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
	                            context = $$.processRule(s, context, firstLevel);
	                        }
	                        else if (op == "+") {
	                            console.log("Next Adjacent Selector is not implemented yet!");
	                        }
	                        else if (op == "~") {
	                            console.log("Next Siblings Selector is not implemented yet!");
	                        }
	                    }
	                    else context = $$.processRule(s, [document], false);

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
		}
	};
}

$$.trimLeft = function (str) {
  return str.replace(trimLeftExp, '');
};
$$.trimRight = function (str) {
  return str.replace(trimRightExp, '');
};
$$.trim = function (str) {
  return str.replace(trimExp, '');
};

$$.$ = function(selector){
	
	if(xpathSupport){
		selector = $$.convert2xpath(selector);
	}

    return $$.runSelector(selector);
};



window["$fx"] = Fix.select = function(selector){
	return $$.$(selector);
};

})(window, hAzzle);
