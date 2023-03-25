var dataCenterBuildVersion = '1.0.3',       // Replace the version using Webpack plugins
	sandboxScope = this;                    // !!! this !== window, this === Sandbox context !!!

window.appendNode = function (text) {
	var element = document.createElement('div');
	element.innerHTML = text;
	element.setAttribute('class', 'x-red-color');
	document.body.appendChild(element);
};

sandboxScope.applyMeta()
	.setAttribute('name', 'viewport')
	.setAttribute('content', 'width=device-width, initial-scale=1');

sandboxScope.applyTitle('This is standalone environment: ' + sandboxScope.isStandAloneEnvironment);

// "dataCenterVersion" is an optional parameter
sandboxScope.applyCss({path: 'resources/main.css', version: dataCenterBuildVersion})
	.then(function () {
		// The patch is loaded strictly after the main file
		return sandboxScope.applyCss({path: 'resources/main.patch.css', version: dataCenterBuildVersion})
	});

sandboxScope.applyElement('div')
	.setAttribute('id', 'loadingscreen')
	.setAttribute('class', 'splash')
	.setInnerHtml('<div class="splash-inner"></div>');

sandboxScope.applyScript({
	fnOrPath: 'polyfills.bundle.js',
	version: dataCenterBuildVersion                                  // "dataCenterVersion" is an optional parameter
}).then(function () {
	return sandboxScope.applyScript({
		fnOrPath: 'vendor.bundle.js',
		version: dataCenterBuildVersion
	}).then(function () {
		return sandboxScope.applyScript({
			fnOrPath: 'main.bundle.js',
			version: dataCenterBuildVersion
		});
	});
});

sandboxScope.applyScript({
	fnOrPath: function () {
		window.appendNode('User agent is: ' + navigator.userAgent);
	}
});
