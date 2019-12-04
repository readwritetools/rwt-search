//=============================================================================
//
// File:         ternwords/src/text-interface.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Nov 13, 2019
// Contents:     Read a SITEWORDS text blob to build a Ternary Search Trie
//
//=============================================================================

import expect			from './utils/expect.js';
import terminal			from './utils/terminal.js';
import DocumentRef		from './document-ref.class.js';
import WeightRef		from './weight-ref.class.js';

export default class TextInterface {
	
    constructor() {
    	this.currentDocumentRef = null;
		Object.seal(this);
    }
 
    //> textBlob is the full text of a SITEWORDS file
    //> ternWords is the public interface to the library
    //< returns true if successfully read
    //< returns false if a problem occurred
	readSiteWords(textBlob, ternWords) {
		expect(textBlob, 'String');
		expect(ternWords, 'TernWords');
		
		var lines = textBlob.split('\n');
		if (lines.length == 0)
			return false;
		
    	// sanity check
    	var line = lines[0];
    	if (line.indexOf('rwsearch') == -1 || line.indexOf('sitewords') == -1) {
    		terminal.abnormal(`This doesn't look like an RWSEARCH sitewords file. The first line should begin with the signature "!rwsearch 1.0 sitewords". Skipping.`);
    		return false;
    	}
    	
		// add to Ternary Search Trie
		for (let i=1; i < lines.length; i++) {
			var lineNumber = i+1;
			var line = lines[i];
			if (line.charAt(0) == '!')
				this.processDocumentRef(lineNumber, line, ternWords);
			else
				this.processWordRef(lineNumber, line, ternWords);
		}
		
		return true;
	}
	
	// Handle these document ref lines:
	// !di documentIndex
	// !hp hostPath
	// !ti title
	// !de description
	// !ky keywords
	processDocumentRef(lineNumber, line, ternWords) {
		expect(lineNumber, 'Number');
		expect(line, 'String');
		expect(ternWords, 'TernWords');
		
		var key = line.substr(1,2);
		var value = line.substr(4);
		
		switch(key) {
			case 'di':
				var documentIndex = parseInt(value);
				this.currentDocumentRef = new DocumentRef(documentIndex);
				ternWords.documentRefs.push(this.currentDocumentRef);
				
				// sanity check: documentRefs[0] will have a documentIndex == 0
				var thisIndex = ternWords.documentRefs.length - 1;
				if (thisIndex != documentIndex) 
					terminal.abnormal(`DocumentIndex on line number ${lineNumber} expected to be ${thisIndex}, not ${documentIndex}`);
				return;
				
			case 'hp':
				this.currentDocumentRef.hostPath = value;
				return;
				
			case 'ti':
				this.currentDocumentRef.title = value;
				return;
				
			case 'de':
				this.currentDocumentRef.description = value;
				return;
				
			case 'ky':
				this.currentDocumentRef.keywords = value;
				return;
				
			default:
				terminal.abnormal(`Unrecognized document ref on line number ${lineNumber} ${line}`);
				return;
		}
	}
	
	processWordRef(lineNumber, line, ternWords) {
		expect(lineNumber, 'Number');
		expect(line, 'String');
		expect(ternWords, 'TernWords');
						
		if (line == '')												// line == 'letters 14 6;19 2;0 1;15 1;20 1;21 1;23 1'
			return;
		var space = line.indexOf(' ');								// space == 7				
		if (space == -1)
			return;
		var word = line.substr(0, space);							// word == 'letters'
		
		var docsAndWeights = line.substr(space+1);					// docsAndWeights == '14 6;19 2;0 1;15 1;20 1;21 1;23 1'
		var arr = docsAndWeights.split(';');						// arr.length == 7
		
		var weightRefs = new Array();
		for (let i=0; i < arr.length; i++) {
			var [documentIndex, weight] = arr[i].split(' ');		// arr[0] == '14 6'
			documentIndex = parseInt(documentIndex);				// 14
			weight = parseInt(weight);								// 6
			var weightRef = new WeightRef(documentIndex, weight);
			weightRefs.push(weightRef);
		}
		
		// add to Ternary Search Trie
		ternWords.putWord(word, weightRefs);
	}
}
