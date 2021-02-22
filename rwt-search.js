/* Copyright (c) 2021 Read Write Tools. Legal use subject to the Site Search DOM Component Software License Agreement. */
import TextInterface from '../ternwords/esm/text-interface.class.js';

import TernWords from '../ternwords/esm/tern-words.class.js';

const Static = {
    componentName: 'rwt-search',
    elementInstance: 1,
    htmlURL: '/node_modules/rwt-search/rwt-search.html',
    cssURL: '/node_modules/rwt-search/rwt-search.css',
    htmlText: null,
    cssText: null,
    nextWordID: 1,
    nextDocID: 1
};

Object.seal(Static);

export default class RwtSearch extends HTMLElement {
    constructor() {
        super(), this.instance = Static.elementInstance++, this.isComponentLoaded = !1, 
        this.collapseSender = `${Static.componentName} ${this.instance}`, this.shortcutKey = null, 
        this.dialog = null, this.closeButton = null, this.userRequest = null, this.searchButton = null, 
        this.matchWords = null, this.matchDocs = null, this.hasSitewords = !1, this.hasTernarySearchTree = !1, 
        this.textInterface = null, this.ternWords = null, this.userInputTimer = null, Object.seal(this);
    }
    async connectedCallback() {
        if (this.isConnected) try {
            var t = await this.getHtmlFragment(), e = await this.getCssStyleElement();
            this.attachShadow({
                mode: 'open'
            }), this.shadowRoot.appendChild(t), this.shadowRoot.appendChild(e), this.identifyChildren(), 
            this.registerEventListeners(), this.initializeShortcutKey(), this.sendComponentLoaded();
        } catch (t) {
            console.log(t.message);
        }
    }
    getHtmlFragment() {
        return new Promise((async (t, e) => {
            var s = `${Static.componentName}-html-template-ready`;
            if (document.addEventListener(s, (() => {
                var e = document.createElement('template');
                e.innerHTML = Static.htmlText, t(e.content);
            })), 1 == this.instance) {
                var a = await fetch(Static.htmlURL, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void e(new Error(`Request for ${Static.htmlURL} returned with ${a.status}`));
                Static.htmlText = await a.text(), document.dispatchEvent(new Event(s));
            } else null != Static.htmlText && document.dispatchEvent(new Event(s));
        }));
    }
    getCssStyleElement() {
        return new Promise((async (t, e) => {
            var s = `${Static.componentName}-css-text-ready`;
            if (document.addEventListener(s, (() => {
                var e = document.createElement('style');
                e.innerHTML = Static.cssText, t(e);
            })), 1 == this.instance) {
                var a = await fetch(Static.cssURL, {
                    cache: 'no-cache',
                    referrerPolicy: 'no-referrer'
                });
                if (200 != a.status && 304 != a.status) return void e(new Error(`Request for ${Static.cssURL} returned with ${a.status}`));
                Static.cssText = await a.text(), document.dispatchEvent(new Event(s));
            } else null != Static.cssText && document.dispatchEvent(new Event(s));
        }));
    }
    identifyChildren() {
        this.dialog = this.shadowRoot.getElementById('search-dialog'), this.closeButton = this.shadowRoot.getElementById('close-button'), 
        this.userRequest = this.shadowRoot.getElementById('user-request'), this.searchButton = this.shadowRoot.getElementById('search-button'), 
        this.matchWords = this.shadowRoot.getElementById('match-words'), this.matchDocs = this.shadowRoot.getElementById('match-docs');
    }
    registerEventListeners() {
        document.addEventListener('click', this.onClickDocument.bind(this)), document.addEventListener('keydown', this.onKeydownDocument.bind(this)), 
        document.addEventListener('collapse-popup', this.onCollapsePopup.bind(this)), document.addEventListener('toggle-search', this.onToggleEvent.bind(this)), 
        this.dialog.addEventListener('click', this.onClickDialog.bind(this)), this.closeButton.addEventListener('click', this.onClickClose.bind(this)), 
        this.userRequest.addEventListener('input', this.onChangeUserRequest.bind(this)), 
        this.userRequest.addEventListener('keydown', this.onKeydownUserRequest.bind(this)), 
        this.searchButton.addEventListener('click', this.onClickSearch.bind(this, !0)), 
        this.matchWords.addEventListener('keydown', this.onKeydownMatchWords.bind(this)), 
        this.matchDocs.addEventListener('keydown', this.onKeydownMatchDocs.bind(this));
    }
    initializeShortcutKey() {
        this.hasAttribute('shortcut') && (this.shortcutKey = this.getAttribute('shortcut'));
    }
    sendComponentLoaded() {
        this.isComponentLoaded = !0, this.dispatchEvent(new Event('component-loaded', {
            bubbles: !0
        }));
    }
    waitOnLoading() {
        return new Promise((t => {
            1 == this.isComponentLoaded ? t() : this.addEventListener('component-loaded', t);
        }));
    }
    onClickDocument(t) {}
    onKeydownDocument(t) {
        'Escape' == t.key && (this.hideDialog(), t.stopPropagation()), t.key == this.shortcutKey && null != this.shortcutKey && (this.toggleDialog(), 
        t.stopPropagation(), t.preventDefault());
    }
    collapseOtherPopups() {
        var t = new CustomEvent('collapse-popup', {
            detail: this.collapseSender
        });
        document.dispatchEvent(t);
    }
    onCollapsePopup(t) {
        t.detail != this.collapseSender && this.hideDialog();
    }
    onToggleEvent(t) {
        t.stopPropagation(), this.toggleDialog();
    }
    onClickDialog(t) {
        t.stopPropagation();
    }
    onClickClose(t) {
        t.stopPropagation(), this.hideDialog();
    }
    onChangeUserRequest(t) {
        if (t.stopPropagation(), clearTimeout(this.userInputTimer), this.hasTernarySearchTree) {
            var e = this.lookAheadMatches.bind(this);
            this.userInputTimer = setTimeout(e, 250);
        }
    }
    lookAheadMatches() {
        var t = this.userRequest.value, e = (t = t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim()).lastIndexOf(' '), s = -1 == e ? t : t.substr(e + 1), a = this.getPrefixMatches(s), i = '', o = new Array;
        for (let t = 0; t < a.length; t++) {
            var n = 'word' + Static.nextWordID++;
            o.push(n), i += `<button id='${n}' class='match' tabindex='501'>${a[t]}</button>`;
        }
        this.matchWords.innerHTML = i;
        for (let t = 0; t < o.length; t++) this.shadowRoot.getElementById(o[t]).addEventListener('click', this.onClickWordButton.bind(this));
    }
    getPrefixMatches(t) {
        var e = this.ternWords.getPrefixMatchesWeighted(t, 5);
        if (e.length > 0 || t.length < 2) return e;
        t = t.substr(0, t.length - 1);
        return this.getPrefixMatches(t);
    }
    onClickWordButton(t) {
        t.stopPropagation();
        var e = t.target.innerText, s = this.userRequest.value, a = s.lastIndexOf(' '), i = -1 == a ? '' : s.substr(0, a + 1);
        this.userRequest.value = i + e + ' ', this.userRequest.focus(), this.onClickSearch(!0);
    }
    onClickSearch(t) {
        var e = this.userRequest.value;
        localStorage.setItem('rwsearch-request', e);
        var s = (e = e.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')).split(' ');
        if (0 != (s = s.filter((t => t.trim().length > 0))).length) {
            var a = this.ternWords.multiWordSearch(s, 10);
            if (0 == a.length) {
                h = Static.nextDocID++, l = `\n\t\t\t\t<a href='${c = `${document.location.protocol}//${document.location.host}`}' id='doc${h}' tabindex=504>\n\t\t\t\t\t<p><span class='description'>No documents found for the search terms</span><span class='search-terms'>${e}</span> <span class='description'>Try something else.</span></p>\n\t\t\t\t\t<p class='url'>${c}</p>\n\t\t\t\t</a>`;
                this.matchDocs.innerHTML = l;
            } else {
                l = '';
                for (let t = 0; t < a.length; t++) {
                    h = Static.nextDocID++;
                    var i = this.ternWords.getDocumentRef(a[t]), o = s.map((t => encodeURIComponent(t))).join('+'), n = `${i.url}?query=${o}`, r = this.formatDate(i.lastmod);
                    l += `<a href='${n}' id='doc${h}' tabindex=504>\n\t\t\t\t\t\t<p><span class='title'>${i.title}</span> <span class='description'>${i.description}</span></p>\n\t\t\t\t\t\t<p><span class='lastmod'>${r}</span> <span class='url'>${i.url}</span></p>\n\t\t\t\t\t</a>`;
                }
                this.matchDocs.innerHTML = l, t && this.matchDocs.querySelector('a').focus();
            }
        } else {
            var c, h = Static.nextDocID++, l = `\n\t\t\t\t<a href='${c = `${document.location.protocol}//${document.location.host}`}' id='doc${h}' tabindex=504>\n\t\t\t\t\t<p><span class='title'>Search </span> <span class='description'> Use this search feature to easily find documents within this website.</span></p>\n\t\t\t\t\t<p class='url'>${c}</p>\n\t\t\t\t</a>`;
            this.matchDocs.innerHTML = l;
        }
    }
    formatDate(t) {
        if (10 == t.length && '-' == t.charAt(4) && '-' == t.charAt(7)) {
            var e = t.substr(0, 4), s = parseInt(t.substr(5, 2)) - 1, a = t.substr(8, 2);
            return `${[ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ][s]} ${a}, ${e}`;
        }
        return '';
    }
    onKeydownUserRequest(t) {
        if ('Enter' == t.key) t.stopPropagation(), this.onClickSearch(!0); else if ('ArrowDown' == t.key) {
            var e = this.matchWords.querySelector('button');
            null == e && (e = this.matchDocs.querySelector('a')), null != e && (e.focus(), t.preventDefault());
        }
    }
    onKeydownMatchWords(t) {
        if ('ArrowLeft' == t.key) {
            if (0 == (s = t.target.id).indexOf('word')) {
                var e = parseInt(s.substr(4));
                if (--e > 0) if (null != (a = this.shadowRoot.getElementById(`word${e}`)) && 'button' == a.tagName.toLowerCase()) return a.focus(), 
                void t.preventDefault();
            }
        } else if ('ArrowRight' == t.key) {
            var s;
            if (0 == (s = t.target.id).indexOf('word')) {
                var a;
                e = parseInt(s.substr(4));
                if (++e < Static.nextWordID) if (null != (a = this.shadowRoot.getElementById(`word${e}`)) && 'button' == a.tagName.toLowerCase()) return a.focus(), 
                void t.preventDefault();
            }
        } else 'ArrowUp' == t.key ? (this.userRequest.focus(), t.preventDefault()) : 'ArrowDown' == t.key && (this.matchDocs.querySelector('a').focus(), 
        t.preventDefault());
    }
    onKeydownMatchDocs(t) {
        if ('ArrowUp' == t.key) {
            if (0 == (s = t.target.id).indexOf('doc')) {
                var e = parseInt(s.substr(3));
                if (--e > 0) if (null != (a = this.shadowRoot.getElementById(`doc${e}`)) && 'a' == a.tagName.toLowerCase()) return a.focus(), 
                void t.preventDefault();
            }
            this.userRequest.focus(), t.preventDefault();
        } else if ('ArrowDown' == t.key) {
            var s;
            if (0 == (s = t.target.id).indexOf('doc')) {
                var a;
                e = parseInt(s.substr(3));
                if (++e < Static.nextDocID) if (null != (a = this.shadowRoot.getElementById(`doc${e}`)) && 'a' == a.tagName.toLowerCase()) return a.focus(), 
                void t.preventDefault();
            }
        }
    }
    async retrieveSitewords() {
        if (1 != this.hasSitewords) if (null != (c = localStorage.getItem('sitewords-expires')) && parseInt(c) > Date.now()) this.hasSitewords = !0; else if (0 != this.hasAttribute('sourceref')) {
            var t = this.getAttribute('sourceref'), e = {
                referrerPolicy: 'no-referrer'
            };
            null != (i = localStorage.getItem('sitewords-etag')) && (e.headers = {
                'if-none-match': i
            });
            var s = await fetch(t, e);
            if (200 == s.status) {
                var a = await s.text();
                localStorage.setItem('sitewords-data', a);
            } else 304 == s.status || localStorage.setItem('sitewords-data', '');
            if (200 == s.status || 304 == s.status) {
                var i = s.headers.get('etag');
                localStorage.setItem('sitewords-etag', i);
                var o = s.headers.get('cache-control'), n = o.indexOf('max-age='), r = -1 == n ? 0 : parseInt(o.substr(n + 8)), c = Date.now() + 1e3 * r;
                localStorage.setItem('sitewords-expires', c);
            }
            this.hasSitewords = !0;
        } else localStorage.setItem('sitewords-data', '');
    }
    async initializeTernarySearchTrie() {
        if (0 == this.hasTernarySearchTree) {
            var t = Static.nextDocID++, e = `${document.location.protocol}//${document.location.host}`, s = `\n\t\t\t\t<a href='${e}' id='doc${t}' tabindex=504>\n\t\t\t\t\t<p><span class='title'>Initializing </span> <span class='description'> Enter your search terms above.</span></p>\n\t\t\t\t\t<p class='url'>${e}</p>\n\t\t\t\t</a>`;
            this.matchDocs.innerHTML = s, window.setTimeout((() => {
                var t = localStorage.getItem('sitewords-data');
                this.textInterface = new TextInterface, this.ternWords = new TernWords, this.textInterface.readSiteWords(t, this.ternWords), 
                this.hasTernarySearchTree = !0, window.setTimeout((() => {
                    if ('' == this.userRequest.value) {
                        var t = localStorage.getItem('rwsearch-request');
                        this.userRequest.value = t;
                    }
                    this.onClickSearch(!1);
                }), 100);
            }), 100);
        }
    }
    async toggleDialog() {
        'none' == this.dialog.style.display ? (setTimeout(this.showDialog(), 0), this.userRequest.select(), 
        this.userRequest.focus(), await this.retrieveSitewords(), this.initializeTernarySearchTrie()) : this.hideDialog();
    }
    showDialog() {
        this.collapseOtherPopups(), this.dialog.style.display = 'block', this.userRequest.select(), 
        this.userRequest.focus();
    }
    hideDialog() {
        this.dialog.style.display = 'none';
    }
}

window.customElements.define(Static.componentName, RwtSearch);