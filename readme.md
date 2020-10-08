











<figure>
	<img src='/img/components/search/search-unsplash-agence-olloweb.jpg' width='100%' />
	<figcaption></figcaption>
</figure>

##### Open Source DOM Component

# Search

## Tenary Trie word look-ahead


<address>
<img src='/img/rwtools.png' width=80 /> by <a href='https://readwritetools.com' title='Read Write Tools'>Read Write Tools</a> <time datetime=2019-12-10>Dec 10, 2019</time></address>



<table>
	<tr><th>Abstract</th></tr>
	<tr><td>The <span class=product>rwt-search</span> DOM component is the standard user interface for the Site Search feature of the <a href='https://hub.readwritetools.com/enterprise/rwserve.blue'>RWSERVE</a> HTTP/2 server. This search dialog box has look-ahead word autofill to guide users in their search for locally hosted documents.</td></tr>
</table>

### Motivation

The SEMWORDS and SITEWORDS tools (see <a href='https://hub.readwritetools.com/enterprise/site-search.blue'>Site Search</a>
) produce an index of all the words used in a given website. That index is used
by this DOM component to provide full text searching on a local basis, without
relying on AJAX or direct server interaction.

This DOM component handles the initial fetch of the site index, caching it to
the user's local-storage for ready use across all of the website's documents.

Internally, the DOM component uses a *ternary search trie* to provide partial word
lookups as the user types, guiding the user towards better results.

#### In the wild

To see an example of this component in use, visit the <a href='https://readwritestack.com/'>READ WRITE STACK</a>
website and press <kbd>F7</kbd> "Search". To understand what's going on under the
hood, use the browser's inspector to view the HTML source code and network
activity, and follow along as you read this documentation.

#### Prerequisites

The <span>rwt-search</span> DOM component works in any browser that
supports modern W3C standards. Templates are written using <span>BLUE</span><span>
PHRASE</span> notation, which can be compiled into HTML using the free <a href='https://hub.readwritetools.com/desktop/rwview.blue'>Read Write View</a>
desktop app. It has no other prerequisites. Distribution and installation are
done with either NPM or via Github.

#### Installation using NPM

If you are familiar with Node.js and the `package.json` file, you'll be
comfortable installing the component just using this command:

```bash
npm install rwt-search
```

If you are a front-end Web developer with no prior experience with NPM, follow
these general steps:

   * Install <a href='https://nodejs.org'>Node.js/NPM</a>
on your development computer.
   * Create a `package.json` file in the root of your web project using the command:
```bash
npm init
```

   * Download and install the DOM component using the command:
```bash
npm install rwt-search
```


Important note: This DOM component uses Node.js and NPM and `package.json` as a
convenient *distribution and installation* mechanism. The DOM component itself
does not need them.

#### Installation using Github

If you are more comfortable using Github for installation, follow these steps:

   * Create a directory `node_modules` in the root of your web project.
   * Clone the <span>rwt-search</span> DOM component into it using the command:
```bash
git clone https://github.com/readwritetools/rwt-search.git
```


### Using the DOM component

After installation, you need to add four things to your HTML page to make use of
it.

   * Add a `script` tag to load the component's `rwt-search.js` file:
```html
<script src='/node_modules/rwt-search/rwt-search.js' type=module></script>             
```

   * Add the component tag somewhere on the page.

      * For scripting purposes, apply an `id` attribute.
      * Apply a `sourceref` attribute with a reference to the full-text word index file
         created by the SITEWORDS utility.
      * Optionally, apply a shortcut attribute with something like F2, F4, etc. for
         hotkey access.
      * And for WAI-ARIA accessibility apply a `role=search` attribute.
```html
<rwt-search id=search sourceref='/data/sitewords' shortcut=F4 role=search></rwt-search>             
```

   * Add a button for the visitor to click to show the dialog:
```html
<a id=search-button title='Search (F4)'>

🔎

</a>
```

   * Add a listener to respond to the click event:
```html
<script type=module>
    document.getElementById('search-button').addEventListener('click', (e) => {
        document.getElementById('search').toggleDialog(e);
    });
</script>
```


### Customization

#### Dialog size and position

The dialog is absolutely positioned towards the bottom right of the viewport.
Its position and size may be overridden using CSS by defining new values for the
variables:

```css
rwt-search {
    --width: 70vw;
    --height: 75vh;
    --bottom: 1rem;
    --right: 1rem;
}
```

#### Dialog color scheme

The default color palette for the dialog uses a dark mode theme. You can use CSS
to override the variables' defaults:

```css
rwt-search {
    --color: var(--white);
    --accent-color1: var(--pure-white);
    --accent-color2: var(--yellow);
    --accent-color3: var(--js-blue);
    --background: var(--black);
    --accent-background1: var(--medium-black);
    --accent-background2: var(--pure-black);
    --accent-background3: var(--nav-black);
    --accent-background4: var(--black);
}
```

### Internals

The browser's local-storage area is used to cache the sitewords file and the
user's most recent search terms. These keys are set by the DOM component:


<table>
	<colgroup><col style=width:12rem /> <col /></colgroup>
	<tr><td>sitewords-data</td> <td>The contents of the SITEWORDS index fetched from the server.</td></tr>
	<tr><td>sitewords-expires</td> <td>An expiration date checked before considering whether or not to refetch the SITEWORDS index. This is obtained from the server's <code>cache-control</code> response header.</td></tr>
	<tr><td>sitewords-etag</td> <td>The <code>etag</code> response header captured in the most recent SITEWORDS fetch. This is used to send a conditional request to the server when the SITEWORDS index has passed its expiration date.</td></tr>
	<tr><td>rwsearch-request</td> <td>The most recent search terms used by the visitor.</td></tr>
</table>

### Life-cycle events

The component issues life-cycle events.


<dl>
	<dt><code>component-loaded</code></dt>
	<dd>Sent when the component is fully loaded and ready to be used. As a convenience you can use the <code>waitOnLoading()</code> method which returns a promise that resolves when the <code>component-loaded</code> event is received. Call this asynchronously with <code>await</code>.</dd>
</dl>

---

### Reference


<table>
	<tr><td><img src='/img/read-write-hub.png' alt='DOM components logo' width=40 /></td>	<td>Documentation</td> 		<td><a href='https://hub.readwritetools.com/components/search.blue'>READ WRITE HUB</a></td></tr>
	<tr><td><img src='/img/git.png' alt='git logo' width=40 /></td>	<td>Source code</td> 			<td><a href='https://github.com/readwritetools/rwt-search'>github</a></td></tr>
	<tr><td><img src='/img/dom-components.png' alt='DOM components logo' width=40 /></td>	<td>Component catalog</td> 	<td><a href='https://domcomponents.com/search.blue'>DOM COMPONENTS</a></td></tr>
	<tr><td><img src='/img/npm.png' alt='npm logo' width=40 /></td>	<td>Package installation</td> <td><a href='https://www.npmjs.com/package/rwt-search'>npm</a></td></tr>
	<tr><td><img src='/img/read-write-stack.png' alt='Read Write Stack logo' width=40 /></td>	<td>Publication venue</td>	<td><a href='https://readwritestack.com/components/search.blue'>READ WRITE STACK</a></td></tr>
</table>

### License

The <span>rwt-search</span> DOM component is licensed under the MIT
License.

<img src='/img/blue-seal-mit.png' width=80 align=right />

<details>
	<summary>MIT License</summary>
	<p>Copyright © 2020 Read Write Tools.</p>
	<p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
	<p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
	<p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
</details>

