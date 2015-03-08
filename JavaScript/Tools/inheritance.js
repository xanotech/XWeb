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
    if (!base._subTypes)
        base._subTypes = [];
    base._subTypes.push(this);
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



Function.prototype.getSubTypes = function(recursive) {
    var subTypes = [];
    if (this._subTypes)
        subTypes = subTypes.concat(this._subTypes);

    if (recursive) {
        for (var st = 0; st < subTypes.length; st++) {
            var moreSubTypes = subTypes[st].getSubTypes(true);
            if (moreSubTypes.length)
                subTypes = subTypes.concat(moreSubTypes);
        } // end for
    } // end if

    return subTypes;
} // end function