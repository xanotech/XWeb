// xrepository JavaScript Library v0.7
// http://xrepository.com/
//
// Copyright 2015 Xanotech LLC
// Released under the MIT license
// http://xrepository.com/#!License.html

"use strict";

var XRepository = {}; // Namespace object for all XRepository classes



// Constructs a new XRepository.Criterion object with name, operation, and value.
// new XRepository.Criterion(); // name = '', operation = '=', value = null
// new XRepository.Criterion('CustomerId'); // name = 'CustomerId', operation = '=', value = null
// new XRepository.Criterion('CustomerId', 101); // name = 'CustomerId', operation = '=', value = 101
// new XRepository.Criterion('Street', 'LIKE', '%Main%'); // name = 'Street', operation = 'LIKE', value = '%Main%'
XRepository.Criterion = function() {
    this.name = '';
    this.operation = 'EqualTo';
    this.value = null;

    switch(arguments.length) {
        case 0:
            break;
        case 1:
            this.name = arguments[0];
            break;
        case 2:
            this.name = arguments[0];
            this.value = arguments[1];
            break;
        default:
            this.name = arguments[0];
            this.operation = arguments[1];
            this.value = arguments[2];
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



XRepository.Cursor = function(type, criteria, countFunc, fetchFunc) {
    var objects = null;
    var index = 0;

    this.type = type;

    this.cursorData = {
        columns: null,
        criteria: criteria,
        limit: null,
        skip: null,
        sort: null
    };


    this.count = function(applySkipLimit) {
        if (applySkipLimit) {
            var result = this.toArray();
            if (Object.isPromise(result)) {
                var deferred = jQuery.Deferred();
                result.done(function(objects) {
                    deferred.resolve(objects.length);
                });
                return deferred.promise();
            } else
                return result.length;
        } else
            return countFunc(this.type, this.cursorData.criteria);
    } // end function


    this.forEach = function(callback) {
        if (!Function.is(callback))
            return;

        function performForEach(objects) {
            jQuery.each(objects, function(index, obj) {
                callback(obj);
            });
        } // end function

        var result = this.toArray();
        if (Object.isPromise(result))
            result.done(performForEach);
        else
            performForEach(result);
    } // end function


    this.hasNext = function() {
        var size = this.size();
        if (size)
            return index < size;
    } // end function


    this.join = function() {
        objects = null;
        this.joinObjects = XRepository.tools.createJoinObjects(arguments, this.joinObjects);
        return this;
    } // end function


    this.limit = function(rows) {
        if (arguments.length == 0)
            return this.cursorData.limit;

        objects = null;
        if (!Number.is(rows))
            rows = null;
        this.cursorData.limit = rows;
        return this;
    } // end function


    this.map = function(callback) {
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
        if (Object.isPromise(result)) {
            var deferred = jQuery.Deferred();
            result.done(function(objects) {
                deferred.resolve(performMap(objects));
            });
            return deferred.promise();
        } else
            return performMap(result);
    } // end function


    this.next = function() {
        if (!this.hasNext())
            return;

        var array = this.toArray();
        if (Object.isPromise(array))
            array = array.array;
        if (array)
            return array[index++];
    } // end function


    this.size = function() {
        var array = this.toArray();
        if (Object.isPromise(array))
            array = array.array;
        if (array)
            return array.length;
    } // end function


    this.skip = function(rows) {
        if (arguments.length == 0)
            return this.cursorData.skip;

        objects = null;
        if (!Number.is(rows))
            rows = null;
        this.cursorData.skip = rows;
        return this;
    } // end function


    this.sort = function(sortObj) {
        if (arguments.length == 0)
            return this.cursorData.sort;

        objects = null;
        if (arguments.length > 1) {
            sortObj = [];
            jQuery.each(arguments, function(index, arg) {
                if (arg)
                    sortObj.push(arg);
            });
        } // end if

        sortObj = validateSortObj(sortObj);
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


    this.toArray = function() {
        var callback = arguments[0];
        if (objects == null) {
            var result = fetchFunc(this);
            if (Object.isPromise(result))
                result.done(function(array) {
                    result.array = array;
                    if (Function.is(callback))
                        callback(array);
                });
            objects = result;
            index = 0;
        } else if (Function.is(callback)) {
            var array = objects;
            if (Object.isPromise(array))
                array = array.array;
            callback(array);
        } // end if-else
        return objects;
    } // end function


    function validateSortObj(sortObj) {
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
                XRepository.tools.formatObjectForError(sortObj, 'sortObj') + '.');
        return sortObj;
    } // end function

} // end function



XRepository.JSRepository = function(path, isSynchronized) {
    var repo = this;

    path = path || 'Repository';

    // The third argument is an undocumented / hidden argument
    // passed from the recursive constructor call below.
    var cache = arguments[2] || {
        columnMap: {},
        columns: {},
        primaryKeys: {},
        propertyMap: {},
        tableDefinition: {},
        tableName: {},
        types: []
    };

    // Check to see if isSynchronized is a Boolean.  In order to deal with
    // Boolean objects (as opposed to primitives), simply check if the
    // value is not equal to false.  If not, set it to true.  This allows
    // "false" and "new Boolean(false)" to make the repository asynchronized.
    this.isSynchronized = isSynchronized != false;
    this.isUsingLikeForEquals = false;

    // Setup default paths
    this.path = {
        root: path,
        count: 'Count',
        fetch: 'Fetch',
        getColumns: 'GetColumns',
        getPrimaryKeys: 'GetPrimaryKeys',
        getTableDefinition: 'GetTableDefinition',
        remove: 'Remove',
        save: 'Save'
    };

    if (!XRepository.JSRepository.isRecursive) {
        var selfProperty = this.isSynchronized ? 'sync' : 'async';
        var altProperty = !this.isSynchronized ? 'sync' : 'async';

        this[selfProperty] = this;
        XRepository.JSRepository.isRecursive = true;
        this[altProperty] = new XRepository.JSRepository(path, !this.isSynchronized, cache);
        delete XRepository.JSRepository.isRecursive;
        this[altProperty].path = this.path;
    } // end if


    function applyIds(objects, ids) {
        jQuery.each(objects, function(index, obj) {
            var idObj = ids[index];
            if (!idObj)
                return true;

            jQuery.each(idObj, function(property, value) {
                var property = getMappedProperty(obj.constructor, property);
                obj[property] = value;
            });
        });
    } // end function


    function applyJoinObjects(objects, joinObjects) {
        if (!joinObjects)
            return;

        if (Array.is(joinObjects)) {
            var array = joinObjects;
            if (!array.length)
                return;
            var joinObjects = {};
            joinObjects[array[0].constructor.getName()] = array;
        } // end if

        jQuery.each(objects, function(index, obj) {
            jQuery.each(getReferences(obj.constructor), function(index, reference) {
                if (reference.isMultiple)
                    applyMultipleReference(obj, joinObjects, reference);
                else
                    applySingleReference(obj, joinObjects, reference);
            });
        });
    } // end function


    function applyMultipleReference(sourceObj, joinObjects, reference) {
        var targetName = reference.target.getName();
        if (!targetName)
            return;

        var targetJoinObjs = joinObjects[targetName];
        if (!targetJoinObjs)
            return;

        var primaryKey = getIdProperty(sourceObj.constructor);
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


    function applySingleReference(sourceObj, joinObjects, reference) {
        var targetName = reference.target.getName();
        if (!targetName)
            return;

        var targetJoinObjs = joinObjects[targetName];
        if (!targetJoinObjs)
            return;

        var foreignKeyValue = sourceObj[reference.getForeignKey()];
        if (!foreignKeyValue)
            return;

        var primaryKey = getIdProperty(reference.target);
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


    function applyTableNames(objects) {
        jQuery.each(objects, function(index, obj) {
            obj._tableNames = obj._tableNames || getTableNames(obj.constructor);
        });
    } // end function


    function convertToLists(objects) {
        var lists = [];
        if (!objects.length)
            return lists;

        lists.push([]); // End the empty "delimiting" list.

        // The columnsMap contains collections of column names sorted
        // and JSONified as keys mapping to values representing their
        // index in lists.  While iterating over objects, their
        // properties are collected, sorted and stringified.  If the
        // JSON value of the sorted columns collection is not in
        // columnsMap, it is added as a key to the position in lists.
        var columnsMap = {};
        var columnsIndex = 0; // Tracks where next to add columns to lists.
        jQuery.each(objects, function(index, object) {
            var columns = [];
            jQuery.each(object, function(property, value) {
                columns.push(property);
            });
            columns.sort();
            var columnsJson = JSON.stringify(columns);

            if (!columnsMap.hasOwnProperty(columnsJson)) {
                columnsMap[columnsJson] = columnsIndex++;
                lists.splice(columnsMap[columnsJson], 0, columns);
            } // end if

            var list = [];
            list.push(columnsMap[columnsJson]);
            jQuery.each(columns, function(index, column) {
                list.push(object[column]);
            });
            lists.push(list);
        });

        return lists;
    } // end function


    function convertToObjects(lists, type) {
        var objects = [];

        var isDoneWithColumns = false;
        var columnsList = [];
        jQuery.each(lists, function(index, list) {
            if (isDoneWithColumns) {
                if (!list.length)
                    return;

                var object = new type();
                var columns;
                jQuery.each(list, function(index, value) {
                    if (columns) {
                        var mappedProperty = getMappedProperty(type, columns[index - 1]);
                        object[mappedProperty] = value;
                    } else
                        columns = columnsList[value];
                });
                objects.push(object);
            } else {
                if (list.length)
                    columnsList.push(list);
                else
                    isDoneWithColumns = true;
            } // end if
        });

        return objects;
    } // end function


    this.count = function(type, criteria) {
        validateRequiredLibraries();
        rememberType(type, 'type', 'count');
        criteria = validateCriteria(type, criteria, 'count');
        var cursor = createCursor(type, criteria);

        cursor.cursorData.criteria = fixCriteria(cursor.cursorData.criteria);
        var request = jQuery.ajax(repo.path.root + '/' + repo.path.count, {
            async: !repo.isSynchronized,
            cache: false,
            method: 'POST',
            data: {
                tableNames: JSON.stringify(getTableNames(cursor.type)),
                cursor: JSON.stringify(cursor.cursorData)
            }
        });
        return handleResponse(request, function() {
            validateResponse(request, 'count');
            return JSON.parse(request.responseText);
        });
    } // end function


    // Creates an instance of an object with all properties defined and set to null
    // for the type provided.  Entities backed by JSRepository created by new
    // operator may not have any properties until they are saved.  The create
    // method is a substitute for new with the difference being that properties
    // defined by the server will be present (although initialized to null).
    this.create = function(type) {
        validateRequiredLibraries();
        rememberType(type, 'type', 'create');
        var tableNames = getTableNames(type);
        var obj = new type();

        var propertyMap = getPropertyMap(type);
        if (XRepository.tools.getProperties(propertyMap).length)
            return obj;

        obj._tableNames = tableNames;
        jQuery.each(tableNames, function(index, tableName) {
            var columns = getColumns(tableName);
            jQuery.each(columns, function(index, column) {
                var property = getMappedProperty(type, column);
                obj[property] = null;
            });
        });
        return obj;
    } // end function


    function createCursor(type, criteria) {
        return new XRepository.Cursor(type, criteria, repo.count, fetch);
    } // end function


    function createJoinCursor(sourceObjects, reference) {
        var criterion = new XRepository.Criterion();
        criterion.operation = '=';
        if (reference.isMultiple) {
            criterion.name = reference.getForeignKey();
            criterion.value = [];
            jQuery.each(sourceObjects, function(index, obj) {
                criterion.value.push(obj[getIdProperty(reference.source)]);
            });
        } else {
            criterion.name = getIdProperty(reference.target);
            criterion.value = [];
            jQuery.each(sourceObjects, function(index, obj) {
                var value = obj[reference.getForeignKey()];
                if (value != null)
                    criterion.value.push(value);
            });
        } // end if-else
        return repo.find(reference.target, criterion).join(sourceObjects);
    } // end function


    function defineReferenceProperty(reference, propertyName) {
        if (!propertyName) {
            propertyName = reference.target.getName();
            if (reference.isMultiple)
                propertyName = XRepository.tools.pluralize(propertyName);
            propertyName = propertyName.charAt(0).toLowerCase() + propertyName.substring(1);
            reference.propertyName = propertyName;
        } // end if

        if (Object.defineProperty)
            Object.defineProperty(reference.source.prototype, propertyName, {
                get: function() {
                    var value = this['_' + propertyName];
                    if (value)
                        return value;

                    var criteria = {};
                    if (reference.isMultiple)
                        criteria[reference.getForeignKey()] = this[getIdProperty(reference.source)];
                    else
                        criteria[getIdProperty(reference.target)] = this[reference.getForeignKey()];
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


    function drillDown(objects, properties) {
        // Start sourceObjects equal to objects.  It is later moved to
        // the combined values of objects' property (and sub properties).
        var sourceObjects = objects;

        // Loops through all individual property names defined in "string"
        // except the last one (which is the one we're fetching for).
        // For each propertyName, sourceObjects is set to all the objects
        // of sourceObjects returned by that property name.
        jQuery.each(properties, function(index, property) {
            if (!sourceObjects || !sourceObjects.length)
                return false;

            var newSourceObjects = [];
            // Get all objects for propertyName
            jQuery.each(sourceObjects, function(index, object) {
                var value = object[property];
                if (Array.is(value))
                    newSourceObjects.pushArray(value);
                else if (value)
                    newSourceObjects.push(value);
            });
            sourceObjects = newSourceObjects;
        });

        return sourceObjects;
    } // end function


    function executeAsyncJoin(objects, deferreds, index) {
        // Get the deferred to be executed from deferreds.  If undefined,
        // there must not be any more; return cause the job is done.
        var deferred = deferreds[index];
        if (!deferred)
            return;

        var properties = deferred.string.split('.');
        var property = properties.pop();
        var sourceObjects = drillDown(objects, properties);

        if (!sourceObjects || !sourceObjects.length) {
            deferred.resolve();
            executeAsyncJoin(objects, deferreds, index + 1);
        } // end if

        var reference = getJoinReference(sourceObjects[0].constructor, property);
        var cursor = createJoinCursor(sourceObjects, reference).toArray().done(function(joinObjs) {
            joinObjs = XRepository.tools.createJoinObjects(joinObjs);
            // If there isn't an element for the reference target, that means there were
            // no results from the find.  Create an empty element so the property will
            // be populated and not re-fetched when accessed.
            joinObjs[reference.target.getName()] = joinObjs[reference.target.getName()] || [];
            applyJoinObjects(sourceObjects, joinObjs);

            deferred.resolve();
            executeAsyncJoin(objects, deferreds, index + 1);
        });
    } // end function


    function fetch(cursor) {
        cursor.cursorData.criteria = fixCriteria(cursor.cursorData.criteria);

        var tableNames = getTableNames(cursor.type);
        var cursorData = initCursorData(cursor);
        var request = jQuery.ajax(repo.path.root + '/' + repo.path.fetch, {
            async: !repo.isSynchronized,
            cache: false,
            method: 'POST',
            data: {
                tableNames: JSON.stringify(tableNames),
                cursor: JSON.stringify(cursorData)
            }
        });

        return handleResponse(request, function() {
            validateResponse(request, 'toArray');
            var lists = JSON.parse(request.responseText);
            fixPropertyNames(lists);
            fixDateStrings(lists);
            var objects = convertToObjects(lists, cursor.type);

            var joinObjects = fetchStringJoins(objects, cursor);
            if (joinObjects && joinObjects.promises) {
                var deferred = jQuery.Deferred();
                jQuery.when.apply(jQuery, joinObjects.promises).done(function() {
                    applyJoinObjects(objects, joinObjects);
                    deferred.resolve(objects);
                });
                objects.promise = deferred.promise();
            } else
                applyJoinObjects(objects, joinObjects);

            return objects;
        });
    } // end function


    function fetchStringJoins(objects, cursor) {
        var joinObjects = {}; // A copy of cursor.joinObjects minus String + objects

        // Copy all properties except 'String' to joinObjects
        jQuery.each(cursor.joinObjects || {}, function(property, objects) {
            if (property != 'String')
                joinObjects[property] = objects;
        });

        var strings = normalizeStrings(cursor.joinObjects && cursor.joinObjects.String);
        if (!strings || !strings.length)
            return joinObjects;

        if (repo.isSynchronized) {
            jQuery.each(strings, function(index, string) {
                var properties = string.split('.');
                var property = properties.pop();
                var sourceObjects = drillDown(objects, properties);

                if (!sourceObjects || !sourceObjects.length)
                    return false;

                var reference = getJoinReference(sourceObjects[0].constructor, property);
                var joinObjs = createJoinCursor(sourceObjects, reference).toArray();
                joinObjs = XRepository.tools.createJoinObjects(joinObjs);
                // If there isn't an element for the reference target, that means there were
                // no results from the find.  Create an empty element so the property will
                // be populated and not re-fetched when accessed.
                joinObjs[reference.target.getName()] = joinObjs[reference.target.getName()] || [];
                applyJoinObjects(sourceObjects, joinObjs);
            });
        } else {
            // The repository is asynchronous, for each string, create a promise which
            // will do the work of fetching the properties' values.  Each promise starts
            // the next and assumes the previous is done.  The first promise should not
            // need the previous done and will be initiated after the promises are all
            // constructed and added to joinObjects.promises.
            joinObjects.promises = [];
            var deferreds = [];
            jQuery.each(strings, function(index, string) {
                var deferred = jQuery.Deferred();
                deferred.string = string;
                deferreds.push(deferred);
                var promise = deferred.promise();
                joinObjects.promises.push(promise);
            });

            if (deferreds.length)
                executeAsyncJoin(objects, deferreds, 0);
        } // end if

        return joinObjects;
    } // end function


    this.find = function(type, criteria) {
        validateRequiredLibraries();
        rememberType(type, 'type', 'find');
        criteria = validateCriteria(type, criteria, 'find');
        return createCursor(type, criteria);
    } // end function


    function findForeignKeyProperty(referencedType, referencingType) {
        var idProperty = getIdProperty(referencedType);
        var vanillaIdProperty = idProperty;

        // If the idProperty without any table names is the same as vanilla idProperty,
        // then they key name is "simple" (like "Id" or "Code").  If that's the case
        // then only check for referencingType columns if the simple idProperty does
        // not match the idProperty of the referencingType.
        var tableNames = getTableNames(referencedType);
        jQuery.each(tableNames, function(index, tableName) {
            var tableDef = getTableDefinition(tableName);
            tableName = tableDef.TableName;
            idProperty = idProperty.removeIgnoreCase(tableName);
        });
        if (idProperty != vanillaIdProperty ||
            idProperty != getIdProperty(referencingType)) {
            var column = findProperty(referencingType, vanillaIdProperty);
            if (column)
                return column;
        } // end if

        return findProperty(referencingType, referencedType.getName() + idProperty);
    } // end function


    this.findOne = function(type, criteria) {
        validateRequiredLibraries();
        var result = repo.find(type, criteria).limit(1).toArray();
        if (Object.isPromise(result)) {
            var deferred = jQuery.Deferred();
            result.done(function(objects) {
                deferred.resolve(objects[0] || null);
            });
            return deferred.promise();
        } else
            return result[0] || null;
    } // end function


    function findProperty(type, columnName) {
        if (!columnName)
            return null;

        var tableNames = getTableNames(type);
        if (!tableNames.length)
            return null;

        var columns = getColumns(tableNames[0]);
        var result = null;
        jQuery.each(columns, function(index, column) {
            var propertyName = getMappedProperty(type, column);
            if (propertyName.is(columnName)) {
                result = propertyName;
                return false;
            } // end if
        });
        return result;
    } // end function


    function fixCriteria(criteria) {
        if (!criteria)
            return null;

        var newCriteria = [];
        jQuery.each(criteria, function(index, criterion) {
            criterion = new XRepository.Criterion(criterion.name,
                criterion.operation, criterion.value);
            if (!criterion.operation)
                criterion.operation = '=';

            criterion.operation = criterion.operation.trim().toUpperCase();
            switch (criterion.operation) {
                case '=':
                case '==':
                case 'EQUALTO':
                    criterion.operation = 'EqualTo';
                    break;
                case '>':
                case 'GREATERTHAN':
                    criterion.operation = 'GreaterThan';
                    break;
                case '>=':
                case 'GREATERTHANOREQUALTO':
                    criterion.operation = 'GreaterThanOrEqualTo';
                    break;
                case '<':
                case 'LESSTHAN':
                    criterion.operation = 'LessThan';
                    break;
                case '<=':
                case 'LESSTHANOREQUALTO':
                    criterion.operation = 'LessThanOrEqualTo';
                    break;
                case '<>':
                case '!=':
                case 'NOTEQUALTO':
                    criterion.operation = 'NotEqualTo';
                    break;
                case 'LIKE':
                    criterion.operation = 'Like';
                    break;
                case 'NOT LIKE':
                    criterion.operation = 'NotLike';
                    break;
                default:
                    throw new Error('operation value "' + str + '" is invalid.  ' +
                        'Acceptable values are: =, >, >=, <, <=, !=, LIKE, NOT LIKE (== and <> are also accepted).');
            } // end switch

            if (repo.isUsingLikeForEquals) {
                if (criterion.operation == 'EqualTo')
                    criterion.operation = 'Like';
                if (criterion.operation == 'NotEqualTo')
                    criterion.operation = 'NotLike';
            } // end if

            newCriteria.push(criterion);
        });
        return newCriteria;
    } // end function


    function fixDateObjects(objects) {
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


    function fixDateStrings(lists) {
        jQuery.each(lists, function(index, list) {
            jQuery.each(list, function(index, value) {
                if (String.is(value)) {
                    var date = XRepository.tools.convertStringToDate(value);
                    if (date)
                        list[index] = date;
                } // end if
            });
        });
    } // end function


    function fixPropertyNames(lists) {
        // Remove the name from the reader's schema.  Fields with
        // the same name in multiple tables selected (usually the
        // primary key) will be preceded by the table name and a ".".
        // For instance, if Employee extends from Person, the names
        // "Person.Id" and "Employee.Id" will be column names.
        // Strip the preceding table name and ".".
        jQuery.each(lists, function(index, list) {
            // An empty list inside of array delimits the columns
            // from actual values.  When encountered, then processing
            // is complete (names to be fixed are in columns only).
            if (!list.length)
                return false;

            jQuery.each(list, function(index, property) {
                var dotIndex = property.lastIndexOf('.');
                if (dotIndex == -1)
                    return;

                var newProperty = property.substring(dotIndex + 1);
                list[index] = newProperty;
            });
        });
    } // end function


    function getCachedValue(cacheName, tableName, isSynchronized) {
        var tableName = tableName.toUpperCase();
        var cachedValue = cache[cacheName][tableName];
        if (cachedValue)
            if (Error.is(cachedValue))
                throw cachedValue;
            else
                return cachedValue;

        var lookupPath = 'get' + cacheName[0].toUpperCase() + cacheName.slice(1);
        lookupPath = repo.path.root + '/' + repo.path[lookupPath];
        var request = jQuery.ajax(lookupPath, {
            async: !isSynchronized,
            cache: false,
            method: 'POST',
            data: { tableName: tableName }
        });

        function cacheResult() {
            try {
                validateResponse(request);
                var value = JSON.parse(request.responseText)
                cache[cacheName][tableName] = value;
                return value;
            } catch (e) {
                cache[cacheName][tableName] = e;
                throw e;
            } // end try catch
        } // end function

        if (isSynchronized)
            return cacheResult();
        else {
            var deferred = jQuery.Deferred();
            request.always(function() {
                try {
                    deferred.resolve(cacheResult());
                } catch (e) {
                    deferred.reject(e);
                } // end try-catch
            });
            return deferred.promise();
        } // end if-else
    } // end function


    function getColumns(tableName) {
        return getCachedValue('columns', tableName, true);
    } // end function


    function getIdProperty(type) {
        var keys = getPrimaryKeys(type);
        if (keys.length != 1)
            return null;
        return keys[0];
    } // end function


    function getJoinReference(type, property) {
        var reference = getReference(type, property);
        if (!reference)
            throw new Error('Error in join parameter "' + string + '".  ' +
                type.getName() + ' does not have a reference named "' +
                property + '".');
        return reference;
    } // end function


    function getMappedColumn(type, propertyName) {
        while (type != Object) {
            var columnMap = cache.columnMap[type.getName()];
            if (columnMap) {
                var mappedColumn;
                jQuery.each(columnMap, function(column, property) {
                    if (property == propertyName) {
                        mappedColumn = column;
                        return false;
                    } // end if
                });
                if (mappedColumn)
                    return mappedColumn;
            }
            type = XRepository.tools.getBase(type);
        } // end while
        return propertyName;
    } // end function


    function getMappedProperty(type, columnName) {
        var column = columnName.toUpperCase();

        // Get propertyMap now since I'm going to jack with type
        var propertyMap = getPropertyMap(type);

        // Scan through references looking for a mapping
        // for this column and return immediately if found.
        while (type != Object) {
            var columnMap = cache.columnMap[type.getName()];
            if (columnMap) {
                var propertyName = columnMap[column];
                if (propertyName)
                    return propertyName;
            } // end if
            type = XRepository.tools.getBase(type);
        } // end while

        // At this point, the columnName was not explicitly mapped so see if it's
        // contained in propertyMap.  If not, just return the original columnName.
        var property = propertyMap[column];
        return property || columnName;
    } // end function


    function getPrimaryKeys(typeOrTable) {
        if (String.is(typeOrTable))
            return getCachedValue('primaryKeys', typeOrTable, true);

        if (Function.is(typeOrTable)) {
            var tableNames = getTableNames(typeOrTable);
            if (tableNames.length == 0)
                return null;

            var keys = [];
            var columns = getPrimaryKeys(tableNames[0]);
            jQuery.each(columns, function(index, column) {
                keys.push(getMappedProperty(typeOrTable, column));
            });
            return keys;
        } // end if
    } // end function


    function getPropertyMap(type) {
        var typeName = type.getName();
        if (cache.propertyMap[typeName])
            return cache.propertyMap[typeName];

        var obj = new type();
        var propertyMap = {};
        jQuery.each(obj, function(property) {
            if (!Function.is(obj[property]))
                propertyMap[property.toUpperCase()] = property;
        });

        return cache.propertyMap[typeName] = propertyMap;
    } // end function


    function getReference(type, propertyName) {
        var result;
        jQuery.each(getReferences(type), function(index, reference) {
            if (reference.propertyName == propertyName) {
                result = reference;
                return false;
            } // end if
        });
        return result;
    } // end function


    function getReferences(type) {
        var references = [];
        while (Function.is(type) && type != Object) {
            if (type._references)
                references.pushArray(type._references);
            type = XRepository.tools.getBase(type);
        } // end while
        return references;
    } // end function


    function getTableDefinition(tableName) {
        return getCachedValue('tableDefinition', tableName, true);
    } // end function


    function getTableNames(type, isSilent) {
        var typeName = type.getName();
        if (cache.tableName[typeName])
            return cache.tableName[typeName];

        var tableNames = [];
        while (type != Object) {
            try {
                var tableDef = getTableDefinition(type.getName());
                tableNames.push(tableDef.FullName);
            } catch (e) {
                // Look at the caught error.  If the message indicates an actual
                // missing table, swallow it.  The underlying server code throws
                // the exception deliberately.  getTableNames will throw an
                // exception if no tables are found.  If the error is something else,
                // throw it.
                if (!(e.message &&
                    e.message.startsWith('The table') &&
                    e.message.endsWith('is not a valid table.')))
                    throw e;
            } // end try-catch

            type = XRepository.tools.getBase(type);
        } // end while
        if (!tableNames.length && !isSilent)
            throw new Error('There are no tables associated with "' + typeName + '".')

        tableNames.reverse();
        return cache.tableName[typeName] = tableNames;
    } // end function


    function handleResponse(request, handle) {
        if (repo.isSynchronized)
            return handle();
        else {
            var deferred = jQuery.Deferred();
            request.done(function() {
                var result = handle();
                if (result && Object.isPromise(result.promise))
                    result.promise.done(function() {
                        delete result.promise; // Remove the promise property added to result
                        deferred.resolve(result);
                    });
                else
                    deferred.resolve(result);
            });
            return deferred.promise();
        } // end if-else
    } // end function


    this.init = function() {
        // Look at all arguments.  For each argument that is a type
        // (or an array of types), remember that type.
        jQuery.each(arguments, function(index, arg) {
            var array = Array.is(arg) ? arg : [arg];
            jQuery.each(array, function(index, type) {
                rememberType(type);
            });
        });

        if (this.isSynchronized) {
            jQuery.each(cache.types, function(index, type) {
                try {
                    jQuery.each(getTableNames(type), function(index, tableName) {
                        getColumns(tableName);
                        getPrimaryKeys(tableName);
                        getTableDefinition(tableName);
                    });
                } catch (e) {
                    // If there are any errors associated with any types
                    // or tableNames, just swallow and move on because
                    // init should not stop.  The init method is fairly
                    // aggressive in attempting to lookup types and many
                    // are expected to throw errors.
                } // end try-catch
            });
        } else {
            // As is typical of asynchronous operations, the asynchronous
            // init process is somewhat complex.  It essentially involves
            // creating a mainDeferred that represents the entire effort
            // with its promise returned.  The process itself involves
            // two phases.  The first phase looks up the tableDefinitions
            // for all remembered types.  The second phase uses those
            // tableDefinitions to lookup their associated columns and
            // primaryKeys.  When all the requests for columns and
            // primaryKeys are done, the mainDeferred is resolved.
            var mainDeferred = jQuery.Deferred();

            // Waits for all requests to finish successfully and then looks up
            // the columns and primaryKeys for each tableName.  Because
            // jQuery's when immediately calls fail or always when any one
            // of the requests passed to it fails, the logic of waiting is
            // put inside a method.  The initial call occurs after the
            // intially populating requests, but if any requests fail,
            // that request is removed from requests and waitForRequests
            // is called again.
            function waitForRequests() {
                jQuery.when.apply(jQuery, requests).done(function() {
                    requests = [];
                    jQuery.each(tableNames, function(index, tableName) {
                        var value = getCachedValue('columns', tableName, false);
                        if (Object.isPromise(value))
                            requests.push(value);

                        value = getCachedValue('primaryKeys', tableName, false);
                        if (Object.isPromise(value))
                            requests.push(value);

                        // Get the tableDefinition again.  This time, tableName
                        // will be a "full name" (schema.table).  Fetching it
                        // again with full name should ensure that all metadata
                        // is fully cached prior to use.
                        value = getCachedValue('tableDefinition', tableName, false);
                        if (Object.isPromise(value))
                            requests.push(value);
                    });
                    jQuery.when.apply(jQuery.requests).always(mainDeferred.resolve);
                });
            } // end function

            var requests = [];
            var tableNames = [];
            jQuery.each(cache.types, function(index, type) {
                try {
                    var value = getCachedValue('tableDefinition', type.getName(), false);
                } catch (e) {
                    return;
                    // Exit the loop.  Sometimes getCachedValue throws an error.
                    // These errors typically occur when it attempts to lookup
                    // base tables that don't have corresponding tables.
                    // Just swallow it because we don't want init to stop.
                    // If any of the persistence methods are called for
                    // entities that truly don't have tables, errors will
                    // be thrown then.
                } // end try-catch

                if (Object.isPromise(value)) {
                    requests.push(value);
                    value.done(function(tableDef) {
                        tableNames.push(tableDef.FullName);
                    }).fail(function() {
                        // Remove the failed request from requests and re-wait.
                        requests.splice(requests.indexOf(value), 1);
                        waitForRequests();
                    });
                } else
                    tableNames.push(value.FullName);
            });

            waitForRequests();

            return mainDeferred.promise();
        } // end if-else
    } // end function


    function initCursorData(cursor) {
        // Clone cursor data (so the original remains untouched)
        var cursorData = JSON.parse(JSON.stringify(cursor.cursorData));

        // This next block of code populates columns based on the properties
        // of the cursor's type and their mapped column name (assuming cursor.type
        // is a Function / "class" and when constructed it contains properties).
        var propertyMap = getPropertyMap(cursor.type);
        if (XRepository.tools.getProperties(propertyMap).length) {
            var columns = [];
            var tableNames = getTableNames(cursor.type);
            var allColumns = {}; // Map of column names keyed by their upper-case value
            jQuery.each(tableNames, function(index, tableName) {
                jQuery.each(getColumns(tableName), function(index, column) {
                    allColumns[column.toUpperCase()] = column;
                });
            });

            jQuery.each(propertyMap, function(propertyUpperCase, property) {
                var column = getMappedColumn(cursor.type, property);
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
                sort[getMappedColumn(cursor.type, property)] = value;
            });
        cursorData.sort = sort;

        return cursorData;
    } // end function


    function isValidColumn(type, columnName) {
        var isValid = false;
        jQuery.each(getTableNames(type), function(index, tableName) {
            jQuery.each(getColumns(tableName), function(index, column) {
                isValid = column.is(columnName);
                return !isValid;
            });
            return !isValid;
        });
        return isValid;
    } // end function


    this.mapColumn = function(type, propertyName, columnName) {
        validateRequiredLibraries();
        rememberType(type, 'type', 'mapColumn');
        if (!String.is(propertyName))
            throw new Error('Error in JSRepository.mapColumn: propertyName argument is missing or is not a String.');
        if (!String.is(columnName))
            throw new Error('Error in JSRepository.mapColumn: columnName argument is missing or is not a String.');

        if (!isValidColumn(type, columnName))
            throw new Error('The columnName "' + columnName + '" does not exist.');

        var typeName = type.getName();
        columnName = columnName.toUpperCase();
        cache.columnMap[typeName] = cache.columnMap[typeName] || {};
        cache.columnMap[typeName][columnName] = propertyName;
    } // end function


    this.mapMultipleReference = function(source, target, foreignKey, propertyName) {
        validateRequiredLibraries();
        rememberType(source, 'source', 'mapMultipleReference');
        rememberType(target, 'target', 'mapMultipleReference');

        var ref = new XRepository.Reference(source, target, findForeignKeyProperty);
        ref.foreignKey = foreignKey;
        ref.isMultiple = true;

        defineReferenceProperty(ref, propertyName);
    } // end function


    this.mapSingleReference = function(source, target, foreignKey, propertyName) {
        validateRequiredLibraries();
        rememberType(source, 'source', 'mapSingleReference');
        rememberType(target, 'target', 'mapSingleReference');

        var ref = new XRepository.Reference(source, target, findForeignKeyProperty);
        ref.foreignKey = foreignKey;

        defineReferenceProperty(ref, propertyName);
    } // end function


    this.mapTable = function(type, tableName) {
        validateRequiredLibraries();
        rememberType(type, 'type', 'mapTable');
        if (!String.is(tableName))
            throw new Error('Error in JSRepository.mapTable: tableName argument is missing or is not a String.');

        if (this.isSynchronized)
            getTableDefinition(tableName); // Validates passed tableName

        var tableNames = [];
        var baseType = XRepository.tools.getBase(type);
        if (baseType != Object)
            tableNames = tableNames.concat(getTableNames(baseType, true));
        tableNames.push(tableName);
        cache.tableName[type.getName()] = tableNames;
    } // end function


    function normalizeStrings(strings) {
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


    function rememberType(type, argumentName, methodName) {
        if (!Function.is(type))
            throw new Error('Error in JSRepository.' + methodName +
                ': ' + argumentName + ' argument was not initialized or was not a function\n' +
                XRepository.tools.formatObjectForError(argument, argumentName) + '.');

        while (type != Object) {
            if (cache.types.indexOf(type) == -1)
                cache.types.push(type);
            type = XRepository.tools.getBase(type);
        } // end while
    } // end function


    this.remove = function(objects) {
        validateRequiredLibraries();
        if (Object.isBasic(objects))
            throw new Error('Error in JSRepository.remove: objects argument cannot be a basic type ' +
                'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
                XRepository.tools.formatObjectForError(objects, 'objects') + '.');

        if (XRepository.Cursor.is(objects)) {
            objects = objects.toArray();
            if (Object.isPromise(objects)) {
                var deferred = jQuery.Deferred();
                objects.done(function(objs) {
                    repo.remove(objs).done(deferred.resolve);
                });
                return deferred.promise();
            } // end if
        } // end if

        if (!Array.is(objects))
            objects = [objects];

        validateEntityArray(objects, 'remove');
        applyTableNames(objects);
        objects = removeExtraneousProperties(objects);
        fixDateObjects(objects);
        var lists = convertToLists(objects);
        var request = jQuery.ajax(repo.path.root + '/' + repo.path.remove, {
            async: !repo.isSynchronized,
            cache: false,
            method: 'POST',
            data: { data: JSON.stringify(lists) }
        });
        return handleResponse(request, function() {
            validateResponse(request, 'remove');
        });
    } // end function


    function removeExtraneousProperties(objects) {
        if (!Array.is(objects))
            objects = [objects];

        var cleanObjs = [];
        jQuery.each(objects, function(index, obj) {
            if (Object.isBasic(obj) || Array.is(obj))
                return true;

            // Set all properties to upper case
            var upperCaseObj = {};
            jQuery.each(obj, function(property, value) {
                upperCaseObj[property.toUpperCase()] = value;
            });

            var cleanObj = {};
            cleanObj._tableNames = obj._tableNames;
            jQuery.each(cleanObj._tableNames, function(index, tableName) {
                var columns = getColumns(tableName);
                jQuery.each(columns, function(index, column) {
                    var upperCaseColumn = column.toUpperCase();
                    var property = getMappedProperty(obj.constructor, upperCaseColumn);

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


    this.save = function(objects) {
        validateRequiredLibraries();
        if (Object.isBasic(objects))
            throw new Error('Error in JSRepository.save: objects argument cannot be a basic type ' +
                'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
                XRepository.tools.formatObjectForError(objects, 'objects') + '.');

        if (XRepository.Cursor.is(objects)) {
            objects = objects.toArray();
            if (Object.isPromise(objects)) {
                var deferred = jQuery.Deferred();
                objects.done(function(objs) {
                    repo.save(objs).done(deferred.resolve);
                });
                return deferred.promise();
            } // end if
        } // end if

        if (!Array.is(objects))
            objects = [objects];

        validateEntityArray(objects, 'save');
        applyTableNames(objects);
        var cleanObjects = removeExtraneousProperties(objects);
        fixDateObjects(cleanObjects);
        var lists = convertToLists(cleanObjects);
        var request = jQuery.ajax(repo.path.root + '/' + repo.path.save, {
            async: !repo.isSynchronized,
            cache: false,
            method: 'POST',
            data: { data: JSON.stringify(lists) }
        });
        return handleResponse(request, function() {
            validateResponse(request, 'save');
            var ids = JSON.parse(request.responseText);
            applyIds(objects, ids);
            return objects;
        });
    } // end function


    function validateCriteria(type, criteria, methodName) {
        // Note: Can't use simple "if (criteria)" checking since criteria could possibly be false boolean.
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
            var idProperty = getIdProperty(type);
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
            validateCriterionArray(criteria, methodName);
        else
            criteria = XRepository.Criterion.create(criteria);

        jQuery.each(criteria, function(index, criterion) {
            criterion.name = getMappedColumn(type, criterion.name);
        });

        return criteria;
    } // end function


    function validateCriterionArray(array, methodName) {
        jQuery.each(array, function(index, element) {
            if (XRepository.Criterion.is(element))
                return;
            if (!element['name'] || !element['operation'])
                throw new Error('Error in JSRepository.' + methodName + ': element ' + index +
                    ' in criteria array missing name and / or operation properties\n' +
                    XRepository.tools.formatObjectForError(element, 'array[' + index + ']') + '.');
        });
    } // end function


    function validateEntityArray(objects, methodName) {
        jQuery.each(objects, function(index, obj) {
            if (Object.isBasic(obj))
                throw new Error('Error in JSRepository.' + methodName +
                    ': element ' + index + ' in objects ' +
                    'array is either basic (ie String, Number, etc), undefined or null ' +
                    'and must instead be an entity object\n' +
                    XRepository.tools.formatObjectForError(obj, 'objects[' + index + ']') + '.');
        });
    } // end function


    function validateRequiredLibraries() {
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


    function validateResponse(ajaxRequest, methodName) {
        if (ajaxRequest.status == 500) {
            var error;
            try {
                var errorObj = JSON.parse(ajaxRequest.responseText);
                error = new Error(errorObj.message || '');
                error.serverStack = errorObj.stack || '';
            } catch (e) {
                // Looks like JSON.parse failed.
                error = new Error('Error in JSRepository.' + methodName +
                    ': unable to parse server error response.  Response data...\n' +
                    ajaxRequest.responseText);
            } // end try-catch
            throw error;
        } // end if
    } // end function

} // end function



XRepository.Reference = function(source, target, findForeignKeyProperty) {
    this.source = source;
    this.target = target;

    this.foreignKey = null;
    this.propertyName = null;
    this.isMultiple = false;

    source._references = source._references || [];
    source._references.push(this);


    this.getForeignKey = function() {
        this.foreignKey = this.foreignKey || (this.isMultiple ?
            findForeignKeyProperty(this.source, this.target) :
            findForeignKeyProperty(this.target, this.source));
        return this.foreignKey;
    } // end function

} // end function



XRepository.tools = {}



XRepository.tools.convertStringToDate = function(string) {
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



XRepository.tools.createJoinObjects = function(objects, joinObjects) {
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
                type = XRepository.tools.getBase(type);
            } // end while
        });
    });

    return joinObjects;
} // end function



XRepository.tools.formatObjectForError = function(object, objectName) {
    return '(typeof ' + objectName + ' = ' + typeof object + ', ' +
        objectName + ' = ' + JSON.stringify(object) + ')';
} // end function



XRepository.tools.getBase = function(type) {
    if (!Function.is(type))
        return null;
    if (Function.is(type.getBase))
        return type.getBase();
    if (type == Object)
        return null;
    return Object;
} // end function



XRepository.tools.getProperties = function(obj) {
    var properties = [];
    jQuery.each(obj, function(property) {
        properties.push(property);
    });
    return properties;
} // end function



XRepository.tools.pluralize = function(word) {
    if (typeof owl != 'undefined' && owl.pluralize)
        return owl.pluralize(word);
    else if (word.endsWith('s') || word.endsWith('x'))
        return word + 'es';
    else if (word.endsWith('y'))
        return word.substring(0, word.length - 1) + 'ies';
    else
        return word + 's';
} // end function



// Create a repository instance to a basic JSRepository if it does not already exist
var repository = repository || new XRepository.JSRepository();