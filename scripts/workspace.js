//The Workspace block is created with the function createWorkspace() in
//this file. The createWorkspace() function is called in file.js

// global variable wb is initialized in the HTML before any javascript files
// are loaded (in template/template.html)

// Currently in this file
//
// clearScripts(event, force)
// loadExample(event)
// handleStateChange(event)
// hideLoader()
// historySwitchStates(state, clearFiles)
// createWorkspace(name)
// wireUpWorkspace(workspace)
// handleDragOver(event)
// disclosure(event)
// handleScriptLoad(event)
// handleScriptModify(event)
// togglePanel(evt)
// initHistory()
// A bunch of controller logic

(function(wb){
    'use strict';

    function clearScripts(event, force){
        if (force || confirm('Throw out the current script?')){
            // wb.clearCodeMap();
            var workspace = document.querySelector('.scripts-workspace');
            var path = location.href.split('?')[0];
            history.pushState(null, '', path);
            workspace.parentElement.removeChild(workspace);
            wb.setState('scriptModified', false);
            wb.setState('scriptReady', false);
            wb.loaded = false;
            wb.clearStage();
            createWorkspace('Workspace');
            document.querySelector('.scripts-text-view').innerHTML = '';
            wb.history.clear();
            wb.block.resetSeqNum();
            delete localStorage['__' + wb.language + '_current_scripts'];
        }
    }

    function reallyLoadExample(exampleName, path){
        wb.setState('scriptModified', true);
        wb.setState('scriptLoaded', false);
        wb.setState('scriptReady', false);
        history.pushState(null, '', path);
        wb.loadScriptsFromExample(exampleName);
        Event.trigger(document.body, 'wb-state-change');
    }

    function loadExample(event){
        var path = location.href.split('?')[0];
        var exampleName = event.target.dataset.example;
        path += "?example=" + exampleName;
        if (wb.getState('scriptModified')){
            if (confirm('Throw out the current script?')){
                reallyLoadExample(exampleName, path);
            }
        }else{
            reallyLoadExample(exampleName, path);
        }
    }

    // function resizeStage(){
    //     var iframe = document.querySelector('.stageframe');
    //     if (!iframe) return; // not all languages have one!
    //     iframe.style.width = iframe.parentElement.clientWidth + 'px';
    //     iframe.style.height = iframe.parentElement.clientHeight + 'px';
    // }

    function handleStateChange(){
        // hide loading spinner if needed
        wb.queryParams = wb.urlToQueryParams(location.href);
        // console.log('handleStateChange %o', wb.queryParams);
        if (wb.queryParams.view === 'fullsize'){
            wb.setState('fullsize', true);
            document.body.classList.add('fullsize');
            wb.enableMenuToggleControls(false);
            // wb.resizeStage();
            // REFACTOR: get rid of wb.view
            wb.view = 'result';
        }else{
            document.body.classList.remove('fullsize');
            wb.setState('fullsize', false);
            wb.enableMenuToggleControls(true);
            wb.view = 'editor';
        }
        // Are we embedded in an iframe? If so, show appropriate menu
        if (wb.getState('scripts-text-view')){
            wb.updateScriptsView();
        }
        if (wb.getState('stage') || wb.getState('fullsize')){
            // console.log('run current scripts');
            // wb.setState('scriptModified', false);
            wb.runCurrentScripts();
        }else{
            console.log('fall through to clearStage');
            wb.clearStage();
        }
    }

    function hideLoader(){
        var loader = document.querySelector('.block-menu-load');
        if (loader){
            loader.parentElement.removeChild(loader);
        }
    }

    function historySwitchState(state, clearFiles){
        console.log('historySwitchState(%o, %s)', state, !!clearFiles);
        var params = wb.urlToQueryParams(location.href);
        if (state !== 'fullsize'){
            delete params.view;
        }else{
            params.view = state;
        }
        if (clearFiles){
            delete params.gist;
            delete params.example;
        }
        history.pushState(null, '', wb.queryParamsToUrl(params));
        Event.trigger(document.body, 'wb-state-change');
    }


    window.addEventListener('unload', wb.saveCurrentScripts, false);
    window.addEventListener('load', wb.loadRecentGists, false);

    // Allow saved scripts to be dropped in
    function createWorkspace(name){
        console.log('createWorkspace');
        var id = uuid();
        var workspace = wb.block.create({
            group: 'scripts-workspace',
            id: id,
            scriptId: id,
            scopeId: id,
            blocktype: 'context',
            sockets: [
            {
                name: name
            }
            ],
            script: '[[1]]',
            isTemplateBlock: false,
            help: 'Drag your script blocks here'
        });
        wb.wireUpWorkspace(workspace);
    }

    function wireUpWorkspace(workspace){
        workspace.addEventListener('drop', wb.getFiles, false);
        workspace.addEventListener('dragover', function(event){event.preventDefault();}, false);
        wb.findAll(document, '.scripts-workspace').forEach(function(ws){
            ws.parentElement.removeChild(ws); // remove any pre-existing workspaces
        });
        document.querySelector('.workspace').appendChild(workspace);
        workspace.querySelector('.contained').appendChild(wb.elem('div', {'class': 'drop-cursor'}));
        // wb.initializeDragHandlers();
        Event.trigger(workspace, 'wb-add');
        Event.trigger(document.body, 'wb-workspace-initialized');
        // wb.drawRectForViewPort();
        workspace.addEventListener('scroll', wb.handleScrollChange, false);
    }

    function enableMenuToggleControls(flag){
        var viewButtons = document.querySelectorAll('.views + .sub-menu .toggle');
        for(var i = 0; i < viewButtons.length; i++) {
            if (flag){
                viewButtons[i].classList.remove('disabled');
            }else{
                viewButtons[i].classList.add('disabled');
            }
        }
    }

    function enableStageControls(flag){
        var viewButtons = document.querySelectorAll('.stage-control');
        for(var i = 0; i < viewButtons.length; i++) {
            if (flag){
                viewButtons[i].classList.remove('disabled');
            }else{
                viewButtons[i].classList.add('disabled');
            }
        }
    }


    function handleDragover(evt){
        // Stop Firefox from grabbing the file prematurely
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    function disclosure(event){
        var block = wb.closest(event.target, '.block');
        if (block.dataset.closed){
            delete block.dataset.closed;
        }else{
            block.dataset.closed = true;
        }
    }

    function handleScriptModify(event){
        console.log('Script modified: node %s %s', event.detail.block, event.detail.type);
        // still need modified events for changing input values
        if (!wb.getState('scriptReady')) return;
        if (!wb.getState('scriptModified')){
            wb.setState('scriptModified', true);
            wb.historySwitchState(wb.view, true);
        }
    }

    function togglePanel(evt){
        var component = evt.detail.name;
        if (evt.detail.state){
            document.body.classList.remove('no-' + component);
            wb.setState(component, true);
            if (component === 'stage'){
                wb.runCurrentScripts();
            }
        }else{
            document.body.classList.add('no-' + component);
            wb.setState(component, false);
        }
    }

    function shouldAutorun(){
        if (wb.getState('fullsize')) return true;
        if (wb.getState('autorun')) return true;
        return false;
    }

    Event.on(document.body, 'wb-toggle', null, togglePanel);


    window.addEventListener('load', function(evt){
        console.log('ide loaded');
        handleStateChange();
        Event.trigger(document.body, 'wb-initialize', {component: 'ide'});
        // Event.trigger(document.body, 'wb-state-change');
    });

    // Kick off some initialization work
    Event.once(document.body, 'wb-workspace-initialized', null, function initHistory(){
        console.log('workspace ready');
        wb.windowLoaded = true;
        wb.workspaceInitialized = true;
        setTimeout(function(){
            window.addEventListener('popstate', function(evt){
                console.log('popstate event');
                Event.trigger(document.body, 'wb-state-change');
            }, false);
        }, 500);
    }, false);
    Event.once(document.body, 'wb-workspace-initialized', null, wb.initializeDragHandlers);

    Event.on('.clear_scripts', 'click', null, clearScripts);
    Event.on('.edit-script', 'click', null, function(event){
        wb.historySwitchState('editor');
    });
    Event.on(document.body, 'click', '.load-example', loadExample);
    Event.on(document.body, 'wb-state-change', null, handleStateChange);
    Event.on('.save_scripts', 'click', null, wb.saveCurrentScriptsToGist);
    Event.on('.download_scripts', 'click', null, wb.createDownloadUrl);
    Event.on('.load_from_gist', 'click', null, wb.loadScriptsFromGistId);
    Event.on('.restore_scripts', 'click', null, wb.loadScriptsFromFilesystem);
    Event.on('.workspace', 'click', '.disclosure', disclosure);
    Event.on('.workspace', 'dblclick', '.locals .name', wb.socket.changeName);
    Event.on('.workspace', 'keypress', 'input', wb.resize);
    Event.on('.workspace', 'change', 'input', wb.resize);
    Event.on('.workspace', 'change', 'input, select', function(event){
        Event.trigger(document.body, 'wb-modified', {block: event.target, type: 'valueChanged'});
    });
    Event.on(document.body, 'wb-modified', null, handleScriptModify);
    Event.on('.run-full-size', 'click', null, function(){
        wb.historySwitchState('fullsize');
    });
    Event.on('.show-ide', 'click', null, function(){
        wb.historySwitchState('ide');
    });
    Event.on('.escape-embed', 'click', null, function(){
        // open this in a new window without embedded in the url
        var params = wb.urlToQueryParams(location.href);
        delete params.embedded;
        var url = wb.queryParamsToUrl(params);
        var a = wb.elem('a', {href: url, target: '_blank'});
        a.click();
    });
    // autorun buttons
    Event.on('.run-script', 'click', null, function(){
        document.body.classList.add('running');
        console.log('running because the play button was pressed');
        wb.runCurrentScripts(true);
    });
    Event.on('.stop-script', 'click', null, function(){
        document.body.classList.remove('running');
        wb.clearStage();
    });
    Event.on(document.body, 'wb-toggle', null, function(evt){
        if (evt.detail.name === 'autorun'){
            // console.log('Caught wb-toggle autorun: %s', evt.detail.state);
            wb.setState('autorun', evt.detail.state);
            if (evt.detail.state){
                // console.log('run when autorun is checked');
                wb.runCurrentScripts();
            }else{
                wb.clearStage();
            }
        }
    });

    function onReady(evt){
        hideLoader();
        if (window.parent !== window){
            document.body.classList.add('embedded');
        }else{
            document.body.classList.remove('embedded');
        }

        if (wb.shouldAutorun()){
            wb.runCurrentScripts();
        }
        wb.setState('ready', true);
    }

    Event.once(document.body, 'wb-ready', null, onReady);

    Event.on(document.body, 'wb-initialize', null, function(evt){
        console.log('wb-initialize %s', evt.detail.component);
        switch(evt.detail.component){
            case 'ide': wb.setState('ideReady', true); break;
            case 'stage': wb.setState('stageReady', true); break;
            case 'script': wb.setState('scriptReady', true); break;
        }
        if (wb.getState('ideReady') && (wb.getState('stageReady') || wb.getState('mobile')) && !wb.getState('scriptReady')){
            wb.loadCurrentScripts(wb.urlToQueryParams(location.href));
        }
        if (wb.getState('ideReady') && wb.getState('scriptReady') && (wb.getState('stageReady') || wb.getState('mobile'))){
            console.log('everything is ready');
            // wb.resizeStage();
            Event.trigger(document.body, 'wb-ready');
        }
    });

    // Event.on(window, 'resize', null, resizeStage);

    wb.onReady = onReady;
    // wb.resizeStage = resizeStage;
    wb.language = location.pathname.split('/')[2];
    wb.shouldAutorun = shouldAutorun;
    wb.loaded = false;
    wb.clearScripts = clearScripts;
    wb.historySwitchState = historySwitchState;
    wb.createWorkspace = createWorkspace;
    wb.wireUpWorkspace = wireUpWorkspace;
    wb.enableStageControls = enableStageControls;
    wb.enableMenuToggleControls = enableMenuToggleControls;
})(wb);
