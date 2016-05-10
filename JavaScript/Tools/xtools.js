// xtools JavaScript Library v1.4
//
// Copyright 2016 Xanotech LLC
// Released under the MIT license
// http://opensource.org/licenses/MIT

"use strict";



// Extends the prototype of the type passed by safely adding a new
// (non-enumerable) method with the name and function definition passed.
Object.extend = function(type, name, func) {
    if (!type || !type.prototype)
        throw new Error('Error in Object.extend: type argument is not a Function');
    if (!name || name.constructor != String)
        throw new Error('Error in Object.extend: name argument is not a String');
    if (!func || func.constructor != Function)
        throw new Error('Error in Object.extend: func argument is not a Function');

    if (type.prototype[name])
        return;

    Object.defineProperty(type.prototype, name, { value: func });
} // end function



Object.extend(Array, 'indexOf', function(searchElement, fromIndex) {
    for (var i = fromIndex || 0; i < this.length; i++)
        if (this[i] === searchElement)
            return i;
    return -1;
});




Object.extend(Array, 'pushArray', function() {
    var toPush = this.concat.apply([], arguments);
    for (var i = 0, len = toPush.length; i < len; i++)
        this.push(toPush[i]);
});



Object.extend(Date, 'getDayName', function() {
    switch (this.getDay()) {
        case 0: return 'Sunday';
        case 1: return 'Monday';
        case 2: return 'Tuesday';
        case 3: return 'Wednesday';
        case 4: return 'Thursday';
        case 5: return 'Friday';
        case 6: return 'Saturday';
    } // end switch
});



Object.extend(Date, 'getMonthName', function() {
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
});



Object.extend(Date, 'format', function(format) {
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
});



Object.extend(Date, 'is', function(date) {
    return this.getTime() == date.getTime();
});



Object.extend(Function, 'getName', function() {
    if (this.name)
        return this.name;

    var funcString = this.toString();
    var start = funcString.indexOf('function') + 8;
    var end = funcString.indexOf('(');
    var name = funcString.substring(start, end).trim();
    return name;
});



// Checks to see if the argument is of the calling type.
// String.is('abc'); // returns true
// Number.is(5); // returns true
// Function.is(String); // returns true since String is a "function"
// Date.is('1/1/2000'); // returns false since the arguement is a String
Object.extend(Function, 'is', function(obj) {
    return obj != undefined && obj != null &&
        (obj.constructor == this || obj instanceof this);
});



Object.extend(Object, 'safe', function(accessor) {
    if (!accessor || !String.is(accessor))
        return;

    var lines = accessor.split('.');
    var obj = this;
    var result;
    for (var l in lines) {
        var line = lines[l];
        if (line.indexOf('(') > -1 &&
            typeof obj[line.split('(')[0].trim()] != 'function')
            return null;

        var evalStr = '';
        if (obj)
            evalStr += 'obj.';
        evalStr += line;
        result = eval(evalStr);
        if (result == null)
            return null;
        obj = result;
    } // end for

    return result || null;
});



Object.extend(String, 'contains', function(str) {
    return this.indexOf(str) != -1;
});



Object.extend(String, 'endsWith', function(str) {
    if (this == '' || !str)
        return false;

    var index = this.lastIndexOf(str);
    return index == this.length - str.length;
});



Object.extend(String, 'is', function(str) {
    if (typeof str == 'undefined' || !str.toString)
        return false;

    if (!String.is(str))
        str = str.toString();
    return this.toUpperCase() == str.toUpperCase();
});



Object.extend(String, 'remove', function(str) {
    return this.split(str).join('');
});



Object.extend(String, 'removeIgnoreCase', function(str) {
    return this.replaceIgnoreCase(str, '');
});



Object.extend(String, 'replaceIgnoreCase', function(oldValue, newValue) {
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
});



Object.extend(String, 'startsWith', function(str) {
    if (this == '' || !str) return false;
    var index = this.indexOf(str);
    return index == 0;
});



Object.extend(String, 'trim', function() {
    return this.replace(/^\s+|\s+$/g, '');
});



Object.extend(String, 'trimLeft', function() {
    return this.replace(/^\s+/, '');
});



Object.extend(String, 'trimRight', function() {
    return this.replace(/\s+$/, '');
});



Object.isBasic = function(obj) {
    return typeof obj == 'undefined' || obj == null ||
        obj.constructor == String || obj.constructor == Number ||
        obj.constructor == Boolean || obj.constructor == Date;
} // end function



Object.isPromise = function(obj) {
    // Inspired by http://stackoverflow.com/questions/13075592/how-can-i-tell-if-an-object-is-a-jquery-promise-deferred/13075985#13075985.
    // Thanks, Jeremy Banks!
    if (!jQuery || !obj || !Function.is(obj.then))
        return false;

    var promiseThenSrc = String(jQuery.Deferred().then);
    var objThenSrc = String(obj.then);
    return promiseThenSrc == objThenSrc;
} // end function