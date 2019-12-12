//=============================================================================
//
// File:         /node_modules/rwt-search/rwt-search.js
// Language:     ECMAScript 2015
// Copyright:    Read Write Tools © 2019
// License:      MIT
// Initial date: Dec 3, 2019
// Purpose:      Full text search across a website
//
//=============================================================================

import TextInterface	from './ternwords/text-interface.class.js';
import TernWords     	from './ternwords/tern-words.class.js';

export default class RwtSearch extends HTMLElement {

	// The elementInstance is used to distinguish between multiple instances of this custom element
	static elementInstance = 0;
	static nextWordID = 1;
	static nextDocID = 1;

	constructor() {
		super();

		// child elements
		this.dialog = null;
		this.closeButton = null;
		this.userRequest = null;
		this.searchButton = null;
		this.matchWords = null;
		this.matchDocs = null;
		
		// properties
		this.shortcutKey = null;
		this.collapseSender = `RwtSearch ${RwtSearch.elementInstance}`;

		this.hasSitewords = false;					// sitewords data files has not yet been retrieved
		this.hasTernarySearchTree = false;			// Ternary Search Trie not been built yet
		this.textInterface = null;					// Ternary Search Trie text interface
		this.ternWords = null;						// Ternary Search Trie userland 
		this.userInputTimer = null;					// use this to dampen the look-ahead autofill 

		Object.seal(this);
	}

	//-------------------------------------------------------------------------
	// customElement life cycle callbacks
	//-------------------------------------------------------------------------
	async connectedCallback() {		
		// guard against possible call after this has been disconnected
		if (!this.isConnected)
			return;
		
		var htmlFragment = await this.fetchTemplate();
		if (htmlFragment == null)
			return;
		
		var styleElement = await this.fetchCSS();
		if (styleElement == null)
			return;

		// append the HTML and CSS to the custom element's shadow root
		this.attachShadow({mode: 'open'});
		this.shadowRoot.appendChild(htmlFragment); 
		this.shadowRoot.appendChild(styleElement); 
		
		this.identifyChildren();
		this.registerEventListeners();
		this.initializeShortcutKey();
	}
	
	//-------------------------------------------------------------------------
	// initialization
	//-------------------------------------------------------------------------

	//^ Fetch the HTML template
	//< returns a document-fragment suitable for appending to shadowRoot
	//< returns null if server does not respond with 200 or 304
	async fetchTemplate() {
		var response = await fetch('/node_modules/rwt-search/rwt-search.blue');
		if (response.status != 200 && response.status != 304)
			return null;
		var templateText = await response.text();
		
		// create a template and turn its content into a document fragment
		var template = document.createElement('template');
		template.innerHTML = templateText;
		return template.content;
	}
	
	//^ Fetch the CSS styles and turn it into a style element
	//< returns an style element suitable for appending to shadowRoot
	//< returns null if server does not respond with 200 or 304
	async fetchCSS() {
		var response = await fetch('/node_modules/rwt-search/rwt-search.css');
		if (response.status != 200 && response.status != 304)
			return null;
		var css = await response.text();

		var styleElement = document.createElement('style');
		styleElement.innerHTML = css;
		return styleElement;
	}
	
	//^ Identify this component's children
	identifyChildren() {
		this.dialog = this.shadowRoot.getElementById('search-dialog');
		this.closeButton = this.shadowRoot.getElementById('close-button');
		this.userRequest = this.shadowRoot.getElementById('user-request');
		this.searchButton = this.shadowRoot.getElementById('search-button');
		this.matchWords = this.shadowRoot.getElementById('match-words');
		this.matchDocs = this.shadowRoot.getElementById('match-docs');
	}		

	registerEventListeners() {
		// document events
		document.addEventListener('click', this.onClickDocument.bind(this));
		document.addEventListener('keydown', this.onKeydownDocument.bind(this));
		document.addEventListener('collapse-popup', this.onCollapsePopup.bind(this));
		document.addEventListener('toggle-search', this.onToggleEvent.bind(this));
		
		// component events
		this.dialog.addEventListener('click', this.onClickDialog.bind(this));
		this.closeButton.addEventListener('click', this.onClickClose.bind(this));
		this.userRequest.addEventListener('input', this.onChangeUserRequest.bind(this));
		this.userRequest.addEventListener('keydown', this.onKeydownUserRequest.bind(this));
		this.searchButton.addEventListener('click', this.onClickSearch.bind(this));
		this.matchWords.addEventListener('keydown', this.onKeydownMatchWords.bind(this));
		this.matchDocs.addEventListener('keydown', this.onKeydownMatchDocs.bind(this));
	}

	//^ Get the user-specified shortcut key. This will be used to open the dialog.
	//  Valid values are "F1", "F2", etc., specified with the *shortcut attribute on the custom element
	//  Default value is "F4"
	initializeShortcutKey() {
		if (this.hasAttribute('shortcut'))
			this.shortcutKey = this.getAttribute('shortcut');
		else
			this.shortcutKey = 'F4';
	}

	//-------------------------------------------------------------------------
	// document events
	//-------------------------------------------------------------------------
	
	// close the dialog when user clicks on the document
	onClickDocument(event) {
		//this.hideDialog();		//no
		//event.stopPropagation();	//no
	}
	
	// close the dialog when user presses the ESC key
	// toggle the dialog when user presses the assigned shortcutKey
	onKeydownDocument(event) {		
		if (event.key == "Escape") {
			this.hideDialog();
			event.stopPropagation();
		}
		// like 'F1', 'F2', etc
		if (event.key == this.shortcutKey) {
			this.toggleDialog();
			event.stopPropagation();
			event.preventDefault();
		}
	}
	
	//^ Send an event to close/hide all other registered popups
	collapseOtherPopups() {
		var collapseSender = this.collapseSender;
		var collapseEvent = new CustomEvent('collapse-popup', {detail: { collapseSender }});
		document.dispatchEvent(collapseEvent);
	}
	
	//^ Listen for an event on the document instructing this dialog to close/hide
	//  But don't collapse this dialog, if it was the one that generated it
	onCollapsePopup(event) {
		if (event.detail.sender == this.collapseSender)
			return;
		else
			this.hideDialog();
	}
	
	//^ Anybody can use: document.dispatchEvent(new Event('toggle-search'));
	// to open/close this component.
	onToggleEvent(event) {
		event.stopPropagation();
		this.toggleDialog();
	}
	
	//-------------------------------------------------------------------------
	// component events
	//-------------------------------------------------------------------------

	// Necessary because clicking anywhere on the dialog will bubble up
	// to onClickDocument which will close the dialog
	onClickDialog(event) {
		event.stopPropagation();
	}
	
	// User has clicked on the dialog box's Close button
	onClickClose(event) {
		event.stopPropagation();
		this.hideDialog();
	}
	
	// user has typed something 
	onChangeUserRequest(event) {
		event.stopPropagation();

		// remove previous timout
		clearTimeout(this.userInputTimer);
		
		// wait 1/4 second before initiating lookup
		var callback = this.lookAheadMatches.bind(this);
		this.userInputTimer = setTimeout(callback, 250);
	}
	
	// get the last word of the user's input, and find the best five words that start with that prefix
	lookAheadMatches() {
		
		// remove punctuation and trailing spaces before looking for the last word
		var fullText = this.userRequest.value;
		fullText = fullText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'').trim();
		var lastSpace = fullText.lastIndexOf(' ');
		var lastWord = (lastSpace == -1) ? fullText : fullText.substr(lastSpace+1);

		// find the best 5 words
		var words = this.getPrefixMatches(lastWord);
		
		// create buttons
		var html = '';
		var buttonIDs = new Array();
		for (let i=0; i < words.length; i++) {
			var buttonID = `word${RwtSearch.nextWordID++}`;
			buttonIDs.push(buttonID);
			html += `<button id='${buttonID}' class='match' tabindex='501'>${words[i]}</button>`;
		}
		
		// completely overwrite the previous buttons
		this.matchWords.innerHTML = html;
		
		// add click callbacks for each word button
		for (let i=0; i < buttonIDs.length; i++) {
			this.shadowRoot.getElementById(buttonIDs[i]).addEventListener('click', this.onClickWordButton.bind(this));
		}
	}
	
	// call this initially with the last word or partial word of the user's input
	// call recursively with one less letter if there are no matches
	getPrefixMatches(lastWord) {
		var words = this.ternWords.getPrefixMatchesWeighted(lastWord, 5);		// find the best 5 words
		
		// if any matches found or if the word has benn shortened to just a single letter
		if (words.length > 0 || lastWord.length < 2)
			return words;

		// try shortening the word  
		var lastWord = lastWord.substr(0, lastWord.length-1);
		return this.getPrefixMatches(lastWord);
	}

	// user has clicked on one of the lookahead words
	// replace the last word of the user's input with the clicked word
	onClickWordButton(event) {
		var word = event.target.innerText;
		var fullText = this.userRequest.value;
		var lastSpace = fullText.lastIndexOf(' ');
		var keep = (lastSpace == -1) ? '' : fullText.substr(0, lastSpace+1);	// keep space between words
		this.userRequest.value = keep + word + ' '; 
		this.userRequest.focus();
	}
	
	// search for documents matching the user's input
	onClickSearch() {
		var fullText = this.userRequest.value;

		// save the search request to localStorage so that the next page can restore it
		localStorage.setItem('rwsearch-request', fullText);
		
		// remove punctuation
		fullText = fullText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,' ');

		// split into words, and remove empties
		var searchWords = fullText.split(' ');
		searchWords = searchWords.filter(word => word.trim().length > 0);
		
		if (searchWords.length == 0) {
			var docID = RwtSearch.nextDocID++;
			var url = `${document.location.protocol}//${document.location.host}`;
			var html = `
				<a href='${url}' id='doc${docID}' tabindex=504>
					<p><span class='title'>Search </span> <span class='description'> Use this search feature to easily find documents within this website.</span></p>
					<p class='url'>${url}</p>
				</a>`;
			this.matchDocs.innerHTML = html;
			return;
		}

		// search and keep the best 10
		var maxMatchCount = 10;
		var documentIndexes = this.ternWords.multiWordSearch(searchWords, maxMatchCount);

		if (documentIndexes.length == 0) {
			var docID = RwtSearch.nextDocID++;
			var url = `${document.location.protocol}//${document.location.host}`;
			var html = `
				<a href='${url}' id='doc${docID}' tabindex=504>
					<p> <span class='description'>No documents found for the search terms</span><span class='search-terms'>${fullText}</span> <span class='description'>Try something else.</span></p>
					<p class='url'>${url}</p>
				</a>`;
			this.matchDocs.innerHTML = html;
		}
		else {
			var html = '';
			for (let i=0; i < documentIndexes.length; i++) {
				var docID = RwtSearch.nextDocID++;
				var dr = this.ternWords.getDocumentRef(documentIndexes[i]);
				html +=
					`<a href='${dr.hostPath}' id='doc${docID}' tabindex=504>
						<p> <span class='title'>${dr.title}</span> <span class='description'>${dr.description}</span></p>
						<p class='url'>${dr.hostPath}	</p>
					</a>`;
			}
			this.matchDocs.innerHTML = html;
			this.matchDocs.querySelector('a').focus();		// place focus on the first search result
		}
	}
	
	// start the search when the user presses <Enter> when inside the text input area
	onKeydownUserRequest(event) {
		if (event.key == 'Enter') {
			event.stopPropagation();
			this.onClickSearch();
		}
		else if (event.key == 'ArrowDown') {
			this.matchWords.querySelector('button').focus();		// place focus on the first word button
			event.preventDefault();
		}
	}

	// move left or right within the match words
	onKeydownMatchWords(event) {
		if (event.key == 'ArrowLeft') {
			var idStr = event.target.id;												// 'word5'
			if (idStr.indexOf('word') == 0) {
				var id = parseInt(idStr.substr(4));										// 5
				id--;
				if (id > 0) {
					var prevButton = this.shadowRoot.getElementById(`word${id}`);		// 'word4'
					if (prevButton != null && prevButton.tagName.toLowerCase() == 'button') {
						prevButton.focus();
						event.preventDefault();
						return;
					}
				}
			}
		}
		else if (event.key == 'ArrowRight') {
			var idStr = event.target.id;												// 'word5'
			if (idStr.indexOf('word') == 0) {
				var id = parseInt(idStr.substr(4));										// 6
				id++;
				if (id < RwtSearch.nextWordID) {
					var prevButton = this.shadowRoot.getElementById(`word${id}`);		// 'word6'
					if (prevButton != null && prevButton.tagName.toLowerCase() == 'button') {
						prevButton.focus();
						event.preventDefault();
						return;
					}
				}
			}
		}
		else if (event.key == 'ArrowUp') {
			this.userRequest.focus();
			event.preventDefault();
		}
		else if (event.key == 'ArrowDown') {
			this.matchDocs.querySelector('a').focus();		// place focus on the first search result
			event.preventDefault();
		}
	}
	
	// move up or down within the search results
	onKeydownMatchDocs(event) {
		if (event.key == 'ArrowUp') {
			var idStr = event.target.id;												// 'doc5'
			if (idStr.indexOf('doc') == 0) {
				var id = parseInt(idStr.substr(3));										// 5
				id--;
				if (id > 0) {
					var prevAnchor = this.shadowRoot.getElementById(`doc${id}`);		// 'doc4'
					if (prevAnchor != null && prevAnchor.tagName.toLowerCase() == 'a') {
						prevAnchor.focus();
						event.preventDefault();
						return;
					}
				}
			}
			// when the target is the first search result
			this.userRequest.focus();
			event.preventDefault();
		}
		else if (event.key == 'ArrowDown') {
			var idStr = event.target.id;												// 'doc5'
			if (idStr.indexOf('doc') == 0) {
				var id = parseInt(idStr.substr(3));										// 5
				id++;
				if (id < RwtSearch.nextDocID) {
					var prevAnchor = this.shadowRoot.getElementById(`doc${id}`);		// 'doc6'
					if (prevAnchor != null && prevAnchor.tagName.toLowerCase() == 'a') {
						prevAnchor.focus();
						event.preventDefault();
						return;
					}
				}
			}
		}
	}
	
	//-------------------------------------------------------------------------
	// delayed loading
	//-------------------------------------------------------------------------

	// The first time that this is called, for any page on this site, 
	// retrieve the SITEWORDS data file from the server, and copy it to localStorage.
	// During subsequent calls, check that the data hasn't expired, and if it has, request it again.
	// Use etag conditional requests to retrieve it only when it's changed on the server
	async retrieveSitewords() {		
		if (this.hasSitewords == true)
			return;
		
		var expirationDate = localStorage.getItem('sitewords-expires');
		if (expirationDate != null && parseInt(expirationDate) > Date.now()) {
			this.hasSitewords = true;
			return;
		}
		
		// the user must provide a sourceref attribute with the location of the SITEWORDS file 
		if (this.hasAttribute('sourceref') == false) {
			localStorage.setItem('sitewords-data', '');
			return;
		}
		// get the location of the user-specified SITEWORDS file from the customElement's sourceref attribute 
		var sourceref = this.getAttribute('sourceref');

		// make a conditional fetch by sending along the previously captured etag, if there is one,
		// or an unconditional request if there isn't
		var options = {};
		var etag = localStorage.getItem('sitewords-etag');
		if (etag != null)
			options.headers = { 'if-none-match': etag };
		
		var response = await fetch(sourceref, options);
		
		// Save the response body to local storage
		if (response.status == 200) {
			var textBlob = await response.text();
			localStorage.setItem('sitewords-data', textBlob);
		}
		else if (response.status == 304) {
			// keep cached copy 
		}
		else {
			// delete current copy
			localStorage.setItem('sitewords-data', '');
		}

		// 200_OK or 304_NOT_MODIFIED
		// read the response headers to get the etag and cache-control and save them to local storage
		if (response.status == 200 || response.status == 304) {
			
			// save etag to localStorage
			var etag = response.headers.get('etag');
			localStorage.setItem('sitewords-etag', etag);

			// Parse the given cache-control header and save it to localStorage 
			var cacheControl = response.headers.get('cache-control');
			var offset = cacheControl.indexOf('max-age=');
			var ttlSeconds = (offset == -1) ? 0 : parseInt(cacheControl.substr(offset+8));		// caution: this assumes a header like 'public, max-age=300' where the max-age is at the end of the string
			var expirationDate = Date.now() + (ttlSeconds * 1000);
			localStorage.setItem('sitewords-expires', expirationDate);
		}
		
		this.hasSitewords = true;
	}
	
	// Obtain the data, as a textBlob, from localStorage
	async initializeTernarySearchTrie() {		
		if (this.hasTernarySearchTree == false) {
			var textBlob = localStorage.getItem('sitewords-data');
			this.textInterface = new TextInterface();
			this.ternWords = new TernWords();
			this.textInterface.readSiteWords(textBlob, this.ternWords);
			this.hasTernarySearchTree = true;
			
			// restore the user's most recent search request
			var savedUserRequest = localStorage.getItem('rwsearch-request');
			this.userRequest.value = savedUserRequest;
			this.onClickSearch();
		}
	}

	//-------------------------------------------------------------------------
	// component methods
	//-------------------------------------------------------------------------

	// open/close
	async toggleDialog() {
		if (this.dialog.style.display == 'none') {
			setTimeout( this.showDialog(), 0);

			// lazy loading of sitewords data, and Ternary Search Trie
			await this.retrieveSitewords();
			await this.initializeTernarySearchTrie();
			
			// reset focus to user input, overriding what onClickSearch just did 
			this.userRequest.select();
			this.userRequest.focus();
		}
		else
			this.hideDialog();
	}

	showDialog() {
		this.collapseOtherPopups();
		this.dialog.style.display = 'block';
		this.userRequest.select();
		this.userRequest.focus();
	}

	hideDialog() {
		this.dialog.style.display = 'none';		
	}
}

window.customElements.define('rwt-search', RwtSearch);

