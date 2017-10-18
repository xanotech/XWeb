ko.extenders.adapter = function(target, entityAndProperty) {
    var entity = entityAndProperty[0];
    var property = entityAndProperty[1];
    target.subscribe(function(newValue) {
        entity[property] = newValue;
    });
    return target;
} // end function



ko.observableAdapter = function(object, property) {
    return ko.observable(object[property]).extend({ adapter: [object, property] });
} // end function



ko.adapt = function(objects) {
    if (!objects)
        return;

    if (!Array.isArray(objects))
        objects = [objects];

    for (var o = 0; o < objects.length; o++) {
        var object = objects[o];
        object.adapter = object.adapter || {};

        // For each property (that isn't object.adapter) set a corresponding
        // property of object.adapter to an observableAdapter (if one isn't
        // already present).
        for (var property in object)
            if (object.hasOwnProperty(property) &&
                object[property] != object.adapter &&
                !object.adapter[property])
                object.adapter[property] = ko.observableAdapter(object, property);
        
        // Add update method to adapter (if it doesn't already exist).
        // This method applies all property values of object to their
        // associated observables in adapter.  If the property does not
        // have an observable, a new one is created.
        if (!object.adapter.update)
            object.adapter.update = function() {
                for (var property in object)
                    if (object.hasOwnProperty(property) &&
                        object[property] != object.adapter) {
                        if (object.adapter[property])
                            object.adapter[property](object[property]);
                        else
                            object.adapter[property] = ko.observableAdapter(object, property);
                    } // end if
            } // end function
    } // end for
} // end function