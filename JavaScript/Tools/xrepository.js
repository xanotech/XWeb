/* xrepository JavaScript Library v0.1.1
 * http://xrepository.com/
 *
 * Copyright 2014 Xanotech LLC
 * Released under the MIT license
 * http://xrepository.com/#!License.html
 */



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



XRepository.Criterion.prototype._fixOperation = function() {
    if (!this.Operation) {
        this.Operation = 'EqualTo';
        return;
    } // end if

    this.Operation = this.Operation.trim();

    switch (this.Operation.toUpperCase()) {
        case '=':
        case '==':
        case 'EQUALTO':
            this.Operation = 'EqualTo';
            break;
        case '>':
        case 'GREATERTHAN':
            this.Operation = 'GreaterThan';
            break;
        case '>=':
        case 'GREATERTHANOREQUALTO':
            this.Operation = 'GreaterThanOrEqualTo';
            break;
        case '<':
        case 'LESSTHAN':
            this.Operation = 'LessThan';
            break;
        case '<=':
        case 'LESSTHANOREQUALTO':
            this.Operation = 'LessThanOrEqualTo';
            break;
        case '<>':
        case '!=':
        case 'NOTEQUALTO':
            this.Operation = 'NotEqualTo';
            break;
        case 'LIKE':
            this.Operation = 'Like';
            break;
        case "NOT LIKE":
            this.Operation = 'NotLike';
            break;
        default:
            throw new FormatException("OperationType string \"" + str + "\" is invalid.  " +
                "Acceptable values are: =, >, >=, <, <=, !=, LIKE, NOT LIKE (== and <> are also accepted).");
    } // end switch
} // end function



XRepository.Cursor = function(type, criteria, repository) {
    // If criteria is a function, go ahead and call it (the caller must be
    // trying to do something clever).  But if its still a function after that,
    // just set criteria to null because functions just won't cut it as criteria.
    if (typeof criteria == 'function')
        criteria = criteria();
    if (typeof criteria == 'function')
        criteria = null;

    if (Object.isBasic(criteria)) {
        var idColumn = repository._getIdColumn(type);
        if (!idColumn) {
            var value = '' + criteria;
            if (criteria.constructor == String || criteria.constructor == Date)
                value = '"' + value + '"';
            var methodName = arguments.callee.caller.getName();
            throw 'Error in JSRepository.' + methodName + ': ' + methodName + '(' +
                type.getName() + ', ' + JSON.stringify(value) +
                ') method cannot be used for ' + type.getName() +
                ' because does not have a single column primary key.';
        } // end if
        criteria = new XRepository.Criterion(idColumn, criteria);
    } // end if

    if (!criteria)
        criteria = [];
    if (criteria instanceof XRepository.Criterion)
        criteria = [criteria];

    if (criteria instanceof Array)
        this._validateCriterionArray(criteria);
    else
        criteria = XRepository.Criterion.create(criteria);

    this.type = type;
    this.repository = repository;
    this.data = null;
    this.index = 0;

    this.cursorData = {};
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
    if (typeof callback != 'function')
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



XRepository.Cursor.prototype.limit = function(rows) {
    if (arguments.length == 0)
        return this.cursorData.limit;

    this.data = null;
    if (!rows || rows.constructor != Number)
        rows = null;
    this.cursorData.limit = rows;
    return this;
} // end function



XRepository.Cursor.prototype.map = function(callback) {
    if (typeof callback != 'function')
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
    if (!rows || rows.constructor != Number)
        rows = null;
    this.cursorData.skip = rows;
    return this;
} // end function



XRepository.Cursor.prototype.sort = function(sortObj) {
    if (arguments.length == 0)
        return this.cursorData.sort;

    this.data = null;
    if (arguments.length = 0 || !sortObj)
        sortObj = null;

    if (arguments > 1) {
        sortObj = [];
        for (var a = 0; a < arguments.length; a++)
            if (arguments[a])
                sortObj.push(arguments[a]);
    } // end if

    sortObj = this._validateSortObj(sortObj);
    if (sortObj)
        jQuery.each(sortObj, function(property, value) {
            if (typeof value == 'number') {
                if (value > 0)
                    value = 1;
                else if (value < 0)
                    value = -1;
            } else
                sortObj[property] = value ? 1 : 0;
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



XRepository.Cursor.prototype._validateCriterionArray = function(array) {
    jQuery.each(array, function(index, element) {
        if (element instanceof XRepository.Criterion)
            return;
        if (!element['Name'] || !element['Operation'])
            throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': element ' + index +
                ' in criteria array missing Name and / or Operation properties\n' +
                '(element = ' + JSON.stringify(element) + ').';
    });
} // end function



XRepository.Cursor.prototype._validateSortObj = function(sortObj) {
    if (!sortObj)
        return sortObj;

    if (sortObj.constructor == String)
        sortObj = [sortObj];

    var isValid = !Object.isBasic(sortObj);

    if (isValid && sortObj instanceof Array) {
        var newSortObj = {};
        jQuery.each(sortObj, function(index, element) {
            if (!element || element.constructor != String)
                return isValid = false;
            newSortObj[element] = 1;
        });
        if (isValid)
            sortObj = newSortObj;
    } // end if

    if (!isValid)
        throw 'Error in JSRepository.sort: sortObj parameter was not valid.  ' +
            'The sortObj parameter must be a String, an array of Strings, ' +
            'or an object where properties are numbers\n' +
            '(typeof sortObj = ' + typeof sortObj + ', sortObj = ' + JSON.stringify(sortObj) + ').';
    return sortObj;
} // end function



XRepository.JSRepository = function(path, isSynchronized) {
    if (!path)
        path = 'Repository';
    if (typeof isSynchronized != 'boolean' ||
        isSynchronized.constructor != Boolean)
        isSynchronized = true;

    this._columnsCache = {};
    this._primaryKeysCache = {};
    this._tableDefinitionCache = {};
    this.isSynchronized = isSynchronized;

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

    if (arguments.callee.caller == XRepository.JSRepository)
        return;

    var selfProperty = isSynchronized ? 'sync' : 'async';
    var altProperty = !isSynchronized ? 'sync' : 'async';

    this[selfProperty] = this;
    this[altProperty] = new XRepository.JSRepository(path, false);
    this[altProperty].path = this.path;
} // end function



XRepository.JSRepository.prototype.count = function(type, criteria) {
    XRepository._validateRequiredLibraries();
    this._validateTypeParameter('type', type);
    var cursor = new XRepository.Cursor(type, criteria, this)

    jQuery.each(cursor.cursorData.criteria, function(index, criterion) {
        criterion._fixOperation();
    });
    var request = jQuery.ajax(this.path.root + '/' + this.path.count, {
        async: !this.isSynchronized,
        cache: false,
        data: {
            tableNames: JSON.stringify(this._getTableNames(cursor.type)),
            cursor: JSON.stringify(cursor.cursorData)
        }
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request);
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
    this._validateTypeParameter('type', type);
    var tableNames = this._getTableNames(type);
    var obj = new type();
    obj._tableNames = tableNames;
    var repo = this;
    jQuery.each(tableNames, function(index, tableName) {
        var columns = repo._getColumns(tableName);
        jQuery.each(columns, function(index, column) {
            obj[column] = null;
        });
    });
    return obj;
} // end function



XRepository.JSRepository.prototype.find = function(type, criteria) {
    XRepository._validateRequiredLibraries();
    this._validateTypeParameter('type', type);
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



XRepository.JSRepository.prototype.mapMultipleReference = function(source, target, foreignKey, methodName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeParameter('source', source);
    this._validateTypeParameter('target', target);

    if (!methodName) {
        methodName = target.getName();
        if (owl && owl.pluralize)
            methodName = owl.pluralize(methodName);
        else {
            if (methodName.endsWith('s'))
                methodName += 'es';
            else
                methodName += 's';
        } // end if
        methodName = 'get' + methodName;
    } // end if

    var repo = this;
    source.prototype[methodName] = function() {
        var objects = this['_' + methodName];
        if (objects)
            return objects;

        var criteria = {};
        if (!foreignKey)
            foreignKey = repo._findForeignKeyColumn(source, target);
        criteria[foreignKey] = this[repo._getIdColumn(source)];
        objects = repo.sync.find(target, criteria).toArray();
        this['_' + methodName] = objects;
        return objects;
    } // end function
} // end function



XRepository.JSRepository.prototype.mapSingleReference = function(source, target, foreignKey, methodName) {
    XRepository._validateRequiredLibraries();
    this._validateTypeParameter('source', source);
    this._validateTypeParameter('target', target);

    if (!methodName) {
        methodName = target.getName();
        methodName = 'get' + methodName;
    } // end if

    var repo = this;
    source.prototype[methodName] = function() {
        var objects = this['_' + methodName];
        if (objects)
            return objects[0] || null;

        var criteria = {};
        if (!foreignKey)
            foreignKey = repo._findForeignKeyColumn(target, source);
        criteria[repo._getIdColumn(target)] = this[foreignKey];
        var objects = repo.sync.find(target, criteria).toArray();
        this['_' + methodName] = objects;
        return objects[0] || null;
    } // end function
} // end function



XRepository.JSRepository.prototype.remove = function(objects) {
    XRepository._validateRequiredLibraries();
    if (Object.isBasic(objects))
        throw 'Error in JSRepository.remove: objects parameter cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            '(typeof objects = ' + typeof objects + ', objects = ' + JSON.stringify(objects) + ').';
    if (!objects)
        return;

    if (objects instanceof XRepository.Cursor) {
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

    if (!(objects instanceof Array))
        objects = [objects];

    this._validateEntityArray(objects);
    this._applyTableNames(objects);
    objects = this._removeExtraneousProperties(objects);
    var request = jQuery.ajax(this.path.root + '/' + this.path.remove, {
        async: !this.isSynchronized,
        cache: false,
        data: { data: JSON.stringify(objects) },
        type: 'POST'
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request);
    });
} // end function



XRepository.JSRepository.prototype.save = function(objects) {
    XRepository._validateRequiredLibraries();
    if (Object.isBasic(objects))
        throw 'Error in JSRepository.save: objects parameter cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            '(typeof objects = ' + typeof objects + ', objects = ' + JSON.stringify(objects) + ').';
    if (!objects)
        return;

    if (objects instanceof XRepository.Cursor) {
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

    if (!(objects instanceof Array))
        objects = [objects];

    this._validateEntityArray(objects);
    this._applyTableNames(objects);
    var cleanObjects = this._removeExtraneousProperties(objects);
    var request = jQuery.ajax(this.path.root + '/' + this.path.save, {
        async: !this.isSynchronized,
        cache: false,
        data: { data: JSON.stringify(cleanObjects) },
        type: 'POST'
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request);
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
            obj[property] = value;
        });
    });
} // end function



XRepository.JSRepository.prototype._applyTableNames = function(objects) {
    var repo = this;
    jQuery.each(objects, function(index, obj) {
        if (!obj._tableNames)
            obj._tableNames = repo._getTableNames(obj.constructor);
    });
} // end function



XRepository.JSRepository.prototype._convert = function(objects, type) {
    jQuery.each(objects, function(index, object) {
        var newObject = new type();
        jQuery.each(object, function(property, value) {
            newObject[property] = value;
        });
        objects[index] = newObject;
    });
} // end function



XRepository.JSRepository.prototype._fetch = function(cursor) {
    jQuery.each(cursor.cursorData.criteria, function(index, criterion) {
        criterion._fixOperation();
    });
    var request = jQuery.ajax(this.path.root + '/' + this.path.fetch, {
        async: !this.isSynchronized,
        cache: false,
        data: {
            tableNames: JSON.stringify(this._getTableNames(cursor.type)),
            cursor: JSON.stringify(cursor.cursorData)
        }
    });
    var repo = this;
    return this._handleResponse(request, function() {
        repo._validateResponse(request);
        var objs = JSON.parse(request.responseText);
        repo._convert(objs, cursor.type);
        repo._fixDates(objs);
        return objs;
    });
} // end function



XRepository.JSRepository.prototype._findColumn = function(type, columnName) {
    if (!columnName)
        return null;

    columnName = columnName.toUpperCase();
    var columns = this._getColumns(type.getName());
    var result = null;
    jQuery.each(columns, function(index, column) {
        if (column.toUpperCase() == columnName) {
            result = column;
            return false;
        } // end if
    });
    return result;
} // end function



XRepository.JSRepository.prototype._findForeignKeyColumn = function(referencedType, referencingType) {
    var idColumn = this._getIdColumn(referencedType);
    var vanillaIdColumn = idColumn;

    // If the idColumn without any table names is the same as vanilla idColumn,
    // then they key name is "simple" (like "Id" or "Code").  If that's the case
    // then only check for referencingType columns if the simple idColumn does
    // not match the idColumn of the referencingType.
    var tableNames = this._getTableNames(referencedType);
    var repo = this;
    jQuery.each(tableNames, function(index, tableName) {
        var tableDef = repo._getTableDefinition(tableName);
        tableName = tableDef.TableName;
        idColumn = idColumn.removeIgnoreCase(tableName);
    });
    if (idColumn != vanillaIdColumn ||
        idColumn != this._getIdColumn(referencingType)) {
        var column = this._findColumn(referencingType, vanillaIdColumn);
        if (column)
            return column;
    } // end if

    return this._findColumn(referencingType, referencedType.getName() + idColumn);
} // end function



XRepository.JSRepository.prototype._fixDates = function(objects) {
    if (!(objects instanceof Array))
        objects = [objects];

    jQuery.each(objects, function(index, obj) {
        jQuery.each(obj, function(property, value) {
            if (!value || value.constructor != String)
                return;

            if (value.length == 20 && value.substring(10, 11) == 'T' && value.substring(19, 20) == 'Z') {
                // Look for ISO 8601 dates: 2013-10-28T16:38:30Z
                var m = moment(value);
                if (m.isValid())
                    obj[property] = m.toDate();

            } else if (value.substring(0, 6) == '/Date(' &&
                value.substring(value.length - 1) == '/' && !isNaN(value.substring(6, value.length - 7))) {
                // Look for funky Microsoft JSON dates (stupid Microsoft): /Date(120750192350912803948012735091237401239)/
                var time = parseInt(value.substring(6));
                obj[property] = new Date(time);
            } // end if-else
        });
    });
} // end function



XRepository.JSRepository.prototype._getCachedValue = function(cache, tableName, lookupPath) {
    var tableName = tableName.toUpperCase();
    if (cache[tableName])
        return cache[tableName];

    lookupPath = this.path.root + '/' + lookupPath;
    var request = jQuery.ajax(lookupPath, {
        async: false,
        cache: false,
        data: { tableName: tableName }
    });
    this._validateResponse(request);
    cache[tableName] = JSON.parse(request.responseText);
    return cache[tableName];
} // end function



XRepository.JSRepository.prototype._getColumns = function(tableName) {
    return this._getCachedValue(this._columnsCache, tableName, this.path.getColumns);
} // end function



XRepository.JSRepository.prototype._getIdColumn = function(type) {
    var tableNames = this._getTableNames(type);
    if (tableNames.length == 0)
        return null;

    var columns = this._getPrimaryKeys(tableNames[0]);
    if (columns.length != 1)
        return null;
    return columns[0];
} // end function



XRepository.JSRepository.prototype._getPrimaryKeys = function(tableName) {
    return this._getCachedValue(this._primaryKeysCache, tableName, this.path.getPrimaryKeys);
} // end function



XRepository.JSRepository.prototype._getTableDefinition = function(tableName) {
    return this._getCachedValue(this._tableDefinitionCache, tableName, this.path.getTableDefinition);
} // end function



XRepository.JSRepository.prototype._getTableNames = function(type) {
    var tableNames = [];
    while (type != Object) {
        var tableDef = this._getTableDefinition(type.getName());
        if (tableDef != null)
            tableNames.push(tableDef.FullName);
        type = type.getBase();
    } // end while
    tableNames.reverse();
    return tableNames;
} // end function



XRepository.JSRepository.prototype._handleResponse = function(request, handle) {
    if (this.isSynchronized)
        return handle();
    else {
        var deferred = jQuery.Deferred();
        request.done(function() {
            deferred.resolve(handle());
        });
        return deferred.promise();
    } // end if-else
} // end function



XRepository.JSRepository.prototype._removeExtraneousProperties = function(objects) {
    if (!(objects instanceof Array))
        objects = [objects];

    var newObjs = [];
    var repo = this;
    jQuery.each(objects, function(index, obj) {
        if (!obj || Object.isBasic(obj) || obj instanceof Array)
            return true;

        // Set all properties to upper case
        var upperCaseObj = {};
        jQuery.each(obj, function(property, value) {
            upperCaseObj[property.toUpperCase()] = value;
        });

        var newObj = {};
        newObj._tableNames = obj._tableNames;
        jQuery.each(newObj._tableNames, function(index, tableName) {
            var columns = repo._getColumns(tableName);
            jQuery.each(columns, function(index, column) {
                var upperCaseColumn = column.toUpperCase()
                if (upperCaseObj.hasOwnProperty(upperCaseColumn))
                    newObj[column] = upperCaseObj[upperCaseColumn];
            });
        });
        newObjs.push(newObj);
    });
    return newObjs;
} // end function



XRepository.JSRepository.prototype._validateEntityArray = function(objects) {
    jQuery.each(objects, function(index, obj) {
        if (Object.isBasic(obj))
            throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': element ' + index + ' in objects' +
                'array parameter cannot be a basic type but must instead be an entity object\n' +
                '(typeof objects[' + index + '] = ' + typeof obj +
                ', objects[' + index + '] = ' + JSON.stringify(obj) + ').';
        else if (!obj)
            throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': element ' + index +
                ' in objects array parameter is null or undefined\n' +
                '(typeof objects[' + index + '] = ' + typeof obj +
                ', objects[' + index + '] = ' + JSON.stringify(obj) + ').';
    });
} // end function



XRepository.JSRepository.prototype._validateResponse = function(ajaxRequest) {
    if (ajaxRequest.status == 500) {
        var error;
        try {
            error = JSON.parse(ajaxRequest.responseText);
            error = error.Message + '\n\nStack Trace...\n' + error.StackTrace;
        } catch (e) {
            error = ajaxRequest.responseText;
        } // end try-catch
        throw error;
    } // end if
} // end function



XRepository.JSRepository.prototype._validateTypeParameter = function(parameterName, parameter) {
    if (typeof parameter != 'function')
        throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': ' + parameterName +
            ' parameter was not initialized or was not a function\n' +
            '(typeof ' + parameterName + ' = ' + typeof parameter +
            ', ' + parameterName + ' = ' + JSON.stringify(parameter) + ').';
} // end function



XRepository.isPromise = function(obj) {
    return (obj &&
        typeof obj.done == 'function' &&
        typeof obj.promise == 'function')
} // end function



XRepository._validateRequiredLibraries = function() {
    if (typeof moment != 'function')
        throw 'Error in JSRepository: moment.js does not appear to be referenced.  ' +
            'xrepository.js requires moment.js.  Make sure it is referenced ' +
            'before attempting to invoke any methods of JSRepository.';

    // Validate XTools
    if (!XRepository.JSRepository.getName)
        throw 'Error in JSRepository: xtools.js does not appear to be referenced.  ' +
            'xrepository.js requires xtools.js.  Make sure it is referenced ' +
            'before attempting to invoke any methods of JSRepository.';

    function getNameTest() {
    } // end function
    if (getNameTest.getName() != 'getNameTest')
        throw 'Error in JSRepository: xtools.js appears to be malfunctioning.  ' +
            'Please make sure there are no other libraries overwriting the functions ' +
            'xtools.js declares.';
} // end function



// Create a repository instance to a basic JSRepository if it does not already exist
var repository = repository || new XRepository.JSRepository();