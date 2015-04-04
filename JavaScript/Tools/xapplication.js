// xapplication JavaScript Library v1.1
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://opensource.org/licenses/MIT



function XApplication() {

    var application = this;



    application.afterHashchange = function() {
        if (typeof hashNavigator == 'undefined')
            return;

        var hash = hashNavigator.getHash();
        application.pageQuery = XApplication.getQuery(hash);
        hash = XApplication.getBaseUrl(hash);
        if (!hash.toUpperCase().endsWith('.HTML'))
            return;

        application.page = XApplication.createPageObject(hash);

        // If page.init exists, then set initFunc to reference it.  Or if
        // page.init isn't defined look for a "free floating" init and set
        // initFunc to that.  Then check to see if jquery.include is present.
        // If it is present, call it passing initFunc as a callback.
        // If it doesn't exist, just call initFunc (if it is set).
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
            if (!init.hash)
                init.hash = hash;
            if (init.hash == hash)
                initFunc = init;
        } // end if-else
        var $content = jQuery('#' + hashNavigator.contentId);
        if (typeof $content.include == 'function')
            $content.include(initFunc);
        else if (initFunc)
            initFunc();
    } // end function



    application.alert = function(html, alertClass) {
        if (typeof jQuery().emulateTransitionEnd == 'function') {
            if (!alertClass)
                alertClass = 'alert-success';

            var alertHtml = '<div class="alert alert-dismissable ' + alertClass + '">' +
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' +
                html + '</div>';
            jQuery('#' + hashNavigator.contentId).prepend(alertHtml);
        } else {
            html = html.split('<br>').join('\n');
            html = html.split('<BR>').join('\n');
            html = html.replace(/(<([^>]+)>)/ig, '');
            alert(html);
        } // end if-else
    } // end function



    application.defaultInit = function() {
        window.onerror = application.handleJavaScriptError;

        hashNavigator.afterHashchange = application.afterHashchange;

        $(document).ajaxComplete(application.handleAjaxCompletion);
        $(document).ajaxError(application.handleAjaxError);
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
            stack = 'Stack Trace...<br>' + stack;
        application.alert([message, stack].join('<br><br>'), 'alert-error');
    } // end method



    application.handleJavaScriptError = function(message, file, line, column, errorObj) {
        if (message.indexOf('Uncaught ') == 0)
            message = message.substring(9);

        var stack;
        if (errorObj && errorObj.stack)
            stack = errorObj.stack;
        if (!stack) {
            stack = file + ' (line ' + line + ')';
            var stackArray = [];
            var func = arguments.callee.caller;
            while (func) {
                stackArray.push(func.getName() || '(anonymous)');
                func = func.caller;
            } // end while
            stack += '\n' + stackArray.join('\n');
        } // end if

        application.handleError(message, stack);
    } // end function



    application.init = function() {
    } // end function



    if (!XApplication.applications)
        XApplication.applications = [];
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
        isDefined = eval('typeof ' + pageObjName + ';') != 'undefined';
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



$(function() {  //This function runs only on the initial page load
    jQuery.each(XApplication.applications, function(index, app) {
        app.defaultInit();
        app.init();
    });
});
