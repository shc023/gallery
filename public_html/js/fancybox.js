 /*!
 * fancyBox - jQuery Plugin
 * version: 2.0.3 (29/11/2011)
 * @requires jQuery v1.6 or later
 *
 * Examples at http://fancyapps.com/fancybox/
 * License: www.fancyapps.com/fancybox/#license
 *
 * Copyright 2011 Janis Skarnelis - janis@fancyapps.com
 *
 */
(function (window, document, $) {
	var W = $(window),
		D = $(document),
		F = $.fancybox = function () {
			F.open.apply( this, arguments );
		},
		didResize = false,
		resizeTimer = null;

	$.extend(F, {
		// The current version of fancyBox
		version: '2.0.3',

		defaults: {
			padding: 15,
			margin: 20,

			width: 800,
			height: 600,
			minWidth: 200,
			minHeight: 200,
			maxWidth: 9999,
			maxHeight: 9999,

			autoSize: true,
			fitToView: true,
			aspectRatio: false,
			topRatio: 0.5,

			fixed: !$.browser.msie || $.browser.version > 6,
			scrolling: 'auto', // 'auto', 'yes' or 'no'
			wrapCSS: 'fancybox-default',

			arrows: true,
			closeBtn: true,
			closeClick: false,
			nextClick : false,
			mouseWheel: true,
			autoPlay: false,
			playSpeed: 3000,

			modal: false,
			loop: true,
			ajax: {},
			keys: {
				next: [13, 32, 34, 39, 40], // enter, space, page down, right arrow, down arrow
				prev: [8, 33, 37, 38], // backspace, page up, left arrow, up arrow
				close: [27] // escape key
			},

			// Override some properties
			index: 0,
			type: null,
			href: null,
			content: null,
			title: null,

			// HTML templates
			tpl: {
				wrap: '<div class="fancybox-wrap"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div>',
				image: '<img class="fancybox-image" src="{href}" alt="" />',
				iframe: '<iframe class="fancybox-iframe" name="fancybox-frame{rnd}" frameborder="0" hspace="0" ' + ($.browser.msie ? 'allowtransparency="true""' : '') + ' scrolling="{scrolling}" src="{href}"></iframe>',
				swf: '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="wmode" value="transparent" /><param name="allowfullscreen" value="true" /><param name="allowscriptaccess" value="always" /><param name="movie" value="{href}" /><embed src="{href}" type="application/x-shockwave-flash" allowfullscreen="true" allowscriptaccess="always" width="100%" height="100%" wmode="transparent"></embed></object>',
				error: '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn: '<div title="Close" class="fancybox-item fancybox-close"></div>',
				next: '<a title="Next" class="fancybox-item fancybox-next"><span></span></a>',
				prev: '<a title="Previous" class="fancybox-item fancybox-prev"><span></span></a>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect: 'elastic', // 'elastic', 'fade' or 'none'
			openSpeed: 500,
			openEasing: 'swing',
			openOpacity: true,
			openMethod: 'zoomIn',

			// Closing fancyBox
			closeEffect: 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed: 500,
			closeEasing: 'swing',
			closeOpacity: true,
			closeMethod: 'zoomOut',

			// Changing next gallery item
			nextEffect: 'elastic', // 'elastic', 'fade' or 'none'
			nextSpeed: 300,
			nextEasing: 'swing',
			nextMethod: 'changeIn',

			// Changing previous gallery item
			prevEffect: 'elastic', // 'elastic', 'fade' or 'none'
			prevSpeed: 300,
			prevEasing: 'swing',
			prevMethod: 'changeOut',

			// Enabled helpers
			helpers: {
				overlay: {
					speedIn: 0,
					speedOut: 0,
					opacity: 0.85,
					css: {
						cursor: 'pointer',
						'background-color': 'rgba(0, 0, 0, 0.85)' //Browsers who don`t support rgba will fall back to default color value defined at CSS file
					},
					closeClick: true
				},
				title: {
					type: 'float' // 'float', 'inside', 'outside' or 'over'
				}
			},

			// Callbacks
			onCancel: $.noop, // If canceling
			beforeLoad: $.noop, // Before loading
			afterLoad: $.noop, // After loading
			beforeShow: $.noop, // Before changing in current item
			afterShow: $.noop, // After opening
			beforeClose: $.noop, // Before closing
			afterClose: $.noop // After closing
		},

		//Current state
		group: {}, // Selected group
		opts: {}, // Group options
		coming: null, // Element being loaded
		current: null, // Currently loaded element
		isOpen: false, // Is currently open
		isOpened: false, // Have been fully opened at least once
		wrap: null,
		outer: null,
		inner: null,

		player: {
			timer: null,
			isActive: false
		},

		// Loaders
		ajaxLoad: null,
		imgPreload: null,

		// Some collections
		transitions: {},
		helpers: {},

		/*
		 *	Static methods
		 */

		open: function (group, opts) {
			// Normalize group
			if (!$.isArray(group)) {
				group = [group];
			}

			if (!group.length) {
				return;
			}

			//Kill existing instances
			F.close(true);

			//extend the defaults
			F.opts = $.extend(true, {}, F.defaults, opts);
			F.group = group;

			F._start(F.opts.index || 0);
		},

		cancel: function () {
			if (F.coming && false === F.trigger('onCancel')) {
				return;
			}

			F.coming = null;

			F.hideLoading();

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onabort = F.imgPreload.onerror = null;
			}
		},

		close: function (a) {
			F.cancel();

			if (!F.current || false === F.trigger('beforeClose')) {
				return;
			}

			F.unbindEvents();

			//If forced or is still opening then remove immediately
			if (!F.isOpen || (a && a[0] === true)) {
				$(".fancybox-wrap").stop().trigger('onReset').remove();

				F._afterZoomOut();

			} else {
				F.isOpen = F.isOpened = false;

				$(".fancybox-item").remove();

				F.wrap.stop(true).removeClass('fancybox-opened');
				F.inner.css('overflow', 'hidden');

				F.transitions[F.current.closeMethod]();
			}
		},

		play: function (a) {
			var clear = function () {
					clearTimeout(F.player.timer);
				},
				set = function () {
					clear();

					if (F.current && F.player.isActive) {
						F.player.timer = setTimeout(F.next, F.current.playSpeed);
					}
				},
				stop = function () {
					clear();

					$('body').unbind('.player');

					F.player.isActive = false;

					F.trigger('onPlayEnd');
				},
				start = function () {
					if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
						F.player.isActive = true;

						set();

						$('body').bind({
							'onCancel.player afterShow.player onUpdate.player': set,
							'beforeClose.player': stop,
							'beforeLoad.player': clear
						});

						F.trigger('onPlayStart');
					}
				};

			if (F.player.isActive || (a && a[0] === false)) {
				stop();
			} else {
				start();
			}
		},

		next: function () {
			if (F.current) {
				F.jumpto(F.current.index + 1);
			}
		},

		prev: function () {
			if (F.current) {
				F.jumpto(F.current.index - 1);
			}
		},

		jumpto: function (index) {
			if (!F.current) {
				return;
			}

			index = parseInt(index, 10);

			if (F.group.length > 1 && F.current.loop) {
				if (index >= F.group.length) {
					index = 0;

				} else if (index < 0) {
					index = F.group.length - 1;
				}
			}

			if (typeof F.group[index] !== 'undefined') {
				F.cancel();

				F._start(index);
			}
		},

		reposition: function (a) {
			if (F.isOpen) {
				F.wrap.css(F._getPosition(a));
			}
		},

		update: function () {
			if (F.isOpen) {
				// It's a very bad idea to attach handlers to the window scroll event, run this code after a delay
				if (!didResize) {
					resizeTimer = setInterval(function () {
						if (didResize) {
							didResize = false;

							clearTimeout(resizeTimer);

							if (F.current) {
								if (F.current.autoSize) {
									F.inner.height('auto');
									F.current.height = F.inner.height();
								}

								F._setDimension();

								if (F.current.canGrow) {
									F.inner.height('auto');
								}

								F.reposition();

								F.trigger('onUpdate');
							}
						}
					}, 100);
				}

				didResize = true;
			}
		},

		toggle: function () {
			if (F.isOpen) {
				F.current.fitToView = !F.current.fitToView;

				F.update();
			}
		},

		hideLoading: function () {
			$("#fancybox-loading").remove();
		},

		showLoading: function () {
			F.hideLoading();

			$('<div id="fancybox-loading"></div>').click(F.cancel).appendTo('body');
		},

		getViewport: function () {
			return {
				x: W.scrollLeft(),
				y: W.scrollTop(),
				w: W.width(),
				h: W.height()
			};
		},

		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (F.wrap) {
				F.wrap.unbind('.fb');	
			}

			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents: function () {
			var current = F.current,
				keys = current.keys;

			if (!current) {
				return;
			}

			W.bind('resize.fb, orientationchange.fb', F.update);

			if (keys) {
				D.bind('keydown.fb', function (e) {
					// Ignore key events within form elements
					if ($.inArray(e.target.tagName.toLowerCase(), ['input', 'textarea', 'select', 'button']) > -1) {
						return;
					}

					if ($.inArray(e.keyCode, keys.close) > -1) {
						F.close();
						e.preventDefault();

					} else if ($.inArray(e.keyCode, keys.next) > -1) {
						F.next();
						e.preventDefault();

					} else if ($.inArray(e.keyCode, keys.prev) > -1) {
						F.prev();
						e.preventDefault();
					}
				});
			}

			if ($.fn.mousewheel && current.mouseWheel && F.group.length > 1) {
				F.wrap.bind('mousewheel.fb', function (e, delta) {
					if ($(e.target).get(0).clientHeight === 0 || $(e.target).get(0).scrollHeight === $(e.target).get(0).clientHeight) {
						e.preventDefault();

						F[delta > 0 ? 'prev' : 'next']();
					}
				});
			}
		},

		trigger: function (event) {
			var ret, obj = $.inArray(event, ['onCancel', 'beforeLoad', 'afterLoad']) > -1 ? 'coming' : 'current';

			if (!F[obj]) {
				return;
			}

			if ($.isFunction(F[obj][event])) {
				ret = F[obj][event].apply(F[obj], Array.prototype.slice.call(arguments, 1));
			}

			if (ret === false) {
				return false;
			}

			if (F[obj].helpers) {
				$.each(F[obj].helpers, function (helper, opts) {
					if (opts && typeof F.helpers[helper] !== 'undefined' && $.isFunction(F.helpers[helper][event])) {
						F.helpers[helper][event](opts);
					}
				});
			}

			$.event.trigger(event + '.fb');
		},

		isImage: function (str) {
			return str && str.match(/\.(jpg|gif|png|bmp|jpeg)(.*)?$/i);
		},

		isSWF: function (str) {
			return str && str.match(/\.(swf)(.*)?$/i);
		},

		_start: function (index) {
			var element = F.group[index] || null,
				isDom,
				href,
				type,
				rez,
				coming = $.extend(true, {}, F.opts, ($.isPlainObject(element) ? element : {}), {
					index : index,
					element : element
				});

			// Convert margin property to array - top, right, bottom, left
			if (typeof coming.margin === 'number') {
				coming.margin = [coming.margin, coming.margin, coming.margin, coming.margin];
			}

			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					closeBtn : false,
					closeClick: false,
					nextClick : false,
					arrows : false,
					mouseWheel : false,
					keys : null,
					helpers: {
						overlay : {
							css: {
								cursor : 'auto'
							},
							closeClick : false
						}
					}
				});
			}

			//Give a chance for callback or helpers to update coming item (type, title, etc)
			F.coming = coming;

			if (false === F.trigger('beforeLoad')) {
				F.coming = null;
				return;
			}

			if (typeof element === 'object' && (element.nodeType || element instanceof $)) {
				isDom = true;
				coming.href = $(element).attr('href') || coming.href;
				coming.title = $(element).attr('title') || coming.title;

				if ($.metadata) {
					$.extend(coming, $(element).metadata());	
				}
			}

			type = coming.type;
			href = coming.href;

			///Check if content type is set, if not, try to get
			if (!type) {
				if (isDom) {
					rez = $(element).data('fancybox-type');

					if (!rez && element.className) {
						rez = element.className.match(/fancybox\.(\w+)/);
						rez = rez ? rez[1] : false;
					}
				}

				if (rez) {
					type = rez;

				} else if (href) {
					if (F.isImage(href)) {
						type = 'image';

					} else if (F.isSWF(href)) {
						type = 'swf';

					} else if (href.match(/^#/)) {
						type = 'inline';
					}
				}

				// ...if not - display element itself
				if (!type) {
					type = isDom ? 'inline' : 'html';
				}

				coming.type = type;
			}

			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content) {
					coming.content = type === 'inline' && href ? $(href) : element;
				}

				if (!coming.content.length) {
					type = null;
				}

			} else {
				coming.href = href || element;

				if (!coming.href) {
					type = null;
				}
			}

			/*
				Add reference to the group, so it`s possible to access from callbacks, example:

				afterLoad : function() {
					this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
				}

			*/

			coming.group = F.group;

			if (type === 'image') {
				F._loadImage();

			} else if (type === 'ajax') {
				F._loadAjax();

			} else if (type) {
				F._afterLoad();

			} else {
				F._error();
			}
		},

		_error: function () {
			F.coming.type = 'html';
			F.coming.minHeight = 0;
			F.coming.autoSize = true;
			F.coming.content = F.coming.tpl.error;

			F._afterLoad();
		},

		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			F.imgPreload = new Image();

			F.imgPreload.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width = this.width;
				F.coming.height = this.height;

				F._afterLoad();
			};

			F.imgPreload.onerror = function () {
				this.onload = this.onerror = null;

				F._error();
			};

			F.imgPreload.src = F.coming.href;

			if (!F.imgPreload.complete) {
				F.showLoading();
			}
		},

		_loadAjax: function () {
			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, F.coming.ajax, {
				url: F.coming.href,
				error: function (jqXHR, textStatus, errorThrown) {
					if (textStatus !== 'abort') {
						F.coming.content = errorThrown;

						F._error();

					} else {
						F.hideLoading();
					}
				},
				success: function (data, textStatus, jqXHR) {
					if (textStatus === 'success') {
						F.coming.content = data;

						F._afterLoad();
					}
				}
			}));
		},

		_afterLoad: function () {
			F.hideLoading();

			if (!F.coming || false === F.trigger('afterLoad', F.current)) {
				F.coming = false;

				return;
			}

			if (F.isOpened) {
				$(".fancybox-item").remove();

				F.wrap.stop(true).removeClass('fancybox-opened');
				F.inner.css('overflow', 'hidden');

				F.transitions[F.current.prevMethod]();

			} else {
				$(".fancybox-wrap").stop().trigger('onReset').remove();

				F.trigger('afterClose');
			}

			F.unbindEvents();

			F.isOpen = false;
			F.current = F.coming;
			F.coming = false;

			//Build the neccessary markup
			F.wrap = $(F.current.tpl.wrap).addClass('fancybox-tmp ' + F.current.wrapCSS).appendTo('body');
			F.outer = $('.fancybox-outer', F.wrap).css('padding', F.current.padding + 'px');
			F.inner = $('.fancybox-inner', F.wrap);

			F._setContent();

			//Give a chance for helpers or callbacks to update elements
			F.trigger('beforeShow');

			//Set initial dimensions and hide
			F._setDimension();

			F.wrap.hide().removeClass('fancybox-tmp');

			F.bindEvents();

			F.transitions[ F.isOpened ? F.current.nextMethod : F.current.openMethod ]();
		},

		_setContent: function () {
			var content, loadingBay, current = F.current,
				type = current.type;

			switch (type) {
				case 'inline':
				case 'ajax':
				case 'html':
					if (type === 'inline') {
						content = current.content.show().detach();

						if (content.parent().hasClass('fancybox-inner')) {
							content.parents('.fancybox-wrap').trigger('onReset').remove();
						}

						$(F.wrap).bind('onReset', function () {
							content.appendTo('body').hide();
						});

					} else {
						content = current.content;
					}

					if (current.autoSize) {
						loadingBay = $('<div class="fancybox-tmp"></div>').appendTo($("body")).append(content);

						current.width = loadingBay.outerWidth();
						current.height = loadingBay.outerHeight(true);

						content = loadingBay.contents().detach();

						loadingBay.remove();
					}

				break;

				case 'image':
					content = current.tpl.image.replace('{href}', current.href);

					current.aspectRatio = true;
				break;

				case 'swf':
					content = current.tpl.swf.replace(/\{width\}/g, current.width).replace(/\{height\}/g, current.height).replace(/\{href\}/g, current.href);
				break;

				case 'iframe':
					content = current.tpl.iframe.replace('{href}', current.href).replace('{scrolling}', current.scrolling).replace('{rnd}', new Date().getTime());
				break;
			}

			if ($.inArray(type, ['image', 'swf', 'iframe']) > -1) {
				current.autoSize = false;
				current.scrolling = false;
			}

			F.inner.append(content);
		},

		_setDimension: function () {
			var current = F.current,
				viewport = F.getViewport(),
				margin = current.margin,
				padding2 = current.padding * 2,
				width = current.width + padding2,
				height = current.height + padding2,
				ratio = current.width / current.height,

				maxWidth = current.maxWidth,
				maxHeight = current.maxHeight,
				minWidth = current.minWidth,
				minHeight = current.minHeight,
				height_,
				space;

			viewport.w -= (margin[1] + margin[3]);
			viewport.h -= (margin[0] + margin[2]);

			if (width.toString().indexOf('%') > -1) {
				width = ((viewport.w * parseFloat(width)) / 100);
			}

			if (height.toString().indexOf('%') > -1) {
				height = ((viewport.h * parseFloat(height)) / 100);
			}

			if (current.fitToView) {
				maxWidth = Math.min(viewport.w, maxWidth);
				maxHeight = Math.min(viewport.h, maxHeight);
			}

			maxWidth = Math.max(minWidth, maxWidth);
			maxHeight = Math.max(minHeight, maxHeight);

			if (current.aspectRatio) {
				if (width > maxWidth) {
					width = maxWidth;
					height = ((width - padding2) / ratio) + padding2;
				}

				if (height > maxHeight) {
					height = maxHeight;
					width = ((height - padding2) * ratio) + padding2;
				}

				if (width < minWidth) {
					width = minWidth;
					height = ((width - padding2) / ratio) + padding2;
				}

				if (height < minHeight) {
					height = minHeight;
					width = ((height - padding2) * ratio) + padding2;
				}

			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));
				height = Math.max(minHeight, Math.min(height, maxHeight));
			}

			width = Math.round(width);
			height = Math.round(height);

			//Reset dimensions
			$(F.wrap.add(F.outer).add(F.inner)).width('auto').height('auto');

			F.inner.width(width - padding2).height(height - padding2);
			F.wrap.width(width);

			height_ = F.wrap.height(); // Real wrap height

			//Fit wrapper inside
			if (width > maxWidth || height_ > maxHeight) {
				while ((width > maxWidth || height_ > maxHeight) && width > minWidth && height_ > minHeight) {
					height = height - 10;

					if (current.aspectRatio) {
						width = Math.round(((height - padding2) * ratio) + padding2);

						if (width < minWidth) {
							width = minWidth;
							height = ((width - padding2) / ratio) + padding2;
						}

					} else {
						width = width - 10;
					}

					F.inner.width(width - padding2).height(height - padding2);
					F.wrap.width(width);

					height_ = F.wrap.height();
				}
			}

			current.dim = {
				width: width,
				height: height_
			};

			current.canGrow = current.autoSize && height > minHeight && height < maxHeight;
			current.canShrink = false;
			current.canExpand = false;

			if ((width - padding2) < current.width || (height - padding2) < current.height) {
				current.canExpand = true;

			} else if ((width > viewport.w || height_ > viewport.h) && width > minWidth && height > minHeight) {
				current.canShrink = true;
			}

			space = height_ - padding2;

			F.innerSpace = space - F.inner.height();
			F.outerSpace = space - F.outer.height();
		},

		_getPosition: function (a) {
			var viewport = F.getViewport(),
				margin = F.current.margin,
				width = F.wrap.width() + margin[1] + margin[3],
				height = F.wrap.height() + margin[0] + margin[2],
				rez = {
					position: 'absolute',
					top: margin[0] + viewport.y,
					left: margin[3] + viewport.x
				};

			if (F.current.fixed && (!a || a[0] === false) && height <= viewport.h && width <= viewport.w) {
				rez = {
					position: 'fixed',
					top: margin[0],
					left: margin[3]
				};
			}

			rez.top = Math.ceil(Math.max(rez.top, rez.top + ((viewport.h - height) * F.current.topRatio))) + 'px';
			rez.left = Math.ceil(Math.max(rez.left, rez.left + ((viewport.w - width) * 0.5))) + 'px';

			return rez;
		},

		_afterZoomIn: function () {
			var current = F.current;

			F.isOpen = F.isOpened = true;

			F.wrap.addClass('fancybox-opened').css('overflow', 'visible');

			F.update();

			F.inner.css('overflow', current.scrolling === 'auto' ? 'auto' : (current.scrolling === 'yes' ? 'scroll' : 'hidden'));

			//Assign a click event
			if (current.closeClick || current.nextClick) {
				F.inner.bind('click.fb', current.nextClick ? F.next : F.close);
			}

			//Create a close button
			if (current.closeBtn) {
				$(F.current.tpl.closeBtn).appendTo(F.wrap).bind('click.fb', F.close);
			}

			//Create navigation arrows
			if (current.arrows && F.group.length > 1) {
				if (current.loop || current.index > 0) {
					$(current.tpl.prev).appendTo(F.wrap).bind('click.fb', F.prev);
				}

				if (current.loop || current.index < F.group.length - 1) {
					$(current.tpl.next).appendTo(F.wrap).bind('click.fb', F.next);
				}
			}

			F.trigger('afterShow');

			if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay = false;

				F.play();
			}
		},

		_afterZoomOut: function () {
			F.trigger('afterClose');

			F.wrap.trigger('onReset').remove();

			$.extend(F, {
				group: {},
				opts: {},
				current: null,
				isOpened: false,
				isOpen: false,
				wrap: null,
				outer: null,
				inner: null
			});
		}
	});

	/*
	 *	Default transitions
	 */

	F.transitions = {
		getOrigPosition: function () {
			var element = F.current.element,
				pos = {},
				width = 50,
				height = 50,
				image, viewport;

			if (element && element.nodeName && $(element).is(':visible')) {
				image = $(element).find('img:first');

				if (image.length) {
					pos = image.offset();
					width = image.outerWidth();
					height = image.outerHeight();

				} else {
					pos = $(element).offset();
				}

			} else {
				viewport = F.getViewport();
				pos.top = viewport.y + (viewport.h - height) * 0.5;
				pos.left = viewport.x + (viewport.w - width) * 0.5;
			}

			pos = {
				top: Math.ceil(pos.top) + 'px',
				left: Math.ceil(pos.left) + 'px',
				width: Math.ceil(width) + 'px',
				height: Math.ceil(height) + 'px'
			};

			return pos;
		},

		step: function (now, fx) {
			var ratio, innerValue, outerValue;

			if (fx.prop === 'width' || fx.prop === 'height') {
				innerValue = outerValue = Math.ceil(now - (F.current.padding * 2));

				if (fx.prop === 'height') {
					ratio = (now - fx.start) / (fx.end - fx.start);

					if (fx.start > fx.end) {
						ratio = 1 - ratio;
					}

					innerValue -= F.innerSpace * ratio;
					outerValue -= F.outerSpace * ratio;
				}

				F.inner[fx.prop](innerValue);
				F.outer[fx.prop](outerValue);
			}
		},

		zoomIn: function () {
			var current = F.current,
				startPos,
				endPos,
				dim = current.dim;

			if (current.openEffect === 'elastic') {
				endPos = $.extend({}, dim, F._getPosition(true));

				//Remove "position" property
				delete endPos.position;

				startPos = this.getOrigPosition();

				if (current.openOpacity) {
					startPos.opacity = 0;
					endPos.opacity = 1;
				}

				F.wrap.css(startPos).show().animate(endPos, {
					duration: current.openSpeed,
					easing: current.openEasing,
					step: this.step,
					complete: F._afterZoomIn
				});

			} else {
				F.wrap.css($.extend({}, dim, F._getPosition()));

				if (current.openEffect === 'fade') {
					F.wrap.fadeIn(current.openSpeed, F._afterZoomIn);

				} else {
					F.wrap.show();
					F._afterZoomIn();
				}
			}
		},

		zoomOut: function () {
			var current = F.current,
				endPos;

			if (current.closeEffect === 'elastic') {
				if (F.wrap.css('position') === 'fixed') {
					F.wrap.css(F._getPosition(true));
				}

				endPos = this.getOrigPosition();

				if (current.closeOpacity) {
					endPos.opacity = 0;
				}

				F.wrap.animate(endPos, {
					duration: current.closeSpeed,
					easing: current.closeEasing,
					step: this.step,
					complete: F._afterZoomOut
				});

			} else {
				F.wrap.fadeOut(current.closeEffect === 'fade' ? current.closeSpeed : 0, F._afterZoomOut);
			}
		},

		changeIn: function () {
			var current = F.current,
				startPos;

			if (F.current.nextEffect === 'elastic') {
				startPos = F._getPosition(true);
				startPos.opacity = 0;
				startPos.top = (parseInt(startPos.top, 10) - 200) + 'px';

				F.wrap.css(startPos).show().animate({
					opacity: 1,
					top: '+=200px'
				}, {
					duration: current.nextSpeed,
					complete: F._afterZoomIn
				});

			} else {
				F.wrap.css(F._getPosition());

				if (current.nextEffect === 'fade') {
					F.wrap.hide().fadeIn(current.nextSpeed, F._afterZoomIn);

				} else {
					F.wrap.show();
					F._afterZoomIn();
				}
			}
		},

		changeOut: function () {
			function cleanUp() {
				$(this).trigger('onReset').remove();
			}

			F.wrap.removeClass('fancybox-opened');

			if (F.current.prevEffect === 'elastic') {
				F.wrap.animate({
					'opacity': 0,
					top: '+=200px'
				}, {
					duration: F.current.prevSpeed,
					complete: cleanUp
				});

			} else {
				F.wrap.fadeOut(F.current.prevEffect === 'fade' ? F.current.prevSpeed : 0, cleanUp);
			}
		}
	};

	/*
	 *	Overlay helper
	 */

	F.helpers.overlay = {
		overlay: null,

		update: function () {
			var width, scrollWidth, offsetWidth;

			//Reset width/height so it will not mess
			this.overlay.width(0).height(0);

			if ($.browser.msie) {
				scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				width = scrollWidth < offsetWidth ? W.width() : scrollWidth;

			} else {
				width = D.width();
			}

			this.overlay.width(width).height(D.height());
		},

		beforeShow: function (opts) {
			if (this.overlay) {
				return;
			}

			this.overlay = $('<div id="fancybox-overlay"></div>').css(opts.css || {
				background: 'black'
			}).appendTo('body');

			this.update();

			if (opts.closeClick) {
				this.overlay.bind('click.fb', F.close);
			}

			W.bind("resize.fb", $.proxy(this.update, this));

			this.overlay.fadeTo(opts.speedIn || "fast", opts.opacity || 1);
		},

		onUpdate: function () {
			//Update as content may change document dimensions
			this.update();
		},

		afterClose: function (opts) {
			if (this.overlay) {
				this.overlay.fadeOut(opts.speedOut || "fast", function () {
					$(this).remove();
				});
			}

			this.overlay = null;
		}
	};

	/*
	 *	Title helper
	 */

	F.helpers.title = {
		beforeShow: function (opts) {
			var title, text = F.current.title;

			if (text) {
				title = $('<div class="fancybox-title fancybox-title-' + opts.type + '-wrap">' + text + '</div>').appendTo('body');

				if (opts.type === 'float') {
					//This helps for some browsers
					title.width(title.width());

					title.wrapInner('<span class="child"></span>');

					//Increase bottom margin so this title will also fit into viewport
					F.current.margin[2] += Math.abs(parseInt(title.css('margin-bottom'), 10));
				}

				title.appendTo(opts.type === 'over' ? F.inner : (opts.type === 'outside' ? F.wrap : F.outer));
			}
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function (options) {
		var opts = options || {},
			selector = this.selector || '';

		function run(e) {
			var group = [], relType = false, relVal = $(this).data('fancybox-group');

			e.preventDefault();

			// Check if element has 'data-fancybox-group' attribute, if not - use 'rel'
			if (typeof relVal !== 'undefined') {
				relType = relVal ? 'data-fancybox-group' : false;

			} else if (this.rel && this.rel !== '' && this.rel !== 'nofollow') {
				relVal = this.rel;
				relType = 'rel';
			}

			if (relType) {
				group = selector.length ? $(selector).filter('[' + relType + '="' + relVal + '"]') : $('[' + relType + '="' + relVal + '"]');
			}

			if (group.length) {
				opts.index = group.index(this);

				F.open(group.get(), opts);

			} else {
				F.open(this, opts);
			}

			return false;
		}

		if (selector) {
			D.undelegate(selector, 'click.fb-start').delegate(selector, 'click.fb-start', run);

		} else {
			$(this).unbind('click.fb-start').bind('click.fb-start', run);
		}

		return this;
	};

}(window, document, jQuery));
 /*!
 * Buttons helper for fancyBox
 * version: 1.0.1
 * @requires fancyBox v2.0 or later
 *
 * Usage: 
 *     $(".fancybox").fancybox({
 *         buttons: {}
 *     });
 * 
 * Options:
 *     tpl - HTML template
 * 
 */
(function ($) {
	//shortcut for fancyBox object
	var F = $.fancybox;

	//Add helper object
	F.helpers.buttons = {
		tpl: '<div id="fancybox-buttons"><ul><li><a class="btnPrev" title="Previous" href="javascript:$.fancybox.prev();">Previous</a></li><li><a class="btnPlay" title="Slideshow" href="javascript:$.fancybox.play();;">Play</a></li><li><a class="btnNext" title="Next" href="javascript:$.fancybox.next();">Next</a></li><li><a class="btnToggle" title="Toggle size" href="javascript:$.fancybox.toggle();">Toggle</a></li><li><a class="btnClose" title="Close" href="javascript:$.fancybox.close();">Close</a></li></ul></div>',
		list: null,
		buttons: {},

		update: function () {
			var toggle = this.buttons.toggle.removeClass('btnDisabled btnToggleOn');

			//Size toggle button
			if (F.current.canShrink) {
				toggle.addClass('btnToggleOn');

			} else if (!F.current.canExpand) {
				toggle.addClass('btnDisabled');
			}
		},

		beforeShow: function () {
			//Increase top margin to give space for buttons
			F.current.margin[0] += 30;
		},

		onPlayStart: function () {
			if (this.list) {
				this.buttons.play.text('Pause').addClass('btnPlayOn');
			}
		},

		onPlayEnd: function () {
			if (this.list) {
				this.buttons.play.text('Play').removeClass('btnPlayOn');
			}
		},

		afterShow: function (opts) {
			var buttons;
			
			if (!this.list) {
				this.list = $(opts.tpl || this.tpl).appendTo('body');

				this.buttons = {
					prev : this.list.find('.btnPrev'),
					next : this.list.find('.btnNext'),
					play : this.list.find('.btnPlay'),
					toggle : this.list.find('.btnToggle')
				}
			}
			
			buttons = this.buttons;

			//Prev
			if (F.current.index > 0 || F.current.loop) {
				buttons.prev.removeClass('btnDisabled');
			} else {
				buttons.prev.addClass('btnDisabled');
			}

			//Next / Play
			if (F.current.loop || F.current.index < F.group.length - 1) {
				buttons.next.removeClass('btnDisabled');
				buttons.play.removeClass('btnDisabled');

			} else {
				buttons.next.addClass('btnDisabled');
				buttons.play.addClass('btnDisabled');
			}

			this.update();
		},

		onUpdate: function () {
			this.update();
		},

		beforeClose: function () {
			if (this.list) {
				this.list.remove();
			}

			this.list = null;
			this.buttons = {};
		}
	};

}(jQuery));
 /*!
 * Thumbnail helper for fancyBox
 * version: 1.0.1
 * @requires fancyBox v2.0 or later
 *
 * Usage: 
 *     $(".fancybox").fancybox({
 *         thumbs: {
 *             width	: 50,
 *             height	: 50
 *         }
 *     });
 * 
 * Options:
 *     width - thumbnail width
 *     height - thumbnail height
 *     source - function to obtain the URL of the thumbnail image
 * 
 */
(function ($) {
	//Shortcut for fancyBox object
	var F = $.fancybox;

	//Add helper object
	F.helpers.thumbs = {
		wrap: null,
		list: null,
		width: 0,

		//Default function to obtain the URL of the thumbnail image
		source: function (el) {
			var img = $(el).find('img');

			return img.length ? img.attr('src') : el.href;
		},

		init: function (opts) {
			var that = this,
				list,
				thumbWidth = opts.width || 50,
				thumbHeight = opts.height || 50,
				thumbSource = opts.source || this.source;

			//Build list structure
			list = '';

			for (var n = 0; n < F.group.length; n++) {
				list += '<li><a style="width:' + thumbWidth + 'px;height:' + thumbHeight + 'px;" href="javascript:$.fancybox.jumpto(' + n + ');"></a></li>';
			}

			this.wrap = $('<div id="fancybox-thumbs"></div>').appendTo('body');
			this.list = $('<ul>' + list + '</ul>').appendTo(this.wrap);

			//Load each thumbnail
			$.each(F.group, function (i) {
				$("<img />").load(function () {
					var width = this.width,
						height = this.height,
						widthRatio, heightRatio, parent;

					if (!that.list || !width || !height) {
						return;
					}

					//Calculate thumbnail width/height and center it
					widthRatio = width / thumbWidth;
					heightRatio = height / thumbHeight;
					parent = that.list.children().eq(i).find('a');

					if (widthRatio >= 1 && heightRatio >= 1) {
						if (widthRatio > heightRatio) {
							width = Math.floor(width / heightRatio);
							height = thumbHeight;

						} else {
							width = thumbWidth;
							height = Math.floor(height / widthRatio);
						}
					}

					$(this).css({
						width: width,
						height: height,
						top: Math.floor(thumbHeight / 2 - height / 2),
						left: Math.floor(thumbWidth / 2 - width / 2)
					});

					parent.width(thumbWidth).height(thumbHeight);

					$(this).hide().appendTo(parent).fadeIn(300);

				}).attr('src', thumbSource(this));
			});

			//Set initial width
			this.width = this.list.children().eq(0).outerWidth();

			this.list.width(this.width * (F.group.length + 1)).css('left', Math.floor($(window).width() * 0.5 - (F.current.index * this.width + this.width * 0.5)));
		},

		//Center list
		update: function (opts) {
			if (this.list) {
				this.list.stop(true).animate({
					'left': Math.floor($(window).width() * 0.5 - (F.current.index * this.width + this.width * 0.5))
				}, 150);
			}
		},

		beforeLoad: function (opts) {
			//Remove self if gallery do not have at least two items 
			if (F.group.length < 2) {
				F.coming.helpers.thumbs = false;

				return;
			}

			//Increase bottom margin to give space for thumbs
			F.coming.margin[2] = opts.height + 30;
		},

		afterShow: function (opts) {
			//Check if exists and create or update list
			if (this.list) {
				this.update(opts);

			} else {
				this.init(opts);
			}

			//Set active element
			this.list.children().removeClass('active').eq(F.current.index).addClass('active');
		},

		onUpdate: function () {
			this.update();
		},

		beforeClose: function () {
			if (this.wrap) {
				this.wrap.remove();
			}

			this.wrap = null;
			this.list = null;
			this.width = 0;
		}
	}

}(jQuery));
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('h.i[\'1a\']=h.i[\'z\'];h.O(h.i,{y:\'D\',z:9(x,t,b,c,d){6 h.i[h.i.y](x,t,b,c,d)},17:9(x,t,b,c,d){6 c*(t/=d)*t+b},D:9(x,t,b,c,d){6-c*(t/=d)*(t-2)+b},13:9(x,t,b,c,d){e((t/=d/2)<1)6 c/2*t*t+b;6-c/2*((--t)*(t-2)-1)+b},X:9(x,t,b,c,d){6 c*(t/=d)*t*t+b},U:9(x,t,b,c,d){6 c*((t=t/d-1)*t*t+1)+b},R:9(x,t,b,c,d){e((t/=d/2)<1)6 c/2*t*t*t+b;6 c/2*((t-=2)*t*t+2)+b},N:9(x,t,b,c,d){6 c*(t/=d)*t*t*t+b},M:9(x,t,b,c,d){6-c*((t=t/d-1)*t*t*t-1)+b},L:9(x,t,b,c,d){e((t/=d/2)<1)6 c/2*t*t*t*t+b;6-c/2*((t-=2)*t*t*t-2)+b},K:9(x,t,b,c,d){6 c*(t/=d)*t*t*t*t+b},J:9(x,t,b,c,d){6 c*((t=t/d-1)*t*t*t*t+1)+b},I:9(x,t,b,c,d){e((t/=d/2)<1)6 c/2*t*t*t*t*t+b;6 c/2*((t-=2)*t*t*t*t+2)+b},G:9(x,t,b,c,d){6-c*8.C(t/d*(8.g/2))+c+b},15:9(x,t,b,c,d){6 c*8.n(t/d*(8.g/2))+b},12:9(x,t,b,c,d){6-c/2*(8.C(8.g*t/d)-1)+b},Z:9(x,t,b,c,d){6(t==0)?b:c*8.j(2,10*(t/d-1))+b},Y:9(x,t,b,c,d){6(t==d)?b+c:c*(-8.j(2,-10*t/d)+1)+b},W:9(x,t,b,c,d){e(t==0)6 b;e(t==d)6 b+c;e((t/=d/2)<1)6 c/2*8.j(2,10*(t-1))+b;6 c/2*(-8.j(2,-10*--t)+2)+b},V:9(x,t,b,c,d){6-c*(8.o(1-(t/=d)*t)-1)+b},S:9(x,t,b,c,d){6 c*8.o(1-(t=t/d-1)*t)+b},Q:9(x,t,b,c,d){e((t/=d/2)<1)6-c/2*(8.o(1-t*t)-1)+b;6 c/2*(8.o(1-(t-=2)*t)+1)+b},P:9(x,t,b,c,d){f s=1.l;f p=0;f a=c;e(t==0)6 b;e((t/=d)==1)6 b+c;e(!p)p=d*.3;e(a<8.w(c)){a=c;f s=p/4}m f s=p/(2*8.g)*8.r(c/a);6-(a*8.j(2,10*(t-=1))*8.n((t*d-s)*(2*8.g)/p))+b},H:9(x,t,b,c,d){f s=1.l;f p=0;f a=c;e(t==0)6 b;e((t/=d)==1)6 b+c;e(!p)p=d*.3;e(a<8.w(c)){a=c;f s=p/4}m f s=p/(2*8.g)*8.r(c/a);6 a*8.j(2,-10*t)*8.n((t*d-s)*(2*8.g)/p)+c+b},T:9(x,t,b,c,d){f s=1.l;f p=0;f a=c;e(t==0)6 b;e((t/=d/2)==2)6 b+c;e(!p)p=d*(.3*1.5);e(a<8.w(c)){a=c;f s=p/4}m f s=p/(2*8.g)*8.r(c/a);e(t<1)6-.5*(a*8.j(2,10*(t-=1))*8.n((t*d-s)*(2*8.g)/p))+b;6 a*8.j(2,-10*(t-=1))*8.n((t*d-s)*(2*8.g)/p)*.5+c+b},F:9(x,t,b,c,d,s){e(s==u)s=1.l;6 c*(t/=d)*t*((s+1)*t-s)+b},E:9(x,t,b,c,d,s){e(s==u)s=1.l;6 c*((t=t/d-1)*t*((s+1)*t+s)+1)+b},16:9(x,t,b,c,d,s){e(s==u)s=1.l;e((t/=d/2)<1)6 c/2*(t*t*(((s*=(1.B))+1)*t-s))+b;6 c/2*((t-=2)*t*(((s*=(1.B))+1)*t+s)+2)+b},A:9(x,t,b,c,d){6 c-h.i.v(x,d-t,0,c,d)+b},v:9(x,t,b,c,d){e((t/=d)<(1/2.k)){6 c*(7.q*t*t)+b}m e(t<(2/2.k)){6 c*(7.q*(t-=(1.5/2.k))*t+.k)+b}m e(t<(2.5/2.k)){6 c*(7.q*(t-=(2.14/2.k))*t+.11)+b}m{6 c*(7.q*(t-=(2.18/2.k))*t+.19)+b}},1b:9(x,t,b,c,d){e(t<d/2)6 h.i.A(x,t*2,0,c,d)*.5+b;6 h.i.v(x,t*2-d,0,c,d)*.5+c*.5+b}});',62,74,'||||||return||Math|function|||||if|var|PI|jQuery|easing|pow|75|70158|else|sin|sqrt||5625|asin|||undefined|easeOutBounce|abs||def|swing|easeInBounce|525|cos|easeOutQuad|easeOutBack|easeInBack|easeInSine|easeOutElastic|easeInOutQuint|easeOutQuint|easeInQuint|easeInOutQuart|easeOutQuart|easeInQuart|extend|easeInElastic|easeInOutCirc|easeInOutCubic|easeOutCirc|easeInOutElastic|easeOutCubic|easeInCirc|easeInOutExpo|easeInCubic|easeOutExpo|easeInExpo||9375|easeInOutSine|easeInOutQuad|25|easeOutSine|easeInOutBack|easeInQuad|625|984375|jswing|easeInOutBounce'.split('|'),0,{}))

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */
