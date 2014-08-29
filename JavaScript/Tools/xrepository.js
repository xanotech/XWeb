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
} // end class



XRepository.Criterion.create = function(obj) {
    var array = [];
    $.each(obj, function(property, value) {
        array.push(new XRepository.Criterion(property, value));
    });
    return array;
} // end method



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
} // end method



XRepository.Cursor = function(type, criteria, repository) {
    this.type = type;
    this.repository = repository;
    this.data = null;
    this.index = 0;

    this.cursorData = {};
    this.cursorData.criteria = criteria;
    this.cursorData.limit = null;
    this.cursorData.skip = null;
    this.cursorData.sort = null;
} // end class



XRepository.Cursor.prototype._validateSortObj = function(sortObj) {
    if (!sortObj)
        return sortObj;

    if (sortObj.constructor == String)
        sortObj = [sortObj];

    var isValid = !Object.isBasic(sortObj);

    if (isValid && sortObj instanceof Array) {
        var newSortObj = {};
        $.each(sortObj, function(index, element) {
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
} // end method



XRepository.Cursor.prototype.count = function(applySkipLimit) {
    if (applySkipLimit) {
        return this.toArray().length;
    } else
        return this.repository.Count<T>(this.cursorData.criteria);
} // end method



XRepository.Cursor.prototype.forEach = function(callback) {
    if (typeof callback != 'function')
        return;

    $.each(this.toArray(), function(index, element) {
        callback(element);
    });
} // end method



XRepository.Cursor.prototype.hasNext = function() {
    this.toArray(); // Ensures that data and index are initialized
    return this.index < this.size();
} // end method



XRepository.Cursor.prototype.limit = function(rows) {
    if (arguments.length == 0)
        return this.cursorData.limit;

    this.data = null;
    if (!rows || rows.constructor != Number)
        rows = null;
    this.cursorData.limit = rows;
    return this;
} // end method



XRepository.Cursor.prototype.map = function() {
    if (typeof callback != 'function')
        return;

    var array = [];
    $.each(this.toArray(), function(index, element) {
        array.push(callback(element));
    });
    return array;
} // end method



XRepository.Cursor.prototype.next = function() {
    return this.hasNext() ? this.toArray()[this.index] : null;
} // end method



XRepository.Cursor.prototype.size = function() {
    return this.toArray().length;
} // end method



XRepository.Cursor.prototype.skip = function(rows) {
    if (arguments.length == 0)
        return this.cursorData.skip;

    this.data = null;
    if (!rows || rows.constructor != Number)
        rows = null;
    this.cursorData.skip = rows;
    return this;
} // end method



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
        $.each(sortObj, function(property, value) {
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
} // end method



XRepository.Cursor.prototype.toArray = function() {
    if (this.data == null) {
        this.data = this.repository._fetch(this);
        this.index = 0;
    } // end if
    return this.data
} // end method



XRepository.JSRepository = function(path, isSynchronized) {
    if (!path)
        path = 'Repository';
    isSynchronized = typeof isSynchronized == 'boolean' && isSynchronized;

    this._columnsCache = {};
    this._primaryKeysCache = {};
    this._tableDefinitionCache = {};
    this.isSynchronized = isSynchronized;

    // Setup default paths
    this.path = {};
    this.path.root = path;
    this.path.fetch = 'Fetch';
    this.path.getColumns = 'GetColumns';
    this.path.getPrimaryKeys = 'GetPrimaryKeys';
    this.path.getTableDefinition = 'GetTableDefinition';
    this.path.remove = 'Remove';
    this.path.save = 'Save';

    if (!isSynchronized)
        this.sync = new XRepository.JSRepository(path, true);
} // end class



// Creates an instance of an object with all properties defined and set to null
// for the type provided.  Entities backed by JSRepository created by new
// operator may not have any properties until they are saved.  The create
// method is a substitute for new with the difference being that properties
// defined by the server will be present (although initialized to null).
XRepository.JSRepository.prototype.create = function(type) {
    this._validateTypeParameter('type', type);
    var tableNames = this._getTableNames(type);
    var obj = new type();
    obj._tableNames = tableNames;
    var repo = this;
    $.each(tableNames, function(index, tableName) {
        var columns = repo._getColumns(tableName);
        $.each(columns, function(index, column) {
            obj[column] = null;
        });
    });
    return obj;
} // end method



XRepository.JSRepository.prototype.find = function(type, criteria) {
    this._validateTypeParameter('type', type);

    // If criteria is a function, go ahead and call it (the caller must be
    // trying to do something clever).  But if its still a function after that,
    // just set criteria to null because functions just won't cut it as criteria.
    if (typeof criteria == 'function')
        criteria = criteria();
    if (typeof criteria == 'function')
        criteria = null;

    if (Object.isBasic(criteria)) {
        var idColumn = this._getIdColumn(type);
        if (!idColumn) {
            var value = '' + criteria;
            if (criteria.constructor == String || criteria.constructor == Date)
                value = '"' + value + '"';
            throw 'Error in JSRepository.find: find(' +
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
    return new XRepository.Cursor(type, criteria, this);
} // end method



XRepository.JSRepository.prototype.findOne = function(type, criteria) {
    return this.find(type, criteria).limit(1).next();
} // end method



XRepository.JSRepository.prototype.mapOneToMany = function(one, many, foreignKeyName, methodName) {
    this._validateTypeParameter('one', one);
    this._validateTypeParameter('many', many);

    var idColumn = this._getIdColumn(one);
    if (!foreignKeyName)
        foreignKeyName = one.getName() + idColumn;

    if (!methodName) {
        methodName = many.getName();
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
    one.prototype[methodName] = function() {
        console.log('_' + methodName);
        var objects = this['_' + methodName];
        console.log(JSON.stringify(objects));
        if (objects)
            return objects;

        var criteria = {};
        criteria[foreignKeyName] = this[idColumn];
        console.log(JSON.stringify(criteria));
        objects = repo.find(many, criteria).toArray();
        this['_' + methodName] = objects;
        return objects;
    } // end method
} // end method



XRepository.JSRepository.prototype.remove = function(objects) {
    if (Object.isBasic(objects))
        throw 'Error in JSRepository.remove: objects parameter cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            '(typeof objects = ' + typeof objects + ', objects = ' + JSON.stringify(objects) + ').';
    if (!objects)
        return;

    if (objects instanceof XRepository.Cursor)
        objects = objects.toArray();
    if (!(objects instanceof Array))
        objects = [objects];

    this._validateEntityArray(objects);
    this._applyTableNames(objects);
    objects = this._removeExtraneousProperties(objects);
    var request = $.ajax(this.path.root + '/' + this.path.remove, {
        async: false,
        cache: false,
        data: { data: JSON.stringify(objects) },
        type: 'POST'
    });
    repository._validateResponse(request)
} // end method



XRepository.JSRepository.prototype.save = function(objects) {
    if (Object.isBasic(objects))
        throw 'Error in JSRepository.save: objects parameter cannot be a basic type ' +
            'but must instead be an entity object, an array of entity objects, or a Cursor\n' +
            '(typeof objects = ' + typeof objects + ', objects = ' + JSON.stringify(objects) + ').';
    if (!objects)
        return;

    if (!(objects instanceof Array))
        objects = [objects];

    this._validateEntityArray(objects);
    this._applyTableNames(objects);
    var cleanObjects = this._removeExtraneousProperties(objects);
    //this._adjustDateTimezones(cleanObjects);
    var request = $.ajax(this.path.root + '/' + this.path.save, {
        async: false,
        cache: false,
        data: { data: JSON.stringify(cleanObjects) },
        type: 'POST'
    });
    this._validateResponse(request);
    var ids = JSON.parse(request.responseText);
    this._applyIds(objects, ids);
} // end method



XRepository.JSRepository.prototype._adjustDateTimezones = function(objects) {
    $.each(objects, function(index, obj) {
        $.each(obj, function(property, value) {
            if (!value)
                return true;
            var type = value.constructor;
            if (!type)
                return true;
            if (value.constructor != Date)
                return true;

            value = new Date(value.getTime());
            value.setHours(value.getHours() - value.getTimezoneOffset() / 60);
            obj[property] = value;
        });
    });
} // end method



XRepository.JSRepository.prototype._applyIds = function(objects, ids) {
    var repo = this;
    $.each(objects, function(index, obj) {
        var idObj = ids[index];
        if (!idObj)
            return true;

        $.each(idObj, function(property, value) {
            obj[property] = value;
        });
    });
} // end method



XRepository.JSRepository.prototype._applyTableNames = function(objects) {
    var repo = this;
    $.each(objects, function(index, obj) {
        if (!obj._tableNames)
            obj._tableNames = repo._getTableNames(obj.constructor);
    });
} // end method



XRepository.JSRepository.prototype._convert = function(objects, type) {
    $.each(objects, function(index, object) {
        var newObject = new type();
        $.each(object, function(property, value) {
            newObject[property] = value;
        });
        objects[index] = newObject;
    });
} // end method



XRepository.JSRepository.prototype._fetch = function(cursor) {
    $.each(cursor.cursorData.criteria, function(index, criterion) {
        criterion._fixOperation();
    });
    var request = $.ajax(this.path.root + '/' + this.path.fetch, {
        async: false,
        cache: false,
        data: {
            tableNames: JSON.stringify(this._getTableNames(cursor.type)),
            cursor: JSON.stringify(cursor.cursorData)
        }
    });
    this._validateResponse(request);
    var objs = JSON.parse(request.responseText);
    this._convert(objs, cursor.type);
    this._fixDates(objs);
    return objs;
} // end method



XRepository.JSRepository.prototype._fixDates = function(objects) {
    if (!(objects instanceof Array))
        objects = [objects];

    $.each(objects, function(index, obj) {
        $.each(obj, function(property, value) {
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
} // end method



XRepository.JSRepository.prototype._getCachedValue = function(cache, tableName, lookupPath) {
    var tableName = tableName.toUpperCase();
    if (cache[tableName])
        return cache[tableName];

    lookupPath = this.path.root + '/' + lookupPath;
    var request = $.ajax(lookupPath, {
        async: false,
        cache: false,
        data: { tableName: tableName }
    });
    this._validateResponse(request);
    cache[tableName] = JSON.parse(request.responseText);
    return cache[tableName];
} // end method



XRepository.JSRepository.prototype._getColumns = function(tableName) {
    return this._getCachedValue(this._columnsCache, tableName, this.path.getColumns);
} // end method



XRepository.JSRepository.prototype._getIdColumn = function(type) {
    var tableNames = this._getTableNames(type);
    if (tableNames.length == 0)
        return null;

    var columns = this._getPrimaryKeys(tableNames[0]);
    if (columns.length != 1)
        return null;
    return columns[0];
} // end method



XRepository.JSRepository.prototype._getPrimaryKeys = function(tableName) {
    return this._getCachedValue(this._primaryKeysCache, tableName, this.path.getPrimaryKeys);
} // end method



XRepository.JSRepository.prototype._getTableDefinition = function(tableName) {
    return this._getCachedValue(this._tableDefinitionCache, tableName, this.path.getTableDefinition);
} // end method



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
} // end method



XRepository.JSRepository.prototype._removeExtraneousProperties = function(objects) {
    if (!(objects instanceof Array))
        objects = [objects];

    var newObjs = [];
    var repo = this;
    $.each(objects, function(index, obj) {
        if (!obj || Object.isBasic(obj) || obj instanceof Array)
            return true;

        // Set all properties to upper case
        var upperCaseObj = {};
        $.each(obj, function(property, value) {
            upperCaseObj[property.toUpperCase()] = value;
        });

        var newObj = {};
        newObj._tableNames = obj._tableNames;
        $.each(newObj._tableNames, function(index, tableName) {
            var columns = repo._getColumns(tableName);
            $.each(columns, function(index, column) {
                var upperCaseColumn = column.toUpperCase()
                if (upperCaseObj.hasOwnProperty(upperCaseColumn))
                    newObj[column] = upperCaseObj[upperCaseColumn];
            });
        });
        newObjs.push(newObj);
    });
    return newObjs;
} // end method



XRepository.JSRepository.prototype._validateCriterionArray = function(array) {
    $.each(array, function(index, element) {
        if (element instanceof XRepository.Criterion)
            return;
        if (!element['Name'] || !element['Operation'])
            throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': element ' + index +
                ' in criteria array missing Name and / or Operation properties\n' +
                '(element = ' + JSON.stringify(element) + ').';
    });
} // end method


XRepository.JSRepository.prototype._validateEntityArray = function(objects) {
    $.each(objects, function(index, obj) {
        if (Object.isBasic(obj))
            throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': element ' + index + ' in objects' +
                'array parameter cannot be a basic type but must instead be an entity object\n' +
                '(typeof objects[' + index + '] = ' + typeof obj +
                ', objects[' + index + '] = ' + JSON.stringify(obj) + ').';
        else if (!obj)
            throw 'Error in JSRepository.' + methodName.callee.caller.getName() + ': element ' + index +
                ' in objects array parameter is null or undefined\n' +
                '(typeof objects[' + index + '] = ' + typeof obj +
                ', objects[' + index + '] = ' + JSON.stringify(obj) + ').';
    });
} // end method



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
} // end method



XRepository.JSRepository.prototype._validateTypeParameter = function(parameterName, parameter) {
    if (!parameter || parameter.constructor != Function)
        throw 'Error in JSRepository.' + arguments.callee.caller.getName() + ': ' + parameterName +
            ' parameter was not initialized or was not a function\n' +
            '(typeof ' + parameterName + ' = ' + typeof parameter +
            ', ' + parameterName + ' = ' + JSON.stringify(parameter) + ').';
} // end method



// Create a repository instance to a basic JSRepository if it does not already exist
var repository = repository || new XRepository.JSRepository();