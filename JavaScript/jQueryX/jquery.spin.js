"use strict";



// Maks a button "spin" (or stop spinning).  Acceptable arguments are
// jQuery "promises" (which are the type of object returned from jQuery's
// ajax, get, and post methods), a string representing the "src" of the
// image to be shown, or the string "stop".  The arguments can be provided
// in any order.  Any string not equal to "stop" is treated as the the value
// to be used for the spinner image src.  If one or more promises are passed,
// the spin effect will be cancelled when they complete.  If no promises
// are passed, the button will continue to spin until another call with
// "stop" is passed.  If no image src is specified, the default
// "Images/Spinner.gif" is used.  To modify the default,
// set jQuery.fn.spin.imgSrc.
jQuery.fn.spin = function() {
    var stop = false;
    var imgSrc = jQuery.fn.spin.imgSrc || 'Images/Spinner.gif';
    var promises = [];

    var args = arguments;
    if (args.length == 1 && Array.is(args[0]))
        args = args[0];
    jQuery.each(args, function(index, arg) {
        if ('stop'.is(arg))
            stop = true;
        else if (String.is(arg))
            imgSrc = arg;
        else if (Object.isPromise(arg))
            promises.push(arg);
    });

    this.find("button").each(function(index, button) {
        var $button = jQuery(button);
        if (stop) {
            if (button.hasAttribute('data-jQuery-spin-originalDisabled')) {
                button.disabled = button.getAttribute('data-jQuery-spin-originalDisabled') == 'true';
                button.removeAttribute('data-jQuery-spin-originalDisabled');
            } // end if

            if (button.hasAttribute('data-jQuery-spin-originalHtml')) {
                button.innerHTML = button.getAttribute('data-jQuery-spin-originalHtml');
                button.removeAttribute('data-jQuery-spin-originalHtml');
            } // end if

            if (button.hasAttribute('data-jQuery-spin-originalWidth')) {
                button.style.width = button.getAttribute('data-jQuery-spin-originalWidth');
                button.removeAttribute('data-jQuery-spin-originalWidth');
            } // end if

            return;
        } // end if

        button.setAttribute('data-jQuery-spin-originalDisabled', button.disabled ? 'true' : 'false');
        button.setAttribute('data-jQuery-spin-originalHtml', button.innerHTML);
        button.setAttribute('data-jQuery-spin-originalWidth', button.style.width);

        $button.width($button.width());
        button.innerHTML = '<img src="' + imgSrc  + '">';
        button.disabled = true;
    });

    var jq = this;
    if (!stop && promises.length)
        jQuery.when.apply(jQuery, promises).done(function() {
            jq.spin('stop');
        //}).fail(function() {
        //    jq.spin('stop');
        });

    return this;
} // end function