//=============================================================================
//
// File:         sitewords/src/document-ref.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Oct 21, 2019
// Contents:     All of the meta data known about a single document file
//
//=============================================================================

import expect			from './utils/expect.js';

export default class DocumentRef {
	
    constructor(documentIndex) {
    	expect(documentIndex, 'Number');
    	
    	this.documentIndex = documentIndex;
		this.hostPath = '';
		this.title = '';
		this.description = '';
		this.keywords = '';
		
		Object.seal(this);
    }
 
	writeDocumentRefs(tw) {
		expect(tw, 'TextWriter');
		
		tw.putline(`!di ${this.documentIndex}`);
		tw.putline(`!hp ${this.hostPath}`);
		tw.putline(`!ti ${this.title}`);
		tw.putline(`!de ${this.description}`);
		tw.putline(`!ky ${this.keywords}`);
	}    
}