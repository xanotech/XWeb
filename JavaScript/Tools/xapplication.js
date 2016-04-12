// xapplication JavaScript Library v1.2
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://opensource.org/licenses/MIT

"use strict";



function XApplication() {
    var application = this;



    application.alert = function(html, alertClass, fadeAfter) {
        if (typeof hashNavigator == 'undefined') {
            // Not using hashNavigator, just use regular alert.
            html = html.split('<br>').join('\n');
            html = html.split('<BR>').join('\n');
            html = html.replace(/(<([^>]+)>)/ig, '');
            alert(html);
        } if (typeof jQuery.fn.emulateTransitionEnd == 'function')
            application.alert.bootstrap3(html, alertClass, fadeAfter);
        else if (typeof jQuery.fn.popover == 'function')
            application.alert.bootstrap2(html, alertClass, fadeAfter);
        else
            application.alert.custom(html, alertClass, fadeAfter);
    } // end function



    application.alert.bootstrap2 = function(html, alertClass, fadeAfter) {
        if (['error', 'info', 'success'].indexOf(alertClass) > -1)
            alertClass = 'alert-' + alertClass;
        var glyphiconMap = {
            'alert-error': 'minus-sign',
            'alert-info': 'info-sign',
            'alert-success': 'ok-sign'
        };

        var alertHtml = '<div class="alert';
        if (alertClass)
            alertHtml += ' ' + alertClass;
        alertHtml += '"><button type="button" class="close" data-dismiss="alert">x</button>';
        if (glyphiconMap[alertClass])
            alertHtml += '<i class="icon-' + glyphiconMap[alertClass] + '"></i> ';
        alertHtml += html + '</div>';
        var $alert = jQuery(alertHtml).prependTo('#' + hashNavigator.contentId);
        if (fadeAfter && fadeAfter.constructor == Number)
            $alert.delay(fadeAfter).fadeOut(1000);
    } // end function



    application.alert.bootstrap3 = function(html, alertClass, fadeAfter) {
        if (!alertClass)
            alertClass = 'info';
        if (['danger', 'info', 'success', 'warning'].indexOf(alertClass) > -1)
            alertClass = 'alert-' + alertClass;
        var glyphiconMap = {
            'alert-danger': 'minus-sign',
            'alert-info': 'info-sign',
            'alert-success': 'ok-sign',
            'alert-warning': 'exclamation-sign'
        };

        var alertHtml = '<div class="alert alert-dismissable ' + alertClass + '">' +
            '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>';
        if (glyphiconMap[alertClass])
            alertHtml += '<span class="glyphicon glyphicon-' + glyphiconMap[alertClass] + '"></span> ';
        alertHtml += html + '</div>';
        var $alert = jQuery(alertHtml).prependTo('#' + hashNavigator.contentId);
        if (fadeAfter && fadeAfter.constructor == Number)
            $alert.delay(fadeAfter).fadeOut(1000);
    } // end function



    application.alert.custom = function(html, alertClass, fadeAfter) {
        alertClass = alertClass || 'alert';
        var alertHtml = '<div class="' + alertClass + '">';
        alertHtml += '<span style="float: right;">';
        alertHtml += '<a href="#" onclick="$(this).parent().parent().remove(); return false;">X</a>'
        alertHtml += '</span>';
        alertHtml += html + '</div>';
        var $alert = jQuery(alertHtml).prependTo('#' + hashNavigator.contentId);
        if (fadeAfter && fadeAfter.constructor == Number)
            $alert.delay(fadeAfter).fadeOut(1000);
    } // end function



    application.defaultInit = function() {
        window.onerror = application.handleJavaScriptError;

        if (typeof hashNavigator != 'undefined')
            hashNavigator.onhashpageload = application.initPage;

        jQuery(document).ajaxComplete(application.handleAjaxCompletion);
        jQuery(document).ajaxError(application.handleAjaxError);
    } // end method



    application.dispatchPageinit = function(hash) {
        var $window = jQuery(window);

        // If onpageinit is set and hasn't already been attached, register it
        // as a handler for the content's pageinit event.
        if (application.onpageinit && !application.onpageinit._attached) {
            $window.on('pageinit', application.onpageinit);
            application.onpageinit._attached = true;
        } // end if

        // Create and trigger the hashpageload event on the content element.
        var event = jQuery.Event('pageinit');
        event.hash = hash;
        $window.trigger(event);
    } // end method



    application.handleAjaxCompletion = function(event, request, settings, error) {
    } // end function



    application.handleAjaxError = function(event, request, settings, error) {
        if (request.status >= 200 && request.status < 300)
            return;

        if (request.ignoreErrorHandler || !settings.async ||
            XApplication.getBaseUrl(settings.url).toUpperCase().endsWith('.HTML'))
            return;

        var exception;
        try {
            exception = JSON.parse(request.responseText);
            application.handleError(exception.message, exception.stack);
        } catch (e) {
            application.handleError(request.responseText);
        }  // end try-catch
    } // end function



    application.handleError = function(message, stack) {
        message = (message || '').split('\n').join('<br>');
        stack = (stack || '').split('\n').join('<br>');
        if (stack)
            stack = '<a class="alert-link" href="#" onclick="jQuery(this).next().toggle(); return false;">' +
                'Stack Trace</a><div style="display: none;">' + stack + '</div>';
        application.alert([message, stack].join('<br><br>'), 'danger');
    } // end method



    application.handleJavaScriptError = function(message, file, line, column, errorObj) {
        if (message.indexOf('Uncaught ') == 0)
            message = message.substring(9);

        var stack;
        if (errorObj && errorObj.stack)
            stack = errorObj.stack;
        if (!stack) {
            stack = file + ' (line ' + line + ')';

            // *** Removing since callee & caller are deprecated. ***
            //var stackArray = [];
            //var func = arguments.callee.caller;
            //while (func) {
            //    stackArray.push(func.getName() || '(anonymous)');
            //    func = func.caller;
            //} // end while
            //stack += '\n' + stackArray.join('\n');
        } // end if

        application.handleError(message, stack);
    } // end function



    application.init = function() {
    } // end function



    application.initPage = function() {
        if (typeof hashNavigator == 'undefined')
            return;

        // Reset page and pageQuery
        application.page = null;
        application.pageQuery = null;

        var hash = hashNavigator.getHash();
        application.pageQuery = XApplication.getQuery(hash);
        hash = XApplication.getBaseUrl(hash);

        // If the hash (now with any "pageQuery" removed) is an HTML file,
        // then attempt to construct a page object of the same name and
        // assign it to application.page.
        if (hash.toUpperCase().endsWith('.HTML'))
            application.page = XApplication.createPageObject(hash);

        // If page.init exists, then set initFunc to reference it.  Or if
        // page.init isn't defined look for a "free floating" init and set
        // initFunc to that.
        var initFunc;
        if (application.page && typeof application.page.init == 'function')
            initFunc = application.page.init;
        else if (typeof init == 'function') {
            // Once an init method is loaded by a page, it does not go away
            // when another page is loaded.  Since we only want to call
            // init with its page, the following logic associates
            // the init function with the hash that spawned it.
            // and then checks the init's hash with the current hash
            // setting initFunc (which is what is called) only if the
            // hash values match.
            init.hash = init.hash || hash;
            if (init.hash == hash)
                initFunc = init;
        } // end if-else

        // Define callInit, which calls initFunc (if it is definied)
        // and then dispatches the pageinit event.
        function callInit() {
            if (initFunc)
                initFunc();
            application.dispatchPageinit(hash);
        } // end function

        // Check to see if jQuery.include is present.  If it is, call it passing
        // callInit as a callback.  Otherwise, just call callInit.
        var $content = jQuery('#' + hashNavigator.contentId);
        if (typeof $content.include == 'function')
            $content.include(callInit);
        else
            callInit();
    } // end function



    // Set this event handler to be called after the page is loaded and initialized.
    // By default, it does nothing.  As an alternative, add handlers listening
    // for the "pageinit" event via jQuery.on, addEventListener, etc.
    application.onpageinit = null;



    XApplication.applications = XApplication.applications || [];
    XApplication.applications.push(application);
} // end function



XApplication.createPageObject = function(hash) {
    hash = hash.split('/').join('.');
    var pageObjName = hash.substring(0, hash.length - 5) + 'Page';
    var pageObjParts = pageObjName.split('.');

    var isDefined = true;
    pageObjName = '';
    jQuery.each(pageObjParts, function(index, part) {
        if (pageObjName)
            pageObjName += '.';
        pageObjName += part;
        try {
            isDefined = eval('typeof ' + pageObjName + ';') != 'undefined';
        } catch (e) {
            isDefined = false;
        } // end try-catch
        return isDefined;
    });

    var pageObj = null;
    if (isDefined && eval('typeof ' + pageObjName + ';') == 'function')
        pageObj = eval('new ' + pageObjName + '();');
    return pageObj;
} // end function



XApplication.getBaseUrl = function(url) {
    var queryIndex = url.indexOf('?');
    if (queryIndex > -1)
        url = url.substring(0, queryIndex);
    return url;
} // end function



XApplication.getQuery = function(url) {
    var query = null;
    var queryIndex = url.indexOf('?');
    if (queryIndex > -1)
        query = url.substring(queryIndex + 1);
    return query;
} // end function



XApplication.getUndefinedMessage = function() {
    if (XApplication.getUndefinedMessage.message)
        return XApplication.getUndefinedMessage.message;

    // The following try is meant to fail with an error message saying some crap isn't defined.
    // When it does, we'll know what the error message looks like and can use that to specifically
    // identify undefined errors.
    var message;
    while (!message) {
        var randomNum = Math.floor(Math.random() * 9000) + 1000; // a 4-digit number
        var undefinedThing = 'x' + randomNum;
        try {
            eval(undefinedThing);
        } catch (e) {
            message = e.message.split(undefinedThing).join('@')
        } // end try-catch
    } // end while
    XApplication.getUndefinedMessage.message = message;
    return message;
} // end method



XApplication.wrap = function(func) {
    if (func._wrappedFunc)
        return func._wrappedFunc;

    func._wrappedFunc = function() {
        try {
            func.apply(this, arguments);
        } catch (e) {
            error = e;
            console.log(e.message, "from", e.stack);
            throw e;
        } // end try-catch
    } // end function
    return func._wrappedFunc;
} // end method



jQuery(function() {
    jQuery.each(XApplication.applications, function(index, app) {
        app.defaultInit();
        app.init();
    });
});
