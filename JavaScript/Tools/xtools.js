// xtools JavaScript Library v1.3
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://opensource.org/licenses/MIT



Array.prototype.indexOf = Array.prototype.indexOf || function(searchElement, fromIndex) {
    for (var i = fromIndex || 0; i < this.length; i++)
        if (this[i] === searchElement)
            return i;
    return -1;
} // end function



Date.prototype.getDayName = function() {
    switch (this.getDay()) {
        case 0: return 'Sunday';
        case 1: return 'Monday';
        case 2: return 'Tuesday';
        case 3: return 'Wednesday';
        case 4: return 'Thursday';
        case 5: return 'Friday';
        case 6: return 'Saturday';
    } // end switch
} // end function



Date.prototype.getMonthName = function() {
    switch (this.getMonth()) {
        case 0: return 'January';
        case 1: return 'February';
        case 2: return 'March';
        case 3: return 'April';
        case 4: return 'May';
        case 5: return 'June';
        case 6: return 'July';
        case 7: return 'August';
        case 8: return 'September';
        case 9: return 'October';
        case 10: return 'November';
        case 11: return 'December';
    } // end switch
} // end function



Date.prototype.format = function(format) {
    var dateParts = {
        'd+': this.getDate(),
        'h+': this.getHours(),
        'm+': this.getMinutes(),
        's+': this.getSeconds(),
        'q+': Math.floor((this.getMonth() + 3) / 3),
        'S': this.getMilliseconds(),
        'MMMM+': '~XxxX~',
        'MMM': '~XxX~',
        'MM': this.getMonth() + 1,
        'M': this.getMonth() + 1,
        '~XxxX~': this.getMonthName(),
        '~XxX~': this.getMonthName().substring(0, 3)
    }

    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var part in dateParts)
        if (new RegExp("(" + part + ")").test(format)) {
            var value = dateParts[part];
            if (!(part.length > 2 || RegExp.$1.length == 1))
                value = ('00' + value).substr(('' + value).length);
            format = format.replace(RegExp.$1, value);
        } // end if
    return format;
} // end function



Date.prototype.is = function(date) {
    return this.getTime() == date.getTime();
} // end function



// Returns the name of a function as initially defined.
Function.prototype.getName = function() {
    if (this.name)
        return this.name;

    var funcString = this.toString();
    var start = funcString.indexOf('function') + 8;
    var end = funcString.indexOf('(');
    var name = funcString.substring(start, end).trim();
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
    return this.split(str).join('');
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