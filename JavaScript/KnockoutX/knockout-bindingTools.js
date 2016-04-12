ko.utils.getBindingRef = function(valueAccessor) {
    var ref = valueAccessor.toString();
    ref.split('\r').join('');
    ref.split('\n').join(' ');
    while (ref.indexOf('{ ') >= 0)
        ref = ref.split('{ ').join('{');
    while (ref.indexOf(' }') >= 0)
        ref = ref.split(' }').join('}');
    while (ref.indexOf('function ') >= 0)
        ref = ref.split('function ').join('function');
    while (ref.indexOf('() ') >= 0)
        ref = ref.split('() ').join('()');
    ref = ref.split('function(){return ').join('');
    if (ref.substr(ref.length - 1, 1) == '}')
        ref = ref.substr(0, ref.length - 1);
    return ref;
} // end function