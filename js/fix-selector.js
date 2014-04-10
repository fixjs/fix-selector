define(function () {
  var $ = function (selector) {
      var elements = [];

      //remove spaces around ","
      selector = selector.replace(/\s(,)\s/g, ",");

      var selectors = selector.split(",");

      for (var i = 0; i < selectors.length; i++) {
          var sel = selectors[i].trim();
          if (sel) {
              //remove spaces around ">", "+" and "~"
              sel = sel.replace(/\s*(>|\+|~)\s*/g, "$1");

              //split based on ">", "+" and "~"
              var selarr = sel.split(/([\s|>|+|~])+/);

              var context = [];
              var j = 0;
              while (j < selarr.length) {
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
      var result = [];
      var filterf = function (child) {
          return (child.nodeType == 1 && tagName.search("," + child.tagName.toLowerCase() + ",") > -1);
      };
      for(var i=0;i<contextNodes.length;i++){
          var node = contextNodes[i];
          if (firstLevel) {
              tagName = "," + tagName.toLowerCase() + ",";
              result = result.concat(Array.prototype.filter.call(node.childNodes, filterf));
          }
          else {
              var tgarr = tagName.split(",");
              for(var j=0;j<tgarr.length;j++){
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
      var result = [];
      var filterf = function (child) {
          return (child.nodeType == 1 && $.hasClass(child, className));
      };
      for (var i = 0; i < contextNodes.length; i++) {
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
          return ((el.tagName.toLowerCase() == "input" && (el.type=="checkbox" || el.type=="radio") && el.checked == checked) ||
              (el.tagName.toLowerCase() == "option" && el.selected == checked));
      });
  };

  /**
   *  Array contextNodes, Node el
  **/
  $.isInContext = function (contextNodes, el) {
      for (var i = 0; i < contextNodes.length; i++) {
          if (contextNodes[i] == document) return true;
          if ($.isParentOf(contextNodes[i], el)) return true;
      }
      return false;
  };

  /**
   *  Array contextNodes, Node el
  **/
  $.isInFirstLevel = function (contextNodes, el) {
      for (var i = 0; i < contextNodes.length; i++) {
          var node = contextNodes[i];
          if (Array.prototype.indexOf.call(node,el) > -1) return true;
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

      var arr = rule.split(/([.|:|#|\/[|\/]|])+/).filter(function (val, index) { return val.trim() !== ""; });

      var k = 0;
      var context = [];
      
      while (k < arr.length) {
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
                  if (el && $.isInContext(contextNodes, el)) context.push(el);
              }

              if (context.length) k += 2;
              else break;
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

              if (context.length) k += 2;
              else break;
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
              if (context.length) k += 2;
              else break;
          }
          else if (o == "[") {
              console.log("Attribute selectors are not implemented yet!");

              if (context.length) k += 3;
              else break;
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
      return (node.nodeType === 1 && (" " + node.className + " ").replace(/[\n\t\r]/g, " ").indexOf(className) > -1);
  };

  /**
   *  Node p (parentNode), Node l (childNode)
  **/
  $.isParentOf = function (p, l) { while (l && (l = l.parentNode) != p); return !!l; };


  /**
   *  Not supported general prototype functions in some browsers
  **/
  if (!Array.prototype.filter) {
      Array.prototype.filter = function (fun /*, thisArg */) {
          if (this === void 0 || this === null)
              throw new TypeError();

          var t = Object(this);
          var len = t.length >>> 0;
          if (typeof fun != "function")
              throw new TypeError();

          var res = [];
          var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
          for (var i = 0; i < len; i++) {
              if (i in t) {
                  var val = t[i];

                  if (fun.call(thisArg, val, i, t))
                      res.push(val);
              }
          }

          return res;
      };
  }
  if (!Array.prototype.indexOf) {
      Array.prototype.indexOf = function (searchElement, fromIndex) {
          if (this === undefined || this === null) {
              throw new TypeError('"this" is null or not defined');
          }

          var length = this.length >>> 0;

          fromIndex = +fromIndex || 0;

          if (Math.abs(fromIndex) === Infinity) {
              fromIndex = 0;
          }

          if (fromIndex < 0) {
              fromIndex += length;
              if (fromIndex < 0) {
                  fromIndex = 0;
              }
          }

          for (; fromIndex < length; fromIndex++) {
              if (this[fromIndex] === searchElement) {
                  return fromIndex;
              }
          }

          return -1;
      };
  }
  if (!String.prototype.trim) {
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
  
  return $;
});