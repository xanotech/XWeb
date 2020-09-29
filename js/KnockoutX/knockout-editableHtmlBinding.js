ko.bindingHandlers.editableHtml = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        ko.utils.updateEditableHtmlProperties.elements = ko.utils.updateEditableHtmlProperties.elements || [];
        ko.utils.updateEditableHtmlProperties.elements.push(element);

        ko.utils.updateEditableHtmlProperties.valueAccessors = ko.utils.updateEditableHtmlProperties.valueAccessors || [];
        ko.utils.updateEditableHtmlProperties.valueAccessors.push(valueAccessor);
        
        var ref = ko.utils.getBindingRef(valueAccessor);
        var accessedValue = valueAccessor();
        element.innerHTML = ko.utils.unwrapObservable(accessedValue) || ''; // Set the initial HTML value (use '' if null)
        element.$data = bindingContext.$data; // Attach $data to element (used later when updating referenced property)

        ko.utils.registerEventHandler(element, "blur", function() {
            if (arguments.callee.isProcessingChange)
                return;

            arguments.callee.isProcessingChange = true;
            if (accessedValue && accessedValue.constructor == Function)
                accessedValue(element.innerHTML);
            else
                eval('this.$data.' + ref + ' = ' + JSON.stringify(element.innerHTML));
            arguments.callee.isProcessingChange = false;
        });
    }
};



// This method is used to update properties bound using editableHtml.
// Call this method whenever the content of an editable element has
// been modified outside of user input.  This method is necessary
// because editableHtml applies to elements like DIV and SPAN or
// other non-input controls which do not have a "change" to detect
// when their content changes.  Therefore, whenever you programatically
// modify the content, call this method to make sure the new content
// is applied to the bound property.
ko.utils.updateEditableHtmlProperties = function() {
    for (var i = 0; i < ko.utils.updateEditableHtmlProperties.elements.length; i++) {
        var element = ko.utils.updateEditableHtmlProperties.elements[i];
        var valueAccessor = ko.utils.updateEditableHtmlProperties.valueAccessors[i]

        var ref = ko.utils.getBindingRef(valueAccessor);
        var accessedValue = valueAccessor();
        if (accessedValue && accessedValue.constructor == Function)
            accessedValue(element.innerHTML);
        else
            eval('element.$data.' + ref + ' = ' + JSON.stringify(element.innerHTML));
    } // end for
} // end function