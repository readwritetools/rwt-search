//=============================================================================
//
// File:         ternwords/src/tern-words.class.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2019
// License:      CC-BY-NC-ND 4.0
// Initial date: Nov 13, 2019
// Contents:     Ternary Search Trie for use with word list built with SITEWORDS
//               This uses Robert Sedgewick's TST algorithm: https://algs4.cs.princeton.edu/lectures/52Tries.pdf
//
//=============================================================================

import expect			from './utils/expect.js';
import TernaryNode		from './ternary-node.class.js';
import WeightRef		from './weight-ref.class.js';

export default class TernWords {
	
    constructor() {
    	this.rootNode = null;				// the Ternary Search Trie root 
		this.documentRefs = new Array();	// DocumentRefs, access by array index
		
		Object.seal(this);
    }

    //=============================================================================
    // build Ternary Search Trie
    //=============================================================================
    
    //^ Call this function for each word to be added to the TST
    //> word is the full word
    //> weightRefs is an array of weightRef objects
    putWord(word, weightRefs) {
    	expect(word, 'String');
    	expect(weightRefs, 'Array');
    	
    	this.rootNode = this.put(this.rootNode, word, weightRefs, 0);
    }
    
    //=============================================================================
    // look-ahead while typing
    //=============================================================================
    
    //^ Userland function to get a list of words that begin with the given prefix, without regard to weights
    //  Use this for type-ahead lookup
    //> wordPrefix is the string to look up
    //> maxWordCount returns no more than this number of matches
    //< returns a list of words that begin with this wordPrefix (including the whole word itself)
    getPrefixMatchesUnweighted(partialWord, maxWordCount) {
    	expect(partialWord, 'String');
    	expect(maxWordCount, 'Number');
    	
    	// no caps, no leading/trailing spaces
    	partialWord = partialWord.toLowerCase().trim();
    	
    	var words = new Array();
    	
    	// navigate to the prefix stem
    	var node = this.get(this.rootNode, partialWord, 0);
    	if (node == null)
    		return [];

    	if (node.isWord())
    		words.push(partialWord);
    	
    	// get everything below here
    	if (node.mid != null)
    		this.getPartialsUnweighted(node.mid, partialWord, maxWordCount, words);

    	this.removeHyphenatedDuplicates(words, maxWordCount);
    	
    	return words;
    }   
    
    // private
    getPartialsUnweighted(node, partialWord, maxWordCount, words) {
    	expect(node, 'TernaryNode');
    	expect(partialWord, 'String');
    	expect(maxWordCount, 'Number');
    	expect(words, 'Array');

    	if (node.isWord() && words.length < maxWordCount)
    		words.push(partialWord + node.glyph);
    	
    	if (node.left != null && words.length < maxWordCount)
    		this.getPartialsUnweighted(node.left, partialWord, maxWordCount, words);
    	
    	if (node.mid != null && words.length < maxWordCount) {
    		if (node.glyph == '-') // any word with a hyphen will have a twin without a hyphen
    			maxWordCount++;
    		this.getPartialsUnweighted(node.mid, partialWord + node.glyph, maxWordCount, words);
    	}

    	if (node.right != null && words.length < maxWordCount)
    		this.getPartialsUnweighted(node.right, partialWord, maxWordCount, words);
    }      
    
    //^ Userland function to get a list of words that begin with the given prefix, that have the greatest weighting
    //  Use this for type-ahead lookup
    //> wordPrefix is the string to look up
    //> maxWordCount returns no more than this number of matches
    //< returns a list of words in descending weighted order
    getPrefixMatchesWeighted(partialWord, maxWordCount) {
    	expect(partialWord, 'String');
    	expect(maxWordCount, 'Number');
    	
    	// no caps, no leading/trailing spaces
    	partialWord = partialWord.toLowerCase().trim();
    	
    	var ww = new Array();
    	
    	// navigate to the prefix stem
    	var node = this.get(this.rootNode, partialWord, 0);
    	if (node == null)
    		return [];

    	if (node.isWord()) {
    		var weight = node.getMaxWordWeight();
    		ww.push([partialWord, weight]);
    	}
    	
    	// get everything below here
    	if (node.mid != null)
    		this.getPartialsWeighted(node.mid, partialWord, maxWordCount, ww);

    	// sort descending by weight
    	ww.sort((a,b) => b[1] - a[1]);
    	
    	// make an array of words without weights
    	var words = new Array();
    	for (let i=0; i < ww.length; i++)
    		words.push(ww[i][0]);
    	
    	this.removeHyphenatedDuplicates(words, maxWordCount);

    	return words;
    }

    // private
    getPartialsWeighted(node, partialWord, maxWordCount, ww) {
    	expect(node, 'TernaryNode');
    	expect(partialWord, 'String');
    	expect(maxWordCount, 'Number');
    	expect(ww, 'Array');

    	if (node.isWord()) {
    		var weight = node.getMaxWordWeight();
    		ww.push([partialWord + node.glyph, weight]);
    	}
    	
    	if (node.left != null)
    		this.getPartialsWeighted(node.left, partialWord, maxWordCount, ww);
    	
    	if (node.mid != null) {
    		if (node.glyph == '-') // any word with a hyphen will have a twin without a hyphen
    			maxWordCount++;
    		this.getPartialsWeighted(node.mid, partialWord + node.glyph, maxWordCount, ww);
    	}
    	
    	if (node.right != null)
    		this.getPartialsWeighted(node.right, partialWord, maxWordCount, ww);
    }      
    
    //=============================================================================
    // search results
    //=============================================================================

    //^ Userland function to get the documents/weights for the given word
    // 
    //< returns an array of WeightRefs if found in TST
    //< returns an empty array if not found in TST
    getExactMatch(word) {
    	expect(word, 'String');
    	
    	// no caps, no leading/trailing spaces
    	word = word.toLowerCase().trim();
    	
    	var node = this.get(this.rootNode, word, 0);
    	if (node == null || node.weightRefs == null)
    		return new Array();
    	else
    		return node.weightRefs;
    }
    
    //^ Get the best documents, by weight, using more than one word as search term
    //> maxMatchCount returns no more than this number of matches
	//
    // A summed weight is equal to the sum of all the individual document weights
	// A boost of 1000 is added to the summed weight for each word that the document contains
	// For example:
	//   word0 has weightRefs ['26 6',  '27 15']
	//   word1 has weightRefs ['26 8',  '28 3']
	//
	//   Searching for 'word0 word1'
	//     doc26 = 2014 = (1006 + 1008)
	//     doc27 = 1015
	//     doc28 = 1003
    //
    //< returns a list of documentIndexes that best match the searchWords
    multiWordSearch(searchWords, maxMatchCount) {
    	expect(searchWords, 'Array');
    	expect(maxMatchCount, 'Number');
    	
    	var mappedItems = new Map();		// documentIndex => summedWeights

    	// loop over each search word
    	for (let i=0; i < searchWords.length; i++) {
    		
        	// no caps, no leading/trailing spaces
        	var word = searchWords[i].toLowerCase().trim();
        	
    		// loop over each document/weight pair
    		var weightedRefs = this.getExactMatch(word);
    		for (let j=0; j < weightedRefs.length; j++) {
    			
    			var documentIndex = weightedRefs[j].documentIndex;
    			var weight = weightedRefs[j].weight;
    			
    			// retrieve the summed weight saved by a previous word
    			var summedWeight = mappedItems.get(documentIndex);
    			if (summedWeight == undefined)
    				summedWeight = 0;
    			
    			// add the current word's weight to this document's sum
    			summedWeight += (1000 + weight); 

    			// stuff the new value into the map
    			mappedItems.set(documentIndex, summedWeight); 
    		}
    	}

    	// sort the map into descending weights
    	var flat = Array.from(mappedItems);
    	flat.sort((a,b) => b[1] - a[1]);
    	
    	// drop the weights and just return the top N document indexes
    	var documentIndexes = new Array();
    	for (let i=0; i < flat.length && i < maxMatchCount; i++) {
    		documentIndexes.push(flat[i][0]);
    	}
    	
    	return documentIndexes;
    }
    
    //=============================================================================
    // access helpers
    //=============================================================================

    //< true if the full word is in the TST and has a value
    //< false if it is not in the TST
    wordExists(word) {
    	// no caps, no leading/trailing spaces
    	word = word.toLowerCase().trim();
    	
    	var node = this.get(this.rootNode, word, 0);
    	return (node != null && node.weightRefs != null);
    }
    
    //< true if the string is a prefix to one or more full words
    //< false if it is not in the TST
    //< false if it is not a prefix to other words (even if it is a word itself)
    isPrefix(str) {
    	// no caps, no leading/trailing spaces
    	str = str.toLowerCase().trim();
    	
    	var node = this.get(this.rootNode, str, 0);

    	// not a word and not a prefix
    	if (node == null)
    		return false;

    	// is a prefix to one or more words
    	if (node.mid != null)
    		return true;
    	else
    		return false;
    }

    //^ Get the document ref object for the given documentIndex
    //> documentIndex (0 .. N-1)
    //< DocumentRef if valid
    //< null if invalid
    getDocumentRef(documentIndex) {
    	expect(documentIndex, 'Number');
    	
    	if (documentIndex < 0)
    		return null;
    	
    	if (documentIndex >= this.documentRefs.length)
    		return null;
    	
    	return this.documentRefs[documentIndex];
    }    
    
    //=============================================================================
    // diagnostic
    //=============================================================================

    // how many TernaryNodes are in the TST
    countNodes() {
    	if (this.rootNode == null)
    		return 0;
    	else
    		return this.rootNode.countNodes(0);
    }
    
    // how many words are in the TST
    countWords() {
    	if (this.rootNode == null)
    		return 0;
    	else
    		return this.rootNode.countWords(0);
    }

    //=============================================================================
    // private
    //=============================================================================
    
    //^ Add a word and its weightRefs to the TST
    //> node is the current node, which may be null because it's the root or because its an undiscovered leaf 
    //> word is always the full word
    //> weightRefs is the value to stuff into the final node, and array of weightRef objects
    //> index is the current index into the word 
    put(node, word, weightRefs, index) {
    	expect(node, ['null', 'TernaryNode']);
    	expect(word, 'String');
    	expect(weightRefs, 'Array');
    	expect(index, 'Number');
    	
    	var glyph = word.charAt(index);
    	
    	// we've reached a leaf that doesn't exist, so create it
    	if (node == null) {
    		node = new TernaryNode();
    		node.glyph = glyph;
    	}
    	
    	if (glyph < node.glyph)
    		node.left = this.put(node.left, word, weightRefs, index);
    	else if (glyph > node.glyph)
    		node.right = this.put(node.right, word, weightRefs, index);
    	else if (index < word.length - 1)
    		node.mid = this.put(node.mid, word, weightRefs, index + 1);
    	else
    		node.weightRefs = weightRefs;	// this assumes that the source file has exactly one instance of this word

    	return node;
    }
    
    //^ Search for a word and its weightRefs in the TST
    //> node is the current node, which may be null because it's the root or because its a leaf that doesn't exist
    //> word is always the full word
    //> index is the current index into the word 
    //< returns a valid TernaryNode, or a null
    get(node, word, index) {
    	// may be an uninitialized root node, or a leaf that doesn't exist
    	if (node == null)
    		return null;
    	
    	var glyph = word.charAt(index);
    	
    	if (glyph < node.glyph)
    		return this.get(node.left, word, index);
    	else if (glyph > node.glyph)
    		return this.get(node.right, word, index);
    	else if (index < word.length - 1)
    		return this.get(node.mid, word, index + 1);
    	else
    		return node;
    }
    
    // This cleans up the results when something like 'offset' is searched for
    // It will remove 'offsetx' and 'offsety', but keep 'offset-x' and 'offset-y'
    // For each word occurrence that has a hyphen, look for its matching occurrence that doesn't have a hyphen and remove it
    removeHyphenatedDuplicates(words, maxWordCount) {
    	expect(words, 'Array');
    	expect(maxWordCount, 'Number');
    	
    	for (let i=words.length-1; i >= 0; i--) {
    		var hyphenatedWord = words[i];
    		var hasHyphen = (hyphenatedWord.indexOf('-') != -1) ? true : false;    		
    		if (hasHyphen) {
    			var plainWord = hyphenatedWord.replace(/-/g, '');		// remove all hyphens
    			for (let j=0; j < words.length; j++) {
    				if (words[j] == plainWord) 
    					words.splice(j, 1);								// remove the plain word
    			}
    		}
    	}
    	
    	// truncate to max length
    	if (words.length > maxWordCount)
    		words.length = maxWordCount;
    }
}