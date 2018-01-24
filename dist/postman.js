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
	setAttribute(node, "svelte-2995772389", "");
}

function add_css() {
	var style = createElement("style");
	style.id = 'svelte-2995772389-style';
	style.textContent = ".inputField[svelte-2995772389]{border-radius:0;text-align:center;width:200px;border:1px solid #EEE;font-size:1em;height:2em;background-color:white}.inputField[svelte-2995772389]:focus{outline:none}.wrapper[svelte-2995772389]{font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;position:fixed;width:100%;height:200px;background-color:#fff;bottom:0;left:0;right:0}.quitButton[svelte-2995772389]{position:absolute;top:0;right:0;width:20px;height:20px;background:rgba(255, 255, 255, 0.5);border-radius:50%;padding:5px;cursor:pointer}.submitButton[svelte-2995772389]{display:inline-block;background:rgb(104, 204, 247);color:white;padding:7px;cursor:pointer;transition:all 0.2s}.submitButton[svelte-2995772389]:hover{background:rgb(69, 169, 212)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9zdG1hbkZvb3RlckZvcm0uaHRtbCIsInNvdXJjZXMiOlsiUG9zdG1hbkZvb3RlckZvcm0uaHRtbCJdLCJzb3VyY2VzQ29udGVudCI6WyI8ZGl2IGNsYXNzPVwid3JhcHBlclwiPlxuICA8cD57e21lc3NhZ2V9fSA8L3A+XG4gIDxpbnB1dCByZWY6ZW1haWxJbnB1dEZpZWxkIGNsYXNzPVwiaW5wdXRGaWVsZFwiIGJpbmQ6dmFsdWU9J2VtYWlsJyBvbjprZXl1cD0nZmllbGRLZXlVcChldmVudCknIHBsYWNlaG9sZGVyPSd5b3VAZW1haWwuY29tJz5cblxuXG4gIDxkaXYgY2xhc3M9XCJzdWJtaXRCdXR0b25cIiBvbjpjbGljaz0nc3VibWl0KCknPnN1YnNjcmliZTwvZGl2PlxuXG4gIDxkaXYgY2xhc3M9XCJxdWl0QnV0dG9uXCIgb246Y2xpY2s9J2Nsb3NlKCknPltYXTwvZGl2PlxuPC9kaXY+XG5cblxuPHN0eWxlPlxuXG5cblxuICAuaW5wdXRGaWVsZCB7XG4gICAgYm9yZGVyLXJhZGl1czogMDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgd2lkdGg6IDIwMHB4O1xuICAgIGJvcmRlcjogMXB4IHNvbGlkICNFRUU7XG4gICAgZm9udC1zaXplOiAxZW07XG4gICAgaGVpZ2h0OiAyZW07XG4gICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gIH1cblxuICAuaW5wdXRGaWVsZDpmb2N1cyB7XG4gICAgb3V0bGluZTpub25lO1xuICB9XG5cbiAgLndyYXBwZXIge1xuICAgIGZvbnQtZmFtaWx5OiAtYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsIFwiU2Vnb2UgVUlcIiwgUm9ib3RvLCBPeHlnZW4tU2FucywgVWJ1bnR1LCBDYW50YXJlbGwsIFwiSGVsdmV0aWNhIE5ldWVcIiwgc2Fucy1zZXJpZjtcbiAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiAyMDBweDtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIGJvdHRvbTogMDtcbiAgICBsZWZ0OiAwO1xuICAgIHJpZ2h0OiAwO1xuICB9XG5cbiAgLnF1aXRCdXR0b24ge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDA7XG4gICAgcmlnaHQ6IDA7XG4gICAgd2lkdGg6IDIwcHg7XG4gICAgaGVpZ2h0OiAyMHB4O1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KTtcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgcGFkZGluZzogNXB4O1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuXG4gIC5zdWJtaXRCdXR0b24ge1xuICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICBiYWNrZ3JvdW5kOiByZ2IoMTA0LCAyMDQsIDI0Nyk7XG4gICAgY29sb3I6IHdoaXRlO1xuICAgIHBhZGRpbmc6IDdweDtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgdHJhbnNpdGlvbjogYWxsIDAuMnM7XG4gIH1cblxuICAuc3VibWl0QnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiByZ2IoNjksIDE2OSwgMjEyKTtcbiAgfVxuXG48L3N0eWxlPlxuXG5cblxuXG48c2NyaXB0PlxuICBmdW5jdGlvbiB2YWxpZGF0ZUVtYWlsKGVtYWlsKSB7XG4gICAgdmFyIHJlID0gL14oKFtePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSsoXFwuW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFxdKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcbiAgICByZXR1cm4gcmUudGVzdChlbWFpbC50b0xvd2VyQ2FzZSgpKTtcbiAgfVxuXG4gIGV4cG9ydCBkZWZhdWx0IHtcblxuICAgIGRhdGEoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbWFpbDogXCJcIixcblxuICAgICAgfVxuICAgIH0sXG5cbiAgICBjb21wdXRlZDoge1xuICAgICBpc0VtYWlsVmFsaWQ6IGZ1bmN0aW9uKGVtYWlsKXtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlRW1haWwoIGVtYWlsIClcbiAgICAgIH1cblxuICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgIGNsb3NlQ2FsbGJhY2soKXsgY29uc29sZS53YXJuKFwibXVzdCBiZSBvdmVybG9hZGVkIGV4dGVybmFsbHlcIik7IH0sXG4gICAgICBzdWJtaXRDYWxsYmFjaygpeyBjb25zb2xlLndhcm4oXCJtdXN0IGJlIG92ZXJsb2FkZWQgZXh0ZXJuYWxseVwiKTsgfSxcblxuICAgICAgZmllbGRLZXlVcCggZXZ0ICl7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3IoKTtcblxuICAgICAgICAvLyBFbnRlciBrZXlcbiAgICAgICAgaWYoIGV2dC5rZXlDb2RlID09PSAxMyApe1xuICAgICAgICAgIHRoaXMuc3VibWl0KClcbiAgICAgICAgfVxuXG4gICAgICB9LFxuXG4gICAgICB1cGRhdGVDb2xvcigpe1xuICAgICAgICB0aGlzLnJlZnMuZW1haWxJbnB1dEZpZWxkLnN0eWxlLmJvcmRlciA9IHRoaXMuZ2V0KFwiaXNFbWFpbFZhbGlkXCIpIHx8ICh0aGlzLmdldChcImVtYWlsXCIpID09PSAnJykgID8gXCIxcHggc29saWQgI2VlZVwiIDogXCIxcHggc29saWQgI2ZmYjA2YlwiO1xuICAgICAgICAvL3RoaXMucmVmcy5lbWFpbElucHV0RmllbGQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5nZXQoXCJpc0VtYWlsVmFsaWRcIikgfHwgKHRoaXMuZ2V0KFwiZW1haWxcIikgPT09ICcnKSAgPyBcIndoaXRlXCIgOiBcIiNGQUFcIjtcbiAgICAgIH0sXG5cbiAgICAgIHN1Ym1pdCgpe1xuICAgICAgICBpZiggdGhpcy5nZXQoXCJpc0VtYWlsVmFsaWRcIikgKXtcbiAgICAgICAgICB0aGlzLnN1Ym1pdENhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgfSxcblxuICAgICAgY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuY2xvc2VDYWxsYmFjaygpO1xuICAgICAgICAvL2FsZXJ0KG1lc3NhZ2UpOyAvLyBhZ2FpbiwgcGxlYXNlIGRvbid0IGRvIHRoaXNcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuPC9zY3JpcHQ+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZUUsV0FBVyxtQkFBQyxDQUFDLEFBQ1gsYUFBYSxDQUFFLENBQUMsQ0FDaEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsS0FBSyxDQUFFLEtBQUssQ0FDWixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQ3RCLFNBQVMsQ0FBRSxHQUFHLENBQ2QsTUFBTSxDQUFFLEdBQUcsQ0FDWCxnQkFBZ0IsQ0FBRSxLQUFLLEFBQ3pCLENBQUMsQUFFRCw4QkFBVyxNQUFNLEFBQUMsQ0FBQyxBQUNqQixRQUFRLElBQUksQUFDZCxDQUFDLEFBRUQsUUFBUSxtQkFBQyxDQUFDLEFBQ1IsV0FBVyxDQUFFLGFBQWEsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxVQUFVLENBQ2hJLFFBQVEsQ0FBRSxLQUFLLENBQ2YsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsS0FBSyxDQUNiLGdCQUFnQixDQUFFLElBQUksQ0FDdEIsTUFBTSxDQUFFLENBQUMsQ0FDVCxJQUFJLENBQUUsQ0FBQyxDQUNQLEtBQUssQ0FBRSxDQUFDLEFBQ1YsQ0FBQyxBQUVELFdBQVcsbUJBQUMsQ0FBQyxBQUNYLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxDQUFDLENBQ04sS0FBSyxDQUFFLENBQUMsQ0FDUixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osVUFBVSxDQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ3BDLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLE9BQU8sQ0FBRSxHQUFHLENBQ1osTUFBTSxDQUFFLE9BQU8sQUFDakIsQ0FBQyxBQUVELGFBQWEsbUJBQUMsQ0FBQyxBQUNiLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLFVBQVUsQ0FBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUM5QixLQUFLLENBQUUsS0FBSyxDQUNaLE9BQU8sQ0FBRSxHQUFHLENBQ1osTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsR0FBRyxDQUFDLElBQUksQUFDdEIsQ0FBQyxBQUVELGdDQUFhLE1BQU0sQUFBQyxDQUFDLEFBQ25CLFVBQVUsQ0FBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUMvQixDQUFDIn0= */";
	appendNode(style, document.head);
}

function create_main_fragment(state, component) {
	var div, p, text, text_2, input, input_updating = false, text_3, div_1, text_5, div_2;

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
			p = createElement("p");
			text = createText(state.message);
			text_2 = createText("\n  ");
			input = createElement("input");
			text_3 = createText("\n\n\n  ");
			div_1 = createElement("div");
			div_1.textContent = "subscribe";
			text_5 = createText("\n\n  ");
			div_2 = createElement("div");
			div_2.textContent = "[X]";
			this.h();
		},

		h: function hydrate() {
			encapsulateStyles(div);
			encapsulateStyles(input);
			addListener(input, "input", input_input_handler);
			input.className = "inputField";
			input.placeholder = "you@email.com";
			addListener(input, "keyup", keyup_handler);
			encapsulateStyles(div_1);
			div_1.className = "submitButton";
			addListener(div_1, "click", click_handler);
			encapsulateStyles(div_2);
			div_2.className = "quitButton";
			addListener(div_2, "click", click_handler_1);
			div.className = "wrapper";
		},

		m: function mount(target, anchor) {
			insertNode(div, target, anchor);
			appendNode(p, div);
			appendNode(text, p);
			appendNode(text_2, div);
			appendNode(input, div);
			component.refs.emailInputField = input;

			input.value = state.email;

			appendNode(text_3, div);
			appendNode(div_1, div);
			appendNode(text_5, div);
			appendNode(div_2, div);
		},

		p: function update(changed, state) {
			if (changed.message) {
				text.data = state.message;
			}

			if (!input_updating) input.value = state.email;
		},

		u: function unmount() {
			detachNode(div);
		},

		d: function destroy$$1() {
			removeListener(input, "input", input_input_handler);
			removeListener(input, "keyup", keyup_handler);
			if (component.refs.emailInputField === input) component.refs.emailInputField = null;
			removeListener(div_1, "click", click_handler);
			removeListener(div_2, "click", click_handler_1);
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

	if (!document.getElementById("svelte-2995772389-style")) add_css();

	this._fragment = create_main_fragment(this._state, this);

	if (options.target) {
		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		this._fragment.c();
		this._fragment.m(options.target, options.anchor || null);
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
      message: "Hello, subscribe!"
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
          return;
        }

        console.log( res );

      }
    );

  };
}




init();

return app;

}());
//# sourceMappingURL=postman.js.map
