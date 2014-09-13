// Performs a c-style #include ajax load of any tags containing a data-include
// attribute.  The value of the attribute should be the url of the content to
// be loaded.  The load is recursive such that any content loaded that contains
// tags with data-include attributes will also be processed.  After all
// includes are complete, the callback (which is optional) will be executed.
jQuery.fn.include = function(callback) {
    if (callback && typeof callback != 'function')
        throw new Error('Error in include: callback argument is not a function');

    // The _dataIncludeElements is an array containing all elements with data-include
    // attribute.  As elements are processed, the are added to this array.
    // Once all the elements are complete, the callback is executed.
    if (callback && !callback._dataIncludeElements)
        callback._dataIncludeElements = [];

    var $includes = this.find("[data-include]");
    $includes.each(function() {
        var $this = $(this);

        if (callback)
            callback._dataIncludeElements.push($this);

        var url = $this.attr('data-include');
        $this.load(url, null, function(response, status, request) {
            var $this = $(this);

            // If a callback is defined, mark the element as complete using a
            // data-include-complete attribute (we only care about completed
            // elements if a callback is specified)
            if (callback)
                $this.attr('data-include-complete', 'true');

            if (status == 'error')
                $this.html(request.status + ' ' + request.statusText + ' (url = "' + url + '")');

            // This is a recursive call which will add more elements to _dataIncludeElements
            // if the content loaded in the .load call has an data-include elements.
            $this.include(callback);

            // Now that this processing for this element is complete, check the total
            // number of elements that are complete.  If that total matches total number
            // of elements in _dataIncludeElements array, then all elements are loaded:
            // clean up the data-include-complete attributes, delete the _dataIncludeElements
            // array, and execute the callback.
            if (callback) {
                var totalComplete = 0;
                jQuery.each(callback._dataIncludeElements, function(index, element) {
                    if (element.attr('data-include-complete') == 'true')
                        totalComplete++;
                });

                if (callback._dataIncludeElements.length == totalComplete) {
                    jQuery.each(callback._dataIncludeElements, function(index, element) {
                        element.removeAttr('data-include-complete');
                    });
                    delete callback._dataIncludeElements;
                    callback();
                } // end if
            } // end if
        });
    });

    if (callback && callback._dataIncludeElements.length == 0)
        callback();

    return this;
} // end function