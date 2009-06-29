﻿/*
    Copyright (C) 2008  向日

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// ==UserScript==
// @name Helianthus.Annuus 3: Kernel
// @namespace http://code.google.com/p/helianthus-annuus/
// @description by 向日
// @include http://forum*.hkgolden.com/*
// ==/UserScript==

setTimeout(function() // Chrome 2 totally ignores this?...forced to remove that @run-at document-start
{

var window = (typeof unsafeWindow != 'undefined') ? unsafeWindow : (typeof contentWindow != 'undefined') ? contentWindow : this;
var AN = window.AN || (window.AN = { temp: [], mod: {} });

if(AN.initialized) return; // for Chrome which interestingly executes user scripts even when injecting xhr HTML into an element

var JSON = window.JSON;
var $, jQuery = $ = window.jQuery;

if(!$) return alert('錯誤發生! 未載入Helianthus.Annuus: Libraries ?');

//////////////////// START OF - [jQuery Extension] ////////////////////

$.extend(
{
	blank: function(){},

	time: function(nStart)
	{
		return nStart ? $.time() - nStart : +new Date;
	},

	correct: function(sTarget)
	{
		if(sTarget == 'true')
		{
			return true;
		}
		else if(sTarget == 'false')
		{
			return false;
		}
		else if(!isNaN(sTarget) && sTarget !== '')
		{
			return sTarget * 1;
		}
		else
		{
			return sTarget;
		}
	},

	doc: function(sHTML)
	{
		//return $(sHTML); // cant's use this because FF3 got a script stacking quota thing
		var eDiv = document.createElement('div');
		eDiv.innerHTML = sHTML;
		return $(eDiv);
	},

	getLength: function(uTarget)
	{
		if('length' in uTarget) return uTarget.length;

		for(var nCount in uTarget){};
		return nCount;
	},

	make: function(sType, uTarget)
	{
		$.each(arguments, function(i, sName)
		{
			if(i < 2) return;

			if(!uTarget[sName]) uTarget[sName] = (sType == 'o' ? {} : []);
			uTarget = uTarget[sName];
		});

		return uTarget;
	},

	isEmpty: function(uTarget)
	{
		if('length' in uTarget) return uTarget.length;
		for(var i in uTarget){ return false; }
		return true;
	},

	isRubbish: function(uTarget)
	{
		return (uTarget === undefined || uTarget === null || uTarget === NaN);
	},

	winWidth: function(nMutiply)
	{
		return Math.round((window.innerWidth || $(window).width()) * (nMutiply || 1));
	},

	winHeight: function(nMutiply)
	{
		return Math.round((window.innerHeight || $(window).height()) * (nMutiply || 1));
	}
});

$.fn.extend(
{
	toFlash: function(sURL, oAttrs, oParams)
	{
		if(!oAttrs) oAttrs = {};
		if(!oAttrs.id) oAttrs.id = this[0].id || 'an-flash-' + $.time(); // IE: must have an id in order to allow JS access
		if(!oAttrs.width) oAttrs.width = 0;
		if(!oAttrs.height) oAttrs.height = 0;
		
		if(!oParams) oParams = {};
		if(!oParams.allowscriptaccess) oParams.allowscriptaccess = 'always';

		if($.browser.msie)
		{
			oAttrs.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			oParams.movie = sURL;
		}
		else
		{
			oAttrs.data = sURL;
			oAttrs.type = 'application/x-shockwave-flash';
		}

		var sAttrs = '';
		var sParams = '';

		$.each(oAttrs, function(sName, sValue)
		{
			sAttrs += $.sprintf('%s="%s" ', sName, sValue);
		});

		$.each(oParams, function(sName, sValue)
		{
			sParams += $.sprintf('<param name="%s" value="%s" />', sName, sValue);
		});

		var sHTML = $.sprintf('<object %s>%s</object>', sAttrs, sParams);

		if($.browser.msie) // IE: element must be created in this way in order to allow JS access
		{
			this[0].outerHTML = sHTML;
		}
		else
		{
			this.replaceWith(sHTML);
		}

		return $('#' + oAttrs.id);
	},

	fn: function(fToExec)
	{
		if(this.length) fToExec.call(this);
		return this;
	},

	outer: function()
	{
		if(!this[0]) return null;

		return this[0].outerHTML ? this[0].outerHTML : $('<div></div>').append(this.eq(0).clone()).html();
	},

	aO: function()
	{
		alert(this.outer());
		return this;
	},

	aL: function()
	{
		alert(this.length);
		return this;
	},

	fadeToggle: function(sSpeed)
	{
		if(!sSpeed) sSpeed = 'normal';
		return this.is(':hidden') ? this.fadeIn(sSpeed) : this.fadeOut(sSpeed);
	},

	up: function(sSelector, nTh)
	{
		if(!nTh) nTh = 0;
		return this.map(function()
		{
			var nCount = 0;
			var eCur = this;
			while(eCur && eCur.ownerDocument)
			{
				eCur = eCur.parentNode;
				if($(eCur).is(sSelector) && nCount++ == nTh) return eCur;
			}
		});
	},

	//--------[AN Related]--------//

	replies: function()
	{
		if(this.aReplies) return this.aReplies;

		var aReplies = this.aReplies = [];

		this.find('.repliers').add(this.filter('.repliers'))
		.each(function()
		{
			var jThis = $(this), jNameLink = jThis.find('a:first');
			if(!jNameLink.length) return;

			aReplies.push(
			{
				sUserid: jNameLink.attr('href').replace(/.+?userid=(\d+).*/, '$1'),
				sUserName: jNameLink.html(),
				jNameLink: jNameLink,
				jTdContent: jThis.find('table:last td:first'),
				jThis: jThis,
				jLabel: jThis.find('table:first img:last')
			});
		});

		return aReplies;
	},

	topics: function()
	{
		if(this.aTopics) return this.aTopics;

		if(!this.jTbody) this.jTbody = $('td,th').filter(function(){ return /\s*最後回應時間/.test($(this).html()); }).eq(0);		
		
		if(!this.jTbody.length) throw new Error('Error on getting table body!');

		var aTopics = this.aTopics = [];

		this.jTbody.children('tr:gt(0)').each(function()
		{
			var jThis = $(this), jTopicLinks = jThis.find('a');

			if(jThis.children().length == 1) return; // ads

			aTopics.push(
			{
				jThis: jThis,
				sTopicid: jTopicLinks.eq(0).attr('href').replace(/.+?id=(\d+).*/, '$1'),
				jNameLink: jTopicLinks.filter(':last'),
				sUserName: jTopicLinks.filter(':last').html(),
				sTitle: jTopicLinks.eq(0).html()
			});
		});

		return aTopics;
	},

	defer: function(nPos, uArg, fHandler)
	{
		var oArg = (typeof uArg == 'string') ? { sDesc: uArg, aHandler: [fHandler] } : uArg;
		$.make('a', this, 'aDefer', nPos).push(oArg);

		return this;
	}
});

//////////////////// END OF - [jQuery Extension] ////////////////////
//////////////////// START OF - [AN Extension] ////////////////////

$.extend(AN,
{
	shared: function(sFnName)
	{
		if(AN.shared[sFnName]) AN.shared[sFnName].apply(null, Array.prototype.slice.call(arguments, 1));
	},

	box:
	{
		aBenchmark: [],
		oTypeMap:
		{
			1: '核心設定',
			2: '樣式設定',
			3: '佈局設定',
			4: '修正修改',
			5: '加入物件',
			6: '其他功能',

			7: 'AJAX化',
			8: '元件重造',
			9: '組合按扭'
		},
		oPageMap:
		{
			65535: { action: null, desc: '所有頁' },
			65534: { action: null, desc: '所有正常頁' },
			32768: { action: null, desc: '未知正常頁' },
			1: { action: 'error', desc: '所有錯誤頁' },
			2: { action: 'default', desc: '主論壇頁' },
			4: { action: 'topics', desc: '標題頁' },
			8: {action: 'search',  desc: '搜尋頁' },
			16: { action: 'newmessages', desc: '最新貼文頁' },
			32: { action: 'view', desc: '帖子頁' },
			64: { action: 'profilepage', desc: '用戶資料頁' },
			128: { action: 'sendpm', desc: '私人訊息發送頁' },
			256: { action: 'post', desc: '發佈/回覆頁' },
			512: { action: 'login', desc: '登入頁' },
			1024: { action: 'giftpage', desc: '人氣頁' },
			2048: { action: 'blog', desc: '網誌頁' }
		}
	},

	//--------[Utility Functions]--------//

	util:
	{
		addFnType: function(uType, sDec)
		{
			AN.box.oTypeMap[uType] = sDec;
		},

		addStyle: function(sStyle)
		{
			var jStyle = $('#an-style');
			if(!jStyle.length) jStyle = $('<style id="an-style" type="text/css"></style>').appendTo('head');

			//sStyle = sStyle.replace(/(^|}|\*\/)\s+/g, '$1\n'); // indentation
			jStyle[0].styleSheet ? jStyle[0].styleSheet.cssText += sStyle : jStyle.append(sStyle);
		},

		cookie: function(sName, sValue)
		{
			if(sValue === undefined) // GET
			{
				var nStart = document.cookie.indexOf(sName + '=');
				if(nStart == -1) return null;

				nStart += sName.length + 1;

				var nEnd = document.cookie.indexOf(';', nStart);
				if(nEnd == -1) nEnd = document.cookie.length;

				return document.cookie.substring(nStart,nEnd);
			}
			else
			{
				var dExpire = new Date;
				dExpire.setFullYear(sValue ? dExpire.getFullYear() + 1 : dExpire.setFullYear(1999)); // SET : DEL
				document.cookie = $.sprintf('%s=%s; domain=%s; expires=%s; path=/', sName, sValue || '', location.hostname, dExpire.toUTCString());

				return true;
			}
		},

		storage: function(sName, uToSet)
		{
			var storage = arguments.callee.storage;

			if(storage === undefined)
			{
				if(AN.box.storageMode == 'DOM')
				{
					var LS = window.localStorage || window.globalStorage && window.globalStorage[location.hostname] || null;
					if(LS)
					{
						storage =
						{
							get: function(sProfile, sName){ var r = LS[sProfile + '___' + sName]; return (r && r.value ? r.value : r); },
							set: function(sProfile, sName, sData){ LS[sProfile + '___' + sName] = sData; },
							remove: function(sProfile, sName){ LS.removeItem(sProfile + '___' + sName); }
						};
					}
				}
				else if(AN.box.storageMode == 'Flash')
				{
					storage =
					{
						get: function(sProfile, sName){ return AN.box.eLSO.get(sProfile, sName); },
						set: function(sProfile, sName, sData){ AN.box.eLSO.set(sProfile, sName, sData.replace(/\\\\/g, '\\')); }, // escape the backslash so that it will not be removed on GET
						remove: function(sProfile, sName){ AN.box.eLSO.remove(sProfile, sName); }
					};
				}

				arguments.callee.storage = storage;
			}

			if(!storage) return null; // mainly for Opera 9 which has no DOM Storage support

			var sProfile = 'default';
			var sData = '';

			if(sName === undefined) // SHOW ALL
			{
				$.each(['an_data', 'an_switches', 'an_options'], function()
				{
					var uCookie = storage.get(sProfile, this + '');
					if(uCookie) sData += uCookie + '\n\n';
				});
				return sData;
			}
			else if(sName == null) // DEL ALL
			{
				var bDelBackup = confirm('同時刪除備份資料?');
				$.each(['an_data', 'an_switches', 'an_options'], function()
				{
					storage.remove(sProfile, this + '');
					if(bDelBackup) storage.remove(sProfile, this + '_backup');
				});
			}
			else if(uToSet === undefined) // GET
			{
				sData = storage.get(sProfile, sName);

				if(sData)
				{
					(function()
					{
						try
						{
							sData = JSON.parse(sData);
						}
						catch(err)
						{
							var sNew;
							if(sNew = prompt('剖析儲存資料時出現問題!\n\n按確定再次讀取修正後的資料\n按取消回復備份資料!', sData))
							{
								sData = sNew;
								return arguments.callee();
							}

							var sBackup = storage.get(sProfile, sName + '_backup');
							if(sBackup)
							{
								sData = JSON.parse(sBackup);
							}
							else
							{
								alert('找不到備份資料!將進行重設!');
								sData = sBackup = null;
							}
							storage.set(sProfile, sName, sBackup);
						}
					})();
				}

				return sData || null;
			}
			else if(uToSet) // SET
			{
				var sData = JSON.stringify(uToSet);

				var sCurrent = storage.get(sProfile, sName);
				if(sCurrent) storage.set(sProfile, sName + '_backup', sCurrent);

				storage.set(sProfile, sName, sData);
			}
			else // DEL
			{
				storage.remove(sProfile, sName);
			}

			return true;
		},

		data: function(sName, uValue)
		{
			var oData = AN.util.storage('an_data') || {};

			// GET
			if(uValue === undefined)
			{
				if(oData[sName] !== undefined)
				{
					return oData[sName];
				}
				return null;
			}
			// SET
			else
			{
				uValue === null ? delete oData[sName] : oData[sName] = uValue;
				return AN.util.storage('an_data', oData);
			}
		},

		getCurPageNo: function()
		{
			return $('select[name=page]:first').val() * 1;
		},

		getData: function(sFile, fToExec)
		{
			var oExternal = $.make('o', AN.box, 'external');
			if(oExternal[sFile]) fToExec(oExternal[sFile]);
			else $.getScript($.sprintf('http://helianthus-annuus.googlecode.com/svn/other/an.v3.%s.js', sFile), function()
			{
				fToExec(oExternal[sFile]);
			});
		},

		getOpenerInfo: function(jDoc, fToExec)
		{
			var oInfo = arguments.callee.oInfo;

			if(oInfo)
			{
				if(oInfo.sId)
				{
					fToExec(oInfo);
				}
				else
				{
					return setTimeout(function(){ AN.util.getOpenerInfo(jDoc, fToExec); }, 100);
				}
			}
			else
			{
				oInfo = arguments.callee.oInfo = {};

				if(AN.util.getCurPageNo() == 1)
				{
					var oOpener = jDoc.replies()[0];
					fToExec(oInfo = { sId: oOpener.sUserid, sName: oOpener.sUserName });
				}
				else
				{
					$.get('/view.aspx?message=' + window.messageid, function(sHTML)
					{
						var jLink = $.doc(sHTML).find('.repliers:first a:first');
						oInfo = { sId: jLink.attr('href').replace(/.+?userid=(\d+).*/, '$1'), sName: jLink.html() };
						fToExec(oInfo);
					});
				}
			}
		},

		getOptions: function(sOptionName)
		{
			var oOptions = $.make('o', arguments.callee, 'oOptions');

			if($.isEmpty(oOptions))
			{
				$.each(AN.box.oOptions, function(sName)
				{
					$.each(this, function(sPage, uValue)
					{
						if(AN.box.nCurPage & sPage)
						{
							oOptions[sName] = uValue;
							return false;
						}
					});
				});
			}

			return sOptionName ? oOptions[sOptionName] : oOptions;
		},

		getPageNo: function(sURL)
		{
			var sExtract = sURL.replace(/.+?page=(\d+).*/i, '$1');
			return isNaN(sExtract) ? 1 : sExtract * 1;
		},

		getURL: function(nPageNo)
		{
			var sURL = location.search.replace(/&page=\d+/, '');
			if(nPageNo > 1)
			{
				var aSearch = sURL.split('&');
				aSearch.splice(1, 0, 'page=' + nPageNo);
				sURL = aSearch.join('&');
			}

			return sURL;
		},

		isLoggedIn: function()
		{
			var bIsLoggedIn = arguments.callee.bIsLoggedIn;
			return (bIsLoggedIn !== undefined) ? bIsLoggedIn : (arguments.callee.bIsLoggedIn = ($('#ctl00_ContentPlaceHolder1_lb_UserName a:first').attr('href').indexOf('login.aspx') == -1));
		}
	},

	//--------[Module Functions]--------//

	modFn:
	{
		getDB: function(bGetDefault)
		{
			var oDB = (!AN.box.oSwitches) ? AN.box : {};
			$.extend(oDB, (bGetDefault ? { oSwitches: {}, oOptions: {} } : { oSwitches: AN.util.storage('an_switches') || {}, oOptions: AN.util.storage('an_options') || {} }));

			$.each(AN.mod, function(sMod)
			{
				if(!AN.mod[sMod].fn) return;

				$.make('o', oDB.oSwitches, sMod);

				$.each(AN.mod[sMod].fn, function(sId, oFn)
				{
					if(!oDB.oSwitches[sMod][sId])
					{
						$.make('a', oDB.oSwitches[sMod], sId);

						$.each(oFn.page, function(sPage, uDefault)
						{
							if(uDefault === true || uDefault == 'comp') oDB.oSwitches[sMod][sId].push(sPage * 1);
						});
					}

					if(!oFn.options) return;

					$.each(oFn.options, function(sName, oOption)
					{
						$.make('o', oDB.oOptions, sName);

						$.each(oFn.page, function(sPage)
						{
							if(oDB.oOptions[sName][sPage] === undefined)
							{
								oDB.oOptions[sName][sPage] = oOption.defaultValue;
							}
						});
					});
				});
			});

			return oDB;
		},

		execMods: function(jDoc)
		{
			var nBegin = $.time();

			var execMod = function(sMod)
			{
				if(!(AN.mod[sMod] && AN.mod[sMod].fn)) return;

				AN.box.aBenchmark.push({ type: 'start', name: sMod });

				$.each(AN.mod[sMod].fn, function(sId, oFn)
				{
					$.each(AN.box.oSwitches[sMod][sId], function()
					{
						if(oFn.page[this] != 'disabled' && this in oFn.page && AN.box.nCurPage & this)
						{
							var aHandler = [];
							if(!AN.initialized && oFn.once) aHandler.push(oFn.once);
							if(oFn.infinite) aHandler.push(oFn.infinite);

							if(aHandler.length)
							{
								var oArg =
								{
									sDesc: oFn.desc,
									aHandler: aHandler,
									oFn: oFn
								};
								oFn.defer ? jDoc.defer(oFn.defer, oArg) : execFn(oArg);
							}
							return false;
						}
					});
				});

				AN.box.aBenchmark.push({ type: 'end', name: sMod });
			};

			var execFn = function(oArg)
			{
				//console.log(oArg.sDesc);
				try
				{
					var nStart = $.time();

					$.each(oArg.aHandler, function()
					{
						this.call(oArg.oFn, jDoc, oArg.oFn);
					});

					AN.box.aBenchmark.push({ type: 'fn', name: oArg.sDesc, time: $.time(nStart) });
				}
				catch(err)
				{
					if(AN.shared.log)
					{
						AN.shared.log('請通知作者有關此錯誤');
						if(err.message) AN.shared.log('錯誤訊息: ' + err.message);
						if(err.type) AN.shared.log('錯誤類型: ' + err.type);
						if(err.lineNumber) AN.shared.log('錯誤行號: ' + err.lineNumber);
						AN.shared.log('出現地址: ' + location.href);
						AN.shared.log($.sprintf('發生錯誤: %s', oArg.sDesc));
					}
					else if(AN.box.debugMode) alert($.sprintf('ERROR ON EXECUATION: %s\r\n%s', oArg.sDesc, err.message));
					//alert($.sprintf('ERROR ON EXECUATION: %s\r\n%s', oArg.sDesc, err.message));
				}
			};

			if(!jDoc) jDoc = $('body');

			execMod('Kernel');
			execMod('User Interface');
			$.each(AN.mod, function(sMod)
			{
				if(sMod != 'Kernel' && sMod != 'User Interface') execMod(sMod);
			});

			setTimeout(function()
			{
				if(jDoc.aDefer)
				{
					AN.box.aBenchmark.push({ type: 'start', name: '延期執行項目' });

					for(var i=1; i<=5; i++)
					{
						if(!jDoc.aDefer[i]) continue;
						$.each(jDoc.aDefer[i], function(){ execFn(this); });
					}
					jDoc.aDefer = null;
					jDoc.splice(0, jDoc.length);

					AN.box.aBenchmark.push({ type: 'end', name: '延期執行項目' });
				}

				AN.initialized = true;
				AN.shared('log2', '所有功能執行完成');

				AN.box.aBenchmark.push({ type: 'final', time: $.time(nBegin) });
			}, 0);
		}
	}
});

//////////////////// END OF - [AN Extension] ////////////////////
//////////////////// START OF - [Kernel Functions] ////////////////////

AN.mod['Kernel'] =
{
	ver: '1.1.7',
	fn: {

'Kernel_Initializer':
{
	desc: '初始化',
	page: { 65535: 'comp' },
	type: 1,
	once: function(jDoc)
	{
		if(!$('head').length) $('html').prepend(document.createElement('head')); // chrome

		$.ajaxSetup(
		{
			cache: false,
			contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
		});

		var AN_VER = '3.0_beta';
		if(AN.util.data('AN-version') != AN_VER)
		{
			AN.util.data('AN-version', AN_VER);
		}

		if(AN.box.sCurPage == 'view') $('select[name=page]').val(AN.util.getPageNo(location.href)); // for FF3 where select box does not reset
	}
},

'a599dafa-b550-4b28-921a-019c72f481e5':
{
	desc: '除錯模式 [除錯按扭、更準確評測結果等]',
	page: { 65535: false },
	type: 1,
	once: function(jDoc)
	{
		AN.box.debugMode = true;

		AN.util.getOptions();
		AN.util.getOptions.oOptions['bAutoShowLog'] = true;
		AN.util.getOptions.oOptions['bShowDetailLog'] = true;

		if(AN.box.nCurPage & 92)
		{
			jDoc.topics();
		}
		else if(AN.box.sCurPage == 'view')
		{
			jDoc.replies();
		}
	}
},

'12c98ebc-873c-4636-a11a-2c4c6ce7d4c2':
{
	desc: '設定內核樣式',
	page: { 65535: 'comp' },
	type: 2,
	options:
	{
		sUIFontColor: { desc: 'UI主顏色', defaultValue: '#808080', type: 'text' },
		sUIHoverColor: { desc: 'UI連結懸浮顏色', defaultValue: '#9ACD32', type: 'text' },
		sMainFontColor: { desc: '論壇主要字體顏色', defaultValue: '#000000', type: 'text' },
		sMainBorderColor: { desc: '論壇主要邊框顏色', defaultValue: '#000000', type: 'text' },
		sSecBorderColor: { desc: '論壇次要邊框顏色', defaultValue: '#CCCCCC', type: 'text' },
		sMainBgColor: { desc: '論壇主要背景顏色', defaultValue: '#FFFFFF', type: 'text' },
		sSecBgColor: { desc: '論壇次要背景顏色', defaultValue: '#F8F8F8', type: 'text' },
		sMainHeaderFontColor: { desc: '論壇標題字體顏色', defaultValue: '#FFFFFF', type: 'text' },
		sMainHeaderBgColor: { desc: '論壇標題背景顏色', defaultValue: '#336699', type: 'text' }
	},
	once: function()
	{
		AN.util.addStyle($.sprintf(' \
		#an, #an legend { color: %(sMainFontColor)s; } \
		\
		.an-forum, .an-forum textarea { background-color: %(sSecBgColor)s; } \
		.an-forum input[type="text"], .an-forum select { background-color: %(sMainBgColor)s; border: 1px solid %(sMainBorderColor)s; } \
		.an-forum, .an-forum h4, .an-forum div, .an-forum td, .an-forum dl, .an-forum dt, .an-forum dd, .an-forum ul, .an-forum li, .an-forum a, .an-forum fieldset, .an-forum hr { border: 0 solid %(sMainBorderColor)s; } \
		.an-forum * { color: %(sMainFontColor)s; } \
		.an-forum a { text-decoration: none; } \
		.an-forum a:hover { text-decoration: underline; } \
		.an-forum table { width: 100%; border-collapse: collapse; } \
		.an-forum td { line-height: 1.5em; padding: 0 0.2em; border-width: 1px; } \
		.an-forum-header[class], .an-forum thead td { color: %(sMainHeaderFontColor)s; background-color: %(sMainHeaderBgColor)s; } \
		.an-forum-header[class] { border-bottom-width: 1px; } \
		\
		.an-content-note, .an-content-line, .an-content-box { color: %(sUIFontColor)s; } \
		.an-content-note { margin-right: 2px; cursor: default; } \
		.an-content-line { font-size: 0.625em; font-style: italic; } \
		.an-content-box { display: inline-block; border: 1px solid; padding: 1px 2px; } \
		a.an-content-line, a.an-content-box { text-decoration: none !important; } \
		a.an-content-line:hover, a.an-content-box:hover { color: %(sUIHoverColor)s; } \
		',
		AN.util.getOptions()
		));
	}
},

'78af3c29-9bf2-47ee-80bf-a3575b711c73':
{
	desc: '自動檢查更新',
	defer: 5,
	page: { 4: true },
	type: 1,
	options:
	{
		bAlsoCheckBeta: { desc: '同時檢查Beta版本', defaultValue: true, type: 'checkbox' },
		nCheckUpdateInterval: { desc: '檢查更新間隔(小時)', defaultValue: 24, type: 'text' }
	},
	once: function()
	{
		var nInterval = AN.util.getOptions('nCheckUpdateInterval');
		if(isNaN(nInterval) || nInterval < 1) nInterval = 1;
		var nLastChecked = AN.util.data('nLastChecked') || 0;
		if($.time() - AN.util.data('nLastChecked') < 3600000 * nInterval) return;

		AN.util.getData('main', function(oMain)
		{
 			AN.util.data('nLastChecked', $.time());

			var isNewer = function(sToCheck, sToCompare)
			{
				var aToCheck = sToCheck.split('.'), aToCompare = sToCompare.split('.');
				for(var i=0; i<aToCheck.length; i++)
				{
					if(aToCompare[i] != aToCheck[i])
					{
						if(aToCompare[i] < aToCheck[i]) return true;
						break;
					}
				}
				return false;
			};
			var aMsg = [];

			$.each(AN.mod, function(sMod, oMod)
			{
				var sCurrent = oMod.ver;
				var sStable = oMain.ver['stable'][sMod];
				var sBeta = oMain.ver['beta'][sMod];
				var sMsg = '';

				if(sStable && isNewer(sStable, sCurrent))
				{
					sMsg += $.sprintf('\n- 最新穩定版本: %s', sStable);
				}

				if(sBeta && AN.util.getOptions('bAlsoCheckBeta') && (isNewer(sBeta, sCurrent) && (!sStable || isNewer(sBeta, sStable))))
				{
					sMsg += $.sprintf('\n- 最新測試版本: %s', sBeta);
				}

				if(sMsg) aMsg.push($.sprintf('%s:\n- 現時版本: %s', sMod, sCurrent) + sMsg);
			});

			if(aMsg.length)
			{
				if(confirm($.sprintf('發現新版本!\n\n%s\n\n按確定前往下載頁', aMsg.join('\n\n'))))
				{
					location.assign('http://code.google.com/p/helianthus-annuus/wiki/Changelog');
				}
			}
		});
	}
},

'c217bf55-6d44-42d1-8fc2-2cd1662d604a':
{
	desc: '轉頁後再次運行功能',
	page: { 64: true },
	type: 1,
	once: function()
	{
		window.Profile_ShowGoogleAds = AN.modFn.execMods;
	}
},

'722b69f8-b80d-4b0e-b608-87946e00cfdc':
{
	desc: '強制鎖定闊度',
	page: { 124: true },
	type: 3,
	infinite: function()
	{
		AN.util.addStyle(' \
		body { word-wrap: break-word; } \
		.repliers_right { overflow-x: hidden; table-layout: fixed; } \
		');
	}
}

}};

//////////////////// END OF - [Kernel Functions] ////////////////////
//////////////////// START OF - [Initialization] ////////////////////

$.each(AN.temp, function(){ this(); });
delete AN.temp;

$.support.localStorage = window.localStorage || window.globalStorage || false;

(function()
{
	$('<div id="an"><div id="an-lso"></div></div>').appendTo('body');

	function exec(sStorageType)
	{
		if(!$('body').length) return AN.box.nCurPage = 0;

		AN.box.sCurPage = $('#ctl00_ContentPlaceHolder1_SystemMessageBoard').length ?
			'message' : //location.pathname.match(/\w+/i)[0] :
			$('#aspnetForm').length ? $('#aspnetForm').attr('action').match(/[^.]+/)[0].toLowerCase() : 'error';

		$.each(AN.box.oPageMap, function(sPage)
		{
			if(this.action == AN.box.sCurPage)
			{
				AN.box.nCurPage = sPage * 1;
				return false;
			}
		});
		if(!AN.box.nCurPage) AN.box.nCurPage = 32768;

		AN.box.storageMode = sStorageType;
		AN.modFn.getDB();
		AN.modFn.execMods();
	}

	if($.support.localStorage && AN.util.cookie('an-storagemode') == 'DOM')
	{
		exec('DOM');
	}
	else
	{
		AN.box.eLSO = $('#an-lso').toFlash('http://helianthus-annuus.googlecode.com/svn/other/lso.swf')[0];

		var nRetry = 0;
		(function()
		{
			if($.isFunction(AN.box.eLSO.get))
			{
				exec('Flash');
			}
			else
			{
				if(nRetry++ < 200) return setTimeout(arguments.callee, 1);
				if(!$.support.localStorage) return alert('無法使用Flash儲存方式, 且瀏覽器並不支援DOM儲存方式!請通知作者有關此問題!');

				AN.util.cookie('an-storagemode', 'DOM');
				alert('無法使用Flash儲存方式!已自動轉用DOM儲存方式!');
				exec('DOM');
			}
		})();
	}
})();

//////////////////// END OF - [Initialization] ////////////////////

}, 1);