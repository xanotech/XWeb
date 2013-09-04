// Used for setting up rudamentary inheritance with Javascript.  To use, two
// calls are necessary.  Consider the example of Cat inheriting from Animal...
// function Cat() {
//     Animal.call(this);
//     // Do other typical constructor logic after the initial call to the parent
// }
// Cat.inherit(Animal)
Function.prototype.inherit = function(base) {
    var c = Function.prototype.inherit.nonconstructor;
    c.prototype = base.prototype;
    this.prototype = new c();
    this.prototype.originalConstructor = this;
} // end function
Function.prototype.inherit.nonconstructor = function() {}
 


// Returns the name of a function as initially defined.
Function.prototype.getName = function() {
    var funcString = this.toString();
    var start = funcString.indexOf('function') + 9;
    var end = funcString.indexOf('(');
    var name = $.trim(funcString.substring(start, end));
    return name;
} // end function
 


// Returns the original constructor (function) of an object.  This method exists
// in order to compensate for an unfortunate side-effect of the inherit method:
// inherited objects must have thier constructor changed making the built-in
// "constructor" property unreliable.  Use getConstructor() to compensate.
Object.getConstructor = function(obj) {
    var proto = obj.__proto__;
    if (proto && proto.originalConstructor){
        return proto.originalConstructor;
    } else if (obj.originalConstructor){
        return obj.originalConstructor
    } else
        return obj.constructor;
} // end function