// Used for setting up rudamentary inheritance with Javascript.  To use, two
// calls are necessary.  Consider the example of Cat inheriting from Animal...
// function Cat() {
//     Animal.call(this);
//     // Do other typical constructor logic after the initial call to the parent
// }
// Cat.inherit(Animal);
Function.prototype.inherit = function(base) {
    var originalConstructor = this;
    var newConstructor = function() {
        this.constructor = originalConstructor;
    };
    newConstructor.prototype = base.prototype;
    this.prototype = new newConstructor();
    this._base = base;
} // end function



Function.prototype.getBase = function() {
    var base;
    if (this == Object)
        base = null;
    else if (this._base)
        base = this._base;
    else
        base = Object;
    return base;
} // end function