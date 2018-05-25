// if (!RedactorPlugins) var RedactorPlugins = {};
(function($R)
{
    $R.add('plugin', 'video', {
            reUrlYoutube: /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube\.com\S*[^\w\-\s])([\w\-]{11})(?=[^\w\-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig,
            reUrlVimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
            translations: {
                en: {
                    "video": "Video",
                    "video-html-code": "Video Embed Code or Youtube/Vimeo Link"
                }
            },            
            modals: {
                'video':
                    '<form action=""> \
                        <div class="form-item"> \
                            <label for="modal-video-input">## video-html-code ## <span class="req">*</span></label> \
                            <textarea id="modal-video-input" name="video" style="height: 160px;"></textarea> \
                        </div> \
                    </form>'
            },            
            init: function(app)
            {
                this.app = app;
                this.lang = app.lang;
                this.opts = app.opts;
                this.toolbar = app.toolbar;
                this.component = app.component;
                this.insertion = app.insertion;
                this.inspector = app.inspector;
            },            
            // messages
            onmodal: {
                video: {
                    opened: function($modal, $form)
                    {
                        $form.getField('video').focus();
                    },
                    insert: function($modal, $form)
                    {
                        var data = $form.getData();
                        this._insert(data);
                    }
                }
            },
            oncontextbar: function(e, contextbar)
            {
                var data = this.inspector.parse(e.target)
                if (data.isComponentType('video'))
                {
                    var node = data.getComponent();
                    var buttons = {
                        "remove": {
                            title: this.lang.get('delete'),
                            api: 'plugin.video.remove',
                            args: node
                        }
                    };
    
                    contextbar.set(e, node, buttons, 'bottom');
                }
    
            },
    
            // public
            start: function()
            {
                var obj = {
                    title: this.lang.get('video'),
                    api: 'plugin.video.open'
                };
    
                var $button = this.toolbar.addButtonAfter('image', 'video', obj);
                $button.setIcon('<i class="re-icon-video"></i>');
            },
            open: function()
            {
                var options = {
                    title: this.lang.get('video'),
                    width: '600px',
                    name: 'video',
                    handle: 'insert',
                    commands: {
                        insert: { title: this.lang.get('insert') },
                        cancel: { title: this.lang.get('cancel') }
                    }
                };
    
                this.app.api('module.modal.build', options);
            },
            remove: function(node)
            {
                this.component.remove(node);
            },
    
            // private
            _insert: function(data)
            {
                this.app.api('module.modal.close');
    
                if (data.video.trim() === '')
                {
                    return;
                }
    
                // parsing
                data.video = this._matchData(data.video);
    
                // inserting
                if (this._isVideoIframe(data.video))
                {
                    var $video = this.component.create('video', data.video);
                    this.insertion.insertHtml($video);
                }
            },
    
            _isVideoIframe: function(data)
            {
                return (data.match(/<iframe|<video/gi) !== null);
            },
            _matchData: function(data)
            {
                var iframeStart = '<iframe style="width: 500px; height: 281px;" src="';
                var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';
                if (this._isVideoIframe(data))
                {
                    var allowed = ['iframe', 'video'];
                    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    
                    data = data.replace(tags, function ($0, $1)
                    {
                        return (allowed.indexOf($1.toLowerCase()) === -1) ? '' : $0;
                    });
                }
    
                if (data.match(this.opts.regex.youtube))
                {
                    data = data.replace(this.opts.regex.youtube, iframeStart + '//www.youtube.com/embed/$1' + iframeEnd);
                }
                else if (data.match(this.opts.regex.vimeo))
                {
                    data = data.replace(this.opts.regex.vimeo, iframeStart + '//player.vimeo.com/video/$2' + iframeEnd);
                }
    
                return data;
            }
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'video.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },

        // private
        _init: function(el)
        {
            if (typeof el !== 'undefined')
            {
                var $node = $R.dom(el);
                var $wrapper = $node.closest('figure');
                if ($wrapper.length !== 0)
                {
                    this.parse($wrapper);
                }
                else
                {
                    this.parse('<figure>');
                    this.append(el);
                }
            }
            else
            {
                this.parse('<figure>');
            }


            this._initWrapper();
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'video',
                'tabindex': '-1',
                'contenteditable': false
            });
        }
    });
})(Redactor);

/* Table Plugin */
(function($R)
{
    $R.add('plugin', 'table', {
        translations: {
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
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
            this.caret = app.caret;
            this.toolbar = app.toolbar;
            this.component = app.component;
            this.inspector = app.inspector;
            this.insertion = app.insertion;
            this.selection = app.selection;
        },
        // messages
        ondropdown: {
            table: {
                observe: function(dropdown)
                {
                    this._observeDropdown(dropdown);
                }
            }
        },

        // public
        start: function()
        {
            var dropdown = {
                observe: 'table',
                'insert-table': {
                    title: this.lang.get('insert-table'),
                    api: 'plugin.table.insert'
                },
                'insert-row-above': {
                    title: this.lang.get('insert-row-above'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowAbove'
                },
                'insert-row-below': {
                    title: this.lang.get('insert-row-below'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowBelow'
                },
                'insert-column-left': {
                    title: this.lang.get('insert-column-left'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnLeft'
                },
                'insert-column-right': {
                    title: this.lang.get('insert-column-right'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnRight'
                },
                'add-head': {
                    title: this.lang.get('add-head'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addHead'
                },
                'delete-head': {
                    title: this.lang.get('delete-head'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteHead'
                },
                'delete-column': {
                    title: this.lang.get('delete-column'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteColumn'
                },
                'delete-row': {
                    title: this.lang.get('delete-row'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteRow'
                },
                'delete-table': {
                    title: this.lang.get('delete-table'),
                    classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteTable'
                }
            };
            var obj = {
                title: this.lang.get('table')
            };

            var $button = this.toolbar.addButtonBefore('link', 'table', obj);
            $button.setIcon('<i class="re-icon-table"></i>');
            $button.setDropdown(dropdown);
        },
        insert: function()
        {
            var rows = 2;
            var columns = 3;
            var $component = this.component.create('table');

            for (var i = 0; i < rows; i++)
            {
                $component.addRow(columns);
            }

            $component =  this.insertion.insertHtml($component);
            this.caret.setStart($component);
        },
        addRowAbove: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'before');

                this.caret.setStart($row);
            }
        },
        addRowBelow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'after');

                this.caret.setStart($row);
            }
        },
        addColumnLeft: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'left');
                this.selection.restore();
            }
        },
        addColumnRight: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'right');
                this.selection.restore();
            }
        },
        addHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                this.selection.save();
                $component.addHead();
                this.selection.restore();
            }
        },
        deleteHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $head = $R.dom(current).closest('thead');
                if ($head.length !== 0)
                {
                    $component.removeHead();
                    this.caret.setStart($component);
                }
                else
                {
                    this.selection.save();
                    $component.removeHead();
                    this.selection.restore();
                }
            }
        },
        deleteColumn: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentCell = $R.dom(current).closest('td, th');
                var nextCell = $currentCell.nextElement().get();
                var prevCell = $currentCell.prevElement().get();

                $component.removeColumn(current);

                if (nextCell) this.caret.setStart(nextCell);
                else if (prevCell) this.caret.setEnd(prevCell);
                else this.deleteTable();
            }
        },
        deleteRow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentRow = $R.dom(current).closest('tr');
                var nextRow = $currentRow.nextElement().get();
                var prevRow = $currentRow.prevElement().get();

                $component.removeRow(current);

                if (nextRow) this.caret.setStart(nextRow);
                else if (prevRow) this.caret.setEnd(prevRow);
                else this.deleteTable();
            }
        },
        deleteTable: function()
        {
            var table = this._getTable();
            if (table)
            {
                this.component.remove(table);
            }
        },

        // private
        _getTable: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                return data.getTable();
            }
        },
        _getComponent: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                var table = data.getTable();

                return this.component.create('table', table);
            }
        },
        _observeDropdown: function(dropdown)
        {
            var table = this._getTable();
            var items = dropdown.getItemsByClass('redactor-table-item-observable');
            var tableItem = dropdown.getItem('insert-table');
            if (table)
            {
                this._observeItems(items, 'enable');
                tableItem.disable();
            }
            else
            {
                this._observeItems(items, 'disable');
                tableItem.enable();
            }
        },
        _observeItems: function(items, type)
        {
            for (var i = 0; i < items.length; i++)
            {
                items[i][type]();
            }
        }
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'table.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },

        // public
        addHead: function()
        {
            this.removeHead();

            var columns = this.$element.find('tr').first().children('td, th').length;
            var $head = $R.dom('<thead>');
            var $row = this._buildRow(columns, '<th>');

            $head.append($row);
            this.$element.prepend($head);
        },
        addRow: function(columns)
        {
            var $row = this._buildRow(columns);
            this.$element.append($row);

            return $row;
        },
        addRowTo: function(current, type)
        {
            return this._addRowTo(current, type);
        },
        addColumnTo: function(current, type)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
            {
                if (node === $currentCell.get()) index = i;
            });

            this.$element.find('tr').each(function(node)
            {
                var $node = $R.dom(node);
                var origCell = $node.find('td, th').get(index);
                var $origCell = $R.dom(origCell);

                var $td = $origCell.clone();
                $td.html('');

                if (type === 'right') $origCell.after($td);
                else                  $origCell.before($td);
            });
        },
        removeHead: function()
        {
            var $head = this.$element.find('thead');
            if ($head.length !== 0) $head.remove();
        },
        removeRow: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');

            $currentRow.remove();
        },
        removeColumn: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
            {
                if (node === $currentCell.get()) index = i;
            });

            this.$element.find('tr').each(function(node)
            {
                var $node = $R.dom(node);
                var origCell = $node.find('td, th').get(index);
                var $origCell = $R.dom(origCell);

                $origCell.remove();
            });
        },

        // private
        _init: function(el)
        {
            var wrapper, element;
            if (typeof el !== 'undefined')
            {
                var $node = $R.dom(el);
                var node = $node.get();
                var $figure = $node.closest('figure');
                if ($figure.length !== 0)
                {
                    wrapper = $figure;
                    element = $figure.find('table').get();
                }
                else if (node.tagName === 'TABLE')
                {
                    element = node;
                }
            }

            this._buildWrapper(wrapper);
            this._buildElement(element);
            this._initWrapper();
        },
        _addRowTo: function(current, position)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            if ($currentRow.length !== 0)
            {
                var columns = $currentRow.children('td, th').length;
                var $newRow = this._buildRow(columns);

                $currentRow[position]($newRow);

                return $newRow;
            }
        },
        _buildRow: function(columns, tag)
        {
            tag = tag || '<td>';

            var $row = $R.dom('<tr>');
            for (var i = 0; i < columns; i++)
            {
                var $cell = $R.dom(tag);
                $cell.attr('contenteditable', true);

                $row.append($cell);
            }

            return $row;
        },
        _buildElement: function(node)
        {
            if (node)
            {
                this.$element = $R.dom(node);
            }
            else
            {
                this.$element = $R.dom('<table>');
                this.append(this.$element);
            }
        },
        _buildWrapper: function(node)
        {
            node = node || '<figure>';

            this.parse(node);
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'table',
                'tabindex': '-1',
                'contenteditable': false
            });
        }
    });

})(Redactor);

/* Alignment Plugin */
(function($R)
{
    $R.add('plugin', 'alignment', {
        translations: {
            en: {
                "align": "Align",
                "align-left": "Align Left",
                "align-center": "Align Center",
                "align-right": "Align Right",
                "align-justify": "Align Justify"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.block = app.block;
            this.toolbar = app.toolbar;
        },
        // public
        start: function()
        {
            var dropdown = {};

            dropdown.left = { title: this.lang.get('align-left'), api: 'plugin.alignment.set', args: 'left' };
            dropdown.center = { title: this.lang.get('align-center'), api: 'plugin.alignment.set', args: 'center' };
            dropdown.right = { title: this.lang.get('align-right'), api: 'plugin.alignment.set', args: 'right' };
            dropdown.justify = { title: this.lang.get('align-justify'), api: 'plugin.alignment.set', args: 'justify' };

            var $button = this.toolbar.addButton('alignment', { title: this.lang.get('align') });
            $button.setIcon('<i class="re-icon-alignment"></i>');
            $button.setDropdown(dropdown);
        },
        set: function(type)
        {
            if (type === 'left')
            {
                return this._remove();
            }

            var args = {
                style: { 'text-align': type }
            };

            this.block.toggle(args);
        },

        // private
        _remove: function()
        {
            this.block.remove({ style: 'text-align' });
        }
    });
})(Redactor);

/* Font Size Plugin */
(function($R)
{
    $R.add('plugin', 'fontsize', {
        translations: {
            en: {
                "size": "Size",
                "remove-size":  "Remove Font Size"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;

            // local
            this.sizes = [10, 11, 12, 14, 16, 18, 20, 24, 28, 30];
        },
        // public
        start: function()
        {
            var dropdown = {};
            for (var i = 0; i < this.sizes.length; i++)
            {
                var size = this.sizes[i];
                dropdown[i] = {
                    title: size + 'px',
                    api: 'plugin.fontsize.set',
                    args: size
                };
            }

            dropdown.remove = {
                title: this.lang.get('remove-size'),
                api: 'plugin.fontsize.remove'
            };

            var $button = this.toolbar.addButton('fontsize', { title: this.lang.get('size') });
            $button.setIcon('<i class="re-icon-fontsize"></i>');
            $button.setDropdown(dropdown);
        },
        set: function(size)
        {
            var args = {
                tag: 'span',
                style: { 'font-size': size + 'px' },
                type: 'toggle'
            };

            this.inline.format(args);
        },
        remove: function()
        {
            this.inline.remove({ style: 'font-size' });
        }
    });
})(Redactor);

/* Font Family Plugin */
(function($R)
{
    $R.add('plugin', 'fontfamily', {
        translations: {
            en: {
                "fontfamily": "Font",
                "remove-font-family":  "Remove Font Family"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;

            // local
            this.fonts = (this.opts.fontfamily) ? this.opts.fontfamily : ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Monospace'];
        },
        // public
        start: function()
        {
            var dropdown = {};
            for (var i = 0; i < this.fonts.length; i++)
            {
                var font = this.fonts[i];
                dropdown[i] = {
                    title: font.replace(/'/g, ''),
                    api: 'plugin.fontfamily.set',
                    args: font
                };
            }

            dropdown.remove = {
                title: this.lang.get('remove-font-family'),
                api: 'plugin.fontfamily.remove'
            };

            var $button = this.toolbar.addButton('fontfamily', { title: this.lang.get('fontfamily') });
            $button.setIcon('<i class="re-icon-fontfamily"></i>');
            $button.setDropdown(dropdown);
        },
        set: function(value)
        {
            var args = {
                tag: 'span',
                style: { 'font-family': value },
                type: 'toggle'
            };

            this.inline.format(args);
        },
        remove: function()
        {
            this.inline.remove({ style: 'font-family' });
        }
    });
})(Redactor);

/* Font Color Plugin */
(function($R)
{
    $R.add('plugin', 'fontcolor', {
        translations: {
            en: {
                "fontcolor": "Text Color",
                "text": "Text",
                "highlight": "Highlight"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;
            this.selection = app.selection;

            // local
            this.colors = (this.opts.fontcolors) ? this.opts.fontcolors : [
                '#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#ffff00',
                '#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f0', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada', '#fff2ca',
                '#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1d9', '#b7dde8', '#fbd5b5', '#ffe694',
                '#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#b7dde8', '#fac08f', '#f2c314',
                '#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76923c', '#5f497a', '#92cddc', '#e36c09', '#c09100',
                '#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244061', '#632423', '#4f6128', '#3f3151', '#31859b',  '#974806', '#7f6000'
            ];
        },
        // messages
        onfontcolor: {
            set: function(rule, value)
            {
                this._set(rule, value);
            },
            remove: function(rule)
            {
                this._remove(rule);
            }
        },

        // public
        start: function()
        {
            var btnObj = {
                title: this.lang.get('fontcolor')
            };

            var $dropdown = this._buildDropdown();

            this.$button = this.toolbar.addButton('fontcolor', btnObj);
            this.$button.setIcon('<i class="re-icon-fontcolor"></i>');
            this.$button.setDropdown($dropdown);
        },

        // private
        _buildDropdown: function()
        {
            var $dropdown = $R.dom('<div class="redactor-dropdown-cells">');

            this.$selector = this._buildSelector();

            this.$selectorText = this._buildSelectorItem('text', this.lang.get('text'));
            this.$selectorText.addClass('active');

            this.$selectorBack = this._buildSelectorItem('back', this.lang.get('highlight'));

            this.$selector.append(this.$selectorText);
            this.$selector.append(this.$selectorBack);

            this.$pickerText = this._buildPicker('textcolor');
            this.$pickerBack = this._buildPicker('backcolor');

            $dropdown.append(this.$selector);
            $dropdown.append(this.$pickerText);
            $dropdown.append(this.$pickerBack);

            this._buildSelectorEvents();

            $dropdown.width(242);

            return $dropdown;
        },
        _buildSelector: function()
        {
            var $selector = $R.dom('<div>');
            $selector.addClass('redactor-dropdown-selector');

            return $selector;
        },
        _buildSelectorItem: function(name, title)
        {
            var $item = $R.dom('<span>');
            $item.attr('rel', name).html(title);
            $item.addClass('redactor-dropdown-not-close');

            return $item;
        },
        _buildSelectorEvents: function()
        {
            this.$selectorText.on('mousedown', function(e)
            {
                e.preventDefault();

                this.$selector.find('span').removeClass('active');
                this.$pickerBack.hide();
                this.$pickerText.show();
                this.$selectorText.addClass('active');

            }.bind(this));

            this.$selectorBack.on('mousedown', function(e)
            {
                e.preventDefault();

                this.$selector.find('span').removeClass('active');
                this.$pickerText.hide();
                this.$pickerBack.show();
                this.$selectorBack.addClass('active');

            }.bind(this));
        },
        _buildPicker: function(name)
        {
            var $box = $R.dom('<div class="re-dropdown-box-' + name + '">');
            var rule = (name == 'backcolor') ? 'background-color' : 'color';
            var len = this.colors.length;
            var self = this;
            var func = function(e)
            {
                e.preventDefault();

                var $el = $R.dom(e.target);
                self._set($el.data('rule'), $el.attr('rel'));
            };

            for (var z = 0; z < len; z++)
            {
                var color = this.colors[z];

                var $swatch = $R.dom('<span>');
                $swatch.attr({ 'rel': color, 'data-rule': rule });
                $swatch.css({ 'background-color': color, 'font-size': 0, 'border': '2px solid #fff', 'width': '22px', 'height': '22px' });
                $swatch.on('mousedown', func);

                $box.append($swatch);
            }

            var $el = $R.dom('<a>');
            $el.attr({ 'href': '#' });
            $el.css({ 'display': 'block', 'clear': 'both', 'padding': '8px 5px', 'font-size': '12px', 'line-height': 1 });
            $el.html(this.lang.get('none'));

            $el.on('click', function(e)
            {
                e.preventDefault();
                self._remove(rule);
            });

            $box.append($el);

            if (name == 'backcolor') $box.hide();

            return $box;
        },
        _set: function(rule, value)
        {
            var style = {};
            style[rule] = value;

            var args = {
                tag: 'span',
                style: style,
                type: 'toggle'
            };

            this.inline.format(args);
        },
        _remove: function(rule)
        {
            this.inline.remove({ style: rule });
        }
    });
})(Redactor);

/* Inline Style Plugin */
(function($R)
{
    $R.add('plugin', 'inlinestyle', {
        translations: {
            en: {
                "style": "Style"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.toolbar = app.toolbar;

            // local
            this.styles = {
                "marked": {
                    title: "Marked",
                    args: 'mark'
                },
                "code": {
                    title: "Code",
                    args: 'code'
                },
                "variable": {
                    title: "Variable",
                    args: 'var'
                },
                "shortcut": {
                    title: "Shortcut",
                    args: 'kbd'
                },
                "sup": {
                    title: "Superscript",
                    args: 'sup'
                },
                "sub": {
                    title: "Subscript",
                    args: 'sub'
                }
            };
        },
        start: function()
        {
            var dropdown = {};
            for (var key in this.styles)
            {
                var style = this.styles[key];
                dropdown[key] = {
                    title: style.title,
                    api: 'module.inline.format',
                    args: style.args
                };
            }

            var $button = this.toolbar.addButtonAfter('format', 'inline', { title: this.lang.get('style') });

            $button.setIcon('<i class="re-icon-inline"></i>');
            $button.setDropdown(dropdown);
        }
    });
})(Redactor);

/* Fullscreen Plugin */
(function($R)
{
    $R.add('plugin', 'fullscreen', {
        translations: {
            en: {
                "fullscreen": "Fullscreen"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.$win = app.$win;
            this.$doc = app.$doc;
            this.$body = app.$body;
            this.editor = app.editor;
            this.toolbar = app.toolbar;
            this.container = app.container;
            this.selection = app.selection;

            // local
            this.isOpen = false;
        },
        // public
        start: function()
        {
            var data = {
                title: this.lang.get('fullscreen'),
                api: 'plugin.fullscreen.toggle'
            };

            var button = this.toolbar.addButton('fullscreen', data);
            button.setIcon('<i class="re-icon-expand"></i>');

            this.isTarget = (this.opts.toolbarFixedTarget !== document);
            this.$target = (this.isTarget) ? $R.dom(this.opts.toolbarFixedTarget) : this.$body;

            if (this.opts.fullscreen) this.toggle();

        },
        toggle: function()
        {
            return (this.isOpen) ? this.close() : this.open();
        },
        open: function()
        {
            this._createPlacemarker();
            this.selection.save();

            var $container = this.container.getElement();
            var $editor = this.editor.getElement();
            var $html = (this.isTarget) ? $R.dom('body, html') : this.$target;

            if (this.opts.toolbarExternal) this._buildInternalToolbar();

            this.$target.prepend($container);
            this.$target.addClass('redactor-body-fullscreen');

            $container.addClass('redactor-box-fullscreen');
            if (this.isTarget) $container.addClass('redactor-box-fullscreen-target');

            $html.css('overflow', 'hidden');

            if (this.opts.maxHeight) $editor.css('max-height', '');
            if (this.opts.minHeight) $editor.css('min-height', '');

            this._resize();
            this.$win.on('resize.redactor-plugin-fullscreen', this._resize.bind(this));
            this.$doc.scrollTop(0);

            var button = this.toolbar.getButton('fullscreen');
            button.setIcon('<i class="re-icon-retract"></i>');

            this.selection.restore();
            this.isOpen = true;
            this.opts.zindex = 1051;
        },
        close: function()
        {
            this.isOpen = false;
            this.opts.zindex = false;
            this.selection.save();

            var $container = this.container.getElement();
            var $editor = this.editor.getElement();
            var $html = $R.dom('body, html');

            if (this.opts.toolbarExternal) this._buildExternalToolbar();

            this.$target.removeClass('redactor-body-fullscreen');
            this.$win.off('resize.redactor-plugin-fullscreen');
            $html.css('overflow', '');

            $container.removeClass('redactor-box-fullscreen redactor-box-fullscreen-target');
            $editor.css('height', 'auto');

            if (this.opts.minHeight) $editor.css('minHeight', this.opts.minHeight);
            if (this.opts.maxHeight) $editor.css('maxHeight', this.opts.maxHeight);

            var button = this.toolbar.getButton('fullscreen');
            button.setIcon('<i class="re-icon-expand"></i>');

            this._removePlacemarker($container);
            this.selection.restore();

        },

        // private
        _resize: function()
        {
            var $editor = this.editor.getElement();
            var height = this.$win.height();

            $editor.height(height);
        },
        _buildInternalToolbar: function()
        {
            var $wrapper = this.toolbar.getWrapper();
            var $toolbar = this.toolbar.getElement();

            $wrapper.addClass('redactor-toolbar-wrapper');
            $wrapper.append($toolbar);

            $toolbar.removeClass('redactor-toolbar-external');
            $container.prepend($wrapper);
        },
        _buildExternalToolbar: function()
        {
            var $wrapper = this.toolbar.getWrapper();
            var $toolbar = this.toolbar.getElement();

            this.$external = $R.dom(this.opts.toolbarExternal);

            $toolbar.addClass('redactor-toolbar-external');
            this.$external.append($toolbar);

            $wrapper.remove();
        },
        _createPlacemarker: function()
        {
            var $container = this.container.getElement();

            this.$placemarker = $R.dom('<span />');
            $container.after(this.$placemarker);
        },
        _removePlacemarker: function($container)
        {
            this.$placemarker.before($container);
            this.$placemarker.remove();
        }
    });
})(Redactor);

/* Imagemanager Plugin */
(function($R)
{
    $R.add('plugin', 'imagemanager', {
        translations: {
            en: {
                "choose": "Choose"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
        },
        // messages
        onmodal: {
            image: {
                open: function($modal, $form)
                {
                    // console.log("init onmodal", this.opts.imageManagerJson);
                    if (!this.opts.imageManagerJson) return;
                    this._load($modal)
                },
                insert: function($modal, $form)
                {
                    var data = $form.getData();
                    this._insert(data);
                }
            }
        },

        // private
        _load: function($modal) {
            // var $tab1 = $('<div style="overflow: auto; height: 300px; display: none;" class="redactor-modal-tab" data-title="Choose">');
            // this.modal.getModal().append($tab);
            $(".redactor-modal-header").html('Insert Image');

            var $modal = $modal.getBody(),
                that = this;
                parentFolder = "cs_root",
                ajax = null,
                enableFolder = that.opts.enableFolder,
                selected = null,
                // breadcrumbForFolder = [{"path":"Home","uid":"cs_root"}],
                breadcrumbForFolder = [{"path":"All Assets","uid":"cs_root"}],
                loadMore = false,
                loadMoreElem = $('<div><a class="btn cs-border-btn rte-load-more">Load More</a></div>'),
                rteElem = enableFolder ? $('<div class="search_bar"><form class="form-search" name="rte-search" enctype="multipart/form-data"><div class="ff w-100 flex"><span class="input-group"><input id="rte-search-placeholder" type="text" placeholder="Search Assets and Folders" class="form-control search-query cs-text-box" autocomplete="off"></span><span class="input-group-btn"><button class="btn cs-border-btn" type="submit"><i class="icon-search icon-on-right"></i></button></span></div></form></div><div class="upload_action"><a class="btn cs-border-btn grid-btn" title="Grid"><i class="icon-th-large"></i></a><a class="btn cs-border-btn list-btn curr" title="List"><i class="icon-list"></i></a></div><div class="breadcrumb-redactor"></div><div class="asset-list-box cs-table"><div class="flex w-100 list-heading cs-table-head"><span class="name table-cell">NAME</span><span class="modified-by table-cell">MODIFIED BY</span><span class="last-modified table-cell">LAST MODIFIED</span></div><div class="clearfix scroll-bar-design grid"><div class="rte-cs-images clearfix"></div><div id="rte-asset-pagination"></div></div></div><div class="cs-form-group no-margin clearfix"><div class="right"><button type="reset" id="cancel-rte" class="btn cs-transparent-btn mr-5 left"><span>Cancel</span></button><button type="button" class="btn cs-btn-success left" id="rte-select-img"  disabled="disabled"> <i class="icon-ok"></i> <span>Select file</span></button></div></div>') : $('<div class="search_bar"><form class="form-search" name="rte-search"enctype="multipart/form-data"><div class="ff w-100 flex"><span class="input-group"><input id="rte-search-placeholder" type="text" placeholder="Search Assets" class="form-control search-query cs-text-box" autocomplete="off"></span><span class="input-group-btn"><button class="btn cs-border-btn" type="submit"><i class="icon-search icon-on-right"></i></button></span></div></form></div><div class="upload_action"><a class="btn cs-border-btn grid-btn" title="Grid"><i class="icon-th-large"></i></a><a class="btn cs-border-btn list-btn curr" title="List"><i class="icon-list"></i></a></div><div class="breadcrumb-redactor"></div><div class="asset-list-box cs-table"><div class="flex w-100 list-heading cs-table-head"><span class="name table-cell">NAME</span><span class="modified-by table-cell">MODIFIED BY</span><span class="last-modified table-cell">LAST MODIFIED</span></div><div class="clearfix scroll-bar-design grid"><div class="rte-cs-images clearfix"></div><div id="rte-asset-pagination"></div></div></div><div class="cs-form-group no-margin clearfix"><div class="right"><button type="reset" id="cancel-rte" class="btn cs-transparent-btn mr-5 left"><span>Cancel</span></button><button type="button" class="btn cs-btn-success left" id="rte-select-img"  disabled="disabled"> <i class="icon-ok"></i> <span>Select file</span></button></div></div>'),
                $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px; display: none;" class="redactor-modal-tab" data-title="Choose">'),
                searchText = "",
                selectedImg = null,
                params = {};
                console.log('$modal.getBody()', $modal, 'enableFolder', enableFolder);
            var getParams = function(){                
                params = {
                    skip : 0,
                    limit : 12,
                    include_count: true,
                    include_folders: true,
                    folder:"cs_root",
                    desc: enableFolder ? 'is_dir': 'updated_at',
                    type: 'uploads'
                };
            };
            getParams();

            var getSearchQuery = function(){
                var temp = "";
                if(params.type === "search"){
                    delete params.folder;
                    console.log("params in searchquery", params);
                    //temp = '&query={ "filename": { "$regex": "'+searchText+'", "$options": "i" } }';
                    if(enableFolder){
                        temp =  '&query= {"$and":[{"$or":[{"filename":{"$regex":"'+searchText+'","$options":"i"}},{"uid":{"$regex":"'+searchText+'","$options":"i"}},{"name":{"$regex":"'+searchText+'","$options":"i"}}]}]}';
                    } else{
                        temp =  '&query= {"$and":[{"$or":[{"filename":{"$regex":"'+searchText+'","$options":"i"}},{"uid":{"$regex":"'+searchText+'","$options":"i"}}]}]}';
                    }
                }
                return temp;
            };

            // var createTabber = function($modal)
            // {
            //     $modal.$tabber = $('<div>').attr('id', 'redactor-modal-tabber');

            //     $modal.prepend($modal.$tabber);
            // }
            // var addTab = function(id, name, active)
            // {
            //     var $tab = $('<a href="#" rel="tab' + id + '">').text(name);
            //     if (active)
            //     {
            //         $tab.addClass('active');
            //     }

            //     var self = this;
            //     $tab.on('click', function(e)
            //     {
            //         e.preventDefault();
            //         $('.redactor-tab').hide();
            //         $('.redactor-' + $(this).attr('rel')).show();

            //         $modal.$tabber.find('a').removeClass('active');
            //         $(this).addClass('active');

            //     });

            //     $modal.$tabber.append($tab);
            // }

            // createTabber($modal);
            // addTab(1, 'Upload', 'active');
            // addTab(2, 'Choose');

            $('.redactor-modal-tab').addClass('redactor-tab redactor-tab1');
            $('<div class="rte-asset-loader"></div>').insertAfter('#redactor-modal .redactor-modal-header');
            var _loaderHtml = document.getElementById('loader-wrapper').outerHTML;
            $(".rte-asset-loader #loader-wrapper").remove();
            $(".rte-asset-loader").append(_loaderHtml);
 
            // var $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">').hide();
            // var $box = $('<div id="redactor-image-manager-box" style="overflow: auto; height: 300px;" class="redactor-tab redactor-tab2">');
            $modal.append($box);
            $('#redactor-image-manager-box').append(rteElem);

            var clearData = function(){
                $('#redactor-image-manager-box .rte-cs-images').html("");
                $('.search-query').val('');
                $(".input-group .icon-remove-sign").remove();
                getParams();
                if(enableFolder) {
                    createBreadcrumbForFolder();
                }
            }
            var loadAssets = function(folder,loadmoreLoader){                
                if(!loadmoreLoader){
                    $(".rte-asset-loader").append(_loaderHtml);
                    $(".rte-asset-loader #loader-wrapper").removeClass('hide');
                    $(".rte-load-more").parent('div').remove();
                    $(".rte-asset-loading").parent('div').remove();
                };                
                $(".rte-load-more").parent('div').remove();
                parentFolder = (folder && folder.uid) ? folder.uid : parentFolder;
                var ajaxUrl = "";
                if(enableFolder){
                    if(params.type === "search"){
                        ajaxUrl = that.opts.imageManagerJson + "&desc="+params["desc"]+"&include_count="+params["include_count"]+"&include_folders=" + params.include_folders +"&limit="+params["limit"]+"&skip="+params["skip"] + getSearchQuery();
                    } else {
                        ajaxUrl = that.opts.imageManagerJson + "&desc="+params["desc"]+"&include_count="+params["include_count"]+"&include_folders=" + params.include_folders+"&folder=" + parentFolder +"&limit="+params["limit"]+"&skip="+params["skip"] + getSearchQuery();  
                    }
                } else {
                    ajaxUrl = that.opts.imageManagerJson + "&desc="+params["desc"]+"&include_count="+params["include_count"]+"&limit="+params["limit"]+"&skip="+params["skip"] + getSearchQuery();  
                }
                ajax = $.ajax({
                        dataType: "json",
                        cache: false,
                        url: ajaxUrl,
                        success: $.proxy(function(data) {
                            ajax = null;
                            if(!data.count){
                                if(params.type === "search"){
                                    $('#redactor-image-manager-box .rte-cs-images').append("<div class='choose_upload'><div class='no_data'>No results found</div></div>");
                                } else {
                                    $('#redactor-image-manager-box .rte-cs-images').append("<div class='choose_upload'><div class='no_data'><span><img src='cdn/images/empty-folder-icon.svg' alt=''/><span class='empty-txt'>This folder is empty</span></span></div></div>");
                                }
                            }
                            $("#redactor-image-manager-box .upload_action a").on("click", function(e) {
                                e.stopImmediatePropagation();
                                if($(this).hasClass("curr")){
                                    $(this).removeClass("curr").siblings().addClass("curr");
                                    if($(this).hasClass("list-btn")){
                                        $("#redactor-image-manager-box .list-heading").addClass("active");
                                        $("#redactor-image-manager-box .scroll-bar-design").addClass("list").removeClass("grid");

                                    }
                                    else if($(this).hasClass("grid-btn")){
                                        $("#redactor-image-manager-box .list-heading").removeClass("active");
                                        $("#redactor-image-manager-box .scroll-bar-design").addClass("grid").removeClass("list");
                                    }
                                }

                            });
                            $(".rte-asset-loading").parent('div').remove();
                            $(".rte-asset-loader #loader-wrapper").remove();
                            params.skip = params.skip + params.limit;
                            if(data.count > params.skip) {
                                loadMore = true;
                            } else {
                                loadMore = false;
                            }
                            var uploadsImages = data.uploads || data.assets; 
                            $.each(uploadsImages, $.proxy(function(key, val) {
                                // title
                                // var thumbtitle = '';
                                // if (typeof val.filename !== 'undefined') thumbtitle = val.filename;

                                var thumbtitle = '';
                                if (typeof val.title !== 'undefined') thumbtitle = val.title;
                                //val.url = val.url.replace('built', 'contentstack') + "?uid=" + val.uid;
                                if(val.url) val.url = val.url.replace('contentstack-api.built.io', 'api.contentstack.io');
                                if(!val.is_dir){
                                    // Redactor 2
                                    // var img = $('<div class="rte-img-ch"><img src="' + val.url + '" data-asset-uid="'+val.uid+'" rel="'+val.url +'" title="'+val.filename+'"  data-params="' + encodeURI(JSON.stringify(val)) + '" style="width: 100px; height: 75px; cursor: pointer;" /><span>'+val.filename+'</span></div>');
                                    console.log("that.opts.getName", that.opts);
                                    var img = $('<div class="rte-img-ch clearfix flex w-100"><span class="name"><span class="asset-preview" style="background-image: url('+ val.url +')" data-asset-uid="' + val.uid + '" rel="' + val.url + '" title="' + thumbtitle + '"  data-params="' + encodeURI(JSON.stringify(val)) + '"></span><span>'+ thumbtitle +'</span></span></div>');
                                    $("#redactor-image-manager-box .rte-cs-images").append(img);
                                    // $(img).click($.proxy(this.imagemanager.insert, this));
                                    $(img).unbind('click').bind("click", function(e){
                                        //selected = $(this).find('.asset-preview').attr('data-asset-uid'); 
                                        $('.rte-img-ch').removeClass('active');
                                        $(this).addClass('active');
                                        $("#rte-select-img").attr('disabled',false);
                                        selected = {
                                            assetUid : $(this).find('.asset-preview').attr('data-asset-uid'),
                                            rel: $(this).find('.asset-preview').attr('rel'),
                                            title: $(this).find('.asset-preview').attr('title') 
                                        };
                                        selectedImg = $(this).find('.asset-preview');
                                    });
                                } else {
                                    var img = $('<div class="rte-img-ch clearfix flex w-100" data-foldername="'+val.name+'" data-uid="'+val.uid+'"><span class="name"><span class="folder-icon"></span><span>'+ val.name +'</span></span></div>');
                                    $('#redactor-image-manager-box .rte-cs-images').append(img);
                                    $(img).on("click", function(e){
                                        e.preventDefault();
                                        e.stopImmediatePropagation();
                                        var $th = $(this);
                                        if($th.hasClass('processing')) {
                                            return;
                                        }
                                        $th.addClass('processing');
                                        if(ajax){
                                            ajax.abort();
                                            //return false;  
                                        } 
                                        var getFolderAjax = null,
                                            parentFolderFlag = false;
                                        // console.log("val here", val);
                                        var newFolder = {"path":$(this).attr('data-foldername'),"uid":$(this).attr('data-uid')};
                                        if(breadcrumbForFolder && breadcrumbForFolder.length && breadcrumbForFolder[breadcrumbForFolder.length - 1].uid === val.parent_uid) {
                                            parentFolderFlag = true;
                                        }
                                        // if(enableFolder && searchText) {
                                        //     breadcrumbForFolder = [{"path":"All Assets","uid": "cs_root"}];
                                        // }
                                        console.log("parentFolderFlag", val.parent_uid, parentFolderFlag);
                                        if(enableFolder && searchText && !val.parent_uid) {
                                            breadcrumbForFolder = [{"path":"All Assets","uid": "cs_root"}];
                                        }
                                        if(enableFolder && searchText && val.parent_uid && !parentFolderFlag) {
                                            // var getFolderAjax = v3/assets/folders/bltc796ab08a9a28bce?include_path=true;
                                            var getFolderAjaxUrl = that.opts.folderJson + $(this).attr('data-uid') + "?include_path=true";

                                            getFolderAjax = $.ajax({
                                                dataType: "json",
                                                headers: { 'api_key': that.opts.stackApiKey },
                                                cache: false,
                                                url: getFolderAjaxUrl,
                                                success: $.proxy(function(res) {
                                                    getFolderAjax = null;
                                                    breadcrumbForFolder = [{"path":"All Assets","uid": "cs_root"}];
                                                    console.log("called folder path", res);
                                                    angular.forEach(res.asset.path, function(folderPath) {
                                                        breadcrumbForFolder.push({"path":folderPath.name,"uid":folderPath.uid});
                                                    });
                                                    if(getFolderAjax) {
                                                        console.log("reached in getFolderAjax to abort", getFolderAjax);
                                                        getFolderAjax.abort();
                                                    }
                                                    clearData();
                                                    loadAssets(newFolder);
                                                    $th.removeClass('processing');
                                                })
                                            });
                                        } else {
                                            console.log("Not called folder path", breadcrumbForFolder);
                                            breadcrumbForFolder.push(newFolder);
                                            clearData();
                                            loadAssets(newFolder);
                                            $th.removeClass('processing');
                                        }
                                    });
                                }
                            }, that));
                            $("#redactor-image-manager-box").animate({ scrollTop: $('.rte-cs-images')[0].scrollHeight}, 1000);
                            if(loadMore){
                                $('#rte-asset-pagination').append(loadMoreElem);
                            }
                            $(".icon-remove-sign").on("click", function(e){
                                e.stopImmediatePropagation();
                                clearData();
                                loadAssets();
                            });
                            $(".rte-load-more").on('click', function(e){
                                e.stopImmediatePropagation();
                                $('#rte-asset-pagination').append('<div><a class="btn cs-border-btn rte-asset-loading"><span class="loading">Loading...</span></a></div>');
                                loadAssets(null,true);
                            });
                            if(folder){
                                createBreadcrumbForFolder();
                                // selected = null;
                                selectedImg = null;
                                $("#rte-select-img").attr('disabled',true);
                                // if(folder.path){
                                //     $("#rte-search-placeholder").attr('placeholder',"Search in " +folder.path);
                                // }
                            }
                        }, that)
                });
            };
            $("#cancel-rte").unbind('click').bind("click", function(e){
                $("#redactor-modal-close").click();                
                // $("#redactor-modal, #redactor-overlay").hide();
            });
            $("#rte-select-img").unbind('click').bind("click", function(e){                
                // that.imagemanager.insert(selected);
                // console.log("final image", that.element.$element);
                that._insert(selected);                
            });
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
                searchText = $(this).find('.search-query').val();
                if(!searchText) return false;
                $('#redactor-image-manager-box .rte-cs-images').html("");
                $('<i class="icon-remove-sign"></i>').insertAfter('#redactor-image-manager-box .search-query');
                if(searchText){
                    getParams();
                    params["type"] = "search";
                    loadAssets();

                    console.log("reached in breadcrumb for search");
                    // var breadcrumb0 = $('<div class="breadcrumbs" data-uid=' + breadcrumbForFolder[0].uid + ' title=' + breadcrumbForFolder[0].path + '><span>' + breadcrumbForFolder[0].path + '</span></div>');
                    // $('.breadcrumb-redactor').append(breadcrumb0);
                    if(enableFolder) {
                        var breadcrumbSearch = $('<div class="breadcrumbs" data-uid="search" title="Search"><span>Search</span></div>');
                        $('.breadcrumb-redactor').children("div").not(':first').remove();
                        $('.breadcrumb-redactor').append(breadcrumbSearch);
                    }
                }else{
                    $(".icon-remove-sign").click();
                }
            });
            function createBreadcrumbForFolder(){                
                $('.breadcrumb-redactor').html("");
                $.each(breadcrumbForFolder,function(key, val) {                    
                    var breadcrumb = $('<div class="breadcrumbs" data-uid='+val.uid+' title='+val.path+'><span>'+val.path+'</span></div>');
                    $('.breadcrumb-redactor').append(breadcrumb);
                });
                $('.breadcrumbs').unbind('click').bind('click',function(e){                    
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    var folder = _.findWhere(breadcrumbForFolder, {uid: $(this).attr('data-uid')});
                    if(parentFolder == folder.uid && params["type"] !== "search"){
                        return false;
                    }
                    var breadcrumbCopy = JSON.parse(JSON.stringify(breadcrumbForFolder));
                    var index = _.findIndex(breadcrumbCopy, function(breadcrumb) { return breadcrumb.uid == folder.uid; });
                    if(index >= 0){
                        breadcrumbCopy = breadcrumbCopy.slice(0, index+1);
                    }
                    breadcrumbForFolder = [];    
                    $.each(breadcrumbCopy,function(key, val) {
                        breadcrumbForFolder.push({"path":val.path,"uid":val.uid});
                    }); 
                    clearData();
                    loadAssets(folder);
                });
            }
            if(enableFolder){                
                createBreadcrumbForFolder();
            }
            loadAssets();
        },
        _parse: function(json)
        {            
            var data = JSON.parse(json);

            for (var key in data)
            {
                var obj = data[key];
                var $img = $R.dom('<img>');
                var url = (obj.thumb) ? obj.thumb : obj.url;

                $img.attr('src', url);
                $img.attr('data-params', encodeURI(JSON.stringify(obj)));
                $img.attr('alt', "aaltttt");
                $img.css({
                    width: '96px',
                    height: '72px',
                    margin: '0 4px 2px 0',
                    cursor: 'pointer'
                });

                $img.on('click', this._insert.bind(this));

                this.$box.append($img);
            }
        },
        _insert: function(e)
        {            
            // e.preventDefault();

            // var $el = $R.dom(e.target);
            // var data = JSON.parse(decodeURI($el.attr('data-params')));

            // this.app.api('module.image.insert', { image: data });
            console.log("($el)-- ", $(e));
            var data = {
                url: $(e)[0].rel,
                id: $(e)[0].title,
                alt: $(e)[0].title
            }            
            // var dataArr = {data, alt};
            console.log("$el data-- ", { image: data });
            
            this.app.api('module.image.insert', { image: data });
        }
    });
})(Redactor);