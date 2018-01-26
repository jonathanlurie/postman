var app = (function () {
'use strict';

var __dirname = '/Users/jonathanlurie/Documents/code/github/postman/node_modules/htmlparser/lib'

var __filename = '/Users/jonathanlurie/Documents/code/github/postman/node_modules/htmlparser/lib/htmlparser.js'

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
}



function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var htmlparser = createCommonjsModule(function (module, exports) {
/***********************************************
Copyright 2010, 2011, Chris Winberry <chris@winberry.net>. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
***********************************************/
/* v1.7.6 */

(function () {

function runningInNode () {
	return(
		(typeof commonjsRequire) == "function"
		&&
		('object') == "object"
		&&
		('object') == "object"
		&&
		(typeof __filename) == "string"
		&&
		(typeof __dirname) == "string"
		);
}

if (!runningInNode()) {
	if (!this.Tautologistics)
		this.Tautologistics = {};
	else if (this.Tautologistics.NodeHtmlParser)
		return; //NodeHtmlParser already defined!
	this.Tautologistics.NodeHtmlParser = {};
	exports = this.Tautologistics.NodeHtmlParser;
}

//Types of elements found in the DOM
var ElementType = {
	  Text: "text" //Plain text
	, Directive: "directive" //Special tag <!...>
	, Comment: "comment" //Special tag <!--...-->
	, Script: "script" //Special tag <script>...</script>
	, Style: "style" //Special tag <style>...</style>
	, Tag: "tag" //Any tag that isn't special
};

function Parser (handler, options) {
	this._options = options ? options : { };
	if (this._options.includeLocation == undefined) {
		this._options.includeLocation = false; //Do not track element position in document by default
	}

	this.validateHandler(handler);
	this._handler = handler;
	this.reset();
}

	//**"Static"**//
	//Regular expressions used for cleaning up and parsing (stateless)
	Parser._reTrim = /(^\s+|\s+$)/g; //Trim leading/trailing whitespace
	Parser._reTrimComment = /(^\!--|--$)/g; //Remove comment tag markup from comment contents
	Parser._reWhitespace = /\s/g; //Used to find any whitespace to split on
	Parser._reTagName = /^\s*(\/?)\s*([^\s\/]+)/; //Used to find the tag name for an element

	//Regular expressions used for parsing (stateful)
	Parser._reAttrib = //Find attributes in a tag
		/([^=<>\"\'\s]+)\s*=\s*"([^"]*)"|([^=<>\"\'\s]+)\s*=\s*'([^']*)'|([^=<>\"\'\s]+)\s*=\s*([^'"\s]+)|([^=<>\"\'\s\/]+)/g;
	Parser._reTags = /[\<\>]/g; //Find tag markers

	//**Public**//
	//Methods//
	//Parses a complete HTML and pushes it to the handler
	Parser.prototype.parseComplete = function Parser$parseComplete (data) {
		this.reset();
		this.parseChunk(data);
		this.done();
	};

	//Parses a piece of an HTML document
	Parser.prototype.parseChunk = function Parser$parseChunk (data) {
		if (this._done)
			this.handleError(new Error("Attempted to parse chunk after parsing already done"));
		this._buffer += data; //FIXME: this can be a bottleneck
		this.parseTags();
	};

	//Tells the parser that the HTML being parsed is complete
	Parser.prototype.done = function Parser$done () {
		if (this._done)
			return;
		this._done = true;
	
		//Push any unparsed text into a final element in the element list
		if (this._buffer.length) {
			var rawData = this._buffer;
			this._buffer = "";
			var element = {
				  raw: rawData
				, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
				, type: this._parseState
				};
			if (this._parseState == ElementType.Tag || this._parseState == ElementType.Script || this._parseState == ElementType.Style)
				element.name = this.parseTagName(element.data);
			this.parseAttribs(element);
			this._elements.push(element);
		}
	
		this.writeHandler();
		this._handler.done();
	};

	//Resets the parser to a blank state, ready to parse a new HTML document
	Parser.prototype.reset = function Parser$reset () {
		this._buffer = "";
		this._done = false;
		this._elements = [];
		this._elementsCurrent = 0;
		this._current = 0;
		this._next = 0;
		this._location = {
			  row: 0
			, col: 0
			, charOffset: 0
			, inBuffer: 0
		};
		this._parseState = ElementType.Text;
		this._prevTagSep = '';
		this._tagStack = [];
		this._handler.reset();
	};
	
	//**Private**//
	//Properties//
	Parser.prototype._options = null; //Parser options for how to behave
	Parser.prototype._handler = null; //Handler for parsed elements
	Parser.prototype._buffer = null; //Buffer of unparsed data
	Parser.prototype._done = false; //Flag indicating whether parsing is done
	Parser.prototype._elements =  null; //Array of parsed elements
	Parser.prototype._elementsCurrent = 0; //Pointer to last element in _elements that has been processed
	Parser.prototype._current = 0; //Position in data that has already been parsed
	Parser.prototype._next = 0; //Position in data of the next tag marker (<>)
	Parser.prototype._location = null; //Position tracking for elements in a stream
	Parser.prototype._parseState = ElementType.Text; //Current type of element being parsed
	Parser.prototype._prevTagSep = ''; //Previous tag marker found
	//Stack of element types previously encountered; keeps track of when
	//parsing occurs inside a script/comment/style tag
	Parser.prototype._tagStack = null;

	//Methods//
	//Takes an array of elements and parses any found attributes
	Parser.prototype.parseTagAttribs = function Parser$parseTagAttribs (elements) {
		var idxEnd = elements.length;
		var idx = 0;
	
		while (idx < idxEnd) {
			var element = elements[idx++];
			if (element.type == ElementType.Tag || element.type == ElementType.Script || element.type == ElementType.style)
				this.parseAttribs(element);
		}
	
		return(elements);
	};

	//Takes an element and adds an "attribs" property for any element attributes found 
	Parser.prototype.parseAttribs = function Parser$parseAttribs (element) {
		//Only parse attributes for tags
		if (element.type != ElementType.Script && element.type != ElementType.Style && element.type != ElementType.Tag)
			return;
	
		var tagName = element.data.split(Parser._reWhitespace, 1)[0];
		var attribRaw = element.data.substring(tagName.length);
		if (attribRaw.length < 1)
			return;
	
		var match;
		Parser._reAttrib.lastIndex = 0;
		while (match = Parser._reAttrib.exec(attribRaw)) {
			if (element.attribs == undefined)
				element.attribs = {};
	
			if (typeof match[1] == "string" && match[1].length) {
				element.attribs[match[1]] = match[2];
			} else if (typeof match[3] == "string" && match[3].length) {
				element.attribs[match[3].toString()] = match[4].toString();
			} else if (typeof match[5] == "string" && match[5].length) {
				element.attribs[match[5]] = match[6];
			} else if (typeof match[7] == "string" && match[7].length) {
				element.attribs[match[7]] = match[7];
			}
		}
	};

	//Extracts the base tag name from the data value of an element
	Parser.prototype.parseTagName = function Parser$parseTagName (data) {
		if (data == null || data == "")
			return("");
		var match = Parser._reTagName.exec(data);
		if (!match)
			return("");
		return((match[1] ? "/" : "") + match[2]);
	};

	//Parses through HTML text and returns an array of found elements
	//I admit, this function is rather large but splitting up had an noticeable impact on speed
	Parser.prototype.parseTags = function Parser$parseTags () {
		var bufferEnd = this._buffer.length - 1;
		while (Parser._reTags.test(this._buffer)) {
			this._next = Parser._reTags.lastIndex - 1;
			var tagSep = this._buffer.charAt(this._next); //The currently found tag marker
			var rawData = this._buffer.substring(this._current, this._next); //The next chunk of data to parse
	
			//A new element to eventually be appended to the element list
			var element = {
				  raw: rawData
				, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
				, type: this._parseState
			};
	
			var elementName = this.parseTagName(element.data);
	
			//This section inspects the current tag stack and modifies the current
			//element if we're actually parsing a special area (script/comment/style tag)
			if (this._tagStack.length) { //We're parsing inside a script/comment/style tag
				if (this._tagStack[this._tagStack.length - 1] == ElementType.Script) { //We're currently in a script tag
					if (elementName.toLowerCase() == "/script") //Actually, we're no longer in a script tag, so pop it off the stack
						this._tagStack.pop();
					else { //Not a closing script tag
						if (element.raw.indexOf("!--") != 0) { //Make sure we're not in a comment
							//All data from here to script close is now a text element
							element.type = ElementType.Text;
							//If the previous element is text, append the current text to it
							if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
								var prevElement = this._elements[this._elements.length - 1];
								prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
								element.raw = element.data = ""; //This causes the current element to not be added to the element list
							}
						}
					}
				}
				else if (this._tagStack[this._tagStack.length - 1] == ElementType.Style) { //We're currently in a style tag
					if (elementName.toLowerCase() == "/style") //Actually, we're no longer in a style tag, so pop it off the stack
						this._tagStack.pop();
					else {
						if (element.raw.indexOf("!--") != 0) { //Make sure we're not in a comment
							//All data from here to style close is now a text element
							element.type = ElementType.Text;
							//If the previous element is text, append the current text to it
							if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
								var prevElement = this._elements[this._elements.length - 1];
								if (element.raw != "") {
									prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
									element.raw = element.data = ""; //This causes the current element to not be added to the element list
								} else { //Element is empty, so just append the last tag marker found
									prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep;
								}
							} else { //The previous element was not text
								if (element.raw != "") {
									element.raw = element.data = element.raw;
								}
							}
						}
					}
				}
				else if (this._tagStack[this._tagStack.length - 1] == ElementType.Comment) { //We're currently in a comment tag
					var rawLen = element.raw.length;
					if (element.raw.charAt(rawLen - 2) == "-" && element.raw.charAt(rawLen - 1) == "-" && tagSep == ">") {
						//Actually, we're no longer in a style tag, so pop it off the stack
						this._tagStack.pop();
						//If the previous element is a comment, append the current text to it
						if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
							var prevElement = this._elements[this._elements.length - 1];
							prevElement.raw = prevElement.data = (prevElement.raw + element.raw).replace(Parser._reTrimComment, "");
							element.raw = element.data = ""; //This causes the current element to not be added to the element list
							element.type = ElementType.Text;
						}
						else //Previous element not a comment
							element.type = ElementType.Comment; //Change the current element's type to a comment
					}
					else { //Still in a comment tag
						element.type = ElementType.Comment;
						//If the previous element is a comment, append the current text to it
						if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
							var prevElement = this._elements[this._elements.length - 1];
							prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
							element.raw = element.data = ""; //This causes the current element to not be added to the element list
							element.type = ElementType.Text;
						}
						else
							element.raw = element.data = element.raw + tagSep;
					}
				}
			}
	
			//Processing of non-special tags
			if (element.type == ElementType.Tag) {
				element.name = elementName;
				var elementNameCI = elementName.toLowerCase();
				
				if (element.raw.indexOf("!--") == 0) { //This tag is really comment
					element.type = ElementType.Comment;
					delete element["name"];
					var rawLen = element.raw.length;
					//Check if the comment is terminated in the current element
					if (element.raw.charAt(rawLen - 1) == "-" && element.raw.charAt(rawLen - 2) == "-" && tagSep == ">")
						element.raw = element.data = element.raw.replace(Parser._reTrimComment, "");
					else { //It's not so push the comment onto the tag stack
						element.raw += tagSep;
						this._tagStack.push(ElementType.Comment);
					}
				}
				else if (element.raw.indexOf("!") == 0 || element.raw.indexOf("?") == 0) {
					element.type = ElementType.Directive;
					//TODO: what about CDATA?
				}
				else if (elementNameCI == "script") {
					element.type = ElementType.Script;
					//Special tag, push onto the tag stack if not terminated
					if (element.data.charAt(element.data.length - 1) != "/")
						this._tagStack.push(ElementType.Script);
				}
				else if (elementNameCI == "/script")
					element.type = ElementType.Script;
				else if (elementNameCI == "style") {
					element.type = ElementType.Style;
					//Special tag, push onto the tag stack if not terminated
					if (element.data.charAt(element.data.length - 1) != "/")
						this._tagStack.push(ElementType.Style);
				}
				else if (elementNameCI == "/style")
					element.type = ElementType.Style;
				if (element.name && element.name.charAt(0) == "/")
					element.data = element.name;
			}
	
			//Add all tags and non-empty text elements to the element list
			if (element.raw != "" || element.type != ElementType.Text) {
				if (this._options.includeLocation && !element.location) {
					element.location = this.getLocation(element.type == ElementType.Tag);
				}
				this.parseAttribs(element);
				this._elements.push(element);
				//If tag self-terminates, add an explicit, separate closing tag
				if (
					element.type != ElementType.Text
					&&
					element.type != ElementType.Comment
					&&
					element.type != ElementType.Directive
					&&
					element.data.charAt(element.data.length - 1) == "/"
					)
					this._elements.push({
						  raw: "/" + element.name
						, data: "/" + element.name
						, name: "/" + element.name
						, type: element.type
					});
			}
			this._parseState = (tagSep == "<") ? ElementType.Tag : ElementType.Text;
			this._current = this._next + 1;
			this._prevTagSep = tagSep;
		}

		if (this._options.includeLocation) {
			this.getLocation();
			this._location.row += this._location.inBuffer;
			this._location.inBuffer = 0;
			this._location.charOffset = 0;
		}
		this._buffer = (this._current <= bufferEnd) ? this._buffer.substring(this._current) : "";
		this._current = 0;
	
		this.writeHandler();
	};

	Parser.prototype.getLocation = function Parser$getLocation (startTag) {
		var c,
			l = this._location,
			end = this._current - (startTag ? 1 : 0),
			chunk = startTag && l.charOffset == 0 && this._current == 0;
		
		for (; l.charOffset < end; l.charOffset++) {
			c = this._buffer.charAt(l.charOffset);
			if (c == '\n') {
				l.inBuffer++;
				l.col = 0;
			} else if (c != '\r') {
				l.col++;
			}
		}
		return {
			  line: l.row + l.inBuffer + 1
			, col: l.col + (chunk ? 0: 1)
		};
	};

	//Checks the handler to make it is an object with the right "interface"
	Parser.prototype.validateHandler = function Parser$validateHandler (handler) {
		if ((typeof handler) != "object")
			throw new Error("Handler is not an object");
		if ((typeof handler.reset) != "function")
			throw new Error("Handler method 'reset' is invalid");
		if ((typeof handler.done) != "function")
			throw new Error("Handler method 'done' is invalid");
		if ((typeof handler.writeTag) != "function")
			throw new Error("Handler method 'writeTag' is invalid");
		if ((typeof handler.writeText) != "function")
			throw new Error("Handler method 'writeText' is invalid");
		if ((typeof handler.writeComment) != "function")
			throw new Error("Handler method 'writeComment' is invalid");
		if ((typeof handler.writeDirective) != "function")
			throw new Error("Handler method 'writeDirective' is invalid");
	};

	//Writes parsed elements out to the handler
	Parser.prototype.writeHandler = function Parser$writeHandler (forceFlush) {
		forceFlush = !!forceFlush;
		if (this._tagStack.length && !forceFlush)
			return;
		while (this._elements.length) {
			var element = this._elements.shift();
			switch (element.type) {
				case ElementType.Comment:
					this._handler.writeComment(element);
					break;
				case ElementType.Directive:
					this._handler.writeDirective(element);
					break;
				case ElementType.Text:
					this._handler.writeText(element);
					break;
				default:
					this._handler.writeTag(element);
					break;
			}
		}
	};

	Parser.prototype.handleError = function Parser$handleError (error) {
		if ((typeof this._handler.error) == "function")
			this._handler.error(error);
		else
			throw error;
	};

//TODO: make this a trully streamable handler
function RssHandler (callback) {
	RssHandler.super_.call(this, callback, { ignoreWhitespace: true, verbose: false, enforceEmptyTags: false });
}
inherits(RssHandler, DefaultHandler);

	RssHandler.prototype.done = function RssHandler$done () {
		var feed = { };
		var feedRoot;

		var found = DomUtils.getElementsByTagName(function (value) { return(value == "rss" || value == "feed"); }, this.dom, false);
		if (found.length) {
			feedRoot = found[0];
		}
		if (feedRoot) {
			if (feedRoot.name == "rss") {
				feed.type = "rss";
				feedRoot = feedRoot.children[0]; //<channel/>
				feed.id = "";
				try {
					feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.description = DomUtils.getElementsByTagName("description", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.updated = new Date(DomUtils.getElementsByTagName("lastBuildDate", feedRoot.children, false)[0].children[0].data);
				} catch (ex) { }
				try {
					feed.author = DomUtils.getElementsByTagName("managingEditor", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				feed.items = [];
				DomUtils.getElementsByTagName("item", feedRoot.children).forEach(function (item, index, list) {
					var entry = {};
					try {
						entry.id = DomUtils.getElementsByTagName("guid", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.description = DomUtils.getElementsByTagName("description", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.pubDate = new Date(DomUtils.getElementsByTagName("pubDate", item.children, false)[0].children[0].data);
					} catch (ex) { }
					feed.items.push(entry);
				});
			} else {
				feed.type = "atom";
				try {
					feed.id = DomUtils.getElementsByTagName("id", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].attribs.href;
				} catch (ex) { }
				try {
					feed.description = DomUtils.getElementsByTagName("subtitle", feedRoot.children, false)[0].children[0].data;
				} catch (ex) { }
				try {
					feed.updated = new Date(DomUtils.getElementsByTagName("updated", feedRoot.children, false)[0].children[0].data);
				} catch (ex) { }
				try {
					feed.author = DomUtils.getElementsByTagName("email", feedRoot.children, true)[0].children[0].data;
				} catch (ex) { }
				feed.items = [];
				DomUtils.getElementsByTagName("entry", feedRoot.children).forEach(function (item, index, list) {
					var entry = {};
					try {
						entry.id = DomUtils.getElementsByTagName("id", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].attribs.href;
					} catch (ex) { }
					try {
						entry.description = DomUtils.getElementsByTagName("summary", item.children, false)[0].children[0].data;
					} catch (ex) { }
					try {
						entry.pubDate = new Date(DomUtils.getElementsByTagName("updated", item.children, false)[0].children[0].data);
					} catch (ex) { }
					feed.items.push(entry);
				});
			}

			this.dom = feed;
		}
		RssHandler.super_.prototype.done.call(this);
	};

///////////////////////////////////////////////////

function DefaultHandler (callback, options) {
	this.reset();
	this._options = options ? options : { };
	if (this._options.ignoreWhitespace == undefined)
		this._options.ignoreWhitespace = false; //Keep whitespace-only text nodes
	if (this._options.verbose == undefined)
		this._options.verbose = true; //Keep data property for tags and raw property for all
	if (this._options.enforceEmptyTags == undefined)
		this._options.enforceEmptyTags = true; //Don't allow children for HTML tags defined as empty in spec
	if ((typeof callback) == "function")
		this._callback = callback;
}

	//**"Static"**//
	//HTML Tags that shouldn't contain child nodes
	DefaultHandler._emptyTags = {
		  area: 1
		, base: 1
		, basefont: 1
		, br: 1
		, col: 1
		, frame: 1
		, hr: 1
		, img: 1
		, input: 1
		, isindex: 1
		, link: 1
		, meta: 1
		, param: 1
		, embed: 1
	};
	//Regex to detect whitespace only text nodes
	DefaultHandler.reWhitespace = /^\s*$/;

	//**Public**//
	//Properties//
	DefaultHandler.prototype.dom = null; //The hierarchical object containing the parsed HTML
	//Methods//
	//Resets the handler back to starting state
	DefaultHandler.prototype.reset = function DefaultHandler$reset() {
		this.dom = [];
		this._done = false;
		this._tagStack = [];
		this._tagStack.last = function DefaultHandler$_tagStack$last () {
			return(this.length ? this[this.length - 1] : null);
		};
	};
	//Signals the handler that parsing is done
	DefaultHandler.prototype.done = function DefaultHandler$done () {
		this._done = true;
		this.handleCallback(null);
	};
	DefaultHandler.prototype.writeTag = function DefaultHandler$writeTag (element) {
		this.handleElement(element);
	}; 
	DefaultHandler.prototype.writeText = function DefaultHandler$writeText (element) {
		if (this._options.ignoreWhitespace)
			if (DefaultHandler.reWhitespace.test(element.data))
				return;
		this.handleElement(element);
	}; 
	DefaultHandler.prototype.writeComment = function DefaultHandler$writeComment (element) {
		this.handleElement(element);
	}; 
	DefaultHandler.prototype.writeDirective = function DefaultHandler$writeDirective (element) {
		this.handleElement(element);
	};
	DefaultHandler.prototype.error = function DefaultHandler$error (error) {
		this.handleCallback(error);
	};

	//**Private**//
	//Properties//
	DefaultHandler.prototype._options = null; //Handler options for how to behave
	DefaultHandler.prototype._callback = null; //Callback to respond to when parsing done
	DefaultHandler.prototype._done = false; //Flag indicating whether handler has been notified of parsing completed
	DefaultHandler.prototype._tagStack = null; //List of parents to the currently element being processed
	//Methods//
	DefaultHandler.prototype.handleCallback = function DefaultHandler$handleCallback (error) {
			if ((typeof this._callback) != "function")
				if (error)
					throw error;
				else
					return;
			this._callback(error, this.dom);
	};
	
	DefaultHandler.prototype.isEmptyTag = function(element) {
		var name = element.name.toLowerCase();
		if (name.charAt(0) == '/') {
			name = name.substring(1);
		}
		return this._options.enforceEmptyTags && !!DefaultHandler._emptyTags[name];
	};
	
	DefaultHandler.prototype.handleElement = function DefaultHandler$handleElement (element) {
		if (this._done)
			this.handleCallback(new Error("Writing to the handler after done() called is not allowed without a reset()"));
		if (!this._options.verbose) {
//			element.raw = null; //FIXME: Not clean
			//FIXME: Serious performance problem using delete
			delete element.raw;
			if (element.type == "tag" || element.type == "script" || element.type == "style")
				delete element.data;
		}
		if (!this._tagStack.last()) { //There are no parent elements
			//If the element can be a container, add it to the tag stack and the top level list
			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
				if (element.name.charAt(0) != "/") { //Ignore closing tags that obviously don't have an opening tag
					this.dom.push(element);
					if (!this.isEmptyTag(element)) { //Don't add tags to the tag stack that can't have children
						this._tagStack.push(element);
					}
				}
			}
			else //Otherwise just add to the top level list
				this.dom.push(element);
		}
		else { //There are parent elements
			//If the element can be a container, add it as a child of the element
			//on top of the tag stack and then add it to the tag stack
			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
				if (element.name.charAt(0) == "/") {
					//This is a closing tag, scan the tagStack to find the matching opening tag
					//and pop the stack up to the opening tag's parent
					var baseName = element.name.substring(1);
					if (!this.isEmptyTag(element)) {
						var pos = this._tagStack.length - 1;
						while (pos > -1 && this._tagStack[pos--].name != baseName) { }
						if (pos > -1 || this._tagStack[0].name == baseName)
							while (pos < this._tagStack.length - 1)
								this._tagStack.pop();
					}
				}
				else { //This is not a closing tag
					if (!this._tagStack.last().children)
						this._tagStack.last().children = [];
					this._tagStack.last().children.push(element);
					if (!this.isEmptyTag(element)) //Don't add tags to the tag stack that can't have children
						this._tagStack.push(element);
				}
			}
			else { //This is not a container element
				if (!this._tagStack.last().children)
					this._tagStack.last().children = [];
				this._tagStack.last().children.push(element);
			}
		}
	};

	var DomUtils = {
		  testElement: function DomUtils$testElement (options, element) {
			if (!element) {
				return false;
			}
	
			for (var key in options) {
				if (key == "tag_name") {
					if (element.type != "tag" && element.type != "script" && element.type != "style") {
						return false;
					}
					if (!options["tag_name"](element.name)) {
						return false;
					}
				} else if (key == "tag_type") {
					if (!options["tag_type"](element.type)) {
						return false;
					}
				} else if (key == "tag_contains") {
					if (element.type != "text" && element.type != "comment" && element.type != "directive") {
						return false;
					}
					if (!options["tag_contains"](element.data)) {
						return false;
					}
				} else {
					if (!element.attribs || !options[key](element.attribs[key])) {
						return false;
					}
				}
			}
		
			return true;
		}
	
		, getElements: function DomUtils$getElements (options, currentElement, recurse, limit) {
			recurse = (recurse === undefined || recurse === null) || !!recurse;
			limit = isNaN(parseInt(limit)) ? -1 : parseInt(limit);

			if (!currentElement) {
				return([]);
			}
	
			var found = [];
			var elementList;

			function getTest (checkVal) {
				return(function (value) { return(value == checkVal); });
			}
			for (var key in options) {
				if ((typeof options[key]) != "function") {
					options[key] = getTest(options[key]);
				}
			}
	
			if (DomUtils.testElement(options, currentElement)) {
				found.push(currentElement);
			}

			if (limit >= 0 && found.length >= limit) {
				return(found);
			}

			if (recurse && currentElement.children) {
				elementList = currentElement.children;
			} else if (currentElement instanceof Array) {
				elementList = currentElement;
			} else {
				return(found);
			}
	
			for (var i = 0; i < elementList.length; i++) {
				found = found.concat(DomUtils.getElements(options, elementList[i], recurse, limit));
				if (limit >= 0 && found.length >= limit) {
					break;
				}
			}
	
			return(found);
		}
		
		, getElementById: function DomUtils$getElementById (id, currentElement, recurse) {
			var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
			return(result.length ? result[0] : null);
		}
		
		, getElementsByTagName: function DomUtils$getElementsByTagName (name, currentElement, recurse, limit) {
			return(DomUtils.getElements({ tag_name: name }, currentElement, recurse, limit));
		}
		
		, getElementsByTagType: function DomUtils$getElementsByTagType (type, currentElement, recurse, limit) {
			return(DomUtils.getElements({ tag_type: type }, currentElement, recurse, limit));
		}
	};

	function inherits (ctor, superCtor) {
		var tempCtor = function(){};
		tempCtor.prototype = superCtor.prototype;
		ctor.super_ = superCtor;
		ctor.prototype = new tempCtor();
		ctor.prototype.constructor = ctor;
	}

exports.Parser = Parser;

exports.DefaultHandler = DefaultHandler;

exports.RssHandler = RssHandler;

exports.ElementType = ElementType;

exports.DomUtils = DomUtils;

})();
});

var htmlparser_1 = htmlparser.Parser;
var htmlparser_2 = htmlparser.DefaultHandler;
var htmlparser_3 = htmlparser.RssHandler;
var htmlparser_4 = htmlparser.ElementType;
var htmlparser_5 = htmlparser.DomUtils;

//import feedme  from 'feedme';
class DataManager {

  constructor(){

    // data from the <script> markup, config of Postman
    this._scriptConfigData = {
      feedUrl: null,
      apiKey: null,
      theme: null,
      isValid: false
    };

    // fetched from the the meta markups
    this._currentPageData = {
      title: null,
      description: null,
      image: null
    };

    // fetched from local storage (possibly not existant)
    this._localStorageData = null;
    this._isFirstVisit = true;

    this._init();
  }


  _init(){
    this._fetchLocalStorageData();
    this._fetchCurrentPageData();
    this._fetchScriptConfigData();
  }


  _fetchScriptConfigData(){
    var that = this;
    this._scriptConfigData.apiKey = document.currentScript.getAttribute("key");
    this._scriptConfigData.theme = document.currentScript.getAttribute("theme");

    var feedUrl = document.currentScript.getAttribute("feed");
    that._scriptConfigData.feedUrl = feedUrl;

    // if( feedUrl ){
    //
    //   fetch( feedUrl )
    //   .then(function(response) {
    //     if( response.status > 200 ){
    //       throw "Error status: " + response.status;
    //       return;
    //     }
    //
    //     return response.text();
    //   }).then(function(rssXml) {
    //
    //     var handler = new htmlparser.RssHandler(function (error, rss) {
    //       if( error ){
    //         console.warn( error );
    //         return;
    //       }
    //       if( "items" in rss && rss.items.length > 1){
    //           that._scriptConfigData.feedUrl = feedUrl;
    //       }
    //       console.log( rss );
    //     });
    //
    //     var parser = new htmlparser.Parser(handler);
    //     parser.parseComplete(rssXml);
    //
    //   })
    //   .catch( function(e){
    //     console.log( e );
    //   });
    // }

  }


  _fetchCurrentPageData(){
    function getMeta( rule ){
      var meta = null;

      try{
        meta = document.querySelector( rule );
      }catch(e){}

      var attr = null;

      if( meta ){
        try{
          attr = meta.getAttribute("content");
        }catch(e){}
      }
      return attr;
    }

    this._currentPageData.image = getMeta( "meta[property='og:image']" ) ||
                                  getMeta( "meta[name='twitter:image']" );

    this._currentPageData.description = getMeta( "meta[property='og:description']" ) ||
                                        getMeta( "meta[name='twitter:description']" ) ||
                                        getMeta( "meta[name='description']" );

    this._currentPageDatatitle = getMeta( "meta[property='og:title']" ) ||
                                 getMeta( "meta[name='twitter:title']" ) ||
                                 document.querySelector( "title").text;

  }


  _fetchLocalStorageData(){
    /*
    the local storage for "postman" is a JSON string of the following object:
    {
      hide: Boolean, // true: dont show the Postman widget, false: show it
      lastVisit: Date, // date of the last visit
      subscribed: Boolean ??
    }
    */

    var localPostman = localStorage.getItem("postman");

    if( localPostman ){
      this._isFirstVisit = false;
      this._localStorageData = JSON.parse( window.localStorage.getItem("postman") );
      this._localStorageData.lastVisit = new Date( this._localStorageData.lastVisit );
    }else{
      this._localStorageData = {
        hide: false,
        lastVisit: new Date(),
        subscribed: false
      };
      this._writeToLocalStorage();
    }
  }

  _writeToLocalStorage(){
    window.localStorage.setItem("postman", JSON.stringify( this._localStorageData ));
  }

  isFeedUrlValid(){
    return this._scriptConfigData.isValid;
  }

  getFeedUrl(){
    return this._scriptConfigData.feedUrl;
  }

  shouldShowPostman(){
    return ( !this._localStorageData.subscribed || (new Date() - this._localStorageData.lastVisit > 86400000) )
    // 86400000 is 1 day in ms
  }



  updateLastVisitDate(){
    this._localStorageData.lastVisit = new Date();
    this._writeToLocalStorage();
  }

  enableSubscribe(){
    this._localStorageData.subscribed = true;
    this._writeToLocalStorage();
  }


  close(){
    this.updateLastVisitDate();
  }

}

class ServerCom {
  static post( baseUrl, route, data, cb ){


    var url = baseUrl + route;
    var status = null;

    fetch(url,
    {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( data )
    })
    .then(function(res){
      status = res.status;
      if( status > 200 ){
        throw "Server error, status " + status;
        return;
      }
      return res.json();
    })
    .then(function(data){
      cb( data );
    })
    .catch(function(e){
      cb( {error: 1, message: e} );
    });

  }


}

function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function createElement(name) {
	return document.createElement(name);
}

function createText(data) {
	return document.createTextNode(data);
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function linear(t) {
	return t;
}

function generateRule(
	a,
	b,
	delta,
	duration,
	ease,
	fn
) {
	var keyframes = '{\n';

	for (var p = 0; p <= 1; p += 16.666 / duration) {
		var t = a + delta * ease(p);
		keyframes += p * 100 + '%{' + fn(t) + '}\n';
	}

	return keyframes + '100% {' + fn(b) + '}\n}';
}

// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
	var hash = 5381;
	var i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return hash >>> 0;
}

function wrapTransition(component, node, fn, params, intro, outgroup) {
	var obj = fn(node, params);
	var duration = obj.duration || 300;
	var ease = obj.easing || linear;
	var cssText;

	// TODO share <style> tag between all transitions?
	if (obj.css && !transitionManager.stylesheet) {
		var style = createElement('style');
		document.head.appendChild(style);
		transitionManager.stylesheet = style.sheet;
	}

	if (intro) {
		if (obj.css && obj.delay) {
			cssText = node.style.cssText;
			node.style.cssText += obj.css(0);
		}

		if (obj.tick) obj.tick(0);
	}

	return {
		t: intro ? 0 : 1,
		running: false,
		program: null,
		pending: null,
		run: function(intro, callback) {
			var program = {
				start: window.performance.now() + (obj.delay || 0),
				intro: intro,
				callback: callback
			};

			if (obj.delay) {
				this.pending = program;
			} else {
				this.start(program);
			}

			if (!this.running) {
				this.running = true;
				transitionManager.add(this);
			}
		},
		start: function(program) {
			component.fire(program.intro ? 'intro.start' : 'outro.start', { node: node });

			program.a = this.t;
			program.b = program.intro ? 1 : 0;
			program.delta = program.b - program.a;
			program.duration = duration * Math.abs(program.b - program.a);
			program.end = program.start + program.duration;

			if (obj.css) {
				if (obj.delay) node.style.cssText = cssText;

				program.rule = generateRule(
					program.a,
					program.b,
					program.delta,
					program.duration,
					ease,
					obj.css
				);

				transitionManager.addRule(program.rule, program.name = '__svelte_' + hash(program.rule));

				node.style.animation = (node.style.animation || '')
					.split(', ')
					.filter(function(anim) {
						// when introing, discard old animations if there are any
						return anim && (program.delta < 0 || !/__svelte/.test(anim));
					})
					.concat(program.name + ' ' + duration + 'ms linear 1 forwards')
					.join(', ');
			}

			this.program = program;
			this.pending = null;
		},
		update: function(now) {
			var program = this.program;
			if (!program) return;

			var p = now - program.start;
			this.t = program.a + program.delta * ease(p / program.duration);
			if (obj.tick) obj.tick(this.t);
		},
		done: function() {
			var program = this.program;
			this.t = program.b;
			if (obj.tick) obj.tick(this.t);
			if (obj.css) transitionManager.deleteRule(node, program.name);
			program.callback();
			program = null;
			this.running = !!this.pending;
		},
		abort: function() {
			if (obj.tick) obj.tick(1);
			if (obj.css) transitionManager.deleteRule(node, this.program.name);
			this.program = this.pending = null;
			this.running = false;
		}
	};
}

var transitionManager = {
	running: false,
	transitions: [],
	bound: null,
	stylesheet: null,
	activeRules: {},

	add: function(transition) {
		this.transitions.push(transition);

		if (!this.running) {
			this.running = true;
			requestAnimationFrame(this.bound || (this.bound = this.next.bind(this)));
		}
	},

	addRule: function(rule, name) {
		if (!this.activeRules[name]) {
			this.activeRules[name] = true;
			this.stylesheet.insertRule('@keyframes ' + name + ' ' + rule, this.stylesheet.cssRules.length);
		}
	},

	next: function() {
		this.running = false;

		var now = window.performance.now();
		var i = this.transitions.length;

		while (i--) {
			var transition = this.transitions[i];

			if (transition.program && now >= transition.program.end) {
				transition.done();
			}

			if (transition.pending && now >= transition.pending.start) {
				transition.start(transition.pending);
			}

			if (transition.running) {
				transition.update(now);
				this.running = true;
			} else if (!transition.pending) {
				this.transitions.splice(i, 1);
			}
		}

		if (this.running) {
			requestAnimationFrame(this.bound);
		} else if (this.stylesheet) {
			var i = this.stylesheet.cssRules.length;
			while (i--) this.stylesheet.deleteRule(i);
			this.activeRules = {};
		}
	},

	deleteRule: function(node, name) {
		node.style.animation = node.style.animation
			.split(', ')
			.filter(function(anim) {
				return anim.slice(0, name.length) !== name;
			})
			.join(', ');
	}
};

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.u();
	this._fragment.d();
	this._fragment = this._state = null;
}

function destroyDev(detach) {
	destroy.call(this, detach);
	this.destroy = function() {
		console.warn('Component was already destroyed');
	};
}

function differs(a, b) {
	return a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init$1(component, options) {
	component._observers = { pre: blankObject(), post: blankObject() };
	component._handlers = blankObject();
	component._bind = options._bind;

	component.options = options;
	component.root = options.root || component;
	component.store = component.root.store || options.store;
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function observeDev(key, callback, options) {
	var c = (key = '' + key).search(/[^\w]/);
	if (c > -1) {
		var message =
			'The first argument to component.observe(...) must be the name of a top-level property';
		if (c > 0)
			message += ", i.e. '" + key.slice(0, c) + "' rather than '" + key + "'";

		throw new Error(message);
	}

	return observe.call(this, key, callback, options);
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function onDev(eventName, handler) {
	if (eventName === 'teardown') {
		console.warn(
			"Use component.on('destroy', ...) instead of component.on('teardown', ...) which has been deprecated and will be unsupported in Svelte 2"
		);
		return this.on('destroy', handler);
	}

	return on.call(this, eventName, handler);
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	this.root._lock = true;
	callAll(this.root._beforecreate);
	callAll(this.root._oncreate);
	callAll(this.root._aftercreate);
	this.root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
		this._fragment.p(changed, this._state);
		dispatchObservers(this, this._observers.post, changed, this._state, oldState);
	}
}

function setDev(newState) {
	if (typeof newState !== 'object') {
		throw new Error(
			this._debugName + '.set was called without an object of data key-values to update.'
		);
	}

	this._checkReadOnly(newState);
	set.call(this, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.pop()();
}

function _mount(target, anchor) {
	this._fragment.m(target, anchor);
}

function _unmount() {
	if (this._fragment) this._fragment.u();
}

var protoDev = {
	destroy: destroyDev,
	get: get,
	fire: fire,
	observe: observeDev,
	on: onDev,
	set: setDev,
	teardown: destroyDev,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount
};

function cubicOut(t) {
  var f = t - 1.0;
  return f * f * f + 1.0
}

function slide(
	node,
	ref
) {
	var delay = ref.delay; if ( delay === void 0 ) delay = 0;
	var duration = ref.duration; if ( duration === void 0 ) duration = 400;
	var easing = ref.easing; if ( easing === void 0 ) easing = cubicOut;

	var style = getComputedStyle(node);
	var opacity = +style.opacity;
	var height = parseFloat(style.height);
	var paddingTop = parseFloat(style.paddingTop);
	var paddingBottom = parseFloat(style.paddingBottom);
	var marginTop = parseFloat(style.marginTop);
	var marginBottom = parseFloat(style.marginBottom);
	var borderTopWidth = parseFloat(style.borderTopWidth);
	var borderBottomWidth = parseFloat(style.borderBottomWidth);

	return {
		delay: delay,
		duration: duration,
		easing: easing,
		css: function (t) { return "overflow: hidden;" +
			"opacity: " + (Math.min(t * 20, 1) * opacity) + ";" +
			"height: " + (t * height) + "px;" +
			"padding-top: " + (t * paddingTop) + "px;" +
			"padding-bottom: " + (t * paddingBottom) + "px;" +
			"margin-top: " + (t * marginTop) + "px;" +
			"margin-bottom: " + (t * marginBottom) + "px;" +
			"border-top-width: " + (t * borderTopWidth) + "px;" +
			"border-bottom-width: " + (t * borderBottomWidth) + "px;"; }
	};
}

var Images = {};

// The Postman logo
Images.postmanLogo =  'data:image/png;base64,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';

// closing cross logo
Images.cross = 'data:image/png;base64,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';

/* src/PostmanFooterForm.html generated by Svelte v1.51.1 */
function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}

function isEmailValid(email){
   return validateEmail( email )
 }

function data() {
  return {
    email: "",
    placeholder: "you@email.com",
    logo: Images.postmanLogo,
    cross: Images.cross,
    message: '',
    error: ''
  }
}

var methods = {
  closeCallback(){ console.warn("must be overloaded externally"); },
  submitCallback(){ console.warn("must be overloaded externally"); },

  fieldKeyUp( evt ){
    this.updateColor();

    // Enter key
    if( evt.keyCode === 13 ){
      this.submit();
    }

  },

  updateColor(){
    this.refs.emailInputField.style.border = this.get("isEmailValid") || (this.get("email") === '')  ? "1px solid #eee" : "1px solid #ffb06b";
    //this.refs.emailInputField.style.backgroundColor = this.get("isEmailValid") || (this.get("email") === '')  ? "white" : "#FAA";
  },

  submit(){
    if( this.get("isEmailValid") ){
      this.submitCallback();
    }


  },

  close() {
    this.closeCallback();
    //alert(message); // again, please don't do this
    this.destroy();
  }
};

function encapsulateStyles(node) {
	setAttribute(node, "svelte-2864433158", "");
}

function add_css() {
	var style = createElement("style");
	style.id = 'svelte-2864433158-style';
	style.textContent = ".message[svelte-2864433158]{margin:12px 0 0 0}.error[svelte-2864433158]{color:#F66}.centeredText[svelte-2864433158]{text-align:center}.separator[svelte-2864433158]{border:0.5px dashed #27272730;width:50px}.inputField[svelte-2864433158]{border-radius:0;text-align:center;width:300px;border:1px solid #EEE;font-size:1em;height:2em;background-color:white;margin-right:0.1em}.inputField[svelte-2864433158]:focus{outline:none}.wrapper[svelte-2864433158]{z-index:2147483647;font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;position:fixed;width:100%;background-color:#fff;bottom:0;left:0;right:0;transition:all 0.2s}.quitButton[svelte-2864433158]{position:absolute;top:0;right:0;width:15px;padding:8px;cursor:pointer;transition:all 0.2s}.quitButton[svelte-2864433158]:hover{opacity:0.3}.submitButton[svelte-2864433158]{display:inline-block;background:rgb(104, 204, 247);color:white;padding:7px;cursor:pointer;transition:all 0.2s}.logoDiv[svelte-2864433158]{display:inline-block;width:125px;margin-bottom:8px;transition:all 0.2s}.logoDiv[svelte-2864433158]:hover{opacity:0.5}.logoDiv[svelte-2864433158] img[svelte-2864433158]{width:100%}.submitButton[svelte-2864433158]:hover{background:rgb(69, 169, 212)}.form[svelte-2864433158]{margin-top:10px}.gradient[svelte-2864433158]{width:100%;height:2px;background-image:-webkit-linear-gradient(left, #FF0099 0%, #FFA600 100%);background-image:-moz-linear-gradient(left, #FF0099 0%, #FFA600 100%);background-image:-o-linear-gradient(left, #FF0099 0%, #FFA600 100%);background-image:linear-gradient(to right, #FF0099 0%, #FFA600 100%)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9zdG1hbkZvb3RlckZvcm0uaHRtbCIsInNvdXJjZXMiOlsiUG9zdG1hbkZvb3RlckZvcm0uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8ZGl2IHRyYW5zaXRpb246c2xpZGU9J3tkdXJhdGlvbjogNTAwLCBkZWxheToxNTAwfScgY2xhc3M9XCJ3cmFwcGVyXCI+XG4gIDxkaXYgY2xhc3M9XCJncmFkaWVudFwiPjwvZGl2PlxuXG4gIDxkaXYgY2xhc3M9XCJjZW50ZXJlZFRleHRcIj5cbiAgICA8cCBjbGFzcz1cIm1lc3NhZ2VcIj57e21lc3NhZ2V9fSA8L3A+XG4gICAgPHAgY2xhc3M9XCJlcnJvclwiPnt7ZXJyb3J9fSA8L3A+XG5cbiAgICA8ZGl2IGNsYXNzPVwiZm9ybVwiPlxuICAgICAgPGlucHV0IHJlZjplbWFpbElucHV0RmllbGQgY2xhc3M9XCJpbnB1dEZpZWxkXCIgYmluZDp2YWx1ZT0nZW1haWwnIG9uOmtleXVwPSdmaWVsZEtleVVwKGV2ZW50KScgcGxhY2Vob2xkZXI9J3t7IHBsYWNlaG9sZGVyIH19JyBvbmZvY3VzPVwidGhpcy5wbGFjZWhvbGRlcj0nJ1wiIG9uYmx1cj1cInRoaXMucGxhY2Vob2xkZXIgPSAne3sgcGxhY2Vob2xkZXIgfX0nXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3VibWl0QnV0dG9uXCIgb246Y2xpY2s9J3N1Ym1pdCgpJz5zdWJzY3JpYmU8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICA8aHIgY2xhc3M9XCJzZXBhcmF0b3JcIiAvPlxuICAgIDxkaXYgY2xhc3M9XCJsb2dvRGl2XCI+XG4gICAgICA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2pvbmF0aGFubHVyaWUvcG9zdG1hblwiIHRhcmdldD1cIl9ibGFua1wiPlxuICAgICAgICA8aW1nIHNyYz1cInt7bG9nb319XCIgYWx0PVwiW1RoZSBQb3N0bWFuXVwiLz5cbiAgICAgIDwvYT5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJxdWl0QnV0dG9uXCIgb246Y2xpY2s9J2Nsb3NlKCknPjxpbWcgc3JjPVwie3tjcm9zc319XCIgYWx0PVwiW2Nsb3NlXVwiIHN0eWxlPVwid2lkdGg6IDEwMCVcIi8+PC9kaXY+XG48L2Rpdj5cblxuXG48c3R5bGU+XG4gIC5tZXNzYWdlIHtcbiAgICBtYXJnaW46IDEycHggMCAwIDA7XG4gIH1cblxuICAuZXJyb3Ige1xuICAgIGNvbG9yOiAjRjY2O1xuICB9XG5cbiAgLmNlbnRlcmVkVGV4dCB7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICB9XG5cbiAgLnNlcGFyYXRvciB7XG4gICAgYm9yZGVyOiAwLjVweCBkYXNoZWQgIzI3MjcyNzMwO1xuICAgIHdpZHRoOiA1MHB4O1xuICB9XG5cbiAgLmlucHV0RmllbGQge1xuICAgIGJvcmRlci1yYWRpdXM6IDA7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIHdpZHRoOiAzMDBweDtcbiAgICBib3JkZXI6IDFweCBzb2xpZCAjRUVFO1xuICAgIGZvbnQtc2l6ZTogMWVtO1xuICAgIGhlaWdodDogMmVtO1xuICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xuICAgIG1hcmdpbi1yaWdodDogMC4xZW07XG4gIH1cblxuICAuaW5wdXRGaWVsZDpmb2N1cyB7XG4gICAgb3V0bGluZTpub25lO1xuICB9XG5cbiAgLndyYXBwZXIge1xuICAgIHotaW5kZXg6IDIxNDc0ODM2NDc7XG4gICAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgXCJTZWdvZSBVSVwiLCBSb2JvdG8sIE94eWdlbi1TYW5zLCBVYnVudHUsIENhbnRhcmVsbCwgXCJIZWx2ZXRpY2EgTmV1ZVwiLCBzYW5zLXNlcmlmO1xuICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIGJvdHRvbTogMDtcbiAgICBsZWZ0OiAwO1xuICAgIHJpZ2h0OiAwO1xuICAgIHRyYW5zaXRpb246IGFsbCAwLjJzO1xuICB9XG5cbiAgLnF1aXRCdXR0b24ge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDA7XG4gICAgcmlnaHQ6IDA7XG4gICAgd2lkdGg6IDE1cHg7XG4gICAgcGFkZGluZzogOHB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgfVxuXG4gIC5xdWl0QnV0dG9uOmhvdmVyIHtcbiAgICBvcGFjaXR5OiAwLjM7XG4gIH1cblxuICAuc3VibWl0QnV0dG9uIHtcbiAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgYmFja2dyb3VuZDogcmdiKDEwNCwgMjA0LCAyNDcpO1xuICAgIGNvbG9yOiB3aGl0ZTtcbiAgICBwYWRkaW5nOiA3cHg7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIHRyYW5zaXRpb246IGFsbCAwLjJzO1xuICB9XG5cbiAgLmxvZ29EaXYge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICB3aWR0aDogMTI1cHg7XG4gICAgbWFyZ2luLWJvdHRvbTogOHB4O1xuICAgIHRyYW5zaXRpb246IGFsbCAwLjJzO1xuICB9XG5cbiAgLmxvZ29EaXY6aG92ZXIge1xuICAgIG9wYWNpdHk6IDAuNTtcbiAgfVxuXG4gIC5sb2dvRGl2IGltZyB7XG4gICAgd2lkdGg6IDEwMCU7XG4gIH1cblxuICAuc3VibWl0QnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiByZ2IoNjksIDE2OSwgMjEyKTtcbiAgfVxuXG4gIC5mb3JtIHtcbiAgICBtYXJnaW4tdG9wOiAxMHB4O1xuICB9XG5cbiAgLmdyYWRpZW50IHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDJweDtcblxuICAgIGJhY2tncm91bmQtaW1hZ2U6IC13ZWJraXQtbGluZWFyLWdyYWRpZW50KGxlZnQsICNGRjAwOTkgMCUsICNGRkE2MDAgMTAwJSk7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogLW1vei1saW5lYXItZ3JhZGllbnQobGVmdCwgI0ZGMDA5OSAwJSwgI0ZGQTYwMCAxMDAlKTtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiAtby1saW5lYXItZ3JhZGllbnQobGVmdCwgI0ZGMDA5OSAwJSwgI0ZGQTYwMCAxMDAlKTtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsICNGRjAwOTkgMCUsICNGRkE2MDAgMTAwJSk7XG4gIH1cblxuPC9zdHlsZT5cblxuXG5cblxuPHNjcmlwdD5cbiAgaW1wb3J0IHNsaWRlIGZyb20gJ3N2ZWx0ZS10cmFuc2l0aW9ucy1zbGlkZSc7XG4gIGltcG9ydCB7IEltYWdlcyB9IGZyb20gJy4vSW1hZ2VzLmpzJztcblxuICBmdW5jdGlvbiB2YWxpZGF0ZUVtYWlsKGVtYWlsKSB7XG4gICAgdmFyIHJlID0gL14oKFtePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSsoXFwuW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFxdKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcbiAgICByZXR1cm4gcmUudGVzdChlbWFpbC50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIGV4cG9ydCBkZWZhdWx0IHtcblxuICAgIGRhdGEoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbWFpbDogXCJcIixcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwieW91QGVtYWlsLmNvbVwiLFxuICAgICAgICBsb2dvOiBJbWFnZXMucG9zdG1hbkxvZ28sXG4gICAgICAgIGNyb3NzOiBJbWFnZXMuY3Jvc3MsXG4gICAgICAgIG1lc3NhZ2U6ICcnLFxuICAgICAgICBlcnJvcjogJydcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY29tcHV0ZWQ6IHtcbiAgICAgaXNFbWFpbFZhbGlkOiBmdW5jdGlvbihlbWFpbCl7XG4gICAgICAgIHJldHVybiB2YWxpZGF0ZUVtYWlsKCBlbWFpbCApXG4gICAgICB9XG5cbiAgIH0sXG5cbiAgICBtZXRob2RzOiB7XG4gICAgICBjbG9zZUNhbGxiYWNrKCl7IGNvbnNvbGUud2FybihcIm11c3QgYmUgb3ZlcmxvYWRlZCBleHRlcm5hbGx5XCIpOyB9LFxuICAgICAgc3VibWl0Q2FsbGJhY2soKXsgY29uc29sZS53YXJuKFwibXVzdCBiZSBvdmVybG9hZGVkIGV4dGVybmFsbHlcIik7IH0sXG5cbiAgICAgIGZpZWxkS2V5VXAoIGV2dCApe1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9yKCk7XG5cbiAgICAgICAgLy8gRW50ZXIga2V5XG4gICAgICAgIGlmKCBldnQua2V5Q29kZSA9PT0gMTMgKXtcbiAgICAgICAgICB0aGlzLnN1Ym1pdCgpXG4gICAgICAgIH1cblxuICAgICAgfSxcblxuICAgICAgdXBkYXRlQ29sb3IoKXtcbiAgICAgICAgdGhpcy5yZWZzLmVtYWlsSW5wdXRGaWVsZC5zdHlsZS5ib3JkZXIgPSB0aGlzLmdldChcImlzRW1haWxWYWxpZFwiKSB8fCAodGhpcy5nZXQoXCJlbWFpbFwiKSA9PT0gJycpICA/IFwiMXB4IHNvbGlkICNlZWVcIiA6IFwiMXB4IHNvbGlkICNmZmIwNmJcIjtcbiAgICAgICAgLy90aGlzLnJlZnMuZW1haWxJbnB1dEZpZWxkLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMuZ2V0KFwiaXNFbWFpbFZhbGlkXCIpIHx8ICh0aGlzLmdldChcImVtYWlsXCIpID09PSAnJykgID8gXCJ3aGl0ZVwiIDogXCIjRkFBXCI7XG4gICAgICB9LFxuXG4gICAgICBzdWJtaXQoKXtcbiAgICAgICAgaWYoIHRoaXMuZ2V0KFwiaXNFbWFpbFZhbGlkXCIpICl7XG4gICAgICAgICAgdGhpcy5zdWJtaXRDYWxsYmFjaygpO1xuICAgICAgICB9XG5cblxuICAgICAgfSxcblxuICAgICAgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuY2xvc2VDYWxsYmFjaygpO1xuICAgICAgICAvL2FsZXJ0KG1lc3NhZ2UpOyAvLyBhZ2FpbiwgcGxlYXNlIGRvbid0IGRvIHRoaXNcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHRyYW5zaXRpb25zOiB7IHNsaWRlIH0sXG4gIH07XG48L3NjcmlwdD5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUF1QkUsUUFBUSxtQkFBQyxDQUFDLEFBQ1IsTUFBTSxDQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFDcEIsQ0FBQyxBQUVELE1BQU0sbUJBQUMsQ0FBQyxBQUNOLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQUVELGFBQWEsbUJBQUMsQ0FBQyxBQUNiLFVBQVUsQ0FBRSxNQUFNLEFBQ3BCLENBQUMsQUFFRCxVQUFVLG1CQUFDLENBQUMsQUFDVixNQUFNLENBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQzlCLEtBQUssQ0FBRSxJQUFJLEFBQ2IsQ0FBQyxBQUVELFdBQVcsbUJBQUMsQ0FBQyxBQUNYLGFBQWEsQ0FBRSxDQUFDLENBQ2hCLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLEtBQUssQ0FBRSxLQUFLLENBQ1osTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUN0QixTQUFTLENBQUUsR0FBRyxDQUNkLE1BQU0sQ0FBRSxHQUFHLENBQ1gsZ0JBQWdCLENBQUUsS0FBSyxDQUN2QixZQUFZLENBQUUsS0FBSyxBQUNyQixDQUFDLEFBRUQsOEJBQVcsTUFBTSxBQUFDLENBQUMsQUFDakIsUUFBUSxJQUFJLEFBQ2QsQ0FBQyxBQUVELFFBQVEsbUJBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxVQUFVLENBQ25CLFdBQVcsQ0FBRSxhQUFhLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsVUFBVSxDQUNoSSxRQUFRLENBQUUsS0FBSyxDQUNmLEtBQUssQ0FBRSxJQUFJLENBQ1gsZ0JBQWdCLENBQUUsSUFBSSxDQUN0QixNQUFNLENBQUUsQ0FBQyxDQUNULElBQUksQ0FBRSxDQUFDLENBQ1AsS0FBSyxDQUFFLENBQUMsQ0FDUixVQUFVLENBQUUsR0FBRyxDQUFDLElBQUksQUFDdEIsQ0FBQyxBQUVELFdBQVcsbUJBQUMsQ0FBQyxBQUNYLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxDQUFDLENBQ04sS0FBSyxDQUFFLENBQUMsQ0FDUixLQUFLLENBQUUsSUFBSSxDQUNYLE9BQU8sQ0FBRSxHQUFHLENBQ1osTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsR0FBRyxDQUFDLElBQUksQUFDdEIsQ0FBQyxBQUVELDhCQUFXLE1BQU0sQUFBQyxDQUFDLEFBQ2pCLE9BQU8sQ0FBRSxHQUFHLEFBQ2QsQ0FBQyxBQUVELGFBQWEsbUJBQUMsQ0FBQyxBQUNiLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLFVBQVUsQ0FBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUM5QixLQUFLLENBQUUsS0FBSyxDQUNaLE9BQU8sQ0FBRSxHQUFHLENBQ1osTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsR0FBRyxDQUFDLElBQUksQUFDdEIsQ0FBQyxBQUVELFFBQVEsbUJBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLEtBQUssQ0FBRSxLQUFLLENBQ1osYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLEdBQUcsQ0FBQyxJQUFJLEFBQ3RCLENBQUMsQUFFRCwyQkFBUSxNQUFNLEFBQUMsQ0FBQyxBQUNkLE9BQU8sQ0FBRSxHQUFHLEFBQ2QsQ0FBQyxBQUVELDJCQUFRLENBQUMsR0FBRyxtQkFBQyxDQUFDLEFBQ1osS0FBSyxDQUFFLElBQUksQUFDYixDQUFDLEFBRUQsZ0NBQWEsTUFBTSxBQUFDLENBQUMsQUFDbkIsVUFBVSxDQUFFLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQy9CLENBQUMsQUFFRCxLQUFLLG1CQUFDLENBQUMsQUFDTCxVQUFVLENBQUUsSUFBSSxBQUNsQixDQUFDLEFBRUQsU0FBUyxtQkFBQyxDQUFDLEFBQ1QsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUVYLGdCQUFnQixDQUFFLHdCQUF3QixJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUN6RSxnQkFBZ0IsQ0FBRSxxQkFBcUIsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FDdEUsZ0JBQWdCLENBQUUsbUJBQW1CLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQ3BFLGdCQUFnQixDQUFFLGdCQUFnQixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQUFDdkUsQ0FBQyJ9 */";
	appendNode(style, document.head);
}

function create_main_fragment(state, component) {
	var div, div_1, text, div_2, p, text_1, text_3, p_1, text_4, text_6, div_3, input, input_updating = false, input_onblur_value, text_7, div_4, text_10, hr, text_11, div_5, a, img, text_15, div_6, img_1, div_transition, introing, outroing;

	function input_input_handler() {
		input_updating = true;
		component.set({ email: input.value });
		input_updating = false;
	}

	function keyup_handler(event) {
		component.fieldKeyUp(event);
	}

	function click_handler(event) {
		component.submit();
	}

	function click_handler_1(event) {
		component.close();
	}

	return {
		c: function create() {
			div = createElement("div");
			div_1 = createElement("div");
			text = createText("\n\n  ");
			div_2 = createElement("div");
			p = createElement("p");
			text_1 = createText(state.message);
			text_3 = createText("\n    ");
			p_1 = createElement("p");
			text_4 = createText(state.error);
			text_6 = createText("\n\n    ");
			div_3 = createElement("div");
			input = createElement("input");
			text_7 = createText("\n      ");
			div_4 = createElement("div");
			div_4.textContent = "subscribe";
			text_10 = createText("\n    ");
			hr = createElement("hr");
			text_11 = createText("\n    ");
			div_5 = createElement("div");
			a = createElement("a");
			img = createElement("img");
			text_15 = createText("\n  ");
			div_6 = createElement("div");
			img_1 = createElement("img");
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(div);
			encapsulateStyles(div_1);
			div_1.className = "gradient";
			encapsulateStyles(div_2);
			encapsulateStyles(p);
			p.className = "message";
			encapsulateStyles(p_1);
			p_1.className = "error";
			encapsulateStyles(div_3);
			encapsulateStyles(input);
			addListener(input, "input", input_input_handler);
			input.className = "inputField";
			input.placeholder = state.placeholder;
			setAttribute(input, "onfocus", "this.placeholder=''");
			setAttribute(input, "onblur", input_onblur_value = "this.placeholder = '" + state.placeholder + "'");
			addListener(input, "keyup", keyup_handler);
			encapsulateStyles(div_4);
			div_4.className = "submitButton";
			addListener(div_4, "click", click_handler);
			div_3.className = "form";
			encapsulateStyles(hr);
			hr.className = "separator";
			encapsulateStyles(div_5);
			encapsulateStyles(img);
			img.src = state.logo;
			img.alt = "[The Postman]";
			a.href = "https://github.com/jonathanlurie/postman";
			a.target = "_blank";
			div_5.className = "logoDiv";
			div_2.className = "centeredText";
			encapsulateStyles(div_6);
			img_1.src = state.cross;
			img_1.alt = "[close]";
			setStyle(img_1, "width", "100%");
			div_6.className = "quitButton";
			addListener(div_6, "click", click_handler_1);
			div.className = "wrapper";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(div_1, div);
			appendNode(text, div);
			appendNode(div_2, div);
			appendNode(p, div_2);
			appendNode(text_1, p);
			appendNode(text_3, div_2);
			appendNode(p_1, div_2);
			appendNode(text_4, p_1);
			appendNode(text_6, div_2);
			appendNode(div_3, div_2);
			appendNode(input, div_3);
			component.refs.emailInputField = input;

			input.value = state.email;

			appendNode(text_7, div_3);
			appendNode(div_4, div_3);
			appendNode(text_10, div_2);
			appendNode(hr, div_2);
			appendNode(text_11, div_2);
			appendNode(div_5, div_2);
			appendNode(a, div_5);
			appendNode(img, a);
			appendNode(text_15, div);
			appendNode(div_6, div);
			appendNode(img_1, div_6);
		},

		p: function update(changed, state) {
			if (outroing || changed.message) {
				text_1.data = state.message;
			}

			if (outroing || changed.error) {
				text_4.data = state.error;
			}

			if (!input_updating) input.value = state.email;
			if (outroing || changed.placeholder) {
				input.placeholder = state.placeholder;
			}

			if ((outroing || changed.placeholder) && input_onblur_value !== (input_onblur_value = "this.placeholder = '" + state.placeholder + "'")) {
				setAttribute(input, "onblur", input_onblur_value);
			}

			if (outroing || changed.logo) {
				img.src = state.logo;
			}

			if (outroing || changed.cross) {
				img_1.src = state.cross;
			}
		},

		i: function intro(target, anchor) {
			if (introing) return;
			introing = true;
			outroing = false;

			component.root._aftercreate.push(function() {
				if (!div_transition) div_transition = wrapTransition(component, div, slide, {duration: 500, delay:1500}, true, null);
				div_transition.run(true, function() {
					component.fire("intro.end", { node: div });
				});
			});

			this.m(target, anchor);
		},

		o: function outro(outrocallback) {
			if (outroing) return;
			outroing = true;
			introing = false;

			var outros = 1;

			div_transition.run(false, function() {
				component.fire("outro.end", { node: div });
				if (--outros === 0) outrocallback();
				div_transition = null;
			});
		},

		u: function unmount() {
			detachNode(div);
		},

		d: function destroy$$1() {
			removeListener(input, "input", input_input_handler);
			removeListener(input, "keyup", keyup_handler);
			if (component.refs.emailInputField === input) component.refs.emailInputField = null;
			removeListener(div_4, "click", click_handler);
			removeListener(div_6, "click", click_handler_1);
		}
	};
}

function PostmanFooterForm(options) {
	this._debugName = '<PostmanFooterForm>';
	if (!options || (!options.target && !options.root)) throw new Error("'target' is a required option");
	init$1(this, options);
	this.refs = {};
	this._state = assign(data(), options.data);
	this._recompute({ email: 1 }, this._state);
	if (!('email' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'email'");
	if (!('message' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'message'");
	if (!('error' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'error'");
	if (!('placeholder' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'placeholder'");
	if (!('logo' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'logo'");
	if (!('cross' in this._state)) console.warn("<PostmanFooterForm> was created without expected data property 'cross'");

	if (!document.getElementById("svelte-2864433158-style")) add_css();

	if (!options.root) {
		this._oncreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.i(options.target, options.anchor || null);

		callAll(this._aftercreate);
	}
}

assign(PostmanFooterForm.prototype, methods, protoDev);

PostmanFooterForm.prototype._checkReadOnly = function _checkReadOnly(newState) {
	if ('isEmailValid' in newState && !this._updatingReadonlyProperty) throw new Error("<PostmanFooterForm>: Cannot set read-only property 'isEmailValid'");
};

PostmanFooterForm.prototype._recompute = function _recompute(changed, state) {
	if (changed.email) {
		if (differs(state.isEmailValid, (state.isEmailValid = isEmailValid(state.email)))) changed.isEmailValid = true;
	}
};

const SERVER_URL = "https://wt-3d8e69c28886f9c9f7ed6ba6797d805b-0.run.webtask.io/postman";
var postmanForm = null;
var dataManager = null;


function init(){
  dataManager = new DataManager();

   if( !dataManager.shouldShowPostman() )
    return;

  var feedUrl = dataManager.getFeedUrl();

  if( !feedUrl )
   return;

  postmanForm = new PostmanFooterForm({
    target: document.body,
    data: {
      message: ''//"Hello, subscribe!"
    }
  });


  postmanForm.closeCallback = function(){
    var email = postmanForm.get("email");
    console.log("email: " + email);
  };

  postmanForm.submitCallback = function(){
    var email = postmanForm.get("email");

    ServerCom.post(
      SERVER_URL,     // url
      "/subscribe",   // route
      {               // data
        email: email,
        feedUrl: feedUrl
      },
      function( res ){
        if( res.error ){
          console.warn( res.message );
          postmanForm.set({"error": "ERROR: " + res.message});
          return;
        }
        postmanForm.set({"error": ""});
        console.log( res );

      }
    );

  };
}





init();

return app;

}());
//# sourceMappingURL=postman.js.map
