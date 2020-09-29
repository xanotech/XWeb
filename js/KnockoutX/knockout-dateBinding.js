ko.bindingHandlers.date = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var ref = ko.utils.getBindingRef(valueAccessor);
        element.$data = bindingContext.$data; // Used later for setting non-observable properties

        ko.utils.registerEventHandler(element, "change", function() {
            if (arguments.callee.isProcessingChange)
                return;

            arguments.callee.isProcessingChange = true;

            var date = null;
            var value = element.value;
            if (Date.parse(value)) {
                var date = new Date(value);

                // By default, JavaScript sets years to 2001 if a year isn't specified.
                // The following code checks date for year 2001 and the number of "parts"
                // specified.  A "part" is a consecutive series of alphanumeric characters
                // (no special characters).  A break in alphanumeric characters indicates
                // the end of a date part.  If less than 3 parts are specified in the
                // string, date is set to a new date with the current year.
                if (date && date.getFullYear() == 2001) {
                    var datePartCount = 0;
                    var separator = '';
                    var wasAlphanumeric = false;
                    for (var v = 0; v < value.length; v++) {
                        var charCode = value.charCodeAt(v);
                        var isAlphanumeric = value[v].isAlphanumeric();
                        if (isAlphanumeric && !wasAlphanumeric)
                            datePartCount++;
                        if (datePartCount == 1 && !isAlphanumeric)
                            separator += value[v];
                        wasAlphanumeric = isAlphanumeric;
                    } // end for

                    if (datePartCount < 3)
                        date = new Date(new Date().getFullYear(), date.getMonth(), date.getDate());
                } // end if

                value = date.format('M/d/yyyy');
            } else
                value = '';

            element.value = value;

            var accessedValue = valueAccessor();
            if (accessedValue && accessedValue.constructor == Function)
                accessedValue(date);
            else
                eval('this.$data.' + ref + ' = "' + (value ? value : 'null') + '"');

            arguments.callee.isProcessingChange = false;
        });
    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        var text = '';
        if (value && value.constructor == Date)
            text = value.format('M/d/yyyy');

        if ($(element).is("input"))
            $(element).val(text);
        else
            $(element).text(text);
    }
}
