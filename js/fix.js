/*!
 * @overview  FixJS - JavaScript Application Framework
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
        if(typeof window.console === 'undefined'){
            window.console = {};
            log = window.console.log = function() {};
        }
        else{
            log = function(msg){
                window.console.log(msg + ' | ' + new Date().valueOf());
            };
        }
    }

    if ('undefined' !== typeof window && window.Fix){
        log('You already have Fix framework added in the context');
        return;
    }

    var Fix = {};

    if ('undefined' !== typeof window) {
        window.Fix = Fix;
    }

//polyfills
if ( !Array.prototype.filter ) {
  ArrayProto.filter = function (fun /*, thisArg */) {
      if ( this === void 0 || this === null ){
          throw new TypeError();
      }

      var t = Object(this),
      len = t.length >>> 0;
      if (typeof fun != 'function'){
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

var
    /**
     * Prototype references.
     */
     ArrayProto = Array.prototype,
    /**
     * Create a reference to some core methods
     */
     slice = ArrayProto.slice,
     filter = ArrayProto.filter,

     csp = !!document.createElement('p').classList,

     $$ = {
        //filters
        //_idfilter: function(){},
        isString: function (value) {
            return typeof value === 'string';
        },
        isFunction: function (value) {
            return typeof value === 'function';
        },
        inArray: function (elem, arr, i) {

            var iOff = (function (find, i /*opt*/ ) {
                if (typeof i === 'undefined') i = 0;
                if (i < 0) i += this.length;
                if (i < 0) i = 0;
                for (var n = this.length; i < n; i++)
                    if (i in this && this[i] === find) {
                        return i;
                    }
                    return -1;
                });
            return arr === null ? -1 : iOff.call(arr, elem, i);
        },

        trimLeft : function (str) {
          return str.replace(/^\s+/, '');
      },
      trimRight : function (str) {
          return str.replace(/\s+$/, '');
      },
      trim : function (str) {
          return str.replace(/^\s+|\s+$/g, '');
      },

        //borrowed from hAzzle
        extend : function (o, target) {
            for (var k in o) {
                if(o.hasOwnProperty(k)){
                    target[k] = o[k];
                }
            }
            return target;
        },

        hasClass: function (node, className) {
            return csp ?
            node.classList.contains($$.trim(className)) : node.nodeType === 1 && (' ' + node.className + ' ').replace(/[\t\r\n\f]/g, ' ').indexOf($$.trim(className)) >= 0;
        },

        isParentOf: function (p, l) {
            log('stack: isParentOf');
            //assign a new value to l in a condition clause is intentionally there
            while (l && (l = l.parentNode) != p);
            return !!l;
        },

        getChecked: function (contextNodes, checked) {
            log('stack: getChecked');
            return contextNodes.filter(function (el) {
                return ((el.tagName.toLowerCase() == 'input' &&
                  (el.type=='checkbox' || el.type=='radio') &&
                  el.checked == checked) ||
                (el.tagName.toLowerCase() == 'option' && el.selected == checked));
            });
        },

        isInContext: function (contextNodes, el) {
            log('stack: isInContext');
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
            log('stack: isInFirstLevel');
            var i = 0,
            l = contextNodes.length;
            for ( ; i < l; i++ ) {
                var node = contextNodes[i];
                if ($$.inArray(el, node.childNodes) >= 0){
                    return true;
                }
            }
            return false;
        },

        GEBTN: function (contextNodes, tagName, firstLevel) {
            log('stack: GEBTN start');
            var result = [],
            i = 0,
            l = contextNodes.length;
            var filterf = function (child) {
                return (child.nodeType == 1 && tagName.search(',' + child.tagName.toLowerCase() + ',') > -1);
            };
            for( ; i<l; i++ ){
                var node = contextNodes[i];
                if (firstLevel) {
                    tagName = ',' + tagName.toLowerCase() + ',';
                    result = result.concat(filter.call(node.childNodes, filterf));
                }
                else {
                    var tgarr = tagName.split(','),
                    j = 0,
                    len = tgarr.length;
                    for( ; j<len; j++){
                        result = result.concat(slice.call(node.getElementsByTagName(tgarr[j]), 0));
                    }
                }
            }
            log('stack: GEBTN end');
            return result;
        },

        GEBCN: function (contextNodes, className, firstLevel) {
            log('stack: GEBTN start');
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
            log('stack: GEBTN end');
            return result;
        },

        processRule: function (rule, contextNodes, firstLevel) {
            log('stack: processRule start');

            rule = rule.replace(/]:/g, '] :');

            //TODO: take care of not operator
            //temporary solution for ':not(:checked)'
            //rule = rule.replace(/:not\(:/g, ':not\(');

                var
                arr = rule
                .split(/([.|:|#|\/[|\/]|])+/)
                .filter(function (val) {
                    return val.trim() !== '';
                }),

                context = [],
                k = 0,
                l = arr.length;

                while ( k < l ) {
                    var o = arr[k],
                    onext = arr[k + 1];

                //check if it is star or letter only
                if (o === '*' || /^[a-z]+[a-z0-9]+$/gi.test(o)) {
                    //first rule
                    context = $$.GEBTN(contextNodes, o, firstLevel);
                    if (context.length){
                        k++;
                    }
                    else{
                        break;
                    }
                }
                else if (o == '#') {
                    //onext is id
                    if (context.length) {
                        //TODO: come up with a solution to abstract filter function away
                        var ctx = [];
                        for (var m = context.length - 1; m >= 0; m--) {
                            if(o.id == onext){
                                ctx.push(context[m]);
                            }
                        }
                        context = ctx;
                        /*context = context.filter(function (o) {
                            return o.id == onext;
                        });*/
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
                else if (o == '.') {
                    //onext is className
                    if (context.length) {
                        //TODO: come up with a solution to abstract filter function away
                        var ctxt = [];
                        for (var n = context.length - 1; n >= 0; n--) {
                            var ctxtEl = context[n],
                            v = true;

                            if (firstLevel) {
                                v = $$.isInFirstLevel(contextNodes, ctxtEl);
                            }
                            if(v && $$.hasClass(ctxtEl, onext)){
                                ctxt.push(ctxtEl);
                            }
                        }
                        context = ctxt;
                        /*context = context.filter(function (o) {
                            var v = true;
                            if (firstLevel) {
                                v = $$.isInFirstLevel(contextNodes, o);
                            }
                            return (v && $$.hasClass(o, onext));
                        });*/
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
                else if (o == ':') {
                    //temporary solution
                    //onext is checked or no(checked)
                    if (onext == 'checked') {
                        if (context.length) {
                            context = $$.getChecked(context, true);
                        }
                    }
                    else if (onext == 'not(checked)') {
                        if (context.length) {
                            context = $$.getChecked(context, false);
                        }
                    }
                    else {
                        log('not all Form selectors and Content Filters are implemented!');
                    }
                    if (context.length){
                        k += 2;
                    }
                    else{
                        break;
                    }
                }
                else if (o == '[') {
                    log('Attribute selectors are not implemented yet!');

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

            log('stack: processRule end');

            return context;
        },

        runSelector: function (selector){
            log('stack: runSelector start');

            var elements = [];
            //remove spaces around ','
            selector = selector.replace(/\s(,)\s/g, ',');

            var selectors = selector.split(','),
            l = selectors.length,
            i = 0;

            for ( ; i < l; i++) {
                var sel = selectors[i].trim();
                if (sel) {
                    //remove spaces around '>', '+' and '~'
                    sel = sel.replace(/\s*(>|\+|~)\s*/g, '$1');

                    //split based on '>', '+' and '~'
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
                            if (op == ' ' || (op == '>' && (firstLevel = true))) {
                                context = $$.processRule(s, context, firstLevel);
                            }
                            else if (op == '+') {
                                log('Next Adjacent Selector is not implemented yet!');
                            }
                            else if (op == '~') {
                                log('Next Siblings Selector is not implemented yet!');
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
                    throw new Error('Invalid selector : ' + selector);
                }
            }
            log('stack: runSelector end');
            return elements;
        }
    };

    Fix.$$ = $$;

    window.$f = Fix.$ = function(selector){
        log('stack: $f start');
        var result = $$.runSelector(selector);
        log('stack: $f end');
        return result;
    };

})(window);
