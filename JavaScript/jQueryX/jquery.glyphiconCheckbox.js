"use strict";



// Turns an A tag into a glyphicon checkbox.
jQuery.fn.glyphiconCheckbox = function() {
    var classAttribute = '';
    var html = ' &nbsp; &nbsp; ';

    if (arguments.length == 1)
        html = arguments[0];
    if (arguments.length > 1) {
        classAttribute = arguments[0];
        html = arguments[1];
    } // end if

    html = '<button' + classAttribute + '>' + html + '</button>';

    $selection.each(function(index, button) {
        var $button = jQuery(button);
        if (!$button.is("button"))
            return;

        // If onclick exists, get the definition and remove it from button.
        var onclick;
        if (button.hasAttribute('onclick')) {
            onclick = button.getAttribute('onclick');
            button.removeAttribute('onclick');
        } // end if

        // Gather up all click handlers attached to button into clickHandlers
        // and remove them from button.
        var clickHandlers = [];
        var events = jQuery._data(button, 'events');
        if (events && events.click)
            jQuery.each(events.click, function(index, eventObj) {
                clickHandlers.push(eventObj.handler);
                $button.unbind('click', eventObj.handler);
            });

        // Setup the popover functionality.  Trigger needs to be manual
        // because along with whatever events are attached to button,
        // safe button needs to close the popover and bootstrap has
        // made it so you either let bootstrap control everything
        // or you do everything yourself.  If you hide the popover
        // manually without setting the trigger to manual, weirdness
        // happens (which is why there is popover('show' / 'hide')
        // code in the $button click handler).
        $button.popover({
            content: html,
            html: true,
            trigger: 'manual'
        }).click(function() {
            // If aria-describedby is present, the popover is visible
            // and needs to be hidden.  If it isn't present, the popover
            // isn't visible and needs to be shown.
            if ($button.is("[aria-describedby]"))
                $button.popover('hide');
            else
                $button.popover('show');

            var $safeButton = $button.next().find("button");

            // Apply onclick attribute if present.
            if (onclick)
                $safeButton.attr('onclick', onclick);

            // Apply clickHandlers if any.
            if (clickHandlers.length)
                jQuery.each(clickHandlers, function(index, handler) {
                    $safeButton.click(handler);
                });

            $safeButton.click(function() { $button.popover('hide'); });
        });
    });

    return this;
} // end function