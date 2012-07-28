var _ = (function(){

  var type, objList = 'Array,Object,Date,Function,Arguments,Boolean,RegExp,String,Number,Null,Undefined'.split(',');
  while(type = objList.pop())
    this['obj' + type] = '[object ' + type + ']';

  var breaker  = {}

    , id       = function(x)    { return x }
    , constant = function(x)    { return function() { return x }}

    , ArrProt  = Array.prototype
    , ObjProt  = Object.prototype
    , FuncProt = Function.prototype

//  , nativeMap          = ArrProt.map
    , nativeSome         = ArrProt.some
    , nativeKeys         = Object.keys
    , nativeBind         = FuncProt.bind
    , nativeEvery        = ArrProt.every
    , nativeReduce       = ArrProt.reduce
//  , nativeFilter       = ArrProt.filter
    , nativeIsArray      = Array.isArray
//  , nativeForEach      = ArrProt.forEach
    , nativeIndexOf      = ArrProt.indexOf
    , nativeReduceRight  = ArrProt.reduceRight
    , nativeLastIndexOf  = ArrProt.lastIndexOf

    , slice    = function(args, n) { return ArrProt.slice.call(args, n || 0) }
    , push     = function(ctx)     { return function(){ return ArrProt.push.apply(ctx, slice(arguments)) } }
    , pop      = function(ctx)     { return function(){ return ArrProt.pop.apply(ctx,  slice(arguments)) } }

    , toString = function(obj) { return ObjProt.toString.call(obj) }
    , has      = function(obj) { return function(prop){ return ObjProt.hasProperty.call(obj, prop) } }

    , isArray     = nativeIsArray ||
                    function(obj) { return toString(obj) == objArray        }
    , isDate      = function(obj) { return toString(obj) == objDate         }
    , isRegExp    = function(obj) { return toString(obj) == objRegExp       }
    , isString    = function(obj) { return toString(obj) == objString       }
    , isNumber    = function(obj) { return toString(obj) == objNumber       }
    , isFunc      = function(obj) { return toString(obj) == objFunction     }
    , isArgs      = function(obj) { return toString(obj) == objArguments    }
    , isNaN       = function(obj) { return obj !== obj                      }
    , isNull      = function(obj) { return obj === null                     }
    , isUndefined = function(obj) { return obj === void 0                   }
    , isElement   = function(obj) { return obj && obj.nodeType == 1         }
    , isWindow    = function(obj) { return obj != null && obj == obj.window }
    , isBool      = function(obj) { return obj === true || obj === false || toString(obj) == objBoolean }

    , bind = function(ctx) { return function(mtd){ var ctx = ctx; return function(){ mtd.apply(ctx, slice(arguments)) } } }

    , isEmpty = function(obj) {
        if(obj == null) return true;
        if(isArray(obj) || isString(obj)) return obj.length === 0;
        var objHas = has(obj);
        for(var k in obj) if(objHas(k)) return false;
        return true;
      }

    , isObject = function(obj) {
        if(!obj || toString(obj) != objObj || obj.nodeType || isWindow(obj)){
          return false;
        }

        try{
          if(obj.constructor && has(obj)('constructor') && has(obj.constructor.prototype)('isPrototypeOf')){
            return false;
          }
        } catch(e){ return false }

        var k;
        for(k in obj){}

        return k === undefined || has(obj)(k);
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

          var aHas = has(a), bHas = has(b);
          for(var k in a){
            if(aHas(k)){
              size++;

              if(!(result = bHas(k) && eq(a[k], b[k], stack))) break;
            }
          }

          // Verfiy that both objects contain
          // the same number of properties
          if(result){
            for(k in b)
              if(bHas(k) && !(size--)) break;
            result = !size;
          }
        }

        stack.pop();
        return result;
      }

    , each = function(obj, iterator, context){
        var length = obj.length;
        if(length === +length){
          for(var i = 0; i < length; i++)
            if(i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
        }
        else{
          var objHas = has(obj);
          for(var k in obj)
            if(objHas(k))
              if(iterator.call(context, obj[k], k, obj) === breaker) return;
        }
      }

    , map = function(obj, iterator, context){
        var results = [];
        each(obj, function(value, index, list){
          results[results.length] = iterator(value, index, list);
        }, context);
        return results;
      }

    , filter = function(obj, iterator, context){
        var results = [];
        each(obj, function(value, index, list){
          iterator(value, index, list) && (results[results.length] = value);
        }, context);
      }

    , extend = function(obj){
        each(slice(arguments, 1), function(source){
          for(k in source)
            obj[k] = source[k];
        });
        return obj;
      }
  ;//var

  if(!isArgs(arguments))
    isArgs = function(obj) { return !!(obj && has(obj)('callee')) }

  var eventSplitter = /\s+/;
  Events = {
    _on: function(events, callback, context){
      var calls, list, event, tail;
      if(callback){
        calls  = this._callbacks || (this._callbacks = {});
        events = events.split(eventSplitter);

        while(event = events.pop()){
          list = calls[event];
          node = list ? list.tail : {};
          node.next = tail = {};
          node.context  = context;
          node.callback = callback;
          calls[event] = {tail: tail, next: list ? list.next : node};
        }
      }

      return this;
    },

    _off: function(events, callback, context){
      var calls, node, tail, flag, prev;

      if(calls = this._callbacks){
        if(events){
          events = events.split(eventSplitter);
          while(event = events.pop()){
            if(!callback) delete calls[event];
            else if(node = prev = calls[event]){
              tail = node.tail;
              while((node = node.next) !== tail){
                if(flag && (prev.next = node)) return this;
                node.callback === callback && (flag = true);
                !flag && (prev = node);
              }
            }
          }
        }
        else delete this._callbacks;
      }

      return this;
    },

    _trigger: function(events){
      var args, calls, event, tail;
      if(calls = this._callbacks){
        args   = slice(arguments, 1);
        events = events.split(eventSplitter);

        while(event = events.pop()){
          if(node = calls[event]){
            tail = node.tail;
            while((node = node.next) !== tail){
              node.callback.apply(node.context || this, args);
            }
          }
        }
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
    'pop'  : pop,
    'push' : push,
    'slice': slice,

    'has'     : has,
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

    'map'   : map,
    'bind'  : bind,
    'each'  : each,
    'extend': extend,
    'filter': filter,

    'Events': Events
  };

})();

var obj = {
  a:1,
  b:2,
  c:3,
  d:4
};
var test = new Model(obj);

var a = [1,2,3,4];
var b = [1,2,3,4];

var func1 = function(){console.log('a', arguments)}
var func2 = function(){console.log('b', arguments)}
var func3 = function(){console.log('c', arguments)}
var func4 = function(){console.log('d', arguments)}

test._on('change:a', func1);
test._on('change:b', func2);
test._on('change:c', func3);
test._on('change:d', func4);
