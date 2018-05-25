if (!RedactorPlugins) var RedactorPlugins = {};
$.Redactor.prototype.iconic2 = function()
    {
        return {
            init: function()
            {
                var icons = {
                    'html': '',
                    'bold':'',
                    'italic':'',
                    'underline':'',
                    'deleted':''
                };

                $.each(this.button.all(), $.proxy(function(i,s)
                {
                    var key = $(s).attr('rel');

                    if (typeof icons[key] !== 'undefined')
                    {
                        var icon = icons[key];
                        var button = this.button.get(key);
                        this.button.setIcon(button, icon);
                    }

                }, this));

            }
        };
    };
$.Redactor.prototype.source = function()
    {
        return {
            init: function()
            {
                var button = this.button.addFirst('html', 'HTML');
                this.button.addCallback(button, this.source.toggle);

                var style = {
                    'width': '100%',
                    'margin': '0',
                    'background': '#111',
                    'box-sizing': 'border-box',
                    'color': 'rgba(255, 255, 255, .8)',
                    'font-size': '14px',
                    'outline': 'none',
                    'padding': '16px',
                    'line-height': '22px',
                    'font-family': 'Menlo, Monaco, Consolas, "Courier New", monospace'
                };

                this.source.$textarea = $('<textarea />');
                this.source.$textarea.css(style).hide();

                if (this.opts.type === 'textarea')
                {
                    this.core.box().append(this.source.$textarea);
                }
                else
                {
                    this.core.box().after(this.source.$textarea);
                }

                this.core.element().on('destroy.callback.redactor', $.proxy(function()
                {
                    this.source.$textarea.remove();

                }, this));

            },
            toggle: function()
            {
                return (this.source.$textarea.hasClass('open')) ? this.source.hide() : this.source.show();
            },
            setCaretOnShow: function()
            {
                this.source.offset = this.offset.get();
                var scroll = $(window).scrollTop();

                var width = this.core.editor().innerWidth();
                var height = this.core.editor().innerHeight();

                // caret position sync
                this.source.start = 0;
                this.source.end = 0;
                var $editorDiv = $("<div/>").append($.parseHTML(this.core.editor().html(), document, true));
                var $selectionMarkers = $editorDiv.find("span.redactor-selection-marker");

                if ($selectionMarkers.length > 0)
                {
                    var editorHtml = $editorDiv.html().replace(/&amp;/g, '&');

                    if ($selectionMarkers.length === 1)
                    {
                        this.source.start = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-1").prop("outerHTML"));
                        this.source.end = this.source.start;
                    }
                    else if ($selectionMarkers.length === 2)
                    {
                        this.source.start = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-1").prop("outerHTML"));
                        this.source.end = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-2").prop("outerHTML")) - $editorDiv.find("#selection-marker-1").prop("outerHTML").toString().length;
                    }
                }

            },
            setCaretOnHide: function(html)
            {
                this.source.start = this.source.$textarea.get(0).selectionStart;
                this.source.end = this.source.$textarea.get(0).selectionEnd;

                // if selection starts from end
                if (this.source.start > this.source.end && this.source.end > 0)
                {
                    var tempStart = this.source.end;
                    var tempEnd = this.source.start;

                    this.source.start = tempStart;
                    this.source.end = tempEnd;
                }

                this.source.start = this.source.enlargeOffset(html, this.source.start);
                this.source.end = this.source.enlargeOffset(html, this.source.end);

                html = html.substr(0, this.source.start) + this.marker.html(1) + html.substr(this.source.start);

                if (this.source.end > this.source.start)
                {
                    var markerLength = this.marker.html(1).toString().length;

                    html = html.substr(0, this.source.end + markerLength) + this.marker.html(2) + html.substr(this.source.end + markerLength);
                }


                return html;

            },
            hide: function()
            {
                this.source.$textarea.removeClass('open').hide();
                this.source.$textarea.off('.redactor-source');

                var code = this.source.$textarea.val();

                code = this.paragraphize.load(code);
                code = this.source.setCaretOnHide(code);

                this.code.start(code);
                this.button.enableAll();
                this.core.editor().show().focus();
                this.selection.restore();

                this.core.callback('visual');
            },
            show: function()
            {
                this.selection.save();
                this.source.setCaretOnShow();

                var height = this.core.editor().innerHeight();
                var code = this.code.get();

                // callback
                code = this.core.callback('source', code);

                this.core.editor().hide();
                this.button.disableAll('html');
                this.source.$textarea.val(code).height(height).addClass('open').show();
                this.source.$textarea.on('keyup.redactor-source', $.proxy(function()
                {
                    if (this.opts.type === 'textarea')
                    {
                        this.core.textarea().val(this.source.$textarea.val());
                    }

                }, this));

                this.marker.remove();

                $(window).scrollTop(scroll);

                if (this.source.$textarea[0].setSelectionRange)
                {
                    this.source.$textarea[0].setSelectionRange(this.source.start, this.source.end);
                }

                this.source.$textarea[0].scrollTop = 0;

                setTimeout($.proxy(function()
                {
                    this.source.$textarea.focus();

                }, this), 0);
            },
            enlargeOffset: function(html, offset)
            {
                var htmlLength = html.length;
                var c = 0;

                if (html[offset] === '>')
                {
                    c++;
                }
                else
                {
                    for(var i = offset; i <= htmlLength; i++)
                    {
                        c++;

                        if (html[i] === '>')
                        {
                            break;
                        }
                        else if (html[i] === '<' || i === htmlLength)
                        {
                            c = 0;
                            break;
                        }
                    }
                }

                return offset + c;
            }
        };
    };

$.Redactor.prototype.fontsize = function()
    {
        return {
            init: function()
            {
                var fonts = [10, 11, 12, 14, 16, 18, 20, 24, 28, 30];
                var that = this;
                var dropdown = {};

                $.each(fonts, function(i, s)
                {
                    dropdown['s' + i] = { title: s + 'px', func: function() { that.fontsize.set(s); } };
                });

                dropdown.remove = { title: 'Remove Font Size', func: that.fontsize.reset };

                var button = this.button.add('fontsize', 'Size');
                this.button.addDropdown(button, dropdown);
            },
            set: function(size)
            {
                this.inline.format('span', 'style', 'font-size: ' + size + 'px;');
            },
            reset: function()
            {
                this.inline.removeStyleRule('font-size');
            }
        };
    };

$.Redactor.prototype.fontcolor = function()
    {
        return {
            init: function()
            {
                var colors = [
                    '#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#ffff00',
                    '#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f0', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada', '#fff2ca',
                    '#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1d9', '#b7dde8', '#fbd5b5', '#ffe694',
                    '#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#b7dde8', '#fac08f', '#f2c314',
                    '#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76923c', '#5f497a', '#92cddc', '#e36c09', '#c09100',
                    '#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244061', '#632423', '#4f6128', '#3f3151', '#31859b',  '#974806', '#7f6000'
                ];

                var buttons = ['fontcolor', 'backcolor'];
                var buttonsName = ['Text Color', 'Back Color'];

                for (var i = 0; i < 2; i++)
                {
                    var name = buttons[i];

                    var $button = this.button.add(name, buttonsName[i]);
                    var $dropdown = this.button.addDropdown($button);
                    $dropdown.attr('rel', 'fontcolor');
                    $dropdown.width(242);
                    this.fontcolor.buildPicker($dropdown, name, colors);
                }
            },
            buildPicker: function($dropdown, name, colors)
            {
                var rule = (name == 'backcolor') ? 'background-color' : 'color';

                var len = colors.length;
                var self = this;
                var func = function(e)
                {
                    e.preventDefault();
                    self.fontcolor.set($(this).data('rule'), $(this).attr('rel'));
                };

                for (var z = 0; z < len; z++)
                {
                    var color = colors[z];

                    var $swatch = $('<a rel="' + color + '" data-rule="' + rule +'" href="#" style="float: left; font-size: 0; border: 2px solid #fff; padding: 0; margin: 0; width: 18px; height: 18px;"></a>');
                    $swatch.css('background-color', color);
                    $swatch.on('mousedown', func);

                    $dropdown.append($swatch);
                }

                var $elNone = $('<a href="#" style="display: block; clear: both; padding: 8px 5px; font-size: 12px; line-height: 1;"></a>').html(this.lang.get('none'));
                $elNone.on('mousedown', $.proxy(function(e)
                {
                    e.preventDefault();
                    this.fontcolor.remove(rule);

                }, this));

                $dropdown.append($elNone);
            },
            set: function(rule, type)
            {
                this.inline.format('span', 'style', rule + ': ' + type + ';');
                this.dropdown.hide();
            },
            remove: function(rule)
            {
                this.inline.removeStyleRule(rule);
                this.dropdown.hide();
            }
        };
    };

$.Redactor.prototype.fontfamily = function()
    {
        return {
            init: function ()
            {
                var fonts = [ 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Monospace' ];
                var that = this;
                var dropdown = {};

                $.each(fonts, function(i, s)
                {
                    dropdown['s' + i] = { title: s, func: function() { that.fontfamily.set(s); }};
                });

                dropdown.remove = { title: 'Remove Font Family', func: that.fontfamily.reset };

                var button = this.button.add('fontfamily', 'Font');
                this.button.addDropdown(button, dropdown);

            },
            set: function (value)
            {
                this.inline.format('span', 'style', 'font-family:' + value + ';');
            },
            reset: function()
            {
                this.inline.removeStyleRule('font-family');
            }
        };
    };
$.Redactor.prototype.scriptbuttons = function()
    {
        return {
            init: function()
            {
                var sup = this.button.add('superscript', 'x²');
                var sub = this.button.add('subscript', 'x₂');
 
                this.button.addCallback(sup, this.scriptbuttons.formatSup);
                this.button.addCallback(sub, this.scriptbuttons.formatSub);
            },
            formatSup: function()
            {
                this.inline.format('sup');
            },
            formatSub: function()
            {
                this.inline.format('sub');
            }
        };
    };
$.Redactor.prototype.alignment = function()
    {
        return {
            langs: {
                en: {
                    "align": "Align",
                    "align-left": "Align Left",
                    "align-center": "Align Center",
                    "align-right": "Align Right"
                }
            },
            init: function()
            {
                var that = this;
                var dropdown = {};

                dropdown.left = { title: that.lang.get('align-left'), func: that.alignment.setLeft };
                dropdown.center = { title: that.lang.get('align-center'), func: that.alignment.setCenter };
                dropdown.right = { title: that.lang.get('align-right'), func: that.alignment.setRight };

                var button = this.button.add('alignment', this.lang.get('align'));
                this.button.addDropdown(button, dropdown);
            },
            removeAlign: function()
            {
                this.block.removeClass('text-center');
                this.block.removeClass('text-right');
            },
            setLeft: function()
            {
                this.buffer.set();
                this.alignment.removeAlign();
            },
            setCenter: function()
            {
                this.buffer.set();
                this.alignment.removeAlign();
                this.block.addClass('text-center');
            },
            setRight: function()
            {
                this.buffer.set();
                this.alignment.removeAlign();
                this.block.addClass('text-right');
            }
        };
    };
$.Redactor.prototype.table = function()
    {
        return {
            langs: {
                en: {
                    "table": "Table",
                    "insert-table": "Insert table",
                    "insert-row-above": "Insert row above",
                    "insert-row-below": "Insert row below",
                    "insert-column-left": "Insert column left",
                    "insert-column-right": "Insert column right",
                    "add-head": "Add head",
                    "delete-head": "Delete head",
                    "delete-column": "Delete column",
                    "delete-row": "Delete row",
                    "delete-table": "Delete table"
                }
            },
            init: function()
            {
                var dropdown = {};

                dropdown.insert_table = {
                                    title: this.lang.get('insert-table'),
                                    func: this.table.insert,
                                    observe: {
                                        element: 'table',
                                        in: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.insert_row_above = {
                                    title: this.lang.get('insert-row-above'),
                                    func: this.table.addRowAbove,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.insert_row_below = {
                                    title: this.lang.get('insert-row-below'),
                                    func: this.table.addRowBelow,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.insert_column_left = {
                                    title: this.lang.get('insert-column-left'),
                                    func: this.table.addColumnLeft,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.insert_column_right = {
                                    title: this.lang.get('insert-column-right'),
                                    func: this.table.addColumnRight,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.add_head = {
                                    title: this.lang.get('add-head'),
                                    func: this.table.addHead,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.delete_head = {
                                    title: this.lang.get('delete-head'),
                                    func: this.table.deleteHead,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.delete_column = {
                                    title: this.lang.get('delete-column'),
                                    func: this.table.deleteColumn,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.delete_row = {
                                    title: this.lang.get('delete-row'),
                                    func: this.table.deleteRow,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };

                dropdown.delete_table = {
                                    title: this.lang.get('delete-table'),
                                    func: this.table.deleteTable,
                                    observe: {
                                        element: 'table',
                                        out: {
                                            attr: {
                                                'class': 'redactor-dropdown-link-inactive',
                                                'aria-disabled': true,
                                            }
                                        }
                                    }
                                };


                var button = this.button.addBefore('link', 'table', this.lang.get('table'));
                this.button.addDropdown(button, dropdown);
            },
            insert: function()
            {
                if (this.table.getTable())
                {
                    return;
                }

                this.placeholder.hide();

                var rows = 2;
                var columns = 3;
                var $tableBox = $('<div>');
                var $table = $('<table />');


                for (var i = 0; i < rows; i++)
                {
                    var $row = $('<tr>');

                    for (var z = 0; z < columns; z++)
                    {
                        var $column = $('<td>' + this.opts.invisibleSpace + '</td>');

                        // set the focus to the first td
                        if (i === 0 && z === 0)
                        {
                            $column.append(this.marker.get());
                        }

                        $($row).append($column);
                    }

                    $table.append($row);
                }

                $tableBox.append($table);
                var html = $tableBox.html();

                this.buffer.set();

                var current = this.selection.current();
                if ($(current).closest('li').length !== 0)
                {
                    $(current).closest('ul, ol').first().after(html);
                }
                else
                {
                    this.air.collapsed();
                    this.insert.html(html);
                }

                this.selection.restore();
                this.core.callback('insertedTable', $table);
            },
            getTable: function()
            {
                var $table = $(this.selection.current()).closest('table');

                if (!this.utils.isRedactorParent($table))
                {
                    return false;
                }

                if ($table.size() === 0)
                {
                    return false;
                }

                return $table;
            },
            restoreAfterDelete: function($table)
            {
                this.selection.restore();
                $table.find('span.redactor-selection-marker').remove();

            },
            deleteTable: function()
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                this.buffer.set();


                var $next = $table.next();
                if (!this.opts.linebreaks && $next.length !== 0)
                {
                    this.caret.start($next);
                }
                else
                {
                    this.caret.after($table);
                }


                $table.remove();


            },
            deleteRow: function()
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                var $current = $(this.selection.current());

                this.buffer.set();

                var $current_tr = $current.closest('tr');
                var $focus_tr = $current_tr.prev().length ? $current_tr.prev() : $current_tr.next();
                if ($focus_tr.length)
                {
                    var $focus_td = $focus_tr.children('td, th').first();
                    if ($focus_td.length)
                    {
                        $focus_td.prepend(this.marker.get());
                    }
                }

                $current_tr.remove();
                this.table.restoreAfterDelete($table);
            },
            deleteColumn: function()
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                this.buffer.set();

                var $current = $(this.selection.current());
                var $current_td = $current.closest('td, th');
                var index = $current_td[0].cellIndex;

                $table.find('tr').each($.proxy(function(i, elem)
                {
                    var $elem = $(elem);
                    var focusIndex = index - 1 < 0 ? index + 1 : index - 1;
                    if (i === 0)
                    {
                        $elem.find('td, th').eq(focusIndex).prepend(this.marker.get());
                    }

                    $elem.find('td, th').eq(index).remove();

                }, this));

                this.table.restoreAfterDelete($table);
            },
            addHead: function()
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                this.buffer.set();

                if ($table.find('thead').size() !== 0)
                {
                    this.table.deleteHead();
                    return;
                }

                var tr = $table.find('tr').first().clone();
                tr.find('td').replaceWith($.proxy(function()
                {
                    return $('<th>').html(this.opts.invisibleSpace);
                }, this));

                $thead = $('<thead></thead>').append(tr);
                $table.prepend($thead);



            },
            deleteHead: function()
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                var $thead = $table.find('thead');
                if ($thead.size() === 0)
                {
                    return;
                }

                this.buffer.set();

                $thead.remove();

            },
            addRowAbove: function()
            {
                this.table.addRow('before');
            },
            addRowBelow: function()
            {
                this.table.addRow('after');
            },
            addColumnLeft: function()
            {
                this.table.addColumn('before');
            },
            addColumnRight: function()
            {
                this.table.addColumn('after');
            },
            addRow: function(type)
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                this.buffer.set();

                var $current = $(this.selection.current());
                var $current_tr = $current.closest('tr');
                var new_tr = $current_tr.clone();

                new_tr.find('th').replaceWith(function()
                {
                    var $td = $('<td>');
                    $td[0].attributes = this.attributes;

                    return $td.append($(this).contents());
                });

                new_tr.find('td').html(this.opts.invisibleSpace);

                if (type === 'after')
                {
                    $current_tr.after(new_tr);
                }
                else
                {
                    $current_tr.before(new_tr);
                }


            },
            addColumn: function (type)
            {
                var $table = this.table.getTable();
                if (!$table)
                {
                    return;
                }

                var index = 0;
                var current = $(this.selection.current());

                this.buffer.set();

                var $current_tr = current.closest('tr');
                var $current_td = current.closest('td, th');

                $current_tr.find('td, th').each($.proxy(function(i, elem)
                {
                    if ($(elem)[0] === $current_td[0])
                    {
                        index = i;
                    }

                }, this));

                $table.find('tr').each($.proxy(function(i, elem)
                {
                    var $current = $(elem).find('td, th').eq(index);

                    var td = $current.clone();
                    td.html(this.opts.invisibleSpace);

                    if (type === 'after')
                    {
                        $current.after(td);
                    }
                    else
                    {
                        $current.before(td);
                    }

                }, this));


            }
        };
    };
$.Redactor.prototype.fullscreen = function()
    {
        return {
            langs: {
                en: {
                    "fullscreen": "Fullscreen"
                }
            },
            init: function()
            {
                this.fullscreen.isOpen = false;

                var button = this.button.add('fullscreen', this.lang.get('fullscreen'));
                this.button.addCallback(button, this.fullscreen.toggle);

                if (this.opts.fullscreen)
                {
                    this.fullscreen.toggle();
                }

            },
            enable: function()
            {
                this.fullscreen.isOpened = false;
                this.button.setActive('fullscreen');
                this.fullscreen.isOpen = true;

                if (!this.opts.fullscreen)
                {
                    this.selection.save();
                }

                if (this.opts.toolbarExternal)
                {
                    this.fullscreen.toolcss = {};
                    this.fullscreen.boxcss = {};
                    this.fullscreen.toolcss.width = this.$toolbar.css('width');
                    this.fullscreen.toolcss.top = this.$toolbar.css('top');
                    this.fullscreen.toolcss.position = this.$toolbar.css('position');
                    this.fullscreen.boxcss.top = this.$box.css('top');
                }

                this.fullscreen.height = this.core.editor().height();

                if (this.opts.maxHeight)
                {
                    this.core.editor().css('max-height', '');
                }

                if (this.opts.minHeight)
                {
                    this.core.editor().css('min-height', '');
                }

                if (!this.$fullscreenPlaceholder)
                {
                    this.$fullscreenPlaceholder = $('<div/>');
                }

                this.$fullscreenPlaceholder.insertAfter(this.$box);

                this.core.box().appendTo(document.body);
                this.core.box().addClass('redactor-box-fullscreen');

                $('body').addClass('redactor-body-fullscreen');
                $('body, html').css('overflow', 'hidden');

                this.fullscreen.resize();

                if (!this.opts.fullscreen)
                {
                    this.selection.restore();
                }

                this.toolbar.observeScrollDisable();
                $(window).on('resize.redactor-plugin-fullscreen', $.proxy(this.fullscreen.resize, this));
                $(document).scrollTop(0, 0);

                var self = this;
                setTimeout(function()
                {
                    self.fullscreen.isOpened = true;
                }, 10);

            },
            disable: function()
            {
                this.button.setInactive('fullscreen');
                this.fullscreen.isOpened = undefined;
                this.fullscreen.isOpen = false;
                this.selection.save();

                $(window).off('resize.redactor-plugin-fullscreen');
                $('body, html').css('overflow', '');

                this.core.box().insertBefore(this.$fullscreenPlaceholder);
                this.$fullscreenPlaceholder.remove();

                this.core.box().removeClass('redactor-box-fullscreen').css({ width: 'auto', height: 'auto' });
                this.core.box().removeClass('redactor-box-fullscreen');

                if (this.opts.toolbarExternal)
                {
                    this.core.box().css('top', this.fullscreen.boxcss.top);
                    this.core.toolbar().css({
                        'width': this.fullscreen.toolcss.width,
                        'top': this.fullscreen.toolcss.top,
                        'position': this.fullscreen.toolcss.position
                    });
                }

                if (this.opts.minHeight)
                {
                    this.core.editor().css('minHeight', this.opts.minHeight);
                }

                if (this.opts.maxHeight)
                {
                    this.core.editor().css('maxHeight', this.opts.maxHeight);
                }

                this.core.editor().css('height', 'auto');
                this.selection.restore();
            },
            toggle: function()
            {
                return (this.fullscreen.isOpen) ? this.fullscreen.disable() : this.fullscreen.enable();
            },
            resize: function()
            {
                if (!this.fullscreen.isOpen)
                {
                    return;
                }

                var toolbarHeight = this.button.toolbar().height();
                var padding = parseInt(this.core.editor().css('padding-top')) + parseInt(this.core.editor().css('padding-bottom'));
                var height = $(window).height() - toolbarHeight - padding;

                this.core.box().width($(window).width()).height(height);

                if (this.opts.toolbarExternal)
                {
                    this.core.toolbar().css({
                        'top': '0px',
                        'position': 'absolute',
                        'width': '100%'
                    });

                    this.core.box().css('top', toolbarHeight + 'px');
                }

                this.core.editor().height(height);
            }
        };
    };
$.Redactor.prototype.video = function()
    {
        return {
            reUrlYoutube: /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig,
            reUrlVimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
            langs: {
                en: {
                    "video": "Video",
                    "video-html-code": "Video Embed Code or Youtube/Vimeo Link"
                }
            },
            getTemplate: function()
            {
                return String()
                + '<div class="modal-section" id="redactor-modal-video-insert">'
                    + '<section>'
                        + '<label>' + this.lang.get('video-html-code') + '</label>'
                        + '<textarea id="redactor-insert-video-area" style="height: 160px;"></textarea>'
                    + '</section>'
                    + '<section>'
                        + '<button id="redactor-modal-button-action">Insert</button>'
                        + '<button id="redactor-modal-button-cancel">Cancel</button>'
                    + '</section>'
                + '</div>';
            },
            init: function()
            {
                var button = this.button.addAfter('image', 'video', this.lang.get('video'));
                this.button.addCallback(button, this.video.show);
            },
            show: function()
            {
                this.modal.addTemplate('video', this.video.getTemplate());

                this.modal.load('video', this.lang.get('video'), 700);

                // action button
                this.modal.getActionButton().text(this.lang.get('insert')).on('click', this.video.insert);
                this.modal.show();

                // focus
                if (this.detect.isDesktop())
                {
                    setTimeout(function()
                    {
                        $('#redactor-insert-video-area').focus();

                    }, 1);
                }


            },
            insert: function()
            {
                var data = $('#redactor-insert-video-area').val();

                if (!data.match(/<iframe|<video/gi))
                {
                    data = this.clean.stripTags(data);

                    this.opts.videoContainerClass = (typeof this.opts.videoContainerClass === 'undefined') ? 'video-container' : this.opts.videoContainerClass;

                    // parse if it is link on youtube & vimeo
                    var iframeStart = '<div class="' + this.opts.videoContainerClass + '"><iframe style="width: 500px; height: 281px;" src="',
                        iframeEnd = '" frameborder="0" allowfullscreen></iframe></div>';

                    if (data.match(this.video.reUrlYoutube))
                    {
                        data = data.replace(this.video.reUrlYoutube, iframeStart + '//www.youtube.com/embed/$1' + iframeEnd);
                    }
                    else if (data.match(this.video.reUrlVimeo))
                    {
                        data = data.replace(this.video.reUrlVimeo, iframeStart + '//player.vimeo.com/video/$2' + iframeEnd);
                    }
                }

                this.modal.close();
                this.placeholder.hide();

                // buffer
                this.buffer.set();

                // insert
                this.air.collapsed();
                this.insert.html(data);

            }

        };
    };
$.Redactor.prototype.imagemanager = function()
{
    return {
        langs: {
            en: {
                "upload": "Upload",
                "choose": "Choose"
            }
        },
        init: function()
        {
            if (!this.opts.imageManagerJson)
            {
                return;
            }

            this.modal.addCallback('image', this.imagemanager.load);
        },
        load: function()
        {
            $("#redactor-modal-header").html('Insert Image');
            var beforeImageContainer= $('<div class="search_bar"><form class="form-search" name="rte-search"><div class="input-group"><input type="text" placeholder="Search Images" class="form-control search-query" autocomplete="off"><span class="input-group-btn"><button class="btn btn-sm btn-white" type="submit"><i class="icon-search icon-on-right"></i></button></span></div></form></div><div id="rte-asset-pagination"></div><div class="rte-cs-images clearfix"></div>'),
                loadMore = false,
                self = this,
                loadMoreElem = $('<a class="rte-load-more">Load More</a>'),
                rteElem = $('<div class="search_bar"><form class="form-search" name="rte-search"><div class="input-group"><input type="text" placeholder="Search Images" class="form-control search-query" autocomplete="off"><span class="input-group-btn"><button class="btn btn-sm btn-white" type="submit"><i class="icon-search icon-on-right"></i></button></span></div></form></div><div id="rte-asset-pagination"></div><div class="rte-cs-images clearfix"></div><div id="modal-images-container" class="clearfix"></div>'),
                $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px; display: none;" class="redactor-modal-tab" data-title="Choose">');
            var _loaderHtml = document.getElementById('loader-wrapper').outerHTML;
            $(".rte-asset-loader #loader-wrapper").remove();
            $(".rte-asset-loader").append(_loaderHtml);
            var getParams = function(){
                params = {
                    skip : 0,
                    limit : 10,
                    include_count: true,
                    desc: 'updated_at',
                    type: 'uploads'
                };
            };
            getParams();

            var getSearchQuery = function(){
                var temp = "";
                if(params.type === "search"){
                    temp = '&query={ "filename": { "$regex": "'+searchText+'", "$options": "i" } }';
                }
                return temp;
            };


            // var $box = $('<div style="overflow: auto; height: 300px; display: none;" class="redactor-modal-tab" data-title="Choose">');
            this.modal.getModal().append($box);

            $('#redactor-image-manager-box').append(rteElem);
            
            var loadAssets = function(){
                $(".rte-asset-loader").append(_loaderHtml);
                $(".rte-asset-loader #loader-wrapper").removeClass('hide');
                $(".rte-load-more").remove();
                $.ajax({
                    dataType: "json",
                    cache: false,
                    url: self.opts.imageManagerJson + "&desc="+params["desc"]+"&include_count="+params["include_count"]+"&limit="+params["limit"]+"&skip="+params["skip"] + getSearchQuery(),
                    success: $.proxy(function(data)
                    {
                        if(!data.count){
                            $(".rte-cs-images").html("");
                            if(params.type === "search"){
                                $('#redactor-image-manager-box .rte-cs-images').append("<div class='choose_upload'><div class='no_data'>No results found</div></div>");
                            } else {
                                $('#redactor-image-manager-box .rte-cs-images').append("<div class='choose_upload'><div class='no_data'>You don't have any uploads!</div></div>");
                            }
                        }
                        $(".rte-asset-loading").remove();
                        $(".rte-asset-loader #loader-wrapper").remove();
                        params.skip = params.skip + params.limit;
                        if(data.count > params.skip){
                            loadMore = true;
                        } else {
                            loadMore = false;
                        }
                        // Earlier code
                        // var uploadsImages = data.uploads || data.assets; 
                        // console.log("uploadsImages",uploadsImages);
                        // $.each(uploadsImages, $.proxy(function(key, val) {
                        //     // title

                        // Reductor 2
                        $.each(data.uploads, $.proxy(function(key, val)
                        {
                            var thumbtitle = '';
                            if (typeof val.title !== 'undefined')
                            {
                                thumbtitle = val.title;
                            }
                            val.url = val.url.replace('contentstack-api.built.io', 'api.contentstack.io');
                            var img = $('<div class="rte-img-ch"><img src="' + val.url + '" data-asset-uid="'+val.uid+'" rel="'+val.url +'" title="'+val.filename+'"  data-params="' + encodeURI(JSON.stringify(val)) + '" style="width: 100px; height: 75px; cursor: pointer;" /><span>'+val.filename+'</span></div>');
                            $(".rte-cs-images").append(img);
                            $(img).click($.proxy(this.imagemanager.insert, this));

                        }, this));
                        if(loadMore){
                            $('#rte-asset-pagination').append(loadMoreElem);
                        }
                        $(".icon-remove-sign").on("click", function(e){
                            e.stopImmediatePropagation();
                            $('#redactor-image-manager-box .rte-cs-images').html("");
                            $('.search-query').val('');
                            $(".input-group .icon-remove-sign").remove();
                            getParams();
                            loadAssets();
                        });
                        $(".rte-load-more").on('click', function(e){
                            e.stopImmediatePropagation();
                            $('#rte-asset-pagination').append('<span class="rte-asset-loading">Loading...</span>');
                            loadAssets();
                        });

                    }, self)
                });


            }
            $('.form-search').find('input').keydown(function(e) {
                if(e.which == 10 || e.which == 13) {
                    $('.form-search').submit();
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });
            $(".form-search").on("submit", function(e){
                e.preventDefault();
                e.stopImmediatePropagation();
                $('#redactor-image-manager-box .rte-cs-images').html("");
                $('<i class="icon-remove-sign"></i>').insertAfter('#redactor-image-manager-box .search-query');
                searchText = $(this).find('.search-query').val();
                if(searchText){
                    getParams();
                    params["type"] = "search";
                    loadAssets();
                }else{
                    $(".icon-remove-sign").click();
                }
            });
            loadAssets();

            // $.ajax({
            //  dataType: "json",
            //  cache: false,
            //  url: this.opts.imageManagerJson,
            //  success: $.proxy(function(data)
            //  {
            //      $.each(data, $.proxy(function(key, val)
            //      {
            //          // title
            //          var thumbtitle = '';
            //          if (typeof val.title !== 'undefined')
            //          {
            //              thumbtitle = val.title;
            //          }

            //          var img = $('<img src="' + val.thumb + '"  data-params="' + encodeURI(JSON.stringify(val)) + '" style="width: 100px; height: 75px; cursor: pointer;" />');
            //          $box.append(img);
            //          $(img).click($.proxy(this.imagemanager.insert, this));

            //      }, this));

            //  }, this)
            // });


        },
        insert: function(e)
        {
            var $el = $(e.target);
            var json = $.parseJSON(decodeURI($el.attr('data-params')));

            this.image.insert(json, null);
        }
    };
};

$.Redactor.prototype.properties = function()
{
    return {
        langs: {
            en: {
                "properties": "Properties"
            }
        },
        block: false,
        labelStyle: {
            'position': 'absolute',
            'padding': '2px 5px',
            'line-height': 1,
            'border-radius': '5px',
            'font-size': '10px',
            'color': 'rgba(255, 255, 255, .9)',
            'z-index': 99
        },
        getTemplate: function()
        {
            return String()
                + '<div class="modal-section" id="redactor-modal-properties">'
                + '<section>'
                + '<label id="modal-properties-id-label">Id</label>'
                + '<input type="text" id="modal-properties-id" />'
                + '</section>'
                + '<section>'
                + '<label id="modal-properties-class-label">Class</label>'
                + '<input type="text" id="modal-properties-class" />'
                + '</section>'
                + '<section>'
                + '<button id="redactor-modal-button-cancel">Cancel</button>'
                + '<button id="redactor-modal-button-action">Save</button>'
                + '</section>'
                + '</div>';
        },
        setup: function()
        {
            this.opts.properties = (typeof this.opts.properties === 'undefined') ? {} : this.opts.properties;
            this.opts.properties.id = (typeof this.opts.properties.id === 'undefined') ? true : this.opts.properties.id;
            this.opts.properties.classname = (typeof this.opts.properties.classname === 'undefined') ? true : this.opts.properties.classname;
            this.opts.properties.show = (typeof this.opts.properties.show === 'undefined') ? false : this.opts.properties.show;

        },
        init: function()
        {
            if (this.opts.type === 'pre' || this.opts.type === 'inline')
            {
                return;
            }

            this.properties.setup();

            this.properties.createLabelId(this.properties.labelStyle);
            this.properties.createLabelClass(this.properties.labelStyle);

            this.properties.setEvents();

            var button = this.button.add('properties', this.lang.get('properties'));
            this.button.addCallback(button, this.properties.show);

        },
        show: function()
        {
            this.modal.addTemplate('properties', this.properties.getTemplate());
            this.modal.load('properties', 'Properties', 600);

            var button = this.modal.getActionButton().text('Save');
            button.on('click', this.properties.save);

            this.properties.showId();
            this.properties.showClass();

            this.modal.show();

        },
        createLabelId: function(css)
        {
            if (!this.opts.properties.show && !this.opts.properties.id)
            {
                return;
            }

            this.properties.labelId = $('<span />').attr('id', 'redactor-properties-label-id-' + this.uuid).attr('title', 'ID').hide();
            this.properties.labelId.css(css).css('background', 'rgba(229, 57, 143, .7)');
            $('body').append(this.properties.labelId);

        },
        createLabelClass: function(css)
        {
            if (!this.opts.properties.show && !this.opts.properties.classname)
            {
                return;
            }

            this.properties.labelClass = $('<span />').attr('id', 'redactor-properties-label-class-' + this.uuid).attr('title', 'class').hide();
            this.properties.labelClass.css(css).css('background', 'rgba(61, 121, 242, .7)');
            $('body').append(this.properties.labelClass);

        },
        setEvents: function()
        {
            this.core.element().on('click.callback.redactor', this.properties.showOnClick);
            $(document).on('mousedown.redactor-properties', $.proxy(this.properties.hideOnBlur, this));

            this.core.element().on('destroy.callback.redactor', $.proxy(function()
            {
                $(document).off('.redactor-properties');

            }, this));
        },
        showId: function()
        {
            if (this.opts.properties.id)
            {
                $('#modal-properties-id-label').show();
                $('#modal-properties-id').show().val($(this.properties.block).attr('id'));
            }
            else
            {
                $('#modal-properties-id, #modal-properties-id-label').hide();
            }
        },
        showClass: function()
        {
            if (this.opts.properties.classname)
            {
                $('#modal-properties-class-label').show();
                $('#modal-properties-class').show().val($(this.properties.block).attr('class'));
            }
            else
            {
                $('#modal-properties-class, #modal-properties-class-label').hide();
            }
        },
        save: function()
        {
            // id
            if (this.opts.properties.id)
            {
                var id = $('#modal-properties-id').val();
                if (typeof id === 'undefined' || id === '')
                {
                    this.block.removeAttr('id', this.properties.block);
                }
                else
                {
                    this.block.replaceAttr('id', id, this.properties.block);
                }
            }

            // class
            if (this.opts.properties.classname)
            {
                var classname = $('#modal-properties-class').val();
                if (typeof classname === 'undefined' || classname === '')
                {
                    this.block.removeAttr('class', this.properties.block);
                }
                else
                {
                    this.block.replaceClass(classname, this.properties.block);
                }
            }

            this.modal.close();
            this.properties.showOnClick(false);

        },
        showOnClick: function(e)
        {
            if (e !== false)
            {
                e.preventDefault();
            }

            var zindex = (typeof this.fullscreen !== 'undefined' && this.fullscreen.isOpen) ? 1052 : 99;

            this.properties.block = this.selection.block();
            if (!this.properties.block || !this.utils.isRedactorParent(this.properties.block) || this.utils.isCurrentOrParent(['figure', 'li']))
            {
                return;
            }

            var pos = $(this.properties.block).offset();

            var classname = this.properties.showOnClickClass(pos, zindex);
            this.properties.showOnClickId(pos, zindex, classname);

        },
        showOnClickId: function(pos, zindex, classname)
        {
            var id = $(this.properties.block).attr('id');
            if (this.opts.properties.show && this.opts.properties.id && typeof id !== 'undefined' && id !== '')
            {
                setTimeout($.proxy(function()
                {
                    var width = (this.opts.properties.classname && typeof classname !== 'undefined' && classname !== '') ? this.properties.labelClass.innerWidth() : -3;
                    this.properties.labelId.css({

                        zIndex: zindex,
                        top: pos.top - 13,
                        left: pos.left + width

                    }).show().text('#' + id);

                }, this), 10);
            }
        },
        showOnClickClass: function(pos, zindex)
        {
            var classname = $(this.properties.block).attr('class');
            if (this.opts.properties.show && this.opts.properties.classname && typeof classname !== 'undefined' && classname !== '')
            {
                this.properties.labelClass.css({

                    zIndex: zindex,
                    top: pos.top - 13,
                    left: pos.left - 3

                }).show().text(classname);
            }

            return classname;
        },
        hideOnBlur: function(e)
        {
            if (e.target === this.properties.block)
            {
                return;
            }

            this.properties.hideOnBlurId();
            this.properties.hideOnBlurClass();

        },
        hideOnBlurId: function()
        {
            if (this.opts.properties.show && this.opts.properties.id)
            {
                this.properties.labelId.css('z-index', 99).hide();
            }
        },
        hideOnBlurClass: function()
        {
            if (this.opts.properties.show && this.opts.properties.classname)
            {
                this.properties.labelClass.css('z-index', 99).hide();
            }
        }
    };
};
$.Redactor.prototype.inlinestyle = function()
{
    return {
        langs: {
            en: {
                "style": "Style"
            }
        },
        init: function()
        {
            var tags = {
                "marked": {
                    title: "Marked",
                    args: ['mark']
                },
                "code": {
                    title: "Code",
                    args: ['code']
                },
                "sample": {
                    title: "Sample",
                    args: ['samp']
                },
                "variable": {
                    title: "Variable",
                    args: ['var']
                },
                "shortcut": {
                    title: "Shortcut",
                    args: ['kbd']
                },
                "cite": {
                    title: "Cite",
                    args: ['cite']
                },
                "sup": {
                    title: "Superscript",
                    args: ['sup']
                },
                "sub": {
                    title: "Subscript",
                    args: ['sub']
                }
            };


            var that = this;
            var dropdown = {};

            $.each(tags, function(i, s)
            {
                dropdown[i] = { title: s.title, func: 'inline.format', args: s.args };
            });


            var button = this.button.addAfter('format', 'inline', this.lang.get('style'));
            this.button.addDropdown(button, dropdown);

        }
    };
};
$.Redactor.prototype.counter = function()
    {
        return {
            init: function()
            {
                if (typeof this.opts.callbacks.counter === 'undefined')
                {
                    return;
                }



                this.core.editor().on('keyup.redactor-plugin-counter', $.proxy(this.counter.count, this));
            },
            count: function()
            {
                var words = 0, characters = 0, spaces = 0;
                var html = this.code.get();

                var text = html.replace(/<\/(.*?)>/gi, ' ');
                text = text.replace(/<(.*?)>/gi, '');
                text = text.replace(/\t/gi, '');
                text = text.replace(/\n/gi, ' ');
                text = text.replace(/\r/gi, ' ');
                text = text.replace(/\u200B/g, '');
                text = $.trim(text);

                if (text !== '')
                {
                    var arrWords = text.split(/\s+/);
                    var arrSpaces = text.match(/\s/g);

                    words = (arrWords) ? arrWords.length : 0;
                    spaces = (arrSpaces) ? arrSpaces.length : 0;

                    characters = text.length;

                }

                this.core.callback('counter', { words: words, characters: characters, spaces: spaces });

            }
        };
    };