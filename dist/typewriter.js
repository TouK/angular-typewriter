/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./line.ts" />
var typewriter;
(function (typewriter) {
    var WriterCtrl = (function () {
        function WriterCtrl($timeout, $scope) {
            var _this = this;
            this.$timeout = $timeout;
            this.$scope = $scope;
            this.lines = [];
            this.doneWritting = true;
            $scope.$watchCollection(function () { return _this.lines; }, function (lines) {
                _this.trigger(lines);
            });
            $scope.$on('TypewriterLine:done', function (event, line) {
                _this.appendNextLine(_this.lines, _this.lines.indexOf(line) + 1, true);
            });
        }
        WriterCtrl.prototype.trigger = function (lines, force) {
            this.$timeout.cancel(this.timeout);
            if (lines)
                this.doneWritting = false;
            this.$scope.$emit('Typewriter:start', this.doneWritting);
            this.appendNextLine(lines, 0, force);
        };
        WriterCtrl.prototype.add = function (line, index) {
            this.lines.splice(index, 0, line);
        };
        WriterCtrl.prototype.remove = function (line) {
            this.lines = _.without(this.lines, line);
        };
        WriterCtrl.prototype.reprint = function () {
            this.trigger(this.lines, true);
        };
        WriterCtrl.prototype.appendNextLine = function (lines, index, force) {
            var _this = this;
            var line = lines[index];
            var delay = Math.round(Math.random() * this.delay * 2);
            if (line != null) {
                this.timeout = this.$timeout(function () {
                    if (force || !line.doneWritting) {
                        _.forEach(lines.slice(index), function (line) { return line.clear(); });
                        line.display();
                    }
                    else {
                        _this.appendNextLine(_this.lines, ++index);
                    }
                }, delay);
            }
            else {
                this.doneWritting = true;
                this.$scope.$emit('Typewriter:done', this.doneWritting);
            }
        };
        WriterCtrl.$inject = ['$timeout', '$scope'];
        return WriterCtrl;
    })();
    var WriterDirective = (function () {
        function WriterDirective() {
            this.restrict = 'E';
            this.scope = true;
            this.controller = WriterCtrl;
            this.controllerAs = 'W';
            this.bindToController = {
                delay: '@?',
                textLines: '=?',
                printTrigger: '=?'
            };
            this.transclude = true;
            this.template = "<lines ng-class='{active: !W.doneWritting}'>" +
                "<ng-transclude ng-if='!W.textLines'></ng-transclude>" +
                "<tt-line ng-repeat='line in W.textLines track by $index + \" \" + line' ng-class='{last: WL.isLast()}' delay='{{W.delay}}'>{{ line }}</tt-line>" +
                "</lines>";
        }
        WriterDirective.prototype.link = function ($scope, $element, $attrs, W) {
            var trigger = function () { return W.reprint(); };
            $scope.$watch($attrs.printTrigger, function () { return W.printTrigger = trigger; });
        };
        WriterDirective.Factory = function () { return new WriterDirective(); };
        return WriterDirective;
    })();
    typewriter.WriterDirective = WriterDirective;
    angular.module('touk.typewriter', ['touk.typewriter.line'])
        .directive("ttWriter", WriterDirective.Factory);
})(typewriter || (typewriter = {}));
/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./writer.ts" />
var typewriter;
(function (typewriter) {
    var line;
    (function (line) {
        var LineCtrl = (function () {
            function LineCtrl($transclude, $timeout, $scope) {
                var _this = this;
                this.$transclude = $transclude;
                this.$timeout = $timeout;
                this.$scope = $scope;
                this.doneWritting = null;
                this.temp = '';
                $transclude(function (clone, scope) {
                    _this.transclusionScope = scope;
                    scope.$watch(function () { return clone.text(); }, function (text) {
                        _this.text = text;
                    });
                });
                $scope.$on('$destroy', function () {
                    _this.transclusionScope.$destroy();
                });
            }
            LineCtrl.prototype.display = function () {
                this.trigger(this.text);
            };
            LineCtrl.prototype.clear = function () {
                this.temp = '';
                this.print('');
                this.doneWritting = null;
            };
            LineCtrl.prototype.trigger = function (text) {
                this.$timeout.cancel(this.timeout);
                this.temp = '';
                if (text != null) {
                    this.$scope.$emit('TypewriterLine:start', this);
                    this.doneWritting = false;
                    this.appendNextLetter(text.split(''));
                }
            };
            LineCtrl.prototype.isLast = function () {
                if (this.parent) {
                    return this.parent.lines.length == this.parent.lines.indexOf(this) + 1;
                }
                return false;
            };
            LineCtrl.prototype.appendNextLetter = function (text) {
                var _this = this;
                this.appendNextLetter = _.throttle(function (text) {
                    var letter = text.shift();
                    var delay = Math.round(Math.random() * _this.delay);
                    _this.timeout = _this.$timeout(function () {
                        if (letter != null) {
                            _this.temp = _this.temp + letter;
                            _this.appendNextLetter(text);
                            _this.print(_this.temp);
                        }
                        else {
                            _this.doneWritting = true;
                            _this.$scope.$emit('TypewriterLine:done', _this);
                        }
                    }, delay);
                }, this.delay / 2);
                this.appendNextLetter(text);
            };
            LineCtrl.$inject = ['$transclude', '$timeout', '$scope'];
            return LineCtrl;
        })();
        var LineDirective = (function () {
            function LineDirective() {
                this.restrict = 'EA';
                this.scope = true;
                this.controller = LineCtrl;
                this.require = ['ttLine', '^ttWriter'];
                this.controllerAs = 'WL';
                this.bindToController = {
                    delay: '@?'
                };
                this.transclude = true;
                this.template = "<span></span><cursor ng-class='{active: WL.doneWritting == false}'>&nbsp;</cursor>";
            }
            LineDirective.prototype.link = function ($scope, $element, $attrs, ctrls) {
                var WL = ctrls[0];
                var W = ctrls[1];
                WL.parent = W;
                var span = $element.find('span');
                WL.print = function (text) { return span.text(text); };
                W.add(WL, $scope.$index);
                $scope.$on('$destroy', function () { return W.remove(WL); });
            };
            LineDirective.Factory = function () { return new LineDirective(); };
            return LineDirective;
        })();
        line.LineDirective = LineDirective;
        angular.module('touk.typewriter.line', ['touk.typewriter'])
            .directive("ttLine", LineDirective.Factory);
    })(line = typewriter.line || (typewriter.line = {}));
})(typewriter || (typewriter = {}));
//# sourceMappingURL=typewriter.js.map