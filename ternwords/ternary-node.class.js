//=============================================================================
//
// File:         ternwords/src/ternary-this.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Nov 13, 2019
// Contents:     A single node of a Ternary Search Trie
//
//=============================================================================

import expect			from './utils/expect.js';

export default class TernaryNode {
	
    constructor() {
    	this.glyph = '';			// this node's character 
		this.left = null;			// TernaryNode for words whose glyph at this depth is less than this node's glyph
		this.mid = null;			// TernaryNode for words whose glyph at this depth is equal to this node's glyph
		this.right = null;			// TernaryNode for words whose glyph at this depth is greater than this node's glyph
		this.weightRefs = null;		// an array of WeightRefs for the full word represented by this node
		
		Object.seal(this);
    }
    
    //< true if this node represents a word
    isWord() {
    	return (this.weightRefs != null);
    }
    
    //^ get the weight of this node's first document
    //< returns a non-negative number if this node is a word
    //< return -1 if this node is not a word
    getMaxWordWeight() {
    	if (this.weightRefs == null)
    		return -1;
    	else
    		return this.weightRefs[0].weight;
    }
    
    // how many TernaryNodes are below this one
    countNodes(count) {
    	expect(count, 'Number');
    	
    	if (this.left != null)
    		count = this.left.countNodes(count); 
    	if (this.mid != null)
    		count = this.mid.countNodes(count); 
    	if (this.right != null)
    		count = this.right.countNodes(count);
    	
    	count++;
    	return count;
    }
    
    // how many words are below this node
    countWords(count) {
    	expect(count, 'Number');
    	
    	if (this.left != null)
    		count = this.left.countWords(count); 
    	if (this.mid != null)
    		count = this.mid.countWords(count); 
    	if (this.right != null)
    		count = this.right.countWords(count);
    	
    	if (this.weightRefs != null)
    		count++;
    	
    	return count;
    }

}