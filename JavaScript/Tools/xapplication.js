function XApplication() {

    this.afterHashchange = function() {
        if (typeof hashNavigator == 'undefined')
            return;

        var hash = hashNavigator.getHash();
        var queryIndex = hash.indexOf('?');
        this.pageQuery = null;
        if (queryIndex > -1) {
            pageQuery = hash.substring(queryIndex + 1);
            hash = hash.substring(0, queryIndex);
        } // end if
        if (!hash.toUpperCase().endsWith('.HTML'))
            return;

        var pageObjName = hash.substring(0, hash.length - 5) + 'Page';
        try {
            this.page = eval('new ' + pageObjName + '();');
        } catch (e) {
            // Swallow errors only when the message indicates that the object type specified
            // by pageObjName is undefined (which is acceptable in this case).  Throw all other errors.
            var msg = XApplication.getUndefinedMessage();
            msg = msg.split('@').join(pageObjName);
            if (e.message != msg)
                throw e;
            this.page = null;
        } // end try-catch

        // If page.init exists, then set initFunc to reference it.  Or if page.init isn't defined
        // look for a free floating init and set initFunc to that.  Then check to see if
        // jquery.include is present.  If it is present, call it passing initFunc as a callback.
        // If it doesn't exist, just call initFunc (if it is set).
        var initFunc;
        if (this.page && typeof page.init == 'function')
            initFunc = this.page.init;
        else if (typeof init == 'function') {
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



    this.alert = function(html, alertClass) {
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



    this.defaultInit = function() {
        window.onerror = this.handleJavaScriptError;

        hashNavigator.afterHashchange = this.afterHashchange;

        $(document).ajaxComplete(this.handleAjaxCompletion);
        $(document).ajaxError(this.handleAjaxError);
    } // end method



    this.handleAjaxCompletion = function(event, request, settings, error) {
    } // end function



    this.handleAjaxError = function(event, request, settings, error) {
        if (request.ignoreErrorHandler || !settings.async ||
            settings.url.substring(settings.url.length - 5).toUpperCase() == '.HTML')
            return;

        var exception;
        try {
            exception = JSON.parse(request.responseText);
            this.handleError(exception.message, exception.stack);
        } catch (e) {
            this.handleError(request.responseText);
        }  // end try-catch
    } // end function



    this.handleError = function(message, stack) {
        this.alert(message + '<br><br>Stack Trace...<br>' + stack, 'alert-error');
    } // end method



    this.handleJavaScriptError = function(message, file, line, column, errorObj) {
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

        arguments.callee.application.handleError(message, stack);
    } // end function
    this.handleJavaScriptError.application = this;



    this.init = function() {
    } // end function



    if (!XApplication.applications)
        XApplication.applications = [];
    XApplication.applications.push(this);

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
