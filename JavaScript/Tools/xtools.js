/* xtools JavaScript Library v1.0
 *
 * Copyright 2014 Xanotech LLC
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 */



Date.prototype.is = function(date) {
    return this.getTime() == date.getTime();
} // end function



// Returns the name of a function as initially defined.
Function.prototype.getName = function() {
    var funcString = this.toString();
    var start = funcString.indexOf('function') + 9;
    var end = funcString.indexOf('(');
    var name = $.trim(funcString.substring(start, end));
    return name;
} // end function



Object.isBasic = function(obj) {
    if (typeof obj == 'undefined' || obj == null)
        return false;

    return obj.constructor == String || obj.constructor == Number ||
        obj.constructor == Boolean || obj.constructor == Date;
} // end function



String.prototype.contains = String.prototype.contains || function(str) {
    return this.indexOf(str) != -1;
} // end function



String.prototype.endsWith = String.prototype.endsWith || function(str) {
    if (this == '' || !str)
        return false;

    var index = this.lastIndexOf(str);
    return index == this.length - str.length;
} // end function



String.prototype.is = String.prototype.is || function(str) {
    if (!_(str).isString())
        str = str.toString();
    return this.toUpperCase() == str.toUpperCase();
} // end function



String.prototype.remove = String.prototype.remove || function(str) {
    return this.replace(str, '');
} // end function



String.prototype.removeIgnoreCase = String.prototype.removeIgnoreCase || function(str) {
    return this.replaceIgnoreCase(str, '');
} // end function



String.prototype.replaceIgnoreCase = String.prototype.replaceIgnoreCase || function(oldValue, newValue) {
    if (!oldValue)
        return this;

    var upperCaseThis = this.toUpperCase();
    var upperCaseOldValue = oldValue.toUpperCase();
    var currentIndex = upperCaseThis.indexOf(upperCaseOldValue);
    var lastIndex = 0;

    var result = ''
    while (currentIndex >= 0) {
        result += this.substring(lastIndex, currentIndex);
        result += newValue;
        lastIndex = currentIndex + oldValue.length;
        currentIndex = upperCaseThis.indexOf(upperCaseOldValue, lastIndex);
    } // end while
    result += this.substring(lastIndex);

    return result;
} // end function



String.prototype.startsWith = String.prototype.startsWith || function(str) {
    if (this == '' || !str) return false;
    var index = this.indexOf(str);
    return index == 0;
} // end function



String.prototype.trim = String.prototype.trim || function() {
    return this.replace(/^\s+|\s+$/g, '');
} // end function



String.prototype.trimLeft = String.prototype.trimLeft || function() {
    return this.replace(/^\s+/, '');
} // end function



String.prototype.trimRight = String.prototype.trimRight || function() {
    return this.replace(/\s+$/, '');
} // end function