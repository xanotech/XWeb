ko.bindingHandlers.percent = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var ref = ko.utils.getBindingRef(valueAccessor);
        element.$data = bindingContext.$data; // Used later for setting non-observable properties

        ko.utils.registerEventHandler(element, "change", function() {
            if (arguments.callee.isProcessingChange)
                return;

            arguments.callee.isProcessingChange = true;

            var num = parseFloat(element.value);
            if (isNaN(num)) {
                num = null;
                element.value = '';
            } else
                num /= 100;

            var accessedValue = valueAccessor();
            if (accessedValue && accessedValue.constructor == Function)
                accessedValue(num);
            else
                eval('this.$data.' + ref + ' = ' + num);

            arguments.callee.isProcessingChange = false;
        });
    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        var text = '';
        if (typeof(value) == 'number')
            text = (value * 100).toString();

        if ($(element).is("input"))
            $(element).val(text);
        else
            $(element).text(text);
    }
}
