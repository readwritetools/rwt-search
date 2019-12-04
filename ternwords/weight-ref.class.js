//=============================================================================
//
// File:         sitewords/src/weight-ref.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Oct 21, 2019
// Contents:     A word's weight for a single file
//
//=============================================================================

import expect			from './utils/expect.js';

export default class WeightRef {
	
    constructor(documentIndex, weight) {
    	expect(documentIndex, 'Number');
    	expect(weight, 'Number');
    	
    	this.documentIndex = documentIndex;
		this.weight = weight;
		
		Object.seal(this);
    }

    // write the object using ' ' as separator
    writeWordWeights(tw) {
    	expect(tw, 'TextWriter');
    	tw.puts(`${this.documentIndex} ${this.weight}`);
    }
    
    toString() {
    	return `${this.documentIndex} ${this.weight}`;
    }
}