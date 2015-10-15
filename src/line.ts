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
			this.$timeout.cancel(this.timeout);
			this.temp = '';
			this.print('');
			this.doneWritting = null;
		}

		trigger(text:string):void {
			this.clear();
			if (text != null) {
				this.$scope.$emit('TypewriterLine:start', this);
				this.doneWritting = false;
				this.appendNextLetter(text.split(''));
			}
		}

		isLast():boolean {
			if (this.parent) {
				return this.parent.elements.length == this.parent.elements.indexOf(this)+1;
			}
			return false;
		}

		private getDelay():number {
			return this.delay || this.parent.delay || 0;
		}

		private appendNextLetter(text:string[]):void {
			var letter = text.shift();
			var delay = Math.round(this.getDelay() / 2 + Math.random() * this.getDelay());
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

			var WL:typewriter.line.ILine = ctrls[0];
			var W:typewriter.IWriter = ctrls[1];

			var span = $element.find('span');
			WL.print = (text:string) => span.text(text);
			WL.parent = W;

			W.add(WL);
			$scope.$on('$destroy', () => W.remove(WL));

			$scope.$watch(() => WL.isLast(), (isLast:boolean) => $element.toggleClass('last', isLast));
		}

		static Factory:ng.IDirectiveFactory = () => new LineDirective();
	}

	angular.module('touk.typewriter.line', ['touk.typewriter'])
		.directive("ttLine", LineDirective.Factory);
}