ko.extenders.adaptor = function(target, entityAndProperty) {
    var entity = entityAndProperty[0];
    var property = entityAndProperty[1];
    target.subscribe(function(newValue) {
        entity[property] = newValue;
    });
    return target;
} // end function



ko.observableAdaptor = function(object, property) {
    return ko.observable(object[property]).extend({ adaptor: [object, property] });
} // end function



ko.adapt = function(objects) {
    if (!objects)
        return;

    if (!Array.isArray(objects))
        objects = [objects];

    for (var o = 0; o < objects.length; o++) {
        var object = objects[o];
        object.adaptor = object.adaptor || {};

        // For each property (that isn't object.adaptor) set a corresponding
        // property of object.adaptor to an observableAdaptor (if one isn't
        // already present).
        for (var property in object)
            if (object.hasOwnProperty(property) &&
                object[property] != object.adaptor &&
                !object.adaptor[property])
                object.adaptor[property] = ko.observableAdaptor(object, property);
        
        // Add update method to adaptor (if it doesn't already exist).
        // This method applies all property values of object to their
        // associated observables in adaptor.  If the property does not
        // have an observable, a new one is created.
        if (!object.adaptor.update)
            object.adaptor.update = function() {
                for (var property in object)
                    if (object.hasOwnProperty(property) &&
                        object[property] != object.adaptor) {
                        if (object.adaptor[property])
                            object.adaptor[property](object[property]);
                        else
                            object.adaptor[property] = ko.observableAdaptor(object, property);
                    } // end if
            } // end function
    } // end for
} // end function