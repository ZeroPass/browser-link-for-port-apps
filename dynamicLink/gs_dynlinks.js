// Dynamic Link builder script v1.1
// Copyright 2007 Gennadiy Shvets
// The program is distributed under the terms of the GNU General
// Public License 3.0
//
// To use this script:
// 1. [Optional] Set URL prefix - this prefix will be pre-pended to URLs 
//    of all links that this script will create:
//
//    var L_urlPrefix = 'http://allmyscripts.com';
//
// 2. [Optional] Specify which tags should be searched:
//
//    var L_searchTags = new Array ('TD', 'DIV');
//
//    If you do not specify L_searchTags then all DIV and SPAN tags will be
//    searched for dynamic links. 
//
// 3. [Optional] Tell the script if the tag contains one link id (0) or
//    multiple link ids separated by <br> (1)
//
//    var L_multipleIds = 1;
//
//    Do not set this flag when you specify link id as a class name!
//    Default is 0 (single link id).
//
// 4. Create new array containing link id and link URL in format:
//
//    var L_allLinks = new Array ('widgets', '/widgets/index.html',
//      'gadgets', '/gadgets/index.html');
//
// 5. Add javascript to your HTML page
//
//    <script type="text/javascript" src="gs_links.js"></script>
//
// See http://www.allmyscripts.com/Dynamic_Links/index.html for more information.

var L_text2Link = new Object ();

function L_findLinks ()
{

	// Copy all data to associative array
	var len = L_allLinks.length;
	var url;
	var last_url = '';
	for (var i = 0; i < L_allLinks.length; i += 2)
	{
		url = L_allLinks[i + 1];
		if	(url != '*')		last_url = url;
		L_text2Link[L_allLinks[i]] = last_url;
	}
	// Loop through all DIV and SPAN tags on the page

	var tags = (typeof (L_searchTags) != 'undefined')?
		L_searchTags: new Array ('DIV', 'SPAN');
	for (var i = 0; i < tags.length; i++)
	{
		L__processElements (tags[i]);
	}
	// Free memory
	L_text2Link = null;

	if	(window.onload_gsl_saved)
		window.onload_gsl_saved();
}

function L__processElements (p_type)
{

	var array = document.getElementsByTagName(p_type);
	if	(array == null)  return;
	var cl, one_el, text, url, a, len, j;
	var prefix = (typeof (L_urlPrefix) == 'undefined')? '': L_urlPrefix;
	var many_ids = (typeof (L_multipleIds) == 'undefined')? 0: L_multipleIds;
	if	(many_ids)
	{
		for (var i = 0; i < array.length; i++)
		{
			one_el = array[i];
			cl = one_el.className;
			if	(!cl.match(/^_link(\s+|$)/))  continue;
			a = one_el.innerHTML.split(/\s*<br>\s*/i);
			len = a.length;
			for (j = 0; j < len; j++)
			{
				text = a[j].replace(/<[^>]+>/g, '');
				text = text.replace(/&nbsp;/g, '');
				url = L_text2Link[text];
				if	(url == null)  continue;
				url.replace(/ /g, '%20');
				a[j] = '<a href="' + prefix + url + '" target="_blank">' + a[j] + '</a>';
			}
			one_el.innerHTML = a.join('<br>');
		}
	}
	else
	{
		for (var i = 0; i < array.length; i++)
		{
			one_el = array[i];
			cl = one_el.className;
			if	(!cl.match(/^_link(\s+|$)/))  continue;
			text = cl.replace(/^_link\s*/, '');
			text = text.replace(/^[^\s_]\S+\s*/, '');
			if	(text)
				text = text.replace(/^_/, '');
			else
			{
				text = one_el.innerHTML.replace(/<[^>]+>/g, '');
				text = text.replace(/&nbsp;/g, '');
			}
			url = L_text2Link[text];
			if	(url == null)  continue;
			url.replace(/ /g, '%20');
			one_el.innerHTML = '<a href="' + prefix + url + '" target="_blank">' + one_el.innerHTML + '</a>';
		}
	}
}

if	(window.addEventListener)
	window.addEventListener("load", L_findLinks, false);
else if (window.attachEvent)
	window.attachEvent ("onload", L_findLinks);
else
{
	if  ((window.onload_gsl_saved == null)&&(window.onload != null))
		window.onload_gsl_saved = window.onload;
	// Assign new onload function
	window.onload = L_findLinks;