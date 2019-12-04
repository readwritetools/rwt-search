//=============================================================================
//
// File:         ternwords/src/file-interface.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Nov 13, 2019
// Contents:     Read a SITEWORDS file to build a Ternary Search Trie
//
//=============================================================================

import expect			from './utils/expect.js';
import terminal			from './utils/terminal.js';
import TextInterface	from './text-interface.class.js'
import DocumentRef		from './document-ref.class.js';
import WeightRef		from './weight-ref.class.js';
import {Pfile}			from 'joezone';
import {TextReader}		from 'joezone';

export default class FileInterface extends TextInterface {
	
    constructor() {
    	super();
    	this.currentDocumentRef = null;
		Object.seal(this);
    }
 
    //> fullFilename is the name of the SITEWORDS file to read
    //> ternWords is the public interface to the library
    //< returns true if successfully read
    //< returns false if a problem occurred
	readSiteWords(fullFilename, ternWords) {
		expect(fullFilename, 'String');
		expect(ternWords, 'TernWords');
		
		// open file
		var pfile = new Pfile(fullFilename);
		if (!pfile.exists()) {
			terminal.abnormal(`File ${pfile.makeAbsolute().name} does not exist`);
			return false;
		}
		if (pfile.isDirectory()) {
			terminal.abnormal(`${pfile.name} is a directory, not a file`);
			return false;
		}
			
		// read one line at a time
		var tr = new TextReader();
		tr.open(pfile);
		
    	// sanity check
    	var line = tr.getline();
    	if (line.indexOf('rwsearch') == -1 || line.indexOf('sitewords') == -1) {
    		terminal.abnormal(`This doesn't look like an RWSEARCH sitewords file. The first line should begin with the signature "!rwsearch 1.0 sitewords". Skipping.`);
    		return false;
    	}
    	
		// add to Ternary Search Trie
		var lineNumber = 0;
		while ((line = tr.getline()) != null) {
			lineNumber++;
			if (line.charAt(0) == '!')
				this.processDocumentRef(lineNumber, line, ternWords);
			else
				this.processWordRef(lineNumber, line, ternWords);
		}
		
		tr.close();
		return true;
	}
}