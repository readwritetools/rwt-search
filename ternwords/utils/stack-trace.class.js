//=============================================================================
//
// File:         joezone/src/stack-trace.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Sep 27, 2015
// Contents:     Stack trace functions
//
//=============================================================================

export default class StackTrace {
		
    constructor() {
    	Object.seal(this);
    }

	//^ Take a snapshot of the stack and return
    //< {className.memberName}
	static getFunctionName(depth) {
		// create an Error object, but don't throw it
		var stackTraceLine = (new Error).stack.split("\n")[depth];
		
		// extract the classname and member name from the backtrace (assuming the backtrace pattern adopted by "node")
		var regex1 = /at (.*) ?\(/g;
		var matches = regex1.exec(stackTraceLine);
		var desiredOutput = '';
		if (matches == null)
			return stackTraceLine;
		if (matches.length > 1)
			desiredOutput += matches[1].trim();
		desiredOutput = desiredOutput.padStart(30, ' ');
		return `{${desiredOutput}}`;
	}

	//^ Take a snapshot of the stack and return
    //< pathAndFilename:lineNumber:columnNumber
	static getSitus(depth) {
		// create an Error object, but don't throw it
		var stackTraceLine = (new Error).stack.split("\n")[depth];
		
		// extract the filename, line and column from the backtrace (assuming the backtrace pattern adopted by "node")
		var regex1 = /at .*\((.*)\)/g;
		var matches = regex1.exec(stackTraceLine);
		var desiredOutput = '';
		if (matches.length > 1)
			desiredOutput += matches[1].trim();
		return desiredOutput;
	}
	
	//^ Take a snapshot of the stack and return
    //< object {
	//    classname
	//    member
	//    path
	//    filename
	//    line
	//    column
	//  }
	static getInfo(depth) {
		var info = {
			classname: '',
			member: '',
			path: '',
			filename: '',
			line: '',
			column: ''
		};
		
		// create an Error object, but don't throw it
		var stackTraceLine = (new Error).stack.split('\n')[depth];
		
		// extract the classname and member name from the backtrace (assuming the backtrace pattern adopted by "node")
		var regexA = /at (.*) ?\(/g;
		var matchesA = regexA.exec(stackTraceLine);
		var classAndMember = '';
		if (matchesA.length > 1)
			classAndMember = matchesA[1].trim();
		
		var partsA = classAndMember.split('.');
		info.classname = partsA[0];
		if (partsA.length > 1) {
			info.member = partsA[1];
			info.member = info.member.replace(" (eval at evaluate", '');
		}
		
		// extract the path, filename, line and column from the backtrace (assuming the backtrace pattern adopted by "node")
		var regexB = /at .*\((.*)\)/g;
		var matchesB = regexB.exec(stackTraceLine);
		var pathFileLineColumn = '';
		if (matchesB.length > 1)
			pathFileLineColumn = matchesB[1].trim();
		
		var partsB = pathFileLineColumn.split(':');
		var pathAndFile = partsB[0];
		if (partsB.length > 1)
			info.line = partsB[1];
		if (partsB.length > 2)
			info.column = partsB[2];

		var slash = pathAndFile.lastIndexOf('/');
		if (slash != -1) {
			info.path = pathAndFile.substr(0, slash);
			info.filename = pathAndFile.substr(slash+1);
		}
		else
			info.filename = pathAndFile;
		
		return info;
	}
}
