//=============================================================================
//
// File:         bifurcate/src/terminal.namespace.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2018
// License:      CC-BY-NC-ND 4.0
// Initial date: Jan 3, 2018
// Usage:        General purpose console logger with terminal colors
//
//=============================================================================

export default class terminal {

//	static gray(str)	{ return `\x1b[30m${str}\x1b[0m`; }
	static gray(str)	{ return `\x1b[37m${str}\x1b[0m`; }
	static red(str)		{ return `\x1b[31m${str}\x1b[0m`; }
	static green(str)	{ return `\x1b[32m${str}\x1b[0m`; }
	static yellow(str)	{ return `\x1b[33m${str}\x1b[0m`; }
	static blue(str)	{ return `\x1b[34m${str}\x1b[0m`; }
	static magenta(str)	{ return `\x1b[35m${str}\x1b[0m`; }
	static cyan(str)	{ return `\x1b[36m${str}\x1b[0m`; }
	static white(str)	{ return `\x1b[37m${str}\x1b[0m`; }

	static trace(...params) {
		terminal.write(terminal.gray(  '   [TRACE] '), params.join(''));
	}
	
	static invalid(...params) {
		terminal.write(terminal.yellow(' [INVALID] '), params.join(''));
	}
	
	static warning(...params) {
		terminal.write(terminal.yellow(' [WARNING] '), params.join(''));
	}
	
	static error(...params) {
		terminal.write(terminal.red(   '   [ERROR] '), params.join(''));
	}
	
	static abnormal(...params) {
		terminal.write(terminal.red(   '[ABNORMAL] ') + terminal.getFunctionName(4), params.join(''));
	}
	
	static logic(...params) {
		terminal.write(terminal.red(   '   [LOGIC] ') + terminal.getFunctionName(4), params.join(''));
	}
	
	static setProcessName(name) {
		Object.defineProperty(terminal, 'processName', { value: name, writable: true});
	}
	
	static getProcessName() {
		return (terminal.processName == undefined) ? '' : terminal.gray(terminal.processName);
	}

	static write(tag, message) {
		terminal.writeToConsoleOrStderr(terminal.getProcessName() + tag + message + '\n');
	}
	
	//^ Send message to browser console or CLI stderr
	static writeToConsoleOrStderr(message) {
		if (typeof console == 'object' && typeof console.warn == 'function')
			console.warn(message);
		else if (typeof process == 'object' && typeof process.stderr == 'object' && typeof process.stderr.write == 'function')
			process.stderr.write(message);
		else
			throw new Error(message);
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
		desiredOutput = terminal.rightAlign(desiredOutput, 30);
		return `{${desiredOutput}} `;
	}

	//^ Right align the given string to fit within a fixed width character column
    static rightAlign(s, width) {
    	var columnLen = width;
    	var stringLen = s.length;
    	if (stringLen > columnLen)
    		return s.substr(0,columnLen-3) + '...';
    	else
    		return ' '.repeat(columnLen+1 - stringLen) + s;
    }
}
