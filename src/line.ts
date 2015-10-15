/// <reference path="../typings/tsd.d.ts" />
/// <reference path="./writer.ts" />

module typewriter.line {

	interface ILineAttributes extends ng.IAttributes {
		delay?:number;
	}

	export interface ILine {
		delay?:number;
		doneWritting:boolean;
		print:(text:string) => void;
		trigger: (text:string) => void;
		display: () => void;
		clear: () => void;
		isLast: () => boolean;
		text:string;
		parent: typewriter.IWriter;
	}

	class LineCtrl implements ILine {
		text:string;
		delay:number;
		parent: typewriter.IWriter;
		doneWritting:boolean = null;
		print:(text:string) => void;
		private temp:string = '';

		static $inject = ['$transclude', '$timeout', '$scope'];
		private timeout:ng.IPromise<void>;
		private transclusionScope:ng.IScope;

		constructor(private $transclude:ng.ITranscludeFunction,
					private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope) {

			$transclude((clone, scope) => {
				this.transclusionScope = scope;
				scope.$watch(()=> clone.text(), (text) => {
					this.text = text;
				});
			});

			$scope.$on('$destroy', () => {
				this.transclusionScope.$destroy();
			});


		}

		display():void {
			this.trigger(this.text);
		}

		clear():void {
			this.temp = '';
			this.print('');
			this.doneWritting = null;
		}

		trigger(text:string):void {
			this.$timeout.cancel(this.timeout);
			this.temp = '';
			if (text != null) {
				this.$scope.$emit('TypewriterLine:start', this);
				this.doneWritting = false;
				this.appendNextLetter(text.split(''));
			}
		}

		isLast():boolean {
			if (this.parent) {
				return this.parent.lines.length == this.parent.lines.indexOf(this)+1;
			}
			return false;
		}

		private appendNextLetter(text:string[]):void {
			this.appendNextLetter = _.throttle((text:string[]) => {
				var letter = text.shift();
				var delay = Math.round(Math.random() * this.delay);
				this.timeout = this.$timeout(() => {
					if (letter != null) {
						this.temp = this.temp + letter;
						this.appendNextLetter(text);
						this.print(this.temp);
					} else {
						this.doneWritting = true;
						this.$scope.$emit('TypewriterLine:done', this);
					}
				}, delay);
			}, this.delay / 2);
			this.appendNextLetter(text);
		}
	}

	export class LineDirective implements ng.IDirective {
		restrict = 'EA';
		scope = true;
		controller = LineCtrl;
		require = ['ttLine', '^ttWriter'];
		controllerAs = 'WL';
		bindToController = {
			delay: '@?'
		};
		transclude = true;
		template = "<span></span><cursor ng-class='{active: WL.doneWritting == false}'>&nbsp;</cursor>";

		link($scope:ng.IRepeatScope,
			 $element:ng.IAugmentedJQuery,
			 $attrs:ILineAttributes,
			 ctrls:[typewriter.line.ILine, typewriter.IWriter]) {

			var WL = ctrls[0];
			var W = ctrls[1];
			WL.parent = W;

			var span = $element.find('span');
			WL.print = (text:string) => span.text(text);

			W.add(WL, $scope.$index);
			$scope.$on('$destroy', () => W.remove(WL));
		}

		static Factory:ng.IDirectiveFactory = () => new LineDirective();
	}

	angular.module('touk.typewriter.line', ['touk.typewriter'])
		.directive("ttLine", LineDirective.Factory);
}