/// <reference path="../typings/tsd.d.ts" />
var typewriter;
(function (typewriter) {
    var line;
    (function (line) {
        var LineCtrl = (function () {
            function LineCtrl($timeout, $scope, $element, $document) {
                var _this = this;
                this.$timeout = $timeout;
                this.$scope = $scope;
                this.$element = $element;
                this.$document = $document;
                this.result = '';
                this.temp = '';
                this.doneWritting = true;
                $scope.$watch(function () { return _this.text; }, function () {
                    _this.temp = '';
                    if (_this.text != null) {
                        _this.$scope.$emit('TypewriterLine:start', _this.doneWritting);
                        _this.doneWritting = false;
                        _this.print(_this.text.split(''));
                    }
                });
                this.$element.prepend(this.createTextNode());
            }
            LineCtrl.prototype.print = function (text) {
                var _this = this;
                this.print = _.throttle(function (text) {
                    var letter = text.shift();
                    _this.$timeout(function () {
                        if (letter != null) {
                            _this.temp = _this.temp + letter;
                            _this.print(text);
                            _this.refreshNode();
                        }
                        else {
                            _this.doneWritting = true;
                            _this.$scope.$emit('TypewriterLine:done', _this.doneWritting);
                        }
                    });
                }, this.delay);
                this.print(text);
            };
            LineCtrl.prototype.createTextNode = function () {
                this.textNode = document.createTextNode('');
                return this.textNode;
            };
            LineCtrl.prototype.refreshNode = function () {
                this.textNode.nodeValue = this.temp;
            };
            LineCtrl.$inject = ['$timeout', '$scope', '$element', '$document'];
            return LineCtrl;
        })();
        var LineDirective = (function () {
            function LineDirective() {
                this.restrict = 'E';
                this.scope = true;
                this.controller = LineCtrl;
                this.controllerAs = 'WL';
                this.bindToController = {
                    text: '=',
                    delay: '@?'
                };
                this.template = "<cursor ng-class='{active: !WL.doneWritting, last: $last}'>&nbsp;</cursor>";
            }
            LineDirective.Factory = function () { return new LineDirective(); };
            return LineDirective;
        })();
        line.LineDirective = LineDirective;
        angular.module('touk.typewriter.line', ['touk.typewriter'])
            .directive("ttLine", LineDirective.Factory);
    })(line = typewriter.line || (typewriter.line = {}));
})(typewriter || (typewriter = {}));
/// <reference path="../typings/tsd.d.ts" />
var typewriter;
(function (typewriter) {
    var WriterCtrl = (function () {
        function WriterCtrl($timeout, $scope, $attrs) {
            var _this = this;
            this.$timeout = $timeout;
            this.$scope = $scope;
            this.$attrs = $attrs;
            this.doneWritting = true;
            this.print = function () {
                _this.tempLines = angular.copy(_this.lines);
                _this.result = [];
                if (_this.tempLines)
                    _this.doneWritting = false;
                _this.$scope.$emit('Typewriter:start', _this.doneWritting);
                _this.appendNext();
            };
            $scope.$watch($attrs.lines, function () { return _this.print(); });
            $scope.$watch($attrs.printFn, function () { return _this.exposePrint(); });
            $scope.$on('TypewriterLine:done', function () { return _this.appendNext(); });
        }
        WriterCtrl.prototype.appendNext = function () {
            var _this = this;
            this.$timeout(function () {
                var line = _this.tempLines.shift();
                if (line != null) {
                    _this.result.push(line);
                }
                else {
                    _this.doneWritting = true;
                    _this.$scope.$emit('Typewriter:done', _this.doneWritting);
                }
            }, this.delay);
        };
        WriterCtrl.prototype.exposePrint = function () {
            this.printFn = this.print;
        };
        WriterCtrl.$inject = ['$timeout', '$scope', '$attrs'];
        return WriterCtrl;
    })();
    var WriterDirective = (function () {
        function WriterDirective() {
            this.restrict = 'E';
            this.scope = true;
            this.controller = WriterCtrl;
            this.controllerAs = 'W';
            this.bindToController = {
                lines: '=',
                delay: '@?',
                printFn: '=?'
            };
            this.template = "<lines ng-class='{active: !WL.doneWritting}'><tt-line ng-repeat='line in W.result track by $index' text='line' delay='{{W.delay}}'></lines>";
        }
        WriterDirective.Factory = function () { return new WriterDirective(); };
        return WriterDirective;
    })();
    typewriter.WriterDirective = WriterDirective;
    angular.module('touk.typewriter', ['touk.typewriter.line'])
        .directive("ttWriter", WriterDirective.Factory);
})(typewriter || (typewriter = {}));
//# sourceMappingURL=typewriter.js.map