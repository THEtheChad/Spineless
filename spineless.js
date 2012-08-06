var _ = (function(){

  var identity = function(x) { return x }
    , constant = function(x) { return function() { return x } }

    , ArrayProt    = Array.prototype
    , ObjectProt   = Object.prototype
    , FunctionProt = Function.prototype

    , objNull      = '[object Null]'
    , objDate      = '[object Date]'
    , objArray     = '[object Array]'
    , objObject    = '[object Object]'
    , objRegExp    = '[object RegExp]'
    , objString    = '[object String]'
    , objNumber    = '[object Number]'
    , objBoolean   = '[object Boolean]'
    , objFunction  = '[object Function]'
    , objArguments = '[object Arguments]'
    , objUndefined = '[object Undefined]'

    , slice    = function(args,n)   { return ArrayProt.slice.call(args, n || 0) }
    , hasProp  = function(obj,prop) { return ObjectProt.hasOwnProperty.call(obj, prop) }
    , toString = function(obj)      { return ObjectProt.toString.call(obj) }

    , isArray     = Array.isArray || (Array.isArray =
                    function(obj) { return toString(obj) == objArray     })
    , isDate      = function(obj) { return toString(obj) == objDate      }
    , isRegExp    = function(obj) { return toString(obj) == objRegExp    }
    , isString    = function(obj) { return toString(obj) == objString    }
    , isNumber    = function(obj) { return toString(obj) == objNumber    }
    , isObject    = function(obj) { return toString(obj) == objObject    }
    , isFunc      = function(obj) { return toString(obj) == objFunction  }
    , isArgs      = function(obj) { return toString(obj) == objArguments }
    , isNaN       = function(obj) { return obj !== obj                   }
    , isNull      = function(obj) { return obj === null                  }
    , isUndefined = function(obj) { return obj === void 0                }
    , isElement   = function(obj) { return obj && obj.nodeType == 1      }
    , isWindow    = function(obj) { return obj && obj.window == obj      }
    , isBool      = function(obj) { return obj === true || obj === false }

    , keys = Object.keys || (Object.keys = function(obj){
        var keys = [], k;
        for(k in obj)
          if(hasProp(obj, k)) keys.push(k);
        return keys;
      })

    , extend = function(obj){
        slice(arguments, 1).forEach(function(source){
          for(k in source)
            obj[k] = source[k];
        });
        return obj;
      }

    , isEmpty = function(obj) {
        if(obj == null) return true;
        if(isArray(obj) || isString(obj)) return obj.length === 0;
        for(var k in obj) if(hasProp(obj, k)) return false;
        return true;
      }

    , isPlainObject = function(obj) {
        if(!obj || toString(obj) != objObject || obj.nodeType || isWindow(obj)){
          return false;
        }

        try{
          if(obj.constructor && hasProp(obj, 'constructor') && hasProp(obj.constructor.prototype, 'isPrototypeOf')){
            return false;
          }
        } catch(e){ return false }

        for(var k in obj){}

        return k === void 0 || hasProp(obj, k);
      }

    , isEqual = function(a, b, stack){
        // If values are equal, we don't need to go any further
        // Doesn't allow 0 === -0 to slip through:
        // http://wiki.ecmascript.org/doku.php?id=harmony:egal
        if(a === b) return a !== 0 || 1/a == 1/b;

        var type = toString(a);

        // If object types are not the same, values
        // are assumed to be non-equivalent
        if(type != toString(b)) return false;

        switch(type){
          // Check for NaN (NaN != NaN is true)
          case objNumber:
            return a != a && b != b;
          // These types should all be false at
          // this point
          case objString:
          case objBoolean:
          case objFunction:
            return false;
          // Converts dates to milliseconds since UTC
          case objDate:
            return +a == +b;
          // Reg expressions are considered equivalent
          // if the source and flags all match
          case objRegExp:
            return a.source     == b.source     &&
                   a.global     == b.global     &&
                   a.ignoreCase == b.ignoreCase &&
                   a.multiline  == b.multiline
            ;//return
        }

        // We keep a running stack of all nested objects
        // to check for cyclic structures
        stack || (stack = []);

        var idx = stack.length;
        while(idx--)
          if(stack[idx] == a) return true;

        stack.push(a);
        var size = 0, result = true;

        if(type == objArray || type == objArguments){
          size = a.length;
          result = size == b.length;
          if(result)
            while(--size)
              if(!(result = isEqual(a[size], b[size], stack))) break;
        }
        else{
          if(a.constructor != b.constructor) return false;

          for(var k in a){
            if(hasProp(a, k)){
              size++;

              if(!(result = hasProp(b, k) && eq(a[k], b[k], stack))) break;
            }
          }

          // Verfiy that both objects contain
          // the same number of properties
          if(result){
            for(k in b)
              if(hasProp(b, k) && !(size--)) break;
            result = !size;
          }
        }

        stack.pop();
        return result;
      }

    , template = function(text){
        source = 'return "' +
          text.replace(/\{\{(.*?)\}\}/g, function(match, code){
            return '"+(' + code + ')+"';
          }) +
          '"';

        return new Function('obj', source);
      }
  ;//var

  if(!isArgs(arguments))
    isArgs = function(obj) { return !!(obj && hasProp(obj, 'callee')) }

  if(!ArrayProt.forEach){
    ArrayProt.forEach = function(iterator, context){
      var i = this.length;
      while(i--)
        i in this && iterator.call(context, this[i], i, this);
    };
  }

  if(!ObjectProt.forEach){
    ObjectProt.forEach = function(iterator, context){
      for(var k in this)
        hasProp(this, k) && iterator.call(context, this[k], k, this);
    };
  }

  if(!ArrayProt.map){
    ArrayProt.map = function(iterator, context){
      var results = [];
      this.forEach(function(value, index, list){
        results.push(iterator(value, index, list));
      }, context);
      return results;
    };
  }

  if(!ArrayProt.filter){
    ArrayProt.filter = function(iterator, context){
      var results = [];
      this.forEach(function(value, index, list){
        if(iterator(value, index, list)) results.push(value);
      }, context);
      return results;
    };
  }

  if(!ArrayProt.every){
    ArrayProt.every = function(iterator, context){
      var i = this.length;
      while(i--)
        if(i in this && !iterator.call(context, this[i], i, this)) return false;
      return true;
    };
  }

  if(!ObjectProt.every){
    ObjectProt.every = function(iterator, context){
      for(var k in this)
        if(hasProp(this, k) && !iterator.call(context, this[k], k, this)) return false;
      return true;
    };
  }

  if(!ArrayProt.some){
    ArrayProt.some = function(iterator, context){
      var i = this.length;
      while(i--)
        if(i in this && iterator.call(context, this[i], i, this)) return true;
      return false;
    };
  }

  if(!ObjectProt.some){
    ObjectProt.some = function(iterator, context){
      for(var k in this)
        if(hasProp(this, k) && iterator.call(context, this[k], k, this)) return true;
      return false;
    };
  }  

  if(!FunctionProt.bind){
    FunctionProt.bind = function(context){
      var self = this;
      return function(){ return self.apply(context, slice(arguments)) };
    };
  }

  if(!ArrayProt.reduce){
    ArrayProt.reduce = function(iterator, initial){
      var result = initial
        , length = this.length
        , idx    = -1
      ;//var

      if(length){
        arguments.length == 1 && (result = this[++idx]);
        while(++idx < length)
          i in this && (result = iterator(result, this[idx], idx, this));
      }
      return result;
    };
  }

  if(!ArrayProt.reduceRight){
    ArrayProt.reduceRight = function(iterator, initial){
      var result = initial
        , idx    = this.length
      ;//var

      if(idx){
        arguments.length == 1 && (result = this[--idx]);
        while(idx--)
          i in this && (result = iterator(result, this[idx], idx, this));
      }
      return result;
    };
  }

  if(!ArrayProt.indexOf){
    ArrayProt.indexOf = function(needle, start){
      var l = this.length
        , i = start ? start < 0 ? l + start : start : 0
      ;//var
      if(i < l && i >= 0)
        while(i < l){
          if(i in this && this[i] === needle) return i;
          i++;
        }
      return -1;
    };
  }

  if(!ArrayProt.lastIndexOf){
    ArrayProt.lastIndexOf = function(needle, start){
      var l = this.length
        , i = start ? start < 0 ? l + start : start : 0
      ;//var
      if(i < l && i >= 0)
        while(i > 0){
          if(i in this && this[i] === needle) return i;
          i--;
        }
      return -1;
    };
  }

  var eventSplitter = /\s+/;
  Events = {
    _on: function(events, callback, context) {
      var list, calls = this._callbacks || (this._callbacks = {});
      events
        .split(eventSplitter)
        .forEach(function(event){
            list = calls[event] || (calls[event] = []);
            list.push({context: context, callback: callback});
          })
      ;//events
      return this;
    },

    _off: function(events, callback) {
      var calls;
      if(calls = this._callbacks){
        events
          .split(eventSplitter)
          .forEach(function(event) {
            if(calls[event]){
              if(callback)
                calls[event] = calls[event].filter(function(node){ return callback !== node.callback });
              else delete calls[event];
            }
          })
        ;//events
      }
      return this;
    },

    _trigger: function(events) {
      var calls, list, args = slice(arguments, 1);
      if(calls = this._callbacks){
        events
          .split(eventSplitter)
          .forEach(function(event){
              if(list = calls[event])
                list.forEach(function(node){
                  node.callback.apply(node.context, args);
                });
            })
        ;//events
      }
      return this;
    }
  };

  Model = function(obj){
    var obj = this._object = obj;

    var getSet = function(key){
      var change = 'change:' + key
        , update = 'update:' + key
        , object = obj
      ;//var

      return function(set){
        var value = object[key];

        if(arguments.length){
          if(!isEqual(value, set)){
            object[key] = value = set;
            this._trigger(change, value);
          }
          this._trigger(update, value);
        }

        return value;
      }
    };

    for(var k in obj)
      this[k] = getSet(k);

    return this;
  };

  Model.prototype = Events;

  return {
    'keys'    : keys,
    'slice'   : slice,
    'extend'  : extend,
    'hasProp' : hasProp,
    'toString': toString,

    'isNaN'   : isNaN,
    'isDate'  : isDate,
    'isFunc'  : isFunc,
    'isArgs'  : isArgs,
    'isNull'  : isNull,
    'isBool'  : isBool,
    'isEmpty' : isEmpty,
    'isArray' : isArray,
    'isRegExp': isRegExp,
    'isString': isString,
    'isNumber': isNumber,
    'isWindow': isWindow,
    'isObject': isObject,
    'isElement': isElement,
    'isUndefined': isUndefined,

    'isEqual': isEqual,

    'Events': Events
  };

})();

// var obj = {
//   a:1,
//   b:2,
//   c:3,
//   d:4
// };
// var test = new Model(obj);

// var a = [1,2,3,4];
// var b = [1,2,3,4];

// var func1 = function(){console.log('a', arguments)}
// var func2 = function(){console.log('b', arguments)}
// var func3 = function(){console.log('c', arguments)}
// var func4 = function(){console.log('d', arguments)}

// test._on('change:a', func1);
// test._on('change:b', func2);
// test._on('change:c', func3);
// test._on('change:d', func4);
