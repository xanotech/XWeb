// Captures and handles hashchange events (as setup by the jquery.ba-hashchange.js
// library).  By default, the hashNavigator attempts to load pages / requests
// specified after the '#' in the url whenever it changes.  If the request is
// successful, the content is placed inside the tag with id = "Content".
var hashNavigator = {
    // Set this function handler to be called after the page successfully loads.
    // By default, it does nothing.
    afterHashchange: null,

    // Specifies the id of the tag to receive the data returned from the request.
    // By default, it is "Content".
    contentId: 'Content',

    // Specifies the hash value to be requested if the hash is ever empty or missing.
    // By default, it is "Home.html".
    defaultHash: 'Home.html'
} // end object



// Returns the hash (the text following the '#' or '#!' of the current URL).
// If no there is no hash, the defaultHash is returned.  The onHashchange
// method uses this method when calling loadHashPage.
hashNavigator.getHash = function() {
    var hash = window.location.hash;

    // Strip off the initial '#' if present
    if (hash.charAt(0) == '#')
        hash = hash.substring(1);

    // Strip off the '!' if present as well (this is to support Googlebot)
    if (hash.charAt(0) == '!')
        hash = hash.substring(1);

    // If a hash is not present, then use the defaultHash
    if (!hash)
        hash = hashNavigator.defaultHash;

    return hash;
} // end function



// By default, this method is called by onHashchange whenever the hash
// changes.  It requests whatever is listed in the hash and applies the result
// to the tag specified by contentId and calls afterHashchange if it is defined.
hashNavigator.loadHashPage = function(hash) {
    $.get(hash).done(function(data) {
        $('#' + hashNavigator.contentId).html(data);
    }).fail(function(xhr) {
        var text = xhr.responseText;
        var lowerText = text.toLowerCase();
        var bodyStart = lowerText.indexOf('<body');
        if (bodyStart > -1) {
            bodyStart = lowerText.indexOf('>', bodyStart + 1) + 1;
            var bodyEnd = lowerText.indexOf('</body');
            text = text.substring(bodyStart, bodyEnd);
        } // end if
        $('#' + hashNavigator.contentId).html(text);
    }).always(function(dataOrXhr, textStatus, xhrOrErrorThrown) {
        if (_(hashNavigator.afterHashchange).isFunction())
            hashNavigator.afterHashchange(dataOrXhr, textStatus, xhrOrErrorThrown);
    });
} // end function



// By default, this method is called whenever the value of the hash changes,
// parses out the content of the hash and calls loadHashPage.
hashNavigator.onHashchange = function() {
    hashNavigator.loadHashPage(hashNavigator.getHash());
} // end function



$(function() {
    // Register the hashchange event hander and trigger the event
    $(window).hashchange(hashNavigator.onHashchange);
    $(window).hashchange();
});