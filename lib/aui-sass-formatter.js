'use babel';

import AuiSassFormatterView from './aui-sass-formatter-view';
import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,


  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'aui-sass-formatter:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    var editor = atom.workspace.getActiveTextEditor();
    function formatSass(sass) {
        var result = [];
        var collection = {};
        var status = null;
        var upcomingStatus = null;
        var currentLine = '';
        var tempLineData = {
            line: '',
            prop: '',
        };
        var newLine = '\n';
        var preference = [
            'position',
            'top',
            'right',
            'bottom',
            'left',
            'z-index',
            'margin',
            'margin-top',
            'margin-right',
            'margin-bottom',
            'margin-left',
            'padding',
            'padding-top',
            'padding-right',
            'padding-bottom',
            'padding-left',
            'width',
            'height',
            'border',
            'border-top',
            'border-right',
            'border-bottom',
            'border-left',
            'border-radius',
            'border-top-left-radius',
            'border-top-right-radius',
            'border-bottom-right-radius',
            'border-bottom-left-radius',
            'display',
            'float',
            'clear',
            'overflow',
            'font-size',
            'font-weight',
            'text-decoration',
            'color',
            'background',
            'line-height'
        ];

        var sassArr = sass.split("");

        for (var i = 0; i < sassArr.length; i++) {
            var that = sassArr[i];

            switch (status) {
                case null:
                    switch (that) {
                        case '{':
                            // upcomingStatus = 'start';
                            // currentLine += that;
                            status = 'start';
                            i--;
                            break;
                        case '}':
                            // upcomingStatus = 'stop';
                            // currentLine += that;
                            status = 'stop';
                            i--;
                            break;
                        case '/':
                            var next = sassArr[i+1]; // NOTE iznest pie that?
                            if (next === '*') {
                                upcomingStatus = 'comment'
                                currentLine += that + next;
                                i++;
                            } else if (next === '/') {
                                status = 'inlineComment';
                                currentLine += that + next;
                                i++;
                            }
                            break;
                        case newLine:
                            currentLine += that;
                            result.push(currentLine);
                            currentLine = '';
                            status = upcomingStatus;
                            break;
                        default:
                            currentLine += that;
                    }
                    break;
                case 'comment':
                    switch (that) {
                        case '*':
                            var next = sassArr[i+1];
                            if (next === '/') {
                                status = null;
                                upcomingStatus = null;
                                currentLine += that + next;
                                i++;
                            } else {
                                currentLine += that;
                            }
                            break;
                        case newLine:
                            currentLine += that;
                            result.push(currentLine);
                            currentLine = '';
                            break;
                        default:
                            currentLine += that;
                    }
                    break;
                case 'inlineComment':
                    switch (that) {
                        case newLine:
                            currentLine += that;
                            result.push(currentLine);
                            currentLine = '';
                            status = null;
                            break;
                        default:
                            currentLine += that;
                    }
                    break;
                case 'start':
                    switch (that) {
                        case '{':
                            currentLine += that;
                            status = 'stop';
                            upcomingStatus = 'start';
                            break;
                        case '}':
                            currentLine += that;
                            status = 'stop';
                            upcomingStatus = null;
                            break;
                        // case '/':
                        //     var next = sassArr[i+1];
                        //     if (next === '*') {
                        //         upcomingStatus = 'comment'
                        //         i++;
                        //     } else if (next === '/') {
                        //         status = 'inlineComment';
                        //         i++;
                        //     }
                        //     break;
                        case newLine:
                            currentLine += that;
                            tempLineData.line = currentLine;
                            currentLine = '';
                            for(var j = 0; j < tempLineData.line.length; j++) {
                                if(!!tempLineData.line[j].trim() && tempLineData.line[j] !== ':') {
                                    tempLineData.prop += tempLineData.line[j];
                                } else if(tempLineData.line[j] === ':') {
                                    break;
                                }
                            }
                            collection[tempLineData.prop] = tempLineData.line;
                            tempLineData = {
                                line: '',
                                prop: '',
                            };
                            status = upcomingStatus;
                            break;
                        default:
                            currentLine += that;
                    }
                    break;
                case 'stop':
                    switch (that) {
                        case newLine:
                            currentLine += that;
                            //console.log(currentLine);
                            if(!!Object.keys(collection).length) {
                                preference.forEach(function(key) {
                                    if(typeof collection[key] !== 'undefined') {
                                        result.push(collection[key]);
                                        delete collection[key];
                                    }
                                });
                                Object.keys(collection).forEach(function(key) {
                                    result.push(collection[key]);
                                });
                            }
                            result.push(currentLine);
                            currentLine = '';
                            collection = {};
                            //console.log(status, upcomingStatus);
                            status = upcomingStatus;
                            //upcomingStatus = null;
                            break;
                        default:
                            currentLine += that;
                    }
                    break;
                default:

            }

            if(i === sassArr.length - 1 && !!currentLine) {
                //currentLine += that;
                if(!!Object.keys(collection).length) {
                    preference.forEach(function(key) {
                        if(typeof collection[key] !== 'undefined') {
                            result.push(collection[key]);
                            delete collection[key];
                        }
                    });
                    Object.keys(collection).forEach(function(key) {
                        result.push(collection[key]);
                    });
                }
                result.push(currentLine);
                currentLine = '';
                collection = {};
                status = upcomingStatus;
            }
        }

        var returnRes = '';
        for(var x = 0; x < result.length; x++) {
            returnRes += result[x];
        }
        return returnRes;
    };
    if(editor) {
        editor.insertText(formatSass(editor.getSelectedText()));
    }
  }

};
