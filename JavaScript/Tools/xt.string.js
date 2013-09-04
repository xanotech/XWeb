String.prototype.contains = String.prototype.contains || function(str) {
    return this.indexOf(str) != -1;
} // end function



String.prototype.endsWith = String.prototype.endsWith || function(str) {
    if (this == '' || !str)
        return false;

    var index = this.lastIndexOf(str);
    return index == this.length - str.length;
} // end function



String.prototype.is = function(str) {
    if (!_(str).isString())
        str = str.toString();
    return this.toUpperCase() == str.toUpperCase();
} // end function



String.prototype.startsWith = String.prototype.contains || function(str) {
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
