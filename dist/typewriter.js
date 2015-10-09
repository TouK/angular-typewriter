/// <reference path="../typings/tsd.d.ts" />
var typewriter;
(function (typewriter) {
    var line;
    (function (line) {
        var LineCtrl = (function () {
            function LineCtrl($timeout, $scope) {
                var _this = this;
                this.$timeout = $timeout;
                this.$scope = $scope;
                this.doneWritting = true;
                this.temp = '';
                $scope.$watch(function () { return _this.text; }, function () { return _this.trigger(); });
            }
            LineCtrl.prototype.trigger = function () {
                this.temp = '';
                if (this.text != null) {
                    this.$scope.$emit('TypewriterLine:start', this.doneWritting);
                    this.doneWritting = false;
                    this.appendNextLetter(this.text.split(''));
                }
            };
            LineCtrl.prototype.appendNextLetter = function (text) {
                var _this = this;
                this.appendNextLetter = _.throttle(function (text) {
                    var letter = text.shift();
                    var delay = Math.round(Math.random() * _this.delay);
                    _this.$timeout(function () {
                        if (letter != null) {
                            _this.temp = _this.temp + letter;
                            _this.appendNextLetter(text);
                            _this.print(_this.temp);
                        }
                        else {
                            _this.doneWritting = true;
                            _this.$scope.$emit('TypewriterLine:done', _this.doneWritting);
                        }
                    }, delay);
                }, this.delay / 2);
                this.appendNextLetter(text);
            };
            LineCtrl.$inject = ['$timeout', '$scope'];
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
                this.template = "<span></span><cursor ng-class='{active: !WL.doneWritting, last: $last}'>&nbsp;</cursor>";
            }
            LineDirective.prototype.link = function ($scope, $element, $attrs, WL) {
                var span = $element.find('span');
                WL.print = function (text) { return span.text(text); };
            };
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
        function WriterCtrl($timeout, $scope) {
            var _this = this;
            this.$timeout = $timeout;
            this.$scope = $scope;
            this.doneWritting = true;
            $scope.$watch(function () { return _this.lines; }, function () { return _this.trigger(); });
            $scope.$on('TypewriterLine:done', function () { return _this.appendNextLine(_this.tempLines); });
        }
        WriterCtrl.prototype.trigger = function () {
            this.tempLines = angular.copy(this.lines);
            this.resultLines = [];
            if (this.tempLines)
                this.doneWritting = false;
            this.$scope.$emit('Typewriter:start', this.doneWritting);
            this.appendNextLine(this.tempLines);
        };
        WriterCtrl.prototype.appendNextLine = function (lines) {
            var _this = this;
            var line = lines.shift();
            var delay = Math.round(Math.random() * this.delay * 2);
            this.$timeout(function () {
                if (line != null) {
                    _this.resultLines.push(line);
                }
                else {
                    _this.doneWritting = true;
                    _this.$scope.$emit('Typewriter:done', _this.doneWritting);
                }
            }, delay);
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
                printTrigger: '=?'
            };
            this.template = "<lines ng-class='{active: !WL.doneWritting}'><tt-line ng-repeat='line in W.resultLines track by $index' text='line' delay='{{W.delay}}'></lines>";
        }
        WriterDirective.prototype.link = function ($scope, $element, $attrs, W) {
            var trigger = function () { W.trigger(); };
            $scope.$watch($attrs.printTrigger, function () { return W.printTrigger = trigger; });
        };
        WriterDirective.Factory = function () { return new WriterDirective(); };
        return WriterDirective;
    })();
    typewriter.WriterDirective = WriterDirective;
    angular.module('touk.typewriter', ['touk.typewriter.line'])
        .directive("ttWriter", WriterDirective.Factory);
})(typewriter || (typewriter = {}));
//# sourceMappingURL=typewriter.js.map