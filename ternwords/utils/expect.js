//=============================================================================
//
// File:         joezone/src/expect.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Sep 13, 2015
// Contents:     Explicit type checking 
//
//=============================================================================

import StackTrace from './stack-trace.class.js';

//^ Check to make sure the given argument is of the expected type, and write an entry when it's not
//> obj is the object to check
//> expectedType is a string (or an array of strings) containing a prototype.name to validate against
//> message to display if expectation not met
//< true if the expectation was met, false if not
//
export default function expect(obj, expectedType, message) {
	message = message || '';

	var validTypes;
	if (expectedType === undefined) {
		logicMessage(`'type' should be a String or an Array of Strings, but is undefined`);
		return false;
	}
	else if (expectedType === null) {
		logicMessage(`'type' should be a String or an Array of Strings, but is null`);
		return false;
	}
	else if (expectedType.constructor.name == 'String') {
		if (expectOne(obj, expectedType) == true)
			return true;
	}
	else if (expectedType.constructor.name == 'Array') {
		for (let type of expectedType) {
			if (expectOne(obj, type) == true)
				return true;
		}
	}
	else {
		logicMessage(`'type' should be a String or an Array of Strings`);
		return false;
	}

	var s = '';
	if (expectedType.constructor.name == 'String')
		s = `Expected type '${expectedType}'`;
	else //if (expectedType.constructor.name == 'Array')
		s = "Expected one of these types '" + expectedType.join('|') + "'";
		
	if (obj === undefined)
		expectMessage(`${s}, but got 'undefined' ${message}`);
	else if (obj === null)
		expectMessage(`${s}, but got 'null' ${message}`);
	else if (obj.__proto__ === undefined)
		expectMessage(`${s}, but got 'no prototype' ${message}`);
	else
		expectMessage(`${s}, but got '${obj.constructor.name}' ${message}`);
	return false;
}

//^ A private helper to perform one object/type evaluation
//< true if obj is type; false if not
function expectOne(obj, type) {
	if (obj === undefined)
		return (type == 'undefined');
	else if (obj === null)
		return (type == 'null');
	else if (obj.__proto__ === undefined)
		return (type == 'no prototype')
	else if (obj.constructor.name != type)
		return false;
	else
		return true;
}

function logicMessage(message) {
	message = message || '';
	writeToConsoleOrStderr(`[*EXPECT*] Logic: ${message}\n`);
}

function expectMessage(message) {
	message = message || '';
	writeToConsoleOrStderr(`[*EXPECT*]${StackTrace.getFunctionName(4)} ${message}\n`);
}

//^ Send message to browser console or CLI stderr
function writeToConsoleOrStderr(message) {
	if (typeof console == 'object' && typeof console.warn == 'function')
		console.warn(message);
	else if (typeof process == 'object' && typeof process.stderr == 'object' && typeof process.stderr.write == 'function')
		process.stderr.write(message);
	else
		throw new Error(message);
}

