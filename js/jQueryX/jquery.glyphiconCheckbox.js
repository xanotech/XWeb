"use strict";



// Turns regular checkboxes (input[type='checkbox']) into a glyphicon checkbox.
jQuery.fn.glyphiconCheckbox = function() {
    var gcFunc = jQuery.fn.glyphiconCheckbox; // Shorthand reference to this plugin function
    gcFunc.checkboxes = gcFunc.checkboxes || []; // A list of glyphiconified checkboxes

    this.each(function(index, checkbox) {
        var $checkbox = jQuery(checkbox);

        // If the element is not a checkbox or already exists in
        // gcFunc.checkboxes, then "return" (which moves to the next checkbox)
        if (!$checkbox.is("input[type='checkbox']") ||
            gcFunc.checkboxes.indexOf(checkbox) > -1)
            return;

        $checkbox.hide();
        $checkbox.after('<span class="glyphicon ' +
            gcFunc.getGlyphiconClass(checkbox.checked) + '"></span>');
        if (!$checkbox.parent().is("label"))
            $checkbox.next().click(function() {
                $checkbox.click();
                gcFunc.syncGlyphicon(checkbox);
            });
        $checkbox.change(function() {
            gcFunc.syncGlyphicon(checkbox);
        })
        gcFunc.checkboxes.push(checkbox);
    });

    if (!gcFunc.interval)
        gcFunc.interval = window.setInterval(gcFunc.monitorCheckboxes, 200);

    return this;
} // end function



jQuery.fn.glyphiconCheckbox.getGlyphiconClass = function(checked) {
    if (checked)
        return 'glyphicon-check';
    else
        return 'glyphicon-unchecked';
} // end function



jQuery.fn.glyphiconCheckbox.monitorCheckboxes = function() {
    var gcFunc = jQuery.fn.glyphiconCheckbox; // Shorthand reference to this plugin function

    // Process the checkboxes in reverse order
    // (because they might) need to be removed.
    for (var c = gcFunc.checkboxes.length - 1; c >= 0; c--) {
        var checkbox = gcFunc.checkboxes[c];
        if (document.body.contains(checkbox))
            gcFunc.syncGlyphicon(checkbox);
        else
            gcFunc.checkboxes.splice(c, 1);
    } // end for
} // end function



jQuery.fn.glyphiconCheckbox.syncGlyphicon = function(checkbox) {
    var gcFunc = jQuery.fn.glyphiconCheckbox; // Shorthand reference to this plugin function

    var $glyphicon = $(checkbox).next();
    var classNeeded = gcFunc.getGlyphiconClass(checkbox.checked);
    var classForbidden = gcFunc.getGlyphiconClass(!checkbox.checked);
    if (!$glyphicon.hasClass(classNeeded))
        $glyphicon.addClass(classNeeded);
    if ($glyphicon.hasClass(classForbidden))
        $glyphicon.removeClass(classForbidden);
} // end function