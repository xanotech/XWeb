// xrepository JavaScript Library v0.7
// http://xrepository.com/
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://xrepository.com/#!License.html

"use strict";

var XRepository = {}; // Namespace object for all XRepository classes



// Constructs a new XRepository.Criterion object with Name, Operation, and Value.
// new XRepository.Criterion(); // Name = '', Operation = '=', Value = null
// new XRepository.Criterion('CustomerId'); // Name = 'CustomerId', Operation = '=', Value = null
// new XRepository.Criterion('CustomerId', 101); // Name = 'CustomerId', Operation = '=', Value = 101
// new XRepository.Criterion('Street', 'LIKE', '%Main%'); // Name = 'Street', Operation = 'LIKE', Value = '%Main%'
XRepository.Criterion = function() {
    this.Name = '';
    this.Operation = 'EqualTo';
    this.Value = null;

    switch(arguments.length) {
        case 0:
            break;
        case 1:
            this.Name = arguments[0];
            break;
        case 2:
            this.Name = arguments[0];
            this.Value = arguments[1];
            break;
        default:
            this.Name = arguments[0];
            this.Operation = arguments[1];
            this.Value = arguments[2];
    } // end switch
} // end function



XRepository.Criterion.create = function(obj) {
    var array = [];
    jQuery.each(obj, function(property, value) {
        array.push(new XRepository.Criterion(property, value));
    });
    return array;
} // end function



XRepository.Criterion.getBasicArray = function(criterion) {
    if (!Array.is(criterion))
        return;

    for (var c = 0; c < criterion.length; c++)
        if (!Object.isBasic(criterion[c]))
            return;

    return criterion;
} // end function



XRepository.Cursor = function(type, criteria, repository) {
    this.type = type;
    this.repository = repository;
    this.data = null;
    this.index = 0;

    this.cursorData = {};
    this.cursorData.columns = null;
    this.cursorData.criteria = criteria;
    this.cursorData.limit = null;
    this.cursorData.skip = null;
    this.cursorData.sort = null;
} // end function



XRepository.Cursor.prototype.count = function(applySkipLimit) {
    if (applySkipLimit) {
        var result = this.toArray();
        if (XRepository.isPromise(result)) {
            var deferred = jQuery.Deferred();
            result.done(function(objects) {
                deferred.resolve(objects.length);
            });
            return deferred.promise();
        } else
            return result.length;
    } else
        return this.repository.count(this.type, this.cursorData.criteria);
} // end function



XRepository.Cursor.prototype.forEach = function(callback) {
    if (!Function.is(callback))
        return;

    function performForEach(objects) {
        jQuery.each(objects, function(index, obj) {
            callback(obj);
        });
    } // end function

    var result = this.toArray();
    if (XRepository.isPromise(result))
        result.done(performForEach);
    else
        performForEach(result);
} // end function



XRepository.Cursor.prototype.hasNext = function() {
    var size = this.size();
    if (size)
        return this.index < size;
} // end function



XRepository.Cursor.prototype.join = function() {
    this.data = null;
    this._joinObjects = XRepository._createJoinObjects(arguments, this._joinObjects);
    return this;
} // end function



XRepository.Cursor.prototype.limit = function(rows) {
    if (arguments.length == 0)
        return this.cursorData.limit;

    this.data = null;
    if (!Number.is(rows))
        rows = null;
    this.cursorData.limit = rows;
    return this;
} // end function



XRepository.Cursor.prototype.map = function(callback) {
    if (Function.is(callback))
        return;

    function performMap(objects) {
        var array = [];
        jQuery.each(objects, function(index, obj) {
            array.push(callback(obj));
        });
        return array;
    } // end function

    var result = this.toArray();
    if (XRepository.isPromise(result)) {
        var deferred = jQuery.Deferred();
        result.done(function(objects) {
            deferred.resolve(performMap(objects));
        });
        return deferred.promise();
    } else
        return performMap(result);
} // end function



XRepository.Cursor.prototype.next = function() {
    if (!this.hasNext())
        return;

    var array = this.toArray();
    if (XRepository.isPromise(array))
        array = array.array;
    if (array)
        return array[this.index++];
} // end function



XRepository.Cursor.prototype.size = function() {
    var array = this.toArray();
    if (XRepository.isPromise(array))
        array = array.array;
    if (array)
        return array.length;
} // end function



XRepository.Cursor.prototype.skip = function(rows) {
    if (arguments.length == 0)
        return this.cursorData.skip;

    this.data = null;
    if (!Number.is(rows))
        rows = null;
    this.cursorData.skip = rows;
    return this;
} // end function



XRepository.Cursor.prototype.sort = function(sortObj) {
    if (arguments.length == 0)
        return this.cursorData.sort;

    this.data = null;
    if (arguments.length > 1) {
        sortObj = [];
        jQuery.each(arguments, function(index, arg) {
            if (arg)
                sortObj.push(arg);
        });
    } // end if

    sortObj = this._validateSortObj(sortObj);
    if (sortObj)
        jQuery.each(sortObj, function(property, value) {
            if (Boolean.is(value))
                value = value ? 1 : -1;
            if (!Number.is(value))
                return;

            if (value > 0)
                sortObj[property] = 1;
            else if (value < 0)
                sortObj[property] = -1;
        });
    this.cursorData.sort = sortObj;
    return this;
} // end function



XRepository.Cursor.prototype.toArray = function() {
    if (this.data == null) {
        var result = this.repository._fetch(this);
        if (XRepository.isPromise(result))
            result.done(function(array) {
                result.array = array;
            });
        this.data = result;
        this.index = 0;
    } // end if
    return this.data;
} // end function



XRepository.Cursor.prototype._validateSortObj = function(sortObj) {
    if (!sortObj)
        return sortObj;

    if (String.is(sortObj))
        sortObj = [sortObj];

    var isValid = !Object.isBasic(sortObj);

    if (isValid && Array.is(sortObj)) {
        var newSortObj = {};
        jQuery.each(sortObj, function(index, element) {
            if (!String.is(element))
                return isValid = false;
            newSortObj[element] = 1;
        });
        if (isValid)
            sortObj = newSortObj;
    } // end if

    if (!isValid)
        throw new Error('Error in JSRepository.sort: sortObj argument was not valid.  ' +
            'The sortObj argument must be a String, an array of Strings, ' +
            'or an object where properties are Booleans or Numbers\n' +
            XRepository._formatObjectForError(sortObj, 'sortObj') + '.');
    return sortObj;
} // end function



XRepository.JSRepository = function(path, isSynchronized) {
    path = path || 'Repository';

    // Check to see if isSynchronized is a Boolean.  Can't use Boolean.is method because
    // xtools.js may not be loaded yet, so just use old fashioned typeof and constructor checking.
    if (typeof isSynchronized != 'boolean' || isSynchronized.constructor != Boolean)
        isSynchronized = true;

    this._internal = {};
    this._internal.columnMapCache = {};
    this._internal.columnsCache = {};
    this._internal.primaryKeysCache = {};
    this._internal.propertyMapCache = {};
    this._internal.tableDefinitionCache = {};
    this._internal.tableNameCache = {};
    this.isSynchronized = isSynchronized;
    this.isUsingLikeForEquals = false;

    // Setup default paths
    this.path = {};
    this.path.root = path;
    this.path.count = 'Count';
    this.path.fetch = 'Fetch';
    this.path.getColumns = 'GetColumns';
    this.path.getPrimaryKeys = 'GetPrimaryKeys';
    this.path.getTableDefinition = 'GetTableDefinition';
    this.path.remove = 'Remove';
    this.path.save = 'Save';

    if (XRepository.JSRepository.isRecursive)
        return;

    var selfProperty = isSynchronized ? 'sync' : 'async';
    var altProperty = !isSynchronized ? 'sync' : 'async';

    this[selfProperty] = this;
    XRepository.JSRepository.isRecursive = true;
    this[altProperty] = new XRepository.JSRepository(path, false);
    delete XRepository.JSRepository.isRecursive;
    this[altProperty]._internal = this._internal;
    this[altProperty].path = this.path;
} // end function



XRepository.JSRepository.prototype.convertStringToDate = function(string) {
    // Look for ISO 8601 dates (2013-10-28T16:38:30Z) and "quasi" ISO 8601 dates (2013-10-28 16:38:30Z).
    if (string.length == 20 && string[4] == '-' && string[7] == '-' &&
        string[13] == ':' && string[16] == ':' && string[19] == 'Z') {
        var m = moment.utc(string);
        if (m.isValid())
            return new Date(m.year(), m.month(), m.date(),
                m.hour(), m.minute(), m.second(), m.millisecond());

    // Look for funky Microsoft JSON dates (stupid Microsoft): /Date(946702800000)/
    } else if (string.startsWith('/Date(') && string.endsWith(')/') &&
        !isNaN(string.substring(6, string.length - 2))) {
        var time = parseInt(string.substring(6));
        return new Date(time);
    } // end if-else
} // end function



XRepository.JSRepository.prototype.count = function(type, criteria) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(type, 'type', 'count');
    criteria = this._validateCriteria(type, criteria, 'count');
    var cursor = new XRepository.Cursor(type, criteria, this)

    cursor.cursorData.criteria = this._fixCriteria(cursor.cursorData.criteria);
    var request = jQuery.ajax(this.path.root + '/' + this.path.count, {
        async: !this.isSynchronized,
        cache: false,
        method: 'POST',
        data: {
            tableNames: JSON.stringify(this._getTableNames(cursor.type)),
            cursor: JSON.stringify(cursor.cursorData)
        }
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request, 'count');
        return JSON.parse(request.responseText);
    });
} // end function



// Creates an instance of an object with all properties defined and set to null
// for the type provided.  Entities backed by JSRepository created by new
// operator may not have any properties until they are saved.  The create
// method is a substitute for new with the difference being that properties
// defined by the server will be present (although initialized to null).
XRepository.JSRepository.prototype.create = function(type) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(type, 'type', 'create');
    var tableNames = this._getTableNames(type);
    var obj = new type();

    var propertyMap = this._getPropertyMap(type);
    if (jQuery(propertyMap).is(function() { return true; }))
        return obj;

    obj._tableNames = tableNames;
    var repo = this;
    jQuery.each(tableNames, function(index, tableName) {
        var columns = repo._getColumns(tableName);
        jQuery.each(columns, function(index, column) {
            var property = repo._getMappedProperty(type, column);
            obj[property] = null;
        });
    });
    return obj;
} // end function



XRepository.JSRepository.prototype.find = function(type, criteria) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(type, 'type', 'find');
    criteria = this._validateCriteria(type, criteria, 'find');
    return new XRepository.Cursor(type, criteria, this);
} // end function



XRepository.JSRepository.prototype.findOne = function(type, criteria) {
    XRepository._validateRequiredLibraries();
    var result = this.find(type, criteria).limit(1).toArray();
    if (XRepository.isPromise(result)) {
        var deferred = jQuery.Deferred();
        result.done(function(objects) {
            deferred.resolve(objects[0] || null);
        });
        return deferred.promise();
    } else
        return result[0] || null;
} // end function



XRepository.JSRepository.prototype.mapColumn = function(type, propertyName, columnName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(type, 'type', 'mapColumn');
    if (!String.is(propertyName))
        throw new Error('Error in JSRepository.mapColumn: propertyName argument is missing or is not a String.');
    if (!String.is(columnName))
        throw new Error('Error in JSRepository.mapColumn: columnName argument is missing or is not a String.');

    if (!this._isValidColumn(type, columnName))
        throw new Error('The columnName "' + columnName + '" does not exist.');

    var typeName = type.getName();
    columnName = columnName.toUpperCase();
    this._internal.columnMapCache[typeName] = this._internal.columnMapCache[typeName] || {}
    this._internal.columnMapCache[typeName][columnName] = propertyName;
} // end function



XRepository.JSRepository.prototype.mapMultipleReference = function(source, target, foreignKey, propertyName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(source, 'source', 'mapMultipleReference');
    this._validateTypeArgument(target, 'target', 'mapMultipleReference');

    var ref = new XRepository.Reference(this, source, target);
    ref.foreignKey = foreignKey;
    ref.isMultiple = true;

    this._defineReferenceProperty(ref, propertyName);
} // end function



XRepository.JSRepository.prototype.mapSingleReference = function(source, target, foreignKey, propertyName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(source, 'source', 'mapSingleReference');
    this._validateTypeArgument(target, 'target', 'mapSingleReference');

    var ref = new XRepository.Reference(this, source, target);
    ref.foreignKey = foreignKey;

    this._defineReferenceProperty(ref, propertyName);
} // end function



XRepository.JSRepository.prototype.mapTable = function(type, tableName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeArgument(type, 'type', 'mapTable');
    if (!String.is(tableName))
        throw new Error('Error in JSRepository.mapTable: tableName argument is missing or is not a String.');

    this._getTableDefinition(tableName); // Validates passed tableName

    var tableNames = [];
    var baseType = XRepository._getBase(type);
    if (baseType != Object)
        tableNames = tableNames.concat(this._getTableNames(baseType, true));
    tableNames.push(tableName);
    this._internal.tableNameCache[type.getName()] = tableNames;
} // end function



XRepository.JSRepository.prototype.pluralize = function(word) {
    if (typeof owl != 'undefined' && owl.pluralize)
        return owl.pluralize(word);
    else if (word.endsWith('s') || word.endsWith('x'))
        return word + 'es';
    else if (word.endsWith('y'))
        return word.substring(0, word.length - 1) + 'ies';
    else
        return word + 's';
}



XRepository.JSRepository.prototype.remove = function(objects) {
    XRepository._validateRequiredLibraries();
    if (Object.isBasic(objects))
        throw new Error('Error in JSRepository.remove: objects argument cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            XRepository._formatObjectForError(objects, 'objects') + '.');
    if (!objects)
        return;

    if (XRepository.Cursor.is(objects)) {
        objects = objects.toArray();
        if (XRepository.isPromise(objects)) {
            var repo = this;
            var deferred = jQuery.Deferred();
            objects.done(function(objs) {
                repo.remove(objs).done(deferred.resolve);
            });
            return deferred.promise();
        } // end if
    } // end if

    if (!Array.is(objects))
        objects = [objects];

    this._validateEntityArray(objects, 'remove');
    this._applyTableNames(objects);
    objects = this._removeExtraneousProperties(objects);
    this._fixDateObjects(objects);
    var request = jQuery.ajax(this.path.root + '/' + this.path.remove, {
        async: !this.isSynchronized,
        cache: false,
        method: 'POST',
        data: { data: JSON.stringify(objects) }
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request, 'remove');
    });
} // end function



XRepository.JSRepository.prototype.save = function(objects) {
    XRepository._validateRequiredLibraries();
    if (Object.isBasic(objects))
        throw new Error('Error in JSRepository.save: objects argument cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            XRepository._formatObjectForError(objects, 'objects') + '.');
    if (!objects)
        return;

    if (XRepository.Cursor.is(objects)) {
        objects = objects.toArray();
        if (XRepository.isPromise(objects)) {
            var repo = this;
            var deferred = jQuery.Deferred();
            objects.done(function(objs) {
                repo.save(objs).done(deferred.resolve);
            });
            return deferred.promise();
        } // end if
    } // end if

    if (!Array.is(objects))
        objects = [objects];

    this._validateEntityArray(objects, 'save');
    this._applyTableNames(objects);
    var cleanObjects = this._removeExtraneousProperties(objects);
    this._fixDateObjects(cleanObjects);
    var request = jQuery.ajax(this.path.root + '/' + this.path.save, {
        async: !this.isSynchronized,
        cache: false,
        method: 'POST',
        data: { data: JSON.stringify(cleanObjects) }
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request, 'save');
        var ids = JSON.parse(request.responseText);
        repo._applyIds(objects, ids);
        return objects;
    });
} // end function



XRepository.JSRepository.prototype._applyIds = function(objects, ids) {
    var repo = this;
    jQuery.each(objects, function(index, obj) {
        var idObj = ids[index];
        if (!idObj)
            return true;

        jQuery.each(idObj, function(property, value) {
            var property = repo._getMappedProperty(obj.constructor, property);
            obj[property] = value;
        });
    });
} // end function



XRepository.JSRepository.prototype._applyJoinObjects = function(objects, joinObjects) {
    if (!joinObjects)
        return;

    if (Array.is(joinObjects)) {
        var array = joinObjects;
        if (!array.length)
            return;
        var joinObjects = {};
        joinObjects[array[0].constructor.getName()] = array;
    } // end if

    var repo = this;
    jQuery.each(objects, function(index, obj) {
        jQuery.each(repo._getReferences(obj.constructor), function(index, reference) {
            if (reference.isMultiple)
                repo._applyMultipleReference(obj, joinObjects, reference);
            else
                repo._applySingleReference(obj, joinObjects, reference);
        });
    });
} // end function



XRepository.JSRepository.prototype._applyMultipleReference = function(sourceObj, joinObjects, reference) {
    var targetName = reference.target.getName();
    if (!targetName)
        return;

    var targetJoinObjs = joinObjects[targetName];
    if (!targetJoinObjs)
        return;
            
    var primaryKey = this._getIdProperty(sourceObj.constructor);
    if (!primaryKey)
        return;

    var primaryKeyValue = sourceObj[primaryKey];
    if (!primaryKeyValue)
        return;

    var objs = [];
    jQuery.each(targetJoinObjs, function(index, targetJoinObj) {
        if (targetJoinObj[reference.getForeignKey()] == primaryKeyValue)
            objs.push(targetJoinObj);
    });
    sourceObj[reference.propertyName] = objs;
} // end function



XRepository.JSRepository.prototype._applySingleReference = function(sourceObj, joinObjects, reference) {
    var targetName = reference.target.getName();
    if (!targetName)
        return;

    var targetJoinObjs = joinObjects[targetName];
    if (!targetJoinObjs)
        return;
            
    var foreignKeyValue = sourceObj[reference.getForeignKey()];
    if (!foreignKeyValue)
        return;

    var primaryKey = this._getIdProperty(reference.target);
    if (!primaryKey)
        return;

    sourceObj[reference.propertyName] = null;
    jQuery.each(targetJoinObjs, function(index, targetJoinObj) {
        if (targetJoinObj[primaryKey] == foreignKeyValue) {
            sourceObj[reference.propertyName] = targetJoinObj;
            return false;
        } // end if
    });
} // end function



XRepository.JSRepository.prototype._applyTableNames = function(objects) {
    var repo = this;
    jQuery.each(objects, function(index, obj) {
        obj._tableNames = obj._tableNames || repo._getTableNames(obj.constructor);
    });
} // end function



XRepository.JSRepository.prototype._convert = function(objects, type) {
    var repo = this;
    
    jQuery.each(objects, function(index, object) {
        var newObject = new type();
        jQuery.each(object, function(column, value) {
            var mappedProperty = repo._getMappedProperty(type, column);
            newObject[mappedProperty] = value;
        });
        objects[index] = newObject;
    });
} // end function



XRepository.JSRepository.prototype._defineReferenceProperty = function(reference, propertyName) {
    if (!propertyName) {
        propertyName = reference.target.getName();
        if (reference.isMultiple)
            propertyName = this.pluralize(propertyName);
        propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substring(1);
        reference.propertyName = propertyName
    } // end if

    var repo = this;
    if (Object.defineProperty)
        Object.defineProperty(reference.source.prototype, propertyName, {
            get: function() {
                var value = this['_' + propertyName];
                if (value)
                    return value;

                var criteria = {};
                if (reference.isMultiple)
                    criteria[reference.getForeignKey()] = this[repo._getIdProperty(reference.source)];
                else
                    criteria[repo._getIdProperty(reference.target)] = this[reference.getForeignKey()];
                var cursor = repo.sync.find(reference.target, criteria);
                if (reference.isMultiple)
                    cursor.join(this);
                value = cursor.toArray();
                
                if (!reference.isMultiple)
                    value = value[0] || null;
                this['_' + propertyName] = value;
                
                return value;
            },
            set: function(value) {
                this['_' + propertyName] = value;
            }
        });
} // end function



XRepository.JSRepository.prototype._fetch = function(cursor) {
    cursor.cursorData.criteria = this._fixCriteria(cursor.cursorData.criteria);

    var tableNames = this._getTableNames(cursor.type);
    var cursorData = this._initCursorData(cursor);
    var request = jQuery.ajax(this.path.root + '/' + this.path.fetch, {
        async: !this.isSynchronized,
        cache: false,
        method: 'POST',
        data: {
            tableNames: JSON.stringify(tableNames),
            cursor: JSON.stringify(cursorData)
        }
    });

    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request, 'toArray');
        var objects = JSON.parse(request.responseText);
        repo._fixPropertyNames(objects);
        repo._fixDateStrings(objects);
        repo._convert(objects, cursor.type);

        var joinObjects = repo._fetchStringJoins(objects, cursor);
        if (joinObjects && joinObjects.promises) {
            var deferred = jQuery.Deferred();
            jQuery.when.apply(jQuery, joinObjects.promises).done(function() {
                repo._applyJoinObjects(objects, joinObjects);
                deferred.resolve();
            });
            objects.promise = deferred.promise();
        } else
            repo._applyJoinObjects(objects, joinObjects);

        return objects;
    });
} // end function



XRepository.JSRepository.prototype._fetchStringJoins = function(objects, cursor) {
    var joinObjects = {}; // A copy of cursor._joinObjects minus String + objects

    // Copy all properties except 'String' to joinObjects
    jQuery.each(cursor._joinObjects || {}, function(property, objects) {
        if (property != 'String')
            joinObjects[property] = objects;
   });

    var strings = this._normalizeStrings(cursor._joinObjects && cursor._joinObjects.String);
    if (!strings || !strings.length)
        return joinObjects;

    var repo = this;
    if (this.isSynchronized) {
        jQuery.each(strings, function(index, string) {
            var sourceObjects = objects;

            // Loops through all individual property names defined in "string"
            // except the last one (which is the one we're fetching for).
            // For each propertyName, sourceObjects is set to all the objects
            // of sourceObjects returned by that property name.
            var split = string.split('.');
            var joinPropertyName = split.splice(split.length - 1)[0];
            jQuery.each(split, function(index, propertyName) {
                if (!sourceObjects || !sourceObjects.length)
                    return false;

                var newSourceObjects = [];
                // Get all objects for propertyName
                jQuery.each(sourceObjects, function(index, object) {
                    var propertyValue = object[propertyName];
                    if (Array.is(propertyValue))
                        newSourceObjects.pushArray(propertyValue);
                    else if (propertyValue)
                        newSourceObjects.push(propertyValue);
                });
                sourceObjects = newSourceObjects;
            });

            if (!sourceObjects || !sourceObjects.length)
                return false;

            var type = sourceObjects[0].constructor;
            var reference = repo._getReference(type, joinPropertyName);
            if (!reference)
                throw new Error('Error in join parameter "' + string + '".  ' +
                    type.getName() + ' does not have a reference named "' +
                    joinPropertyName + '".');

            var criterion = new XRepository.Criterion();
            criterion.Operation = '=';
            if (reference.isMultiple) {
                criterion.Name = reference.getForeignKey();
                criterion.Value = [];
                jQuery.each(sourceObjects, function(index, obj) {
                    criterion.Value.push(obj[repo._getIdProperty(type)]);
                });
            } else {
                criterion.Name = repo._getIdProperty(reference.target);
                criterion.Value = [];
                jQuery.each(sourceObjects, function(index, obj) {
                    var value = obj[reference.getForeignKey()];
                    if (value != null)
                        criterion.Value.push(value);
                });
            } // end if-else

            var joinObjs = repo.find(reference.target, criterion).join(sourceObjects).toArray();
            var joinObjs = XRepository._createJoinObjects(joinObjs);
            // If there isn't an element for the reference target, that means there were
            // no results from the find.  Create an empty element so the property will
            // be populated and not re-fetched when accessed.
            joinObjs[reference.target.getName()] = joinObjs[reference.target.getName()] || [];
            repo._applyJoinObjects(sourceObjects, joinObjs);
        });
    } else {
    } // end if

    return joinObjects;
} // end function



XRepository.JSRepository.prototype._findProperty = function(type, columnName) {
    if (!columnName)
        return null;

    var tableNames = this._getTableNames(type);
    if (!tableNames.length)
        return null;

    var columns = this._getColumns(tableNames[0]);
    var result = null;
    var repo = this;
    jQuery.each(columns, function(index, column) {
        var propertyName = repo._getMappedProperty(type, column);
        if (propertyName.is(columnName)) {
            result = propertyName;
            return false;
        } // end if
    });
    return result;
} // end function



XRepository.JSRepository.prototype._findForeignKeyProperty = function(referencedType, referencingType) {
    var idProperty = this._getIdProperty(referencedType);
    var vanillaIdProperty = idProperty;

    // If the idProperty without any table names is the same as vanilla idProperty,
    // then they key name is "simple" (like "Id" or "Code").  If that's the case
    // then only check for referencingType columns if the simple idProperty does
    // not match the idProperty of the referencingType.
    var tableNames = this._getTableNames(referencedType);
    var repo = this;
    jQuery.each(tableNames, function(index, tableName) {
        var tableDef = repo._getTableDefinition(tableName);
        tableName = tableDef.TableName;
        idProperty = idProperty.removeIgnoreCase(tableName);
    });
    if (idProperty != vanillaIdProperty ||
        idProperty != this._getIdProperty(referencingType)) {
        var column = this._findProperty(referencingType, vanillaIdProperty);
        if (column)
            return column;
    } // end if

    return this._findProperty(referencingType, referencedType.getName() + idProperty);
} // end function



XRepository.JSRepository.prototype._fixDateObjects = function(objects) {
    if (!Array.is(objects))
        objects = [objects];

    jQuery.each(objects, function(index, obj) {
        jQuery.each(obj, function(property, value) {
            if (!Date.is(value))
                return;

            var m = moment.utc([value.getFullYear(), value.getMonth(), value.getDate(),
                value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds()]);
            obj[property] = m.toDate();
        });
    });
} // end function



XRepository.JSRepository.prototype._fixDateStrings = function(objects) {
    if (!Array.is(objects))
        objects = [objects];

    var self = this;
    jQuery.each(objects, function(index, obj) {
        jQuery.each(obj, function(property, value) {
            if (String.is(value)) {
                var date = self.convertStringToDate(value);
                if (date)
                    obj[property] = date;
            } // end if
        });
    });
} // end function



XRepository.JSRepository.prototype._fixPropertyNames = function(objects) {
    // Extract the name from the reader's schema.  Fields with
    // the same name in multiple tables selected (usually the
    // primary key) will be preceded by the table name and a ".".
    // For instance, if Employee extends from Person, the names
    // "Person.Id" and "Employee.Id" will be column names.
    // Strip the preceding table name and ".".
    jQuery.each(objects, function(index, obj) {
        jQuery.each(obj, function(property) {
            var index = property.lastIndexOf('.');
            if (index == -1)
                return;

            var newProperty = property.substring(index + 1);
            obj[newProperty] = obj[property];
            delete obj[property];
        });
    });
} // end function



XRepository.JSRepository.prototype._fixCriteria = function(criteria) {
    if (!criteria)
        return null;

    var newCriteria = [];
    var repo = this;
    jQuery.each(criteria, function(index, criterion) {
        criterion = new XRepository.Criterion(criterion.Name,
            criterion.Operation, criterion.Value);
        if (!criterion.Operation)
            criterion.Operation = '=';

        criterion.Operation = criterion.Operation.trim().toUpperCase();
        switch (criterion.Operation) {
            case '=':
            case '==':
            case 'EQUALTO':
                criterion.Operation = 'EqualTo';
                break;
            case '>':
            case 'GREATERTHAN':
                criterion.Operation = 'GreaterThan';
                break;
            case '>=':
            case 'GREATERTHANOREQUALTO':
                criterion.Operation = 'GreaterThanOrEqualTo';
                break;
            case '<':
            case 'LESSTHAN':
                criterion.Operation = 'LessThan';
                break;
            case '<=':
            case 'LESSTHANOREQUALTO':
                criterion.Operation = 'LessThanOrEqualTo';
                break;
            case '<>':
            case '!=':
            case 'NOTEQUALTO':
                criterion.Operation = 'NotEqualTo';
                break;
            case 'LIKE':
                criterion.Operation = 'Like';
                break;
            case 'NOT LIKE':
                this.Operation = 'NotLike';
                break;
            default:
                throw new Error('OperationType string "' + str + '" is invalid.  ' +
                    'Acceptable values are: =, >, >=, <, <=, !=, LIKE, NOT LIKE (== and <> are also accepted).');
        } // end switch

        if (repo.isUsingLikeForEquals) {
            if (criterion.Operation == 'EqualTo')
                criterion.Operation = 'Like';
            if (criterion.Operation == 'NotEqualTo')
                criterion.Operation = 'NotLike';
        } // end if

        newCriteria.push(criterion);
    });
    return newCriteria;
} // end function



XRepository.JSRepository.prototype._getCachedValue = function(cache, tableName, lookupPath) {
    var tableName = tableName.toUpperCase();
    var cachedValue = cache[tableName];
    if (cachedValue)
        if (Error.is(cachedValue))
            throw cachedValue;
        else
            return cache[tableName];

    lookupPath = this.path.root + '/' + lookupPath;
    var request = jQuery.ajax(lookupPath, {
        async: false,
        cache: false,
        method: 'POST',
        data: { tableName: tableName }
    });
    try {
        this._validateResponse(request);
        cache[tableName] = JSON.parse(request.responseText);
    } catch (e) {
        cache[tableName] = e;
        throw e;
    } // end try catch
    return cache[tableName];
} // end function



XRepository.JSRepository.prototype._getColumns = function(tableName) {
    return this._getCachedValue(this._internal.columnsCache, tableName, this.path.getColumns);
} // end function



XRepository.JSRepository.prototype._getIdProperty = function(type) {
    var keys = this._getPrimaryKeys(type);
    if (keys.length != 1)
        return null;
    return keys[0];
} // end function



XRepository.JSRepository.prototype._getMappedColumn = function(type, propertyName) {
    while (type != Object) {
        var cache = this._internal.columnMapCache[type.getName()]
        if (cache) {
            var mappedColumn;
            jQuery.each(cache, function(column, property) {
                if (property == propertyName) {
                    mappedColumn = column;
                    return false;
                } // end if
            });
            if (mappedColumn)
                return mappedColumn;
        }
        type = XRepository._getBase(type);
    } // end while
    return propertyName;
} // end function



XRepository.JSRepository.prototype._getMappedProperty = function(type, columnName) {
    var column = columnName.toUpperCase();
    
    // Get propertyMap now since I'm going to jack with type
    var propertyMap = this._getPropertyMap(type);
    
    // Scan through references looking for a mapping
    // for this column and return immediately if found.
    while (type != Object) {
        var cache = this._internal.columnMapCache[type.getName()]
        if (cache) {
            var propertyName = cache[column]
            if (propertyName)
                return propertyName;
        } // end if
        type = XRepository._getBase(type);
    } // end while

    // At this point, the columnName was not explicitly mapped so see if it's
    // contained in propertyMap.  If not, just return the original columnName.
    var property = propertyMap[column];
    return property || columnName;
} // end function



XRepository.JSRepository.prototype._getPrimaryKeys = function(typeOrTable) {
    if (String.is(typeOrTable))
        return this._getCachedValue(this._internal.primaryKeysCache, typeOrTable, this.path.getPrimaryKeys);

    if (Function.is(typeOrTable)) {
        var tableNames = this._getTableNames(typeOrTable);
        if (tableNames.length == 0)
            return null;

        var keys = [];
        var columns = this._getPrimaryKeys(tableNames[0]);
        var repo = this;
        jQuery.each(columns, function(index, column) {
            keys.push(repo._getMappedProperty(typeOrTable, column));
        });
        return keys;
    } // end if
} // end function



XRepository.JSRepository.prototype._getPropertyMap = function(type) {
    var typeName = type.getName();
    if (this._internal.propertyMapCache[typeName])
        return this._internal.propertyMapCache[typeName];

    var obj = new type();
    var propertyMap = {};
    jQuery.each(obj, function(property) {
        if (!Function.is(obj[property]))
            propertyMap[property.toUpperCase()] = property;
    });

    return this._internal.propertyMapCache[typeName] = propertyMap;
} // end function



XRepository.JSRepository.prototype._getReference = function(type, propertyName) {
    var result;
    jQuery.each(this._getReferences(type), function(index, reference) {
        if (reference.propertyName == propertyName) {
            result = reference;
            return false;
        } // end if
    });
    return result;
} // end function



XRepository.JSRepository.prototype._getReferences = function(type) {
    var references = [];
    while (Function.is(type) && type != Object) {
        if (type._references)
            references.pushArray(type._references);
        type = XRepository._getBase(type);
    } // end while
    return references;
} // end function



XRepository.JSRepository.prototype._getTableDefinition = function(tableName) {
    return this._getCachedValue(this._internal.tableDefinitionCache, tableName, this.path.getTableDefinition);
} // end function



XRepository.JSRepository.prototype._getTableNames = function(type, isSilent) {
    var typeName = type.getName();
    if (this._internal.tableNameCache[typeName])
        return this._internal.tableNameCache[typeName];

    var tableNames = [];
    while (type != Object) {
        try {
            var tableDef = this._getTableDefinition(type.getName());
            tableNames.push(tableDef.FullName);
        } catch (e) {
            // _getTableDefinition throws errors when the table
            // indicated by type.getName() does not exist.  In those cases,
            // catch the exception and move on.  _getTableNames will
            // throw an exception if no tables are found.
        } // end try-catch

        type = XRepository._getBase(type);
    } // end while
    if (!tableNames.length && !isSilent)
        throw new Error('There are no tables associated with "' + typeName + '".')

    tableNames.reverse();
    return this._internal.tableNameCache[typeName] = tableNames;
} // end function



XRepository.JSRepository.prototype._handleResponse = function(request, handle) {
    if (this.isSynchronized)
        return handle();
    else {
        var deferred = jQuery.Deferred();
        request.done(function() {
            var result = handle();
            if (result.promise && XRepository.isPromise(result.promise))
                result.promise.done(function() {
                    deferred.resolve(result);
                });
            else
                deferred.resolve(result);
        });
        return deferred.promise();
    } // end if-else
} // end function



XRepository.JSRepository.prototype._initCursorData = function(cursor) {
    var repo = this;

    // Clone cursor data (so the original remains untouched)
    var cursorData = JSON.parse(JSON.stringify(cursor.cursorData));
    
    // This next block of code populates columns based on the properties
    // of the cursor's type and their mapped column name (assuming cursor.type
    // is a Function / "class" and when constructed it contains properties).
    var propertyMap = this._getPropertyMap(cursor.type);
    if (jQuery(propertyMap).is(function() { return true; })) {
        var columns = [];
        var tableNames = this._getTableNames(cursor.type);
        var allColumns = {}; // Map of column names keyed by their upper-case value
        jQuery.each(tableNames, function(index, tableName) {
            jQuery.each(repo._getColumns(tableName), function(index, column) {
                allColumns[column.toUpperCase()] = column;
            });
        });

        jQuery.each(propertyMap, function(propertyUpperCase, property) {
            var column = repo._getMappedColumn(cursor.type, property);
            column = allColumns[column.toUpperCase()];
            if (column)
                columns.push(column);
        });
        cursorData.columns = columns;
    } // end if

    // Change sort columns to mapped database columns
    var sort = {};
    if (cursorData.sort)
        jQuery.each(cursorData.sort, function(property, value) {
            sort[repo._getMappedColumn(cursor.type, property)] = value;
        });
    cursorData.sort = sort;

    return cursorData;
} // end function



XRepository.JSRepository.prototype._isValidColumn = function(type, columnName) {
    var isValid = false;
    var self = this;
    jQuery.each(self._getTableNames(type), function(index, tableName) {
        jQuery.each(self._getColumns(tableName), function(index, column) {
            isValid = column.is(columnName);
            return !isValid;
        });
        return !isValid;
    });
    return isValid;
} // end function



XRepository.JSRepository.prototype._normalizeStrings = function(strings) {
    var normalizedStrings = [];
    if (!strings)
        return strings;

    jQuery.each(strings, function(index, string) {
        if (!string)
            return true;

        var split = string.split('.');
        var combinedString = '';
        jQuery.each(split, function(index, propertyName) {
            if (!propertyName)
                return;

            if (combinedString)
                combinedString += '.'
            combinedString += propertyName;
            if (normalizedStrings.indexOf(combinedString) == -1)
                normalizedStrings.push(combinedString);
        });
    });
    normalizedStrings.sort();
    return normalizedStrings;
} // end function



XRepository.JSRepository.prototype._removeExtraneousProperties = function(objects) {
    if (!Array.is(objects))
        objects = [objects];

    var cleanObjs = [];
    var repo = this;
    jQuery.each(objects, function(index, obj) {
        if (!obj || Object.isBasic(obj) || Array.is(obj))
            return true;

        // Set all properties to upper case
        var upperCaseObj = {};
        jQuery.each(obj, function(property, value) {
            upperCaseObj[property.toUpperCase()] = value;
        });

        var cleanObj = {};
        cleanObj._tableNames = obj._tableNames;
        jQuery.each(cleanObj._tableNames, function(index, tableName) {
            var columns = repo._getColumns(tableName);
            jQuery.each(columns, function(index, column) {
                var upperCaseColumn = column.toUpperCase();
                var property = repo._getMappedProperty(obj.constructor, upperCaseColumn);

                if (property == upperCaseColumn) {
                    if (upperCaseObj.hasOwnProperty(upperCaseColumn))
                        cleanObj[column] = upperCaseObj[upperCaseColumn];
                } else {
                    if (obj.hasOwnProperty(property))
                        cleanObj[column] = obj[property];
                } // end if-else
            });
        });
        cleanObjs.push(cleanObj);
    });
    return cleanObjs;
} // end function


XRepository.JSRepository.prototype._validateCriteria = function(type, criteria, methodName) {
    // Note: Can't use simple if (isThere) checking since criteria could possibly be false boolean.
    if (criteria == undefined || criteria == null)
        return null;

    // If criteria is a function, go ahead and call it (the caller must be
    // trying to do something clever).  But if its still a function after that,
    // just set criteria to null because functions just won't cut it as criteria.
    if (Function.is(criteria))
        criteria = criteria();
    if (Function.is(criteria))
        criteria = null;

    var basicArray = XRepository.Criterion.getBasicArray(criteria);    
    if (Object.isBasic(criteria) || basicArray) {
        var idProperty = this._getIdProperty(type);
        if (!idProperty) {
            var valueStr = basicArray ? '[list-of-values]' : '' + criteria;

            if (String.is(criteria) || Date.is(criteria))
                valueStr = '"' + valueStr + '"';

            throw new Error('Error in JSRepository.' + methodName + ': ' + methodName + '(' +
                type.getName() + ', ' + JSON.stringify(valueStr) +
                ') method cannot be used for ' + type.getName() +
                ' because does not have a single column primary key.');
        } // end if
        criteria = new XRepository.Criterion(idProperty, criteria);
    } // end if

    criteria = criteria || [];
    if (XRepository.Criterion.is(criteria))
        criteria = [criteria];

    if (Array.is(criteria))
        this._validateCriterionArray(criteria, methodName);
    else
        criteria = XRepository.Criterion.create(criteria);

    var repo = this;
    jQuery.each(criteria, function(index, criterion) {
        criterion.Name = repo._getMappedColumn(type, criterion.Name);
    });

    return criteria;
} // end function



XRepository.JSRepository.prototype._validateCriterionArray = function(array, methodName) {
    jQuery.each(array, function(index, element) {
        if (XRepository.Criterion.is(element))
            return;
        if (!element['Name'] || !element['Operation'])
            throw new Error('Error in JSRepository.' + methodName + ': element ' + index +
                ' in criteria array missing Name and / or Operation properties\n' +
                '(element = ' + JSON.stringify(element) + ').');
    });
} // end function



XRepository.JSRepository.prototype._validateEntityArray = function(objects, methodName) {
    jQuery.each(objects, function(index, obj) {
        if (Object.isBasic(obj))
            throw new Error('Error in JSRepository.' + methodName +
                ': element ' + index + ' in objects' +
                'array argument cannot be a basic type but must instead be an entity object\n' +
                XRepository._formatObjectForError(obj, 'objects[' + index + ']') + '.');
        else if (!obj)
            throw new Error('Error in JSRepository.' + methodName +
                ': element ' + index + ' in objects array argument is null or undefined\n' +
                XRepository._formatObjectForError(obj, 'objects[' + index + ']') + '.');
    });
} // end function



XRepository.JSRepository.prototype._validateResponse = function(ajaxRequest, methodName) {
    if (ajaxRequest.status == 500) {
        var error;
        try {
            var errorObj = JSON.parse(ajaxRequest.responseText);
            if (errorObj.message || errorObj.stack) {
                var message = errorObj.message || '';
                var stack = errorObj.stack || '';
                if (stack)
                    stack = 'Stack Trace...\n' + stack;
                error = [message, stack].join('\n\n');
            } // end if
        } catch (e) {
            // Looks like JSON.parse failed.
            error = 'Error in JSRepository.'+ methodName +
                ': unable to parse server error response.  Response data...\n' +
                ajaxRequest.responseText;
        } // end try-catch
        throw new Error(error);
    } // end if
} // end function



XRepository.JSRepository.prototype._validateTypeArgument = function(argument, argumentName, methodName) {
    if (!Function.is(argument))
        throw new Error('Error in JSRepository.' + methodName +
            ': ' + argumentName + ' argument was not initialized or was not a function\n' +
            XRepository._formatObjectForError(argument, argumentName) + '.');
} // end function



XRepository.Reference = function(repository, source, target) {
    this.repository = repository;
    this.source = source;
    this.target = target;
    this.foreignKey = null;
    this.propertyName = null;
    this.isMultiple = false;

    source._references = source._references || [];
    source._references.push(this);
} // end function



XRepository.Reference.prototype.getForeignKey = function() {
    this.foreignKey = this.foreignKey || (this.isMultiple ?
        this.repository._findForeignKeyProperty(this.source, this.target) :
        this.repository._findForeignKeyProperty(this.target, this.source));
    return this.foreignKey
} // end function



XRepository.isPromise = function(obj) {
    return obj && Function.is(obj.done) && Function.is(obj.promise);
} // end function



XRepository._formatObjectForError = function(object, objectName) {
    return '(typeof ' + objectName + ' = ' + typeof object + ', ' +
        objectName + ' = ' + JSON.stringify(object) + ')';
} // end function



XRepository._createJoinObjects = function(objects, joinObjects) {
    // Instanciate joinObjects if it is undefined.
    joinObjects = joinObjects || {};

    jQuery.each(objects, function(index, array) {
        // Each object should be an array.  If it isn't an array,
        // wrap it with an array so the rest of the logic can proceed.
        if (!Array.is(array))
            array = [array];

        jQuery.each(array, function(index, obj) {
            if (!obj || !obj.constructor)
                return;

            // Add obj to joinObjects for all type names that obj is known by.
            var type = obj.constructor;
            while (type != Object) {
                var name = type.getName();
                joinObjects[name] = joinObjects[name] || [];
                joinObjects[name].push(obj);
                type = XRepository._getBase(type);
            } // end while
        });
    });

    return joinObjects;
} // end function



XRepository._getBase = function(type) {
    if (!Function.is(type))
        return null;
    if (Function.is(type.getBase))
        return type.getBase();
    if (type == Object)
        return null;
    return Object;
} // end function



XRepository._validateRequiredLibraries = function() {
    if (typeof moment != 'function')
        throw new Error('Error in JSRepository: moment.js does not appear to be referenced.  ' +
            'xrepository.js requires moment.js.  Make sure it is referenced ' +
            'before attempting to invoke any methods of JSRepository.');

    // Validate XTools
    if (!XRepository.JSRepository.getName)
        throw new Error('Error in JSRepository: xtools.js does not appear to be referenced.  ' +
            'xrepository.js requires xtools.js.  Make sure it is referenced ' +
            'before attempting to invoke any methods of JSRepository.');

    function getNameTest() {
    } // end function
    if (getNameTest.getName() != 'getNameTest')
        throw new Error('Error in JSRepository: xtools.js appears to be malfunctioning.  ' +
            'Please make sure there are no other libraries overwriting the functions ' +
            'xtools.js declares.');
} // end function



// Create a repository instance to a basic JSRepository if it does not already exist
var repository = repository || new XRepository.JSRepository();