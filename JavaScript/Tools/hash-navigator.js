// hashNavigator JavaScript Library v1.2
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://opensource.org/licenses/MIT

"use strict";



// Captures and handles hashchange events (as setup by the jquery.ba-hashchange.js
// library).  By default, the hashNavigator attempts to load pages / requests
// specified after the '#' in the url whenever it changes.  If the request is
// successful, the content is placed inside the tag with id = "content".
var hashNavigator = {
    // Specifies the id of the tag to receive the data returned from the request.
    // By default, it is "content".
    contentId: 'content',

    // Specifies the hash value to be requested if the hash is ever empty or missing.
    // By default, it is "Home.html".
    defaultHash: 'Home.html',

    // Sets whether caching is enabled when making requests to load a page.
    // The hashNavigator itself does no caching but if isCachingEnabled is set
    // to false, hashNavigator will attempt to bypass any caching that may be in effect.
    isCachingEnabled: true,

    // Set this event handler to be called after the page successfully loads.
    // By default, it does nothing.  As an alternative, add handlers listening
    // for the "hashpageload" event via jQuery.on, addEventListener, etc.
    onhashpageload: null
} // end object



// Dispatches a "hashpageload" event to the content element (as designated by contentId).
// Any handler set via the onhashpageload property will be called along with any
// handlers listening to the "hashpageload" event.
hashNavigator.dispatchHashpageload = function(data, textStatus, request) {
    var $window = jQuery(window);

    // If onhashpageload is set and hasn't already been added, register it
    // as a handler for the content's hashpageload event.
    if (hashNavigator.onhashpageload && !hashNavigator.onhashpageload._attached) {
        $window.on('hashpageload', hashNavigator.onhashpageload);
        hashNavigator.onhashpageload._attached = true;
    } // end if

    // Create and trigger the hashpageload event on the content element.
    var event = jQuery.Event('hashpageload');
    event.data = data;
    event.textStatus = textStatus;
    event.request = request;
    $window.trigger(event);
} // end function



// Returns the hash (the text following the '#' or '#!' of the current URL).
// If no there is no hash, the defaultHash is returned.  The hashchange event handler
// uses the results from getHash and passes it to loadHashPage.
hashNavigator.getHash = function() {
    var hash = window.location.hash;

    // Strip off the initial '#' if present
    if (hash.charAt(0) == '#')
        hash = hash.substring(1);

    // Strip off the '!' if present as well (this is to support Googlebot)
    if (hash.charAt(0) == '!')
        hash = hash.substring(1);

    // If a hash is not present, then use the defaultHash
    hash = hash || hashNavigator.defaultHash;

    return hash;
} // end function



// By default, this method is called whenever the hash changes.  It loads (via
// AJAX request) whatever is listed in the hash and applies the result to
// the tag specified by contentId.  It then dispatches a "hashpageload"
// event on the contentId element.
hashNavigator.loadHashPage = function(hash) {
    jQuery.ajax({ url: hash, cache: this.isCachingEnabled }).done(function(data) {
        jQuery('#' + hashNavigator.contentId).html(data);
    }).fail(function(request) {
        var text = request.responseText;
        var lowerText = text.toLowerCase();
        var bodyStart = lowerText.indexOf('<body');
        if (bodyStart > -1) {
            bodyStart = lowerText.indexOf('>', bodyStart + 1) + 1;
            var bodyEnd = lowerText.indexOf('</body');
            text = text.substring(bodyStart, bodyEnd);
        } // end if
        jQuery('#' + hashNavigator.contentId).html(text);
    }).always(function(data, textStatus, request) {
        // If data.done and data.promise are functions, that means that
        // data and request need to be swapped.  This can happen in various
        // scenarios depending on whether or not the ajax call succeeded
        // or failed and the version of jQuery present.
        if (typeof data.done == 'function' &&
            typeof data.promise == 'function') {
            var temp = data; // request (disguised as data) moved to temp
            var data = request; // data (disguised as request) moved to data
            var request = temp; // request (stored in temp) moved to request
        } // end if

        hashNavigator.dispatchHashpageload(data, textStatus, request);
    });
} // end function



hashNavigator.monitorHash = function() {
    // Check if hashchange event is supported natively.  If so,
    // clear the monitoryHash.interval and return.  Your work here is done.
    if ('onhashchange' in window) {
        window.clearInterval(hashNavigator.monitorHash.interval);
        return;
    } // end if

    var hash = window.location.hash;
    if (hash == hashNavigator.monitorHash.lastHash)
        return;

    hashNavigator.monitorHash.lastHash = hash;
    $window.trigger('hashchange');
} // end function



jQuery(function() {
    // Register the hashchange event hander and trigger the event
    var $window = jQuery(window);
    $window.on('hashchange', function() {
        hashNavigator.loadHashPage(hashNavigator.getHash());
    });
    $window.trigger('hashchange');

    hashNavigator.monitorHash.lastHash = window.location.hash;
    hashNavigator.monitorHash.interval = window.setInterval(hashNavigator.monitorHash, 200);
});