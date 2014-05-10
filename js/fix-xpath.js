/*!
 * @overview  FixJS - CSS selecor engine based on XPath
 * @copyright (c) 2014 Mehran Hatami
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/fixjs/fix-selector/master/LICENSE
 * @version   0.1.3
 */

(function (window, undefined) {

var log;
if('undefined' === typeof window){
	log = function() {};
}
else{
	log = window.console.log;
}

if (window['Fix'] === undefined ||
	window['$f'] === undefined){

	log("Please include fix.js before fix-xpath.js");

	return;
}

var

	$$ = Fix.$$,
	replace = String.prototype.replace,
    xpathSupport = ($$.isFunction(document.evaluate) && $$.isFunction(XPathResult));

if(xpathSupport){
	
	$$.extend({
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
		        {
		        	conditional: function(selector){
		        		while(selector.indexOf(">") > -1){
		        			selector = replace.apply(selector, this.exp);
		        		}
		        		return selector;
		        	},
		        	exp: [/([a-zA-Z0-9_\-\*])>([a-zA-Z0-9_\-\*])/, "$1/$2"]
		        },

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

			var i=0,
				l = xExps.length;

			for ( ; i < l ; i++ ) {

				var xExp = xExps[i];

				if(Array.isArray(xExp)){
					selector = replace.apply(selector, xExp);
				}
				else{
					selector = xExp.conditional(selector);
				}
			}
			
			//TODO: check if there is any better way instead of using double slash in xpath
			selector = "//" + selector;

			$$.queries[cssSelector] = selector;
			return selector;
		},
		runXPathSelector: function(query) {
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
	        	log("Unknown selector pattern");
	        }
	        return elements;
	    }
	}, Fix.$$);

}

window["$fx"] = Fix.$x = function(selector){
	if(xpathSupport){
		selector = $$.convert2xpath(selector);
		return $$.runXPathSelector(selector);
	}
	else{
		log("The browser doesn't support XPath");
		return null;
	}
};

})(window);
